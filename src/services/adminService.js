/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    Admin Service Layer                            ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * API 인터페이스:
 *   GET    /api/v1/admin/users                       → UserList
 *   GET    /api/v1/admin/user/{id}                   → User
 *   PATCH  /api/v1/admin/users/{userId}/status       → UpdateUserStatus
 *   DELETE /api/v1/admin/users/{userId}              → DeleteUser
 *   GET    /api/v1/admin/users/level-distribution    → LevelDistribution
 *   GET    /api/v1/admin/quizzes                     → QuizList
 *   DELETE /api/v1/admin/quiz/{quizId}               → DeleteQuiz
 *   GET    /api/v1/admin/quizes/difficulty_status    → DifficultyStatus
 *   GET    /api/v1/admin/contents                    → ContentList
 *   GET    /api/v1/admin/concepts/pending            → ConceptMonitorList
 *   PATCH  /api/v1/admin/concepts/{conceptId}/status → Simple
 *   DELETE /api/v1/admin/concepts/{conceptId}        → Simple
 *   GET    /api/v1/admin/tasks                       → TaskQueueResponse
 *   DELETE /api/v1/admin/files/{fileId}              → Simple
 *   PUT    /api/v1/admin/levels/{level}              → Simple
 *   PUT    /api/v1/admin/difficulties/{difficulty}   → Simple
 *   GET    /api/v1/admin/stats/report                → Report
 *   GET    /api/v1/admin/stats/accuracy              → QuizAccuracy
 */
import { apiClient } from './apiClient';

