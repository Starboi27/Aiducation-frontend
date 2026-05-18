/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║               User / Dashboard / Ranking Service Layer           ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * API 인터페이스:
 *   GET /api/v1/users/me              → Me 객체
 *   GET /api/v1/users/me/dashboard   → Dashboard 객체
 *   GET /api/v1/ranking?page={page}  → RankingList
 *   GET /api/v1/users/me/incorrects  → IncorrectItem[]
 *
 * Types:
 *   Me           = { userId, email, level, exp, totalExp, ... }
 *   Dashboard    = { weeklyStats, accuracy, weakTypes, recentNotifications }
 *   RankingEntry = { rank, userId, name, level, totalExp }
 *   IncorrectItem = { quizId, question, myAnswer, correctAnswer, explanation, conceptName }
 */
import { apiClient } from './apiClient';

// ── Configuration ──────────────────────────────────────────────────────────────
export const USER_CONFIG = {
  useMock: false,
  mockDelayMs: 500,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Mock DB ────────────────────────────────────────────────────────────────────
const MOCK_ME = {
  userId: 'testuser',
  name: '이창현',
  email: 'test@test.com',
  level: 12,
  exp: 450,
  totalExp: 12450,
  role: 'admin',
  streak: 5,
  maxStreak: 12,
  accuracy: 78,
  wrongCount: 3,
  unreadNotifications: 2,
};

const MOCK_DASHBOARD = {
  userName: '이창현',
  weeklyStats: { thisWeekRate: 0.82, lastWeekRate: 0.75, changeRate: 0.07 },
  solvedCount: 73,
  correctRate: 0.78,
  growthIndicator: {
    level: 12,
    exp: 450,
    totalExp: 12450,
    nextLevelExp: 1000,
    grade: 'Silver',
    progressRate: 0.45,
  },
  weakTypes: [
    { subjectName: '메모리 관리',   incorrectCount: 5, totalAttempted: 12, incorrectRate: 0.42 },
    { subjectName: 'CPU 스케줄링', incorrectCount: 3, totalAttempted: 10, incorrectRate: 0.30 },
    { subjectName: 'SQL JOIN',      incorrectCount: 2, totalAttempted: 8,  incorrectRate: 0.25 },
  ],
  recentNotifications: [
    { type: 'REVIEW',   message: '오늘의 복습 5문제가 준비됐어요!',        createdAt: '2024-03-23T08:00:00Z', read: false },
    { type: 'CONCEPT',  message: '"운영체제" 과목에 새 개념이 추가됐어요.', createdAt: '2024-03-22T18:30:00Z', read: false },
  ],
  unreadNotificationCount: 2,
};

const MOCK_RANKING = {
  totalCount: 5,
  rankings: [
    { rank: 1, userId: 'user_001', level: 12, totalExp: 12450 },
    { rank: 2, userId: 'user_002', level: 10, totalExp: 9820  },
    { rank: 3, userId: 'user_003', level: 9,  totalExp: 8640  },
    { rank: 4, userId: 'user_004', level: 8,  totalExp: 7210  },
    { rank: 5, userId: 'user_005', level: 7,  totalExp: 6050  },
  ],
};

const MOCK_INCORRECTS = {
  totalCount: 2,
  incorrects: [
    {
      quizId: 1,
      conceptName: '메모리 관리',
      question: '다음 중 페이지 교체 알고리즘이 아닌 것은?',
      examples: ['FIFO', 'LRU', 'OPT', 'RR', 'LFU'],
      correctAnswer: 4,
      explanation: 'RR(Round Robin)은 CPU 스케줄링 알고리즘이며, 페이지 교체 알고리즘이 아닙니다.',
      difficulty: 2,
    },
    {
      quizId: 2,
      conceptName: 'SQL 기초',
      question: 'INNER JOIN과 OUTER JOIN의 차이점은?',
      examples: ['속도 차이', '조인 조건 유무', '매칭되지 않는 행 포함 여부', '테이블 수 제한', '인덱스 사용 여부'],
      correctAnswer: 3,
      explanation: 'OUTER JOIN은 한쪽 테이블에 매칭되는 데이터가 없어도 결과에 포함시킵니다.',
      difficulty: 3,
    },
  ],
};

// StudySettings 스펙: { dailyGoal(1~100), studyAlarmTime(LocalTime), defaultDifficulty(0~5) }
// reviewInterval은 API 스펙에 없는 UI 전용 값 → localStorage만 사용
const MOCK_STUDY_SETTINGS = {
  dailyGoal: 30,
  studyAlarmTime: { hour: 20, minute: 0, second: 0, nano: 0 },
  defaultDifficulty: 3,
};

// AlarmStatus 스펙: { pushAlarm, mailAlram(오타 유지), rankingAlarm } — 3개 모두 required
const MOCK_ALARM_SETTINGS = {
  pushAlarm: true,
  mailAlram: true,
  rankingAlarm: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function mockGetMe() {
  await sleep(300);
  return { ...MOCK_ME };
}

async function mockGetDashboard() {
  await sleep(USER_CONFIG.mockDelayMs);
  return { ...MOCK_DASHBOARD };
}

async function mockGetRanking(page = 0) {
  await sleep(USER_CONFIG.mockDelayMs);
  return { ...MOCK_RANKING };
}

async function mockGetIncorrects() {
  await sleep(USER_CONFIG.mockDelayMs);
  return { ...MOCK_INCORRECTS };
}

async function mockGetStudySettings() {
  await sleep(USER_CONFIG.mockDelayMs);
  return { ...MOCK_STUDY_SETTINGS };
}

async function mockUpdateStudySettings(settings) {
  await sleep(USER_CONFIG.mockDelayMs);
  Object.assign(MOCK_STUDY_SETTINGS, settings);
  return { resultCode: 200 };
}

async function mockGetAlarmSettings() {
  await sleep(USER_CONFIG.mockDelayMs);
  return { ...MOCK_ALARM_SETTINGS };
}

async function mockUpdateAlarmSettings(settings) {
  await sleep(USER_CONFIG.mockDelayMs);
  Object.assign(MOCK_ALARM_SETTINGS, settings);
  return { ...MOCK_ALARM_SETTINGS };
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS (profile, password, delete)
// ─────────────────────────────────────────────────────────────────────────────
async function mockUpdateProfile(name, email) {
  await sleep(USER_CONFIG.mockDelayMs);
  const stored = localStorage.getItem('user_info');
  if (stored) {
    const user = JSON.parse(stored);
    user.name = name;
    user.email = email;
    localStorage.setItem('user_info', JSON.stringify(user));
  }
  return { resultCode: 200 };
}

async function mockUpdatePassword(_currentPassword, _newPassword) {
  await sleep(USER_CONFIG.mockDelayMs);
  return { resultCode: 200 };
}

async function mockDeleteAccount() {
  await sleep(USER_CONFIG.mockDelayMs);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
  return { resultCode: 200 };
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
// spec에 GET /api/v1/users/me 없음 → localStorage 캐시 사용
function realGetMe() {
  const stored = localStorage.getItem('user_info');
  if (stored) return Promise.resolve(JSON.parse(stored));
  return Promise.reject(new Error('사용자 정보가 없습니다. 다시 로그인해주세요.'));
}
const realGetDashboard  = ()         => apiClient.get('/api/v1/users/me/dashboard');
const realGetRanking    = (page = 0) => apiClient.get(`/api/v1/ranking?page=${page}`);
const realGetIncorrects = ()         => apiClient.get('/api/v1/users/me/incorrects');

const realGetStudySettings    = ()         => apiClient.get('/api/v1/users/me/settings');
const realUpdateStudySettings = (settings) => apiClient.patch('/api/v1/users/me/settings', settings);
const realGetAlarmSettings    = ()         => apiClient.get('/api/v1/users/me/alarm-settings');
const realUpdateAlarmSettings = (settings) => apiClient.patch('/api/v1/users/me/alarm-settings', settings);

const realUpdateProfile  = (name, email)                       => apiClient.patch('/api/v1/users/me/profile', { name, email });
const realUpdatePassword = (currentPassword, newPassword)      => apiClient.patch('/api/v1/users/me/password', { currentPassword, newPassword });
const realDeleteAccount  = ()                                  => apiClient.delete('/api/v1/users/me');

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
const isMockEnabled = () => USER_CONFIG.useMock;

export const userService = {
  /** 내 정보 조회 → Me */
  getMe() {
    return isMockEnabled() ? mockGetMe() : realGetMe();
  },

  /** 대시보드 통계 조회 → Dashboard */
  getDashboard() {
    return isMockEnabled() ? mockGetDashboard() : realGetDashboard();
  },

  /**
   * 전체 랭킹 조회 → { ranking: RankingEntry[], page, totalPage }
   * @param {number} [page=1]
   */
  getRanking(page = 0) {
    return isMockEnabled() ? mockGetRanking(page) : realGetRanking(page);
  },

  /** 내 오답 노트 조회 → IncorrectItem[] */
  getIncorrects() {
    return isMockEnabled() ? mockGetIncorrects() : realGetIncorrects();
  },

  /** 학습 설정 조회 */
  getStudySettings() {
    return isMockEnabled() ? mockGetStudySettings() : realGetStudySettings();
  },

  /** 학습 설정 업데이트 */
  updateStudySettings(settings) {
    return isMockEnabled() ? mockUpdateStudySettings(settings) : realUpdateStudySettings(settings);
  },

  /** 알림 설정 조회 */
  getAlarmSettings() {
    return isMockEnabled() ? mockGetAlarmSettings() : realGetAlarmSettings();
  },

  /** 알림 설정 업데이트 */
  updateAlarmSettings(settings) {
    return isMockEnabled() ? mockUpdateAlarmSettings(settings) : realUpdateAlarmSettings(settings);
  },

  /**
   * 프로필(이름·이메일) 수정 → { resultCode }
   * @param {string} name
   * @param {string} email
   */
  updateProfile(name, email) {
    return isMockEnabled() ? mockUpdateProfile(name, email) : realUpdateProfile(name, email);
  },

  /**
   * 비밀번호 변경 → { resultCode }
   * @param {string} currentPassword
   * @param {string} newPassword
   */
  updatePassword(currentPassword, newPassword) {
    return isMockEnabled()
      ? mockUpdatePassword(currentPassword, newPassword)
      : realUpdatePassword(currentPassword, newPassword);
  },

  /** 회원 탈퇴 → { resultCode } */
  deleteAccount() {
    return isMockEnabled() ? mockDeleteAccount() : realDeleteAccount();
  },
};
