/**
 * 공통 HTTP 클라이언트
 * - JWT 토큰 자동 주입 (localStorage → Authorization 헤더)
 * - 401 응답 시 토큰 제거 후 /login 리다이렉트
 * - 에러 메시지 정규화
 *
 * ⚠️ 순환 의존성 방지: authService를 import하지 않음.
 *    토큰은 localStorage에서 직접 읽음 (tokenStorage와 동일한 key 'auth_token' 사용).
 */

// 개발: proxy(package.json)가 /api/* 요청을 localhost:8080으로 중계 → 상대 경로 사용
// 프로덕션: REACT_APP_API_URL에 실제 도메인 설정 (예: https://api.aiducation.com)
const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://bbasung.iptime.org:8080';
const TOKEN_KEY = 'auth_token';

const getToken = () => localStorage.getItem(TOKEN_KEY);

async function request(method, path, options = {}) {
  const { body, isFormData = false } = options;

  const headers = {};

  // FormData는 브라우저가 Content-Type을 자동으로 설정 (boundary 포함)
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
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

  // 공개 인증 엔드포인트(회원가입, 비밀번호 재설정 등)는 401 시 리다이렉트 제외
  const PUBLIC_AUTH_PATHS = [
    '/api/v1/auth/signup',
    '/api/v1/auth/login',
    '/api/v1/auth/find-id',
    '/api/v1/auth/reset-password',
  ];
  const isPublicPath = PUBLIC_AUTH_PATHS.some((p) => path.startsWith(p));

  if (res.status === 401) {
    if (!isPublicPath) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
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