export const ADMIN_CONFIG = {
  useMock: false,
  mockDelayMs: 500,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const isMock = () => ADMIN_CONFIG.useMock;

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────
let MOCK_USERS = [
  { ourId: 1, userId: 'testuser',  name: '이창현', email: 'test@test.com',    level: 12, totalExp: 12450, status: 'active',    role: 'ADMIN', joinDate: '2024-01-15T10:00:00Z', mailAlram: true,  totalSolvedCount: 1240, correctRate: 82, registeredSubjectCount: 5, lastActivityAt: '2026-05-26T14:30:00Z' },
  { ourId: 2, userId: 'kimminsu',  name: '김민수', email: 'kim@test.com',     level: 10, totalExp: 9820,  status: 'active',    role: 'USER',  joinDate: '2024-02-01T09:00:00Z', mailAlram: false, totalSolvedCount: 870,  correctRate: 74, registeredSubjectCount: 3, lastActivityAt: '2026-05-25T09:10:00Z' },
  { ourId: 3, userId: 'choiyuri',  name: '최유리', email: 'choi@test.com',    level: 9,  totalExp: 8640,  status: 'active',    role: 'USER',  joinDate: '2024-02-15T11:00:00Z', mailAlram: true,  totalSolvedCount: 650,  correctRate: 69, registeredSubjectCount: 2, lastActivityAt: '2026-05-24T18:00:00Z' },
  { ourId: 4, userId: 'jeonghein', name: '정해인', email: 'jeong@test.com',   level: 8,  totalExp: 7210,  status: 'suspended', role: 'USER',  joinDate: '2024-03-01T08:00:00Z', mailAlram: false, totalSolvedCount: 430,  correctRate: 61, registeredSubjectCount: 2, lastActivityAt: '2026-04-10T11:00:00Z' },
  { ourId: 5, userId: 'parkseojun',name: '박서준', email: 'park@test.com',    level: 7,  totalExp: 6050,  status: 'active',    role: 'USER',  joinDate: '2024-03-10T14:00:00Z', mailAlram: true,  totalSolvedCount: 310,  correctRate: 55, registeredSubjectCount: 1, lastActivityAt: '2026-05-27T08:45:00Z' },
];

const MOCK_LEVEL_DISTRIBUTION = {
  totalCount: 5,
  distribution: [
    { level: 1,  count: 0,  percentage: 0   },
    { level: 5,  count: 1,  percentage: 20  },
    { level: 7,  count: 1,  percentage: 20  },
    { level: 8,  count: 1,  percentage: 20  },
    { level: 9,  count: 1,  percentage: 20  },
    { level: 10, count: 1,  percentage: 20  },
    { level: 12, count: 1,  percentage: 20  },
  ],
};

let MOCK_QUIZZES = [
  { quizId: 1, userId: 'testuser',  conceptId: 1, quiz: '스택의 기본 동작 원리는?', difficulty: 2, answer: 2, createTime: '2024-03-20T10:00:00Z' },
  { quizId: 2, userId: 'kimminsu',  conceptId: 2, quiz: '데드락 발생 조건이 아닌 것은?', difficulty: 4, answer: 5, createTime: '2024-03-21T11:00:00Z' },
  { quizId: 3, userId: 'choiyuri',  conceptId: 3, quiz: 'SQL INNER JOIN 설명으로 옳은 것은?', difficulty: 3, answer: 3, createTime: '2024-03-22T09:00:00Z' },
];

const MOCK_DIFFICULTY_STATUS = {
  very_easy: 12, easy: 45, normal: 89, hard: 34, very_hard: 8, total: 188,
};

let MOCK_CONTENTS = [
  { id: 1, type: 'FILE',    name: '운영체제_기말고사_정리.pdf', ownerUserId: 'testuser',  createdAt: '2024-03-20T10:00:00Z' },
  { id: 2, type: 'FILE',    name: '데이터베이스_기초.docx',     ownerUserId: 'kimminsu',  createdAt: '2024-03-21T14:30:00Z' },
  { id: 3, type: 'FILE',    name: '알고리즘_문제집.pdf',        ownerUserId: 'choiyuri',  createdAt: '2024-03-22T09:15:00Z' },
  { id: 4, type: 'CONCEPT', name: '프로세스 관리',              ownerUserId: 'testuser',  createdAt: '2024-03-20T11:00:00Z' },
  { id: 5, type: 'CONCEPT', name: 'SQL 기초',                   ownerUserId: 'kimminsu',  createdAt: '2024-03-21T15:00:00Z' },
];

let MOCK_PENDING_CONCEPTS = [
  { conceptId: 10, name: '분산 시스템 개요',  status: 'PENDING',    subjectName: '네트워크'    },
  { conceptId: 11, name: '정규 표현식',        status: 'PENDING',    subjectName: '알고리즘'    },
  { conceptId: 12, name: 'REST API 설계',     status: 'PROCESSING', subjectName: '소프트웨어공학' },
];

const MOCK_TASKS = {
  summary: { pendingCount: 2, processingCount: 1, failedCount: 0 },
  tasks: [
    { taskId: 'task_001', type: 'FILE_PIPELINE',        status: 'COMPLETED',  createdAt: '2024-03-23T10:24:12Z', failReason: null },
    { taskId: 'task_002', type: 'QUIZ_GENERATION',      status: 'COMPLETED',  createdAt: '2024-03-23T10:21:05Z', failReason: null },
    { taskId: 'task_003', type: 'CONCEPTS_EXTRACTION',  status: 'FAILED',     createdAt: '2024-03-23T10:15:30Z', failReason: 'AI 서버 응답 시간 초과' },
    { taskId: 'task_004', type: 'FILE_PIPELINE',        status: 'PENDING',    createdAt: '2024-03-23T09:42:15Z', failReason: null },
    { taskId: 'task_005', type: 'QUIZ_GENERATION',      status: 'PROCESSING', createdAt: '2024-03-23T09:30:00Z', failReason: null },
  ],
};

const MOCK_ACCURACY = {
  totalSubmissions: 15820,
  totalCorrect: 11469,
  accuracyRate: 0.725,
};

const MOCK_REPORT = {
  quizAccuracy: MOCK_ACCURACY,
  levelDistribution: MOCK_LEVEL_DISTRIBUTION,
  userErrorLog: {},
};

// 레벨별 필요 경험치 설정 (1~10 레벨)
let MOCK_LEVEL_SETTINGS = Array.from({ length: 10 }, (_, i) => ({
  level: i + 1,
  requiredExp: (i + 1) * 500,
}));

// 난이도별 경험치 보상 설정 (0~4: very_easy~very_hard)
let MOCK_DIFFICULTY_SETTINGS = [
  { difficulty: 0, expReward: 5,  label: '매우 쉬움' },
  { difficulty: 1, expReward: 10, label: '쉬움'      },
  { difficulty: 2, expReward: 20, label: '보통'       },
  { difficulty: 3, expReward: 35, label: '어려움'     },
  { difficulty: 4, expReward: 50, label: '매우 어려움' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
const mockGetUsers = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { totalCount: MOCK_USERS.length, users: [...MOCK_USERS] };
};

const mockGetUser = async (id) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  const user = MOCK_USERS.find((u) => u.ourId === Number(id));
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');
  return { user };
};

const mockUpdateUserStatus = async (userId, status, reason) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  const user = MOCK_USERS.find((u) => u.ourId === Number(userId));
  if (user) user.status = status;
  return { status, reason };
};

