/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    AI Service Layer                              ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * API 인터페이스 (Spring Boot 8080 → AI Server 8000 내부 프록시):
 *   POST /api/ai/analyze       FormData { file } → { subjectName, fileName, topics }
 *   POST /api/ai/quiz          { topicName, subjectName, count, difficulty } → { questions }
 *   POST /api/ai/analyze-wrong { question, userAnswerText } → { explanation }
 *
 * Types:
 *   Topic    = { id, name, description, quizCount, color }
 *   Question = { id, topic, difficulty, question, options: string[],
 *                correctIndex: number, explanation: string }
 */
import { apiClient } from './apiClient';

// ── Configuration ──────────────────────────────────────────────────────────────
export const AI_CONFIG = {
  // Spring Boot가 AI 서버(8000)를 내부적으로 프록시 → 프론트엔드는 8080만 사용
  baseUrl: process.env.REACT_APP_API_URL ?? 'http://localhost:8080',

  // Mock 전환: true → Mock 데이터 / false → 실제 백엔드 호출
  useMock: false,

  mockDelayMs: 900,    // 각 분석 단계 딜레이 (UX용)
  defaultQuizCount: 5, // 토픽당 기본 문제 수
};

// ── Shared Constants ───────────────────────────────────────────────────────────
const TOPIC_COLORS = [
  '#6C5CE7', '#00cec9', '#fd79a8', '#fdcb6e',
  '#00b894', '#e17055', '#0984e3', '#a29bfe',
];

// ── Keyword → Category Mapping (Mock용) ───────────────────────────────────────
const KEYWORD_TOPICS = {
  '영상처리': ['이미지 필터링', '엣지 검출 알고리즘', '푸리에 변환', '모폴로지 연산'],
  '운영체제': ['프로세스 관리', '메모리 관리', 'CPU 스케줄링', '동기화 문제'],
  '자료구조': ['선형 자료구조', '트리 구조', '그래프 구조', '해시 테이블'],
  '알고리즘': ['분할 정복', '동적 프로그래밍', '탐욕 알고리즘', '그래프 탐색'],
  '데이터베이스': ['관계형 모델', 'SQL 기초', '정규화', '트랜잭션'],
  '네트워크': ['OSI 7 계층', 'TCP/IP', 'HTTP & HTTPS', '라우팅 & 보안'],
  '머신러닝': ['지도 학습', '비지도 학습', '신경망 기초', '모델 평가'],
  '딥러닝': ['CNN 구조', 'RNN & LSTM', 'Transformer', '손실 함수 & 역전파'],
  '소프트웨어공학': ['요구사항 분석', '설계 패턴', 'UML', '테스트 전략'],
};

// ── Utility ────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeTopicId(index) {
  return `topic_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`;
}

// ── Mock: 파일명에서 토픽 추출 ──────────────────────────────────────────────────
function pickMockTopics(filename) {
  const base = filename.replace(/\.[^.]+$/, '');
  const matchedKey = Object.keys(KEYWORD_TOPICS).find(
    (k) => base.includes(k) || k.includes(base)
  );
  const names = matchedKey
    ? KEYWORD_TOPICS[matchedKey].slice(0, 4)
    : [`${base} 개요`, `${base} 핵심 이론`, `${base} 응용`, `${base} 심화`];

  return names.map((name, i) => ({
    id: makeTopicId(i),
    name,
    description: `"${base}"에서 추출된 "${name}" 핵심 개념 모음`,
    quizCount: Math.floor(Math.random() * 8) + 5,
    color: TOPIC_COLORS[i % TOPIC_COLORS.length],
    questions: [], // 문제는 generateQuiz 호출 시 채워짐
  }));
}

