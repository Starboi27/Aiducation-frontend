/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    Auth Service Layer                             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * API 인터페이스:
 *   POST /api/auth/login       body: { email, password } → { token, user }
 *   POST /api/auth/signup      body: { email, password, name } → { token, user }
 *   GET  /api/auth/me          header: Bearer <token> → User
 *   POST /api/auth/find-email  body: { name } → { email }
 *   POST /api/auth/reset-password body: { email } → { message }
 *   GET  /oauth/kakao           → 카카오 OAuth 인증 페이지로 리다이렉트
 *
 * Types:
 *   User = { id, name, email, role, level, totalExp, streak, ... }
 */
import { apiClient } from "./apiClient";

// ── Configuration ──────────────────────────────────────────────────────────────
export const AUTH_CONFIG = {
  baseUrl: process.env.REACT_APP_API_URL ?? "http://bbasung.iptime.org:8080",

  // Mock 전환: true → Mock 데이터 사용 / false → 실제 백엔드 호출
  useMock: false,

  // 비밀번호 재설정: 백엔드 permitAll() 설정 전 임시 Mock 사용
  // 백엔드 준비 완료 시 false로 변경
  useMockReset: false,

  mockDelayMs: 800,
};

// ── Token 관리 (localStorage) ──────────────────────────────────────────────────
export const tokenStorage = {
  get: () => localStorage.getItem("auth_token"),
  set: (token) => localStorage.setItem("auth_token", token),
  remove: () => localStorage.removeItem("auth_token"),
};

// ── Utility ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Mock 유저 DB (테스트용) ────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    id: "user_001",
    userId: "testuser",
    name: "이창현",
    email: "test@test.com",
    password: "1234",
    role: "admin",
    level: 12,
    totalExp: 12450,
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    streak: 5,
    maxStreak: 12,
    accuracy: 78,
    wrongCount: 3,
    unreadNotifications: 2,
  },
];
// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function mockLogin(email, password) {
  await sleep(AUTH_CONFIG.mockDelayMs);

  const user = MOCK_USERS.find(
    (u) => u.email === email && u.password === password,
  );

  if (!user) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  const { password: _, ...safeUser } = user;
  const mockToken = `mock_token_${user.id}_${Date.now()}`;

  return { token: mockToken, user: safeUser };
}

async function mockSignup(email, password, name) {
  await sleep(AUTH_CONFIG.mockDelayMs);

  const exists = MOCK_USERS.find((u) => u.email === email);
  if (exists) {
    throw new Error("이미 사용 중인 이메일입니다.");
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    role: "user",
    level: 1,
    exp: 0,
    totalExp: 0,
    totalSolved: 0,
    correctCount: 0,
    streak: 0,
    maxStreak: 0,
    accuracy: 0,
    wrongCount: 0,
    unreadNotifications: 0,
  };

  MOCK_USERS.push({ ...newUser, password });

  const mockToken = `mock_token_${newUser.id}_${Date.now()}`;
  return { token: mockToken, user: newUser };
}

async function mockFindEmail(name) {
  await sleep(AUTH_CONFIG.mockDelayMs);

  const user = MOCK_USERS.find((u) => u.name === name);
  if (!user) {
    throw new Error("해당 이름으로 등록된 계정을 찾을 수 없습니다.");
  }

  // 이메일 일부를 마스킹하여 반환
  const [local, domain] = user.email.split("@");
  const masked = local.slice(0, 2) + "***@" + domain;
  return { email: masked };
}

async function mockRequestReset(userId, email) {
  await sleep(AUTH_CONFIG.mockDelayMs);
  // mock: 입력값이 비어있지 않으면 발송 성공 (실제 DB 검증은 백엔드 담당)
  if (!userId || !email)
    throw new Error("아이디와 이메일을 모두 입력해주세요.");
  return { message: `${email}로 인증 코드를 발송했습니다.` };
}

async function mockVerifyCode(email, code) {
  await sleep(AUTH_CONFIG.mockDelayMs);
  if (code !== "ab1234") throw new Error("인증 코드가 올바르지 않습니다.");
  return { success: true };
}

async function mockCompleteReset(email, code, newPassword) {
  await sleep(AUTH_CONFIG.mockDelayMs);
  // mock: DB 업데이트 시뮬레이션 (실제 유저 존재 여부 무관)
  const user = MOCK_USERS.find((u) => u.email === email);
  if (user) user.password = newPassword;
  return { message: "비밀번호가 변경되었습니다." };
}

async function mockGetMe(token) {
  await sleep(300);

  if (!token || !token.startsWith("mock_token_")) {
    throw new Error("유효하지 않은 토큰입니다.");
  }

  const userId = token.split("_")[2];
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) throw new Error("유저를 찾을 수 없습니다.");

  const { password: _, ...safeUser } = user;
  return safeUser;
}

