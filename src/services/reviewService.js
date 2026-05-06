/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║               Review / Notification Service Layer                ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * API 인터페이스:
 *   GET    /api/v1/reviews/today                      → ReviewSchedule[]
 *   POST   /api/v1/reviews/{scheduleId}/complete      → 204
 *   POST   /api/v1/notifications/subscribe            { Subscribe } → 200
 *   DELETE /api/v1/notifications/subscribe            { Unsubscribe } → 204
 *
 * Types:
 *   ReviewSchedule = { scheduleId, conceptName, subjectName, quizCount, dueDate }
 *   Subscribe      = { endpoint, p256dh, auth }  (Web Push 구독 정보)
 */
import { apiClient } from './apiClient';

// ── Configuration ──────────────────────────────────────────────────────────────
export const REVIEW_CONFIG = {
  useMock: false,
  mockDelayMs: 400,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Mock DB ────────────────────────────────────────────────────────────────────
let MOCK_REVIEWS = [
  {
    scheduleId: 'rev_001',
    conceptName: '프로세스 관리',
    subjectName: '운영체제',
    quizCount: 5,
    dueDate: new Date().toISOString(),
  },
  {
    scheduleId: 'rev_002',
    conceptName: 'SQL 기초',
    subjectName: '데이터베이스',
    quizCount: 3,
    dueDate: new Date().toISOString(),
  },
  {
    scheduleId: 'rev_003',
    conceptName: '분할 정복',
    subjectName: '알고리즘',
    quizCount: 5,
    dueDate: new Date().toISOString(),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function mockGetTodayReviews() {
  await sleep(REVIEW_CONFIG.mockDelayMs);
  return [...MOCK_REVIEWS];
}

async function mockCompleteReview(scheduleId) {
  await sleep(REVIEW_CONFIG.mockDelayMs);
  MOCK_REVIEWS = MOCK_REVIEWS.filter((r) => r.scheduleId !== scheduleId);
  return null;
}

async function mockSubscribeNotification(subscribeData) {
  await sleep(REVIEW_CONFIG.mockDelayMs);
  console.log('[Mock] 푸시 알림 구독:', subscribeData);
  return { message: '알림 구독이 완료되었습니다.' };
}

async function mockUnsubscribeNotification(unsubscribeData) {
  await sleep(REVIEW_CONFIG.mockDelayMs);
  console.log('[Mock] 푸시 알림 구독 해제:', unsubscribeData);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
const realGetTodayReviews = () =>
  apiClient.get('/api/v1/reviews/today');

const realCompleteReview = (scheduleId) =>
  apiClient.post(`/api/v1/reviews/${scheduleId}/complete`);

const realSubscribeNotification = (subscribeData) =>
  apiClient.post('/api/v1/notifications/subscribe', subscribeData);

const realUnsubscribeNotification = (unsubscribeData) =>
  apiClient.delete('/api/v1/notifications/subscribe', { body: unsubscribeData });

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
const isMockEnabled = () => REVIEW_CONFIG.useMock;

export const reviewService = {
  /** 오늘 복습할 스케줄 목록 → ReviewSchedule[] */
  getTodayReviews() {
    return isMockEnabled() ? mockGetTodayReviews() : realGetTodayReviews();
  },

  /** 복습 완료 처리 */
  completeReview(scheduleId) {
    return isMockEnabled() ? mockCompleteReview(scheduleId) : realCompleteReview(scheduleId);
  },

  /**
   * Web Push 알림 구독
   * @param {{ endpoint: string, p256dh: string, auth: string }} subscribeData
   */
  subscribeNotification(subscribeData) {
    return isMockEnabled()
      ? mockSubscribeNotification(subscribeData)
      : realSubscribeNotification(subscribeData);
  },

  /**
   * Web Push 알림 구독 해제
   * @param {{ endpoint: string }} unsubscribeData
   */
  unsubscribeNotification(unsubscribeData) {
    return isMockEnabled()
      ? mockUnsubscribeNotification(unsubscribeData)
      : realUnsubscribeNotification(unsubscribeData);
  },
};