// ── Mock: 퀴즈 문제 생성 ─────────────────────────────────────────────────────
function buildMockQuestions(topicName, count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q_${Date.now()}_${i}`,
    topic: topicName,
    difficulty: Math.floor(Math.random() * 4) + 1,
    question: `[Mock] "${topicName}"에 관한 문제 ${i + 1}: 다음 중 옳은 것은?`,
    options: [
      `${topicName} 핵심 개념 A`,
      `${topicName} 핵심 개념 B`,
      `${topicName} 핵심 개념 C`,
      `${topicName} 핵심 개념 D`,
      `${topicName} 핵심 개념 E`,
    ],
    correctIndex: Math.floor(Math.random() * 5),
    explanation: `실제 AI API 연동 시 "${topicName}"의 학습 내용을 기반으로 자동 생성된 해설이 표시됩니다.`,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function mockAnalyzeDocument(file, onProgress) {
  const delay = AI_CONFIG.mockDelayMs;

  onProgress?.({ step: 'reading',      status: 'active', progress: 0  });
  await sleep(delay);

  onProgress?.({ step: 'reading',      status: 'done',   progress: 33 });
  onProgress?.({ step: 'analyzing',    status: 'active', progress: 33 });
  await sleep(delay);

  onProgress?.({ step: 'analyzing',    status: 'done',   progress: 66 });
  onProgress?.({ step: 'categorizing', status: 'active', progress: 66 });
  await sleep(delay);

  onProgress?.({ step: 'categorizing', status: 'done',   progress: 100 });

  return {
    subjectName: file.name.replace(/\.[^.]+$/, ''),
    fileName: file.name,
    source: 'auto',
    topics: pickMockTopics(file.name),
  };
}

async function mockGenerateQuiz(topicName, _subjectName, options) {
  await sleep(AI_CONFIG.mockDelayMs);
  return buildMockQuestions(topicName, options.count ?? AI_CONFIG.defaultQuizCount);
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 파일을 subject에 업로드하고, 추출된 개념(concepts)을 Topic 형식으로 반환.
 * @param {File}   file
 * @param {function} onProgress
 * @param {{ subjectId: string }} options - 실제 API 모드에서 subjectId 필수
 */
async function realAnalyzeDocument(file, onProgress, options = {}) {
  const { subjectId } = options;
  if (!subjectId) throw new Error('실제 API 모드에서는 options.subjectId가 필요합니다.');

  onProgress?.({ step: 'reading', status: 'active', progress: 0 });

  const formData = new FormData();
  formData.append('file', file);

  // 파일 업로드 → POST /api/v1/subjects/{subjectId}/files
  await apiClient.postForm(`/api/v1/subjects/${subjectId}/files`, formData);
  onProgress?.({ step: 'analyzing', status: 'active', progress: 50 });

  // 개념 목록 조회 → GET /api/v1/subjects/{subjectId}/concepts
  const concepts = await apiClient.get(`/api/v1/subjects/${subjectId}/concepts`);
  onProgress?.({ step: 'categorizing', status: 'done', progress: 100 });

  return {
    subjectName: file.name.replace(/\.[^.]+$/, ''),
    fileName: file.name,
    source: 'auto',
    topics: (concepts ?? []).map((c, i) => ({
      id: c.conceptId ?? c.id,
      name: c.conceptName ?? c.name,
      description: c.description ?? '',
      quizCount: c.quizCount ?? 0,
      color: TOPIC_COLORS[i % TOPIC_COLORS.length],
      questions: [],
    })),
  };
}

/**
 * 개념(conceptId) 기반 퀴즈 생성.
 * options.conceptId 필수 (실제 API 모드).
 */
async function realGenerateQuiz(topicName, subjectName, options) {
  const { conceptId } = options;
  if (!conceptId) throw new Error('실제 API 모드에서는 options.conceptId가 필요합니다.');

  const data = await apiClient.post(`/api/v1/concepts/${conceptId}/generate-quiz`, {
    count: options.count ?? AI_CONFIG.defaultQuizCount,
    difficulty: options.difficulty ?? 3,
  });

  const quizzes = data.questions ?? data ?? [];
  return quizzes.map((q, i) => ({
    id: q.quizId ?? q.id ?? `q_${Date.now()}_${i}`,
    topic: topicName,
    difficulty: q.difficulty ?? 3,
    question: q.question,
    options: q.options ?? [],
    // 백엔드 answer는 1-5 (1-based) → 프론트 correctIndex는 0-based
    correctIndex: (q.answer ?? 1) - 1,
    explanation: q.explanation ?? '',
  }));
}

async function mockAnalyzeWrongAnswer(question, userAnswerText) {
  await sleep(AI_CONFIG.mockDelayMs * 1.5);
  return `[AI 분석] "${question}"에서 "${userAnswerText}"를 선택한 이유는 핵심 개념의 혼동으로 보입니다. 정답과의 차이를 명확히 이해하고 관련 개념을 복습하세요. (실제 API 연동 시 정밀한 분석이 제공됩니다.)`;
}

/**
 * 퀴즈 해설 조회 → GET /api/v1/quizzes/{quizId}/explanation
 * options.quizId 필수 (실제 API 모드).
 */
async function realAnalyzeWrongAnswer(question, userAnswerText, options = {}) {
  const { quizId } = options;
  if (!quizId) throw new Error('실제 API 모드에서는 options.quizId가 필요합니다.');
  const data = await apiClient.get(`/api/v1/quizzes/${quizId}/explanation`);
  return data.explanation ?? data;
}

// ── 정답 제출 ──────────────────────────────────────────────────────────────────
async function mockSubmitAnswer(quizId, answer) {
  await sleep(300);
  return { correct: Math.random() > 0.4, expGained: 10 };
}

async function realSubmitAnswer(quizId, answer) {
  // answer: 1-5 (1-based)
  return apiClient.post(`/api/v1/quizzes/${quizId}/submit`, { answer });
}

// ── 힌트 조회 ──────────────────────────────────────────────────────────────────
async function mockGetHint(quizId) {
  await sleep(400);
  return { hint: '[Mock] 핵심 키워드를 중심으로 문제를 다시 읽어보세요.' };
}

async function realGetHint(quizId) {
  return apiClient.get(`/api/v1/quizzes/${quizId}/hint`);
}

// ── Mock 콘텐츠 DB (관리자용) ──────────────────────────────────────────────────
const MOCK_CONTENTS = [
  { id: 'file_001', name: '운영체제_기말고사_정리.pdf', uploader: '이창현', size: '2.4MB', createdAt: '2024-03-20T10:00:00Z', topicCount: 4, quizCount: 32 },
  { id: 'file_002', name: '데이터베이스_기초.docx', uploader: '김민수', size: '1.1MB', createdAt: '2024-03-21T14:30:00Z', topicCount: 3, quizCount: 15 },
  { id: 'file_003', name: '알고리즘_문제집.pdf', uploader: '최유리', size: '4.8MB', createdAt: '2024-03-22T09:15:00Z', topicCount: 6, quizCount: 60 },
  { id: 'file_004', name: '네트워크_프로토콜.pdf', uploader: '정해인', size: '3.2MB', createdAt: '2024-03-23T11:45:00Z', topicCount: 5, quizCount: 25 },
];

async function mockGetAllContents() {
  await sleep(500);
  return MOCK_CONTENTS;
}

async function realGetAllContents() {
  return apiClient.get('/api/admin/contents');
}

// ── Mock AI 로그 (관리자용) ────────────────────────────────────────────────────
const MOCK_AI_LOGS = [
  { id: 'log_001', service: 'Document Analysis', user: '이창현', status: 'success', duration: '1.2s', tokens: 450, createdAt: '2024-03-23T10:24:12Z' },
  { id: 'log_002', service: 'Quiz Generation', user: '이창현', status: 'success', duration: '2.5s', tokens: 1280, createdAt: '2024-03-23T10:21:05Z' },
  { id: 'log_003', service: 'Document Analysis', user: '김민수', status: 'error', duration: '0.8s', tokens: 0, createdAt: '2024-03-23T10:15:30Z', error: 'Timeout' },
  { id: 'log_004', service: 'Wrong Answer Analysis', user: '최유리', status: 'success', duration: '1.8s', tokens: 320, createdAt: '2024-03-23T09:42:15Z' },
];

async function mockGetAILogs() {
  await sleep(400);
  return MOCK_AI_LOGS;
}

async function realGetAILogs() {
  return apiClient.get('/api/admin/ai-logs');
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API  ← 컴포넌트에서 이 인터페이스만 사용
// ─────────────────────────────────────────────────────────────────────────────
export const aiService = {
  /**
   * AI 설정 정보 조회
   */
  getSettings() {
    return {
      useMock: AI_CONFIG.useMock,
      baseUrl: AI_CONFIG.baseUrl,
      defaultQuizCount: AI_CONFIG.defaultQuizCount,
      modelName: AI_CONFIG.useMock ? 'Mock Gemini-2.5-flash-lite' : 'Gemini-2.5-flash-lite',
    };
  },

  /**
   * AI 서비스 로그 조회 (관리자용)
   */
  getAILogs() {
    return AI_CONFIG.useMock ? mockGetAILogs() : realGetAILogs();
  },

  /**
   * 파일을 과목에 업로드 후 추출된 개념을 Topic 형식으로 반환합니다.
   *
   * @param {File} file
   * @param {(event: ProgressEvent) => void} onProgress
   * @param {{ subjectId?: string }} options - 실제 API 모드에서 subjectId 필수
   * @returns {Promise<{ subjectName: string, fileName: string, source: 'auto', topics: Topic[] }>}
   */
  analyzeDocument(file, onProgress, options = {}) {
    return AI_CONFIG.useMock
      ? mockAnalyzeDocument(file, onProgress)
      : realAnalyzeDocument(file, onProgress, options);
  },

  /**
   * 특정 토픽에 대한 퀴즈 문제를 생성합니다.
   * 결과는 AppContext의 setTopicQuestions로 캐시하여 재호출을 방지하세요.
   *
   * @param {string} topicName
   * @param {string} subjectName
   * @param {{ count?: number, difficulty?: number, conceptId?: string }} options
   *   - 실제 API 모드에서 conceptId 필수
   * @returns {Promise<Question[]>}
   */
  generateQuiz(topicName, subjectName, options = {}) {
    return AI_CONFIG.useMock
      ? mockGenerateQuiz(topicName, subjectName, options)
      : realGenerateQuiz(topicName, subjectName, options);
  },

  /**
   * 퀴즈 해설 텍스트를 반환합니다.
   *
   * @param {string} question
   * @param {string} userAnswerText
   * @param {{ quizId?: string }} options - 실제 API 모드에서 quizId 필수
   * @returns {Promise<string>}
   */
  analyzeWrongAnswer(question, userAnswerText, options = {}) {
    return AI_CONFIG.useMock
      ? mockAnalyzeWrongAnswer(question, userAnswerText)
      : realAnalyzeWrongAnswer(question, userAnswerText, options);
  },

  /**
   * 퀴즈 정답 제출 → { correct: boolean, expGained: number }
   *
   * @param {string} quizId
   * @param {number} answer - 1-based (1~5)
   */
  submitAnswer(quizId, answer) {
    return AI_CONFIG.useMock
      ? mockSubmitAnswer(quizId, answer)
      : realSubmitAnswer(quizId, answer);
  },

  /**
   * 퀴즈 힌트 조회 → { hint: string }
   *
   * @param {string} quizId
   */
  getHint(quizId) {
    return AI_CONFIG.useMock
      ? mockGetHint(quizId)
      : realGetHint(quizId);
  },

  /**
   * 모든 업로드된 콘텐츠 목록 조회 (관리자용)
   */
  getAllContents() {
    return AI_CONFIG.useMock ? mockGetAllContents() : realGetAllContents();
  }
};

