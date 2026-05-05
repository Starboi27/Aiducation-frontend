/**
 * 공통 HTTP 클라이언트
 * - JWT 토큰 자동 주입 (localStorage → Authorization 헤더)
 * - 401 응답 시 refresh token으로 재발급 후 원래 요청 재시도
 * - 재발급 실패 시 토큰 제거 후 /login 리다이렉트
 * - 에러 메시지 정규화
 *
 * ⚠️ 순환 의존성 방지: authService를 import하지 않음.
 *    토큰은 localStorage에서 직접 읽음 (tokenStorage와 동일한 key 'accessToken' 사용).
 */

// 개발: proxy(package.json)가 /api/* 요청을 localhost:8080으로 중계 → 상대 경로 사용
// 프로덕션: REACT_APP_API_URL에 실제 도메인 설정 (예: https://api.aiducation.com)
const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://bbasung.iptime.org:8080';
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refresh_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);

// 인증 토큰을 붙이지 않을 공개 경로
const PUBLIC_AUTH_PATHS = [
  '/api/v1/auth/signup',
  '/api/v1/auth/login',
  '/api/v1/auth/find-id',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/refresh',
];

// 동시에 여러 요청이 401을 받을 경우 refresh를 한 번만 시도하기 위한 잠금
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('refresh token 없음');

  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) throw new Error('refresh 실패');

  const data = await res.json();
  const newAccessToken = data.accessToken;
  localStorage.setItem(TOKEN_KEY, newAccessToken);
  if (data.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  }
  return newAccessToken;
}

function clearAuthAndRedirect() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('user_info');
  window.location.href = '/login';
}

async function request(method, path, options = {}) {
  const { body, isFormData = false } = options;

  const headers = {};

  // FormData는 브라우저가 Content-Type을 자동으로 설정 (boundary 포함)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const isPublicPath = PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));

  // 공개 경로에는 만료된 토큰을 보내지 않음 (Spring Security가 토큰 검증 후 401 반환하는 문제 방지)
  const token = isPublicPath ? null : getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('서버에 연결할 수 없습니다. 백엔드가 실행 중인지 확인해주세요.');
  }

  if (res.status === 401) {
    if (!isPublicPath) {
      // refresh token으로 재발급 시도
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await tryRefreshToken();
          isRefreshing = false;
          onRefreshed(newToken);
          // 원래 요청 재시도 (새 토큰으로)
          return request(method, path, options);
        } catch {
          isRefreshing = false;
          refreshSubscribers = [];
          clearAuthAndRedirect();
          throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
      }

      // 이미 refresh 중이면 완료될 때까지 대기 후 재시도
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((newToken) => {
          resolve(request(method, path, options));
        });
      });
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? '인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  // 204 No Content
  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const apiClient = {
  /** GET 요청 */
  get: (path, opts = {}) =>
    request('GET', path, opts),

  /** JSON body POST 요청 */
  post: (path, body, opts = {}) =>
    request('POST', path, { body, ...opts }),

  /** JSON body PUT 요청 */
  put: (path, body, opts = {}) =>
    request('PUT', path, { body, ...opts }),

  /** JSON body PATCH 요청 */
  patch: (path, body, opts = {}) =>
    request('PATCH', path, { body, ...opts }),

  /** DELETE 요청 */
  delete: (path, opts = {}) =>
    request('DELETE', path, opts),

  /** FormData 파일 업로드 전용 POST */
  postForm: (path, formData, opts = {}) =>
    request('POST', path, { body: formData, isFormData: true, ...opts }),
};