async function mockGetAllUsers() {
  await sleep(500);
  return MOCK_USERS.map(({ password: _, ...u }) => u);
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
function mapLoginResponse(data) {
  const user = {
    id: data.userId,
    name: data.name,
    email: data.userId,
    role: data.role?.toLowerCase(),
    level: data.level ?? 1,
    totalExp: 0,
    totalSolved: 0,
    correctCount: 0,
    streak: 0,
    maxStreak: 0,
    accuracy: 0,
    wrongCount: 0,
    unreadNotifications: 0,
  };
  localStorage.setItem("user_info", JSON.stringify(user));
  localStorage.setItem("refresh_token", data.refreshToken);
  return { token: data.accessToken, user };
}

async function realLogin(email, password) {
  return apiClient
    .post("/api/v1/auth/login", { userId: email, password })
    .then(mapLoginResponse);
}

async function realSignup(email, password, name) {
  return apiClient
    .post("/api/v1/auth/signup", { userId: email, password, name, email })
    .then(mapLoginResponse);
}

async function realFindEmail(name) {
  return apiClient.post("/api/v1/auth/find-id", { email: name });
}

async function realRequestReset(userId, email) {
  return apiClient.post("/api/v1/auth/reset-password", { userId, email });
}

async function realVerifyCode(email, code) {
  return apiClient.post("/api/v1/auth/reset-password/verify", { email, code });
}

async function realCompleteReset(email, code, newPassword) {
  return apiClient.post("/api/v1/auth/reset-password/complete", {
    email,
    code,
    newPassword,
  });
}

async function realGetMe(token) {
  const saved = localStorage.getItem("user_info");
  if (saved) return JSON.parse(saved);

  // 소셜 로그인 콜백: localStorage에 user_info 없을 시 JWT payload decode
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const user = {
        id: payload.sub,
        name: payload.name ?? payload.sub,
        email: payload.sub,
        role: payload.role?.toLowerCase() ?? "user",
        level: 1,
        totalExp: 0,
        totalSolved: 0,
        correctCount: 0,
        streak: 0,
        maxStreak: 0,
        accuracy: 0,
        wrongCount: 0,
        unreadNotifications: 0,
      };
      localStorage.setItem("user_info", JSON.stringify(user));
      return user;
    } catch {
      throw new Error("사용자 정보를 불러올 수 없습니다.");
    }
  }
  throw new Error("유저 정보를 찾을 수 없습니다.");
}

async function realGetAllUsers() {
  return apiClient.get("/api/v1/admin/users");
}

/**
 * 카카오 OAuth: Spring Boot의 OAuth 시작 엔드포인트로 리다이렉트.
 * Spring이 카카오와 코드 교환 → JWT 발급 → 프론트엔드 /oauth/callback?token=<JWT> 로 포워딩.
 */
function realSocialLogin(provider) {
  const paths = { kakao: "/oauth/kakao_login", google: "/oauth/google_login" };
  window.location.href = `${AUTH_CONFIG.baseUrl}${paths[provider]}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API  ← 컴포넌트에서 이 인터페이스만 사용
// ─────────────────────────────────────────────────────────────────────────────
export const authService = {
  /** 로그인 → { token, user } */
  login(email, password) {
    return AUTH_CONFIG.useMock
      ? mockLogin(email, password)
      : realLogin(email, password);
  },

  /** 회원가입 → { token, user } */
  signup(email, password, name) {
    return AUTH_CONFIG.useMock
      ? mockSignup(email, password, name)
      : realSignup(email, password, name);
  },

  /** 이메일 찾기 → { email } */
  findEmail(name) {
    return AUTH_CONFIG.useMock ? mockFindEmail(name) : realFindEmail(name);
  },

  /** 비밀번호 재설정 1단계: 아이디+이메일 확인 후 코드 발송 */
  requestReset(userId, email) {
    return AUTH_CONFIG.useMock || AUTH_CONFIG.useMockReset
      ? mockRequestReset(userId, email)
      : realRequestReset(userId, email);
  },

  /** 비밀번호 재설정 2단계: 코드 검증 */
  verifyCode(email, code) {
    return AUTH_CONFIG.useMock || AUTH_CONFIG.useMockReset
      ? mockVerifyCode(email, code)
      : realVerifyCode(email, code);
  },

  /** 비밀번호 재설정 3단계: 새 비밀번호 설정 */
  completeReset(email, code, newPassword) {
    return AUTH_CONFIG.useMock || AUTH_CONFIG.useMockReset
      ? mockCompleteReset(email, code, newPassword)
      : realCompleteReset(email, code, newPassword);
  },

  /** 토큰으로 유저 정보 조회 (자동 로그인) → User */
  getMe(token) {
    return AUTH_CONFIG.useMock ? mockGetMe(token) : realGetMe(token);
  },

  /** 모든 사용자 목록 조회 (관리자용) */
  getAllUsers() {
    return AUTH_CONFIG.useMock ? mockGetAllUsers() : realGetAllUsers();
  },

  /**
   * 소셜 로그인 (카카오 등)
   * - Real 모드: 백엔드 OAuth 엔드포인트로 브라우저 리다이렉트 (반환값 없음)
   * - Mock 모드: 즉시 { token, user } 반환
   */
  socialLogin(provider) {
    if (AUTH_CONFIG.useMock) {
      // Mock: 첫 번째 Mock 유저로 즉시 로그인
      return sleep(AUTH_CONFIG.mockDelayMs).then(() => {
        const user = MOCK_USERS[0];
        const { password: _, ...safeUser } = user;
        return { token: `mock_token_${user.id}_${Date.now()}`, user: safeUser };
      });
    }
    realSocialLogin(provider);
    // Real: 페이지가 이동하므로 반환값 없음
  },
};
