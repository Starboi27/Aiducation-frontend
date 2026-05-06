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
  weeklyStats: [
    { day: '월', solved: 12, correct: 9 },
    { day: '화', solved: 8,  correct: 6 },
    { day: '수', solved: 15, correct: 13 },
    { day: '목', solved: 5,  correct: 4 },
    { day: '금', solved: 20, correct: 17 },
    { day: '토', solved: 3,  correct: 2 },
    { day: '일', solved: 10, correct: 8 },
  ],
  accuracy: 78,
  weakTypes: ['메모리 관리', 'CPU 스케줄링', 'SQL JOIN'],
  recentNotifications: [
    { id: 'noti_001', message: '오늘의 복습 5문제가 준비됐어요!', createdAt: '2024-03-23T08:00:00Z', read: false },
    { id: 'noti_002', message: '"운영체제" 과목에 새 개념이 추가됐어요.', createdAt: '2024-03-22T18:30:00Z', read: false },
  ],
};

const MOCK_RANKING = [
  { rank: 1, userId: 'user_001', name: '이창현', level: 12, totalExp: 12450 },
  { rank: 2, userId: 'user_002', name: '김민수', level: 10, totalExp: 9820  },
  { rank: 3, userId: 'user_003', name: '최유리', level: 9,  totalExp: 8640  },
  { rank: 4, userId: 'user_004', name: '정해인', level: 8,  totalExp: 7210  },
  { rank: 5, userId: 'user_005', name: '박서준', level: 7,  totalExp: 6050  },
];

const MOCK_INCORRECTS = [
  {
    quizId: 'q_001',
    conceptName: '메모리 관리',
    question: '다음 중 페이지 교체 알고리즘이 아닌 것은?',
    options: ['FIFO', 'LRU', 'OPT', 'RR', 'LFU'],
    myAnswer: 4,
    correctAnswer: 4,
    explanation: 'RR(Round Robin)은 CPU 스케줄링 알고리즘이며, 페이지 교체 알고리즘이 아닙니다.',
    solvedAt: '2024-03-22T14:30:00Z',
  },
  {
    quizId: 'q_002',
    conceptName: 'SQL 기초',
    question: 'INNER JOIN과 OUTER JOIN의 차이점은?',
    options: ['속도 차이', '조인 조건 유무', '매칭되지 않는 행 포함 여부', '테이블 수 제한', '인덱스 사용 여부'],
    myAnswer: 1,
    correctAnswer: 3,
    explanation: 'OUTER JOIN은 한쪽 테이블에 매칭되는 데이터가 없어도 결과에 포함시킵니다.',
    solvedAt: '2024-03-23T09:15:00Z',
  },
];

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

async function mockGetRanking(page = 1) {
  await sleep(USER_CONFIG.mockDelayMs);
  return { ranking: MOCK_RANKING, page, totalPage: 1 };
}

async function mockGetIncorrects() {
  await sleep(USER_CONFIG.mockDelayMs);
  return [...MOCK_INCORRECTS];
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
const realGetMe         = ()         => apiClient.get('/api/v1/users/me');
const realGetDashboard  = ()         => apiClient.get('/api/v1/users/me/dashboard');
const realGetRanking    = (page = 1) => apiClient.get(`/api/v1/ranking?page=${page}`);
const realGetIncorrects = ()         => apiClient.get('/api/v1/users/me/incorrects');

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
  getRanking(page = 1) {
    return isMockEnabled() ? mockGetRanking(page) : realGetRanking(page);
  },

  /** 내 오답 노트 조회 → IncorrectItem[] */
  getIncorrects() {
    return isMockEnabled() ? mockGetIncorrects() : realGetIncorrects();
  },
};