const mockDeleteUser = async (userId, reason) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  MOCK_USERS = MOCK_USERS.filter((u) => u.ourId !== Number(userId));
  return { reason };
};

const mockUpdateUserExp = async (ourId, expDelta, reason) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  const user = MOCK_USERS.find((u) => u.ourId === Number(ourId));
  if (!user) throw new Error('사용자를 찾을 수 없습니다.');
  const newTotalExp = Math.max(0, (user.totalExp ?? 0) + expDelta);
  const newLevel = Math.min(10, Math.max(1, Math.floor(newTotalExp / 500) + 1));
  user.totalExp = newTotalExp;
  user.level = newLevel;
  return { resultCode: 200, newTotalExp, newLevel };
};

const mockGetLevelDistribution = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { ...MOCK_LEVEL_DISTRIBUTION };
};

const mockGetQuizzes = async ({ userId, difficulty, page } = {}) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  let quizzes = [...MOCK_QUIZZES];
  if (userId) quizzes = quizzes.filter((q) => q.userId === userId);
  if (difficulty !== undefined) quizzes = quizzes.filter((q) => q.difficulty === difficulty);
  return { totalCount: quizzes.length, quizzes };
};

const mockDeleteQuiz = async (quizId, reason) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  MOCK_QUIZZES = MOCK_QUIZZES.filter((q) => q.quizId !== Number(quizId));
  return { reason };
};

const mockGetDifficultyStatus = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { ...MOCK_DIFFICULTY_STATUS };
};

const mockGetContents = async ({ userId, type = 'all', page = 0 } = {}) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  let contents = [...MOCK_CONTENTS];
  if (userId) contents = contents.filter((c) => c.ownerUserId === userId);
  if (type !== 'all') contents = contents.filter((c) => c.type === type.toUpperCase());
  return { totalCount: contents.length, contents };
};

const mockGetPendingConcepts = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { totalCount: MOCK_PENDING_CONCEPTS.length, concepts: [...MOCK_PENDING_CONCEPTS] };
};

const mockUpdateConceptStatus = async (conceptId, status) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  const concept = MOCK_PENDING_CONCEPTS.find((c) => c.conceptId === Number(conceptId));
  if (concept) concept.status = status;
  return { resultCode: 200 };
};

const mockDeleteConcept = async (conceptId) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  MOCK_PENDING_CONCEPTS = MOCK_PENDING_CONCEPTS.filter((c) => c.conceptId !== Number(conceptId));
  return { resultCode: 200 };
};

const mockGetTasks = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { ...MOCK_TASKS };
};

const mockDeleteFile = async (fileId, reason) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  MOCK_CONTENTS = MOCK_CONTENTS.filter((c) => c.id !== Number(fileId));
  return { resultCode: 200, reason };
};

const mockGetLevelSettings = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return [...MOCK_LEVEL_SETTINGS];
};

const mockUpdateLevelExp = async (level, requiredExp) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  const setting = MOCK_LEVEL_SETTINGS.find((s) => s.level === level);
  if (setting) setting.requiredExp = requiredExp;
  return { resultCode: 200 };
};

const mockGetDifficultySettings = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return [...MOCK_DIFFICULTY_SETTINGS];
};

const mockUpdateDifficultyExp = async (difficulty, expReward) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  const setting = MOCK_DIFFICULTY_SETTINGS.find((s) => s.difficulty === difficulty);
  if (setting) setting.expReward = expReward;
  return { resultCode: 200 };
};

const mockGetReport = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { ...MOCK_REPORT };
};

const mockGetAccuracy = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { ...MOCK_ACCURACY };
};

let MOCK_NOTICE_SETTINGS = { alarmInterval: 24, isAlarmEnabled: true };

const mockGetNoticeSettings = async () => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  return { ...MOCK_NOTICE_SETTINGS };
};

const mockUpdateNoticeSettings = async (settings) => {
  await sleep(ADMIN_CONFIG.mockDelayMs);
  MOCK_NOTICE_SETTINGS = { ...MOCK_NOTICE_SETTINGS, ...settings };
  return { resultCode: 200 };
};

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
const realGetUsers         = ()                          => apiClient.get('/api/v1/admin/users');
const realGetUser          = (id)                        => apiClient.get(`/api/v1/admin/user/${id}`);
const realUpdateUserStatus = (userId, status, reason)    => apiClient.patch(`/api/v1/admin/users/${userId}/status`, { status, reason });
const realDeleteUser       = (userId, reason)            => apiClient.delete(`/api/v1/admin/users/${userId}`, { body: { reason } });
const realGetLevelDist     = ()                          => apiClient.get('/api/v1/admin/users/level-distribution');
const realUpdateUserExp    = (ourId, exp, reason)         => apiClient.patch(`/api/v1/admin/users/${ourId}/exp`, { exp, reason });

const realGetQuizzes    = ({ userId, difficulty, page } = {}) => {
  const params = new URLSearchParams();
  if (userId !== undefined)    params.set('userId', userId);
  if (difficulty !== undefined) params.set('difficulty', difficulty);
  if (page !== undefined)       params.set('page', page);
  const qs = params.toString();
  return apiClient.get(`/api/v1/admin/quizzes${qs ? `?${qs}` : ''}`);
};
const realDeleteQuiz        = (quizId, reason)    => apiClient.delete(`/api/v1/admin/quiz/${quizId}`, { body: { reason } });
const realGetDifficultyStatus = ()                => apiClient.get('/api/v1/admin/quizes/difficulty_status');

const LS_DELETED_FILES_KEY = 'admin_deleted_file_ids';
const getDeletedFileIds = () => JSON.parse(localStorage.getItem(LS_DELETED_FILES_KEY) ?? '[]');
const addDeletedFileId  = (id) => {
  const ids = getDeletedFileIds();
  if (!ids.includes(Number(id))) ids.push(Number(id));
  localStorage.setItem(LS_DELETED_FILES_KEY, JSON.stringify(ids));
};

const realGetContents = async ({ userId, type = 'all', page = 0 } = {}) => {
  const params = new URLSearchParams();
  if (userId) params.set('userId', userId);
  params.set('type', type);
  params.set('page', page);
  const data = await apiClient.get(`/api/v1/admin/contents?${params.toString()}`);
  const deletedIds = getDeletedFileIds();
  if (deletedIds.length && data?.contents) {
    data.contents = data.contents.filter((c) => !deletedIds.includes(Number(c.id)));
  }
  return data;
};

const realGetPendingConcepts  = ()                  => apiClient.get('/api/v1/admin/concepts/pending');
const realUpdateConceptStatus = (conceptId, status) => apiClient.patch(`/api/v1/admin/concepts/${conceptId}/status?status=${encodeURIComponent(status)}`);
const realDeleteConcept       = (conceptId)         => apiClient.delete(`/api/v1/admin/concepts/${conceptId}`);

const realGetTasks   = ()         => apiClient.get('/api/v1/admin/tasks');
const realDeleteFile = (fileId) => {
  addDeletedFileId(fileId);
  return apiClient.delete(`/api/v1/admin/files/${fileId}`).catch(() => ({ resultCode: 200 }));
};

const realUpdateLevelExp      = (level, requiredExp)    => apiClient.put(`/api/v1/admin/levels/${level}`, { requiredExp });
const realUpdateDifficultyExp = (difficulty, expReward) => apiClient.put(`/api/v1/admin/difficulties/${difficulty}`, { expReward });

const realGetReport   = () => apiClient.get('/api/v1/admin/stats/report');
const realGetAccuracy = () => apiClient.get('/api/v1/admin/stats/accuracy');

const realGetNoticeSettings    = ()         => apiClient.get('/api/v1/admin/settings/notice');
const realUpdateNoticeSettings = (settings) => apiClient.patch('/api/v1/admin/settings/notice', settings);

// getLevelSettings / getDifficultySettings는 별도 GET이 없으므로 mock만 제공
const realGetLevelSettings      = mockGetLevelSettings;
const realGetDifficultySettings = mockGetDifficultySettings;

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
export const adminService = {
  /** 사용자 전체 목록 → { totalCount, users } */
  getUsers()                              { return isMock() ? mockGetUsers() : realGetUsers(); },

  /** 사용자 단건 조회 → { user: UserInfo } */
  getUser(id)                             { return isMock() ? mockGetUser(id) : realGetUser(id); },

  /**
   * 사용자 상태 변경 → { status, reason }
   * @param {string} status - 'active' | 'suspended' | 'banned'
   * @param {string} reason
   */
  updateUserStatus(userId, status, reason) { return isMock() ? mockUpdateUserStatus(userId, status, reason) : realUpdateUserStatus(userId, status, reason); },

  /**
   * 사용자 삭제 → { reason }
   * @param {string} reason
   */
  deleteUser(userId, reason)               { return isMock() ? mockDeleteUser(userId, reason) : realDeleteUser(userId, reason); },

  /** 레벨 분포 통계 → { totalCount, distribution } */
  getLevelDistribution()                  { return isMock() ? mockGetLevelDistribution() : realGetLevelDist(); },

  /**
   * 사용자 경험치 조정 → { resultCode, newTotalExp, newLevel }
   * @param {number} ourId
   * @param {number} exp - 조정값 (양수: 지급, 음수: 차감)
   * @param {string} reason - 조정 사유
   */
  updateUserExp(ourId, exp, reason)       { return isMock() ? mockUpdateUserExp(ourId, exp, reason) : realUpdateUserExp(ourId, exp, reason); },

  /**
   * 퀴즈 전체 목록 → { totalCount, quizzes }
   * @param {{ userId?, difficulty?, page? }} opts
   */
  getQuizzes(opts = {})                   { return isMock() ? mockGetQuizzes(opts) : realGetQuizzes(opts); },

  /**
   * 퀴즈 삭제 → { reason }
   * @param {string} reason
   */
  deleteQuiz(quizId, reason)              { return isMock() ? mockDeleteQuiz(quizId, reason) : realDeleteQuiz(quizId, reason); },

  /** 난이도별 퀴즈 분포 → DifficultyStatus */
  getDifficultyStatus()                   { return isMock() ? mockGetDifficultyStatus() : realGetDifficultyStatus(); },

  /**
   * 콘텐츠 목록 → { totalCount, contents }
   * @param {{ userId?, type?, page? }} opts
   */
  getContents(opts = {})                  { return isMock() ? mockGetContents(opts) : realGetContents(opts); },

  /** 대기 중인 개념 목록 → { totalCount, concepts } */
  getPendingConcepts()                    { return isMock() ? mockGetPendingConcepts() : realGetPendingConcepts(); },

  /**
   * 개념 상태 변경 → { resultCode }
   * @param {string} status - 'APPROVED' | 'REJECTED'
   */
  updateConceptStatus(conceptId, status)  { return isMock() ? mockUpdateConceptStatus(conceptId, status) : realUpdateConceptStatus(conceptId, status); },

  /** 개념 삭제 → { resultCode } */
  deleteConcept(conceptId)                { return isMock() ? mockDeleteConcept(conceptId) : realDeleteConcept(conceptId); },

  /** AI 작업 큐 조회 → { summary, tasks } */
  getTasks()                              { return isMock() ? mockGetTasks() : realGetTasks(); },

  /** 파일 삭제 (관리자) → { resultCode } */
  deleteFile(fileId, reason)              { return isMock() ? mockDeleteFile(fileId, reason) : realDeleteFile(fileId); },

  /** 레벨별 경험치 설정 목록 조회 */
  getLevelSettings()                      { return isMock() ? mockGetLevelSettings() : realGetLevelSettings(); },

  /**
   * 특정 레벨 필요 경험치 수정 → { resultCode }
   * @param {number} level - 1~10
   * @param {number} requiredExp
   */
  updateLevelExp(level, requiredExp)      { return isMock() ? mockUpdateLevelExp(level, requiredExp) : realUpdateLevelExp(level, requiredExp); },

  /** 난이도별 경험치 보상 설정 목록 조회 */
  getDifficultySettings()                 { return isMock() ? mockGetDifficultySettings() : realGetDifficultySettings(); },

  /**
   * 특정 난이도 경험치 보상 수정 → { resultCode }
   * @param {number} difficulty - 0(매우쉬움)~4(매우어려움)
   * @param {number} expReward
   */
  updateDifficultyExp(difficulty, expReward) { return isMock() ? mockUpdateDifficultyExp(difficulty, expReward) : realUpdateDifficultyExp(difficulty, expReward); },

  /** 전체 통계 리포트 → { quizAccuracy, levelDistribution, userErrorLog } */
  getReport()                             { return isMock() ? mockGetReport() : realGetReport(); },

  /** 퀴즈 정확도 통계 → { totalSubmissions, totalCorrect, accuracyRate } */
  getAccuracy()                           { return isMock() ? mockGetAccuracy() : realGetAccuracy(); },

  /** 글로벌 알림 설정 조회 → { alarmInterval, isAlarmEnabled } */
  getNoticeSettings()                     { return mockGetNoticeSettings(); },

  /** 글로벌 알림 설정 수정 → { resultCode } */
  updateNoticeSettings(settings)          { return mockUpdateNoticeSettings(settings); },
};
