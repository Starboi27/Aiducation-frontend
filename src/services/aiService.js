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
 * 파일을 subject에 업로드한 뒤 AI 콜백이 개념 데이터를 채울 때까지 폴링.
 * @param {File}   file
 * @param {function} onProgress
 * @param {{ subjectId: string }} options - 실제 API 모드에서 subjectId 필수
 */
async function realAnalyzeDocument(file, onProgress, options = {}) {
  const { subjectId } = options;
  // subjectId 없으면 mock으로 폴백 (Create 응답에 subjectId 누락 시 대비)
  if (!subjectId) {
    console.warn('[aiService] subjectId 없음 → mock 분석으로 폴백');
    return mockAnalyzeDocument(file, onProgress);
  }

  // Step 1: 파일 업로드 → fileId 응답 저장
  onProgress?.({ step: 'reading', status: 'active', progress: 0 });
  const formData = new FormData();
  formData.append('file', file);
  const uploadRes = await apiClient.postForm(`/api/v1/subjects/${subjectId}/files`, formData);
  const fileId = uploadRes?.fileId ?? null;
  onProgress?.({ step: 'analyzing', status: 'active', progress: 33 });

  // Step 2: AI 콜백 완료를 폴링으로 확인 (최대 40회 × 3초 = 2분)
  const MAX_ATTEMPTS = 40;
  const INTERVAL_MS = 3000;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await sleep(INTERVAL_MS);

    const data = await apiClient.get(`/api/v1/subjects/${subjectId}/concepts`);
    // 응답 형식: { concepts:[...] } | { subjects:[...] } | 배열 직접
    const concepts =
      data?.concepts ??
      data?.subjects ??
      (Array.isArray(data) ? data : []);

    console.log(`[폴링 ${i + 1}/${MAX_ATTEMPTS}] 응답:`, data, '→ concepts:', concepts);

    const progress = 40 + Math.min(50, Math.floor((i / MAX_ATTEMPTS) * 50));
    onProgress?.({ step: 'categorizing', status: 'active', progress });

    if (concepts.length > 0) {
      onProgress?.({ step: 'categorizing', status: 'done', progress: 100 });
      return {
        id: subjectId,
        fileId: fileId,           // 삭제 시 사용할 실제 fileId
        subjectName: file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        source: 'auto',
        topics: concepts.map((c, idx) => ({
          id: c.conceptId ?? c.id,
          name: c.conceptName ?? c.name,
          description: c.description ?? '',
          quizCount: c.quizCount ?? 0,
          color: TOPIC_COLORS[idx % TOPIC_COLORS.length],
          questions: [],
        })),
      };
    }
  }

  throw new Error('AI 분석 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
}

/**
 * 개념(conceptId) 기반 퀴즈 생성.
 * POST로 생성 요청 → GET으로 폴링하여 문제 배열 반환.
 * options.conceptId 필수 (실제 API 모드).
 */
async function realGenerateQuiz(topicName, subjectName, options) {
  const { conceptId } = options;
  if (!conceptId) throw new Error('실제 API 모드에서는 options.conceptId가 필요합니다.');
  if (isNaN(Number(conceptId))) {
    return mockGenerateQuiz(topicName, subjectName, options);
  }


  // POST 전에 기존 퀴즈 ID 목록 저장 (사전 필터링)
  const existingData = await apiClient.get(`/api/v1/concepts/${conceptId}/quizzes`);
  const existingIds = (existingData.quizzes ?? existingData.questions ?? []).map(q => q.quizId);

  await apiClient.post(`/api/v1/concepts/${conceptId}/generate-quiz`, {
    count: options.count ?? AI_CONFIG.defaultQuizCount,
    difficulty: options.difficulty ?? 3,
  });

  // 백엔드가 비동기 생성 → GET으로 폴링 (최대 20회 × 3초 = 60초)
  const MAX_ATTEMPTS = 20;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await sleep(3000);
    const data = await apiClient.get(`/api/v1/concepts/${conceptId}/quizzes`);
    const quizzes = data.questions ?? data.quizzes ?? (Array.isArray(data) ? data : null);
    if (Array.isArray(quizzes) && quizzes.length > 0) {
      // 기존 ID에 없는 것만 골라냄 (이번에 새로 생성된 퀴즈)
      const newQuizzes = quizzes
        .filter(q => !existingIds.includes(q.quizId))
        .slice(0, options.count ?? AI_CONFIG.defaultQuizCount);
      if (newQuizzes.length === 0) continue;
      return newQuizzes.map((q, idx) => ({
        id: q.quizId ?? q.id ?? `q_${Date.now()}_${idx}`,
        topic: topicName,
        difficulty: q.difficulty ?? options.difficulty ?? 3,
        question: q.question,
        options: q.examples ?? q.options ?? [],
        correctIndex: q.correctAnswer != null ? Number(q.correctAnswer) : q.answer != null ? Number(q.answer) : null,
        explanation: q.explanation ?? '',
      }));
    }
  }
  throw new Error('퀴즈 생성 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.');
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
  if (isNaN(Number(quizId))) {
    return mockAnalyzeWrongAnswer(question, userAnswerText, options);
  }
  // 401 시 로그아웃 없이 에러만 throw (silent401)
  const data = await apiClient.get(`/api/v1/quizzes/${quizId}/explanation`, { silent401: true });
  return data.explanation ?? data;
}

// ── 퀴즈 일괄 제출 ────────────────────────────────────────────────────────────
// spec: POST /api/v1/quizzes/submit-all
//   body: { answers: [{ quizId, answer }] }
//   response: { results, expGained, levelUp, currentLevel, currentExp }
async function mockSubmitAll(answers) {
  await sleep(400);
  const results = answers.map(({ quizId, answer }) => ({
    quizId,
    correct: Math.random() > 0.4,
    correctAnswer: Math.floor(Math.random() * 5) + 1,
    submittedAnswer: answer,
  }));
  const correctCount = results.filter((r) => r.correct).length;
  return { results, expGained: correctCount * 10, levelUp: false, currentLevel: 1, currentExp: correctCount * 10 };
}

async function realSubmitAll(answers) {
  // mock ID(비정수)가 하나라도 있으면 mock 처리 — 401 → 로그아웃 방지
  const hasLocalIds = answers.some(({ quizId }) => isNaN(Number(quizId)));
  if (hasLocalIds) return mockSubmitAll(answers);
  return apiClient.post('/api/v1/quizzes/submit-all', { answers }, { silent401: true });
}

// ── 개념별 기존 퀴즈 목록 ──────────────────────────────────────────────────────
async function mockGetQuizzes(conceptId) {
  await sleep(AI_CONFIG.mockDelayMs);
  return buildMockQuestions(`concept_${conceptId}`, AI_CONFIG.defaultQuizCount);
}

async function realGetQuizzes(conceptId) {
  if (isNaN(Number(conceptId))) {
    return mockGetQuizzes(conceptId);
  }
  return apiClient.get(`/api/v1/concepts/${conceptId}/quizzes`);
}

// ── 퀴즈 단건 조회 ────────────────────────────────────────────────────────────
async function mockGetQuiz(quizId) {
  await sleep(300);
  return { subjectId: 1, subjectName: '[Mock] 운영체제' };
}

async function realGetQuiz(quizId) {
  if (isNaN(Number(quizId))) {
    return mockGetQuiz(quizId);
  }
  return apiClient.get(`/api/v1/quizzes/${quizId}`);
}

// ── 힌트 조회 ──────────────────────────────────────────────────────────────────
async function mockGetHint(quizId) {
  await sleep(400);
  return { hint: '[Mock] 핵심 키워드를 중심으로 문제를 다시 읽어보세요.' };
}

async function realGetHint(quizId) {
  if (isNaN(Number(quizId))) {
    return mockGetHint(quizId);
  }
  // 401 시 로그아웃 없이 에러만 throw (silent401)
  return apiClient.get(`/api/v1/quizzes/${quizId}/hint`, { silent401: true });
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
  return apiClient.get('/api/v1/admin/contents');
}

// ── Mock AI 작업 큐 (TaskQueueResponse 형식) ──────────────────────────────────
const MOCK_TASK_QUEUE = {
  summary: { pendingCount: 2, processingCount: 1, failedCount: 1 },
  tasks: [
    { taskId: 'task_001', type: 'FILE_PIPELINE',       status: 'COMPLETED',  createdAt: '2024-03-23T10:24:12Z', failReason: null },
    { taskId: 'task_002', type: 'QUIZ_GENERATION',     status: 'COMPLETED',  createdAt: '2024-03-23T10:21:05Z', failReason: null },
    { taskId: 'task_003', type: 'CONCEPTS_EXTRACTION', status: 'FAILED',     createdAt: '2024-03-23T10:15:30Z', failReason: 'AI 서버 응답 시간 초과' },
    { taskId: 'task_004', type: 'FILE_PIPELINE',       status: 'PENDING',    createdAt: '2024-03-23T09:42:15Z', failReason: null },
    { taskId: 'task_005', type: 'QUIZ_GENERATION',     status: 'PROCESSING', createdAt: '2024-03-23T09:30:00Z', failReason: null },
  ],
};

async function mockGetAILogs() {
  await sleep(400);
  return { ...MOCK_TASK_QUEUE };
}

async function realGetAILogs() {
  return apiClient.get('/api/v1/admin/tasks');
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
      modelName: AI_CONFIG.useMock ? 'Mock GChatGPT 4.1 ' : 'ChatGPT 4.1 ',
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
   * 퀴즈 일괄 제출 → { results, expGained, levelUp, currentLevel, currentExp }
   *
   * @param {{ quizId: number, answer: number }[]} answers - answer는 1-based (1~5)
   */
  submitAll(answers) {
    return AI_CONFIG.useMock
      ? mockSubmitAll(answers)
      : realSubmitAll(answers);
  },

  /**
   * 개념별 퀴즈 목록 조회 → Question[]
   *
   * @param {number|string} conceptId
   */
  getQuizzes(conceptId) {
    return AI_CONFIG.useMock
      ? mockGetQuizzes(conceptId)
      : realGetQuizzes(conceptId);
  },

  /**
   * 퀴즈 단건 조회 → Info { subjectId, subjectName }
   *
   * @param {number|string} quizId
   */
  getQuiz(quizId) {
    return AI_CONFIG.useMock
      ? mockGetQuiz(quizId)
      : realGetQuiz(quizId);
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
   * 퀴즈 해설 전체 응답 조회 (answer + explanation 모두 포함)
   * GET /api/v1/quizzes/{quizId}/explanation
   *
   * @param {string|number} quizId
   * @returns {Promise<{ explanation?: string, answer?: number, correctAnswer?: number }>}
   */
  getExplanation(quizId) {
    if (AI_CONFIG.useMock || isNaN(Number(quizId))) {
      // mock 문제는 correctIndex가 이미 있으므로 explanation만 반환
      return Promise.resolve({
        explanation: `[Mock 해설] 퀴즈 ${quizId}번 문제에 대한 자세한 해설입니다.`,
      });
    }
    // 401 시 로그아웃 없이 에러만 throw (silent401)
    return apiClient.get(`/api/v1/quizzes/${quizId}/explanation`, { silent401: true });
  },

  /**
   * 퀴즈 단건 제출 → 서버에 답 기록
   * POST /api/v1/quizzes/{quizId}/submit
   * answer는 1-based (1~5)
   */
  async submitAnswer(quizId, answerIdx) {
    if (AI_CONFIG.useMock || isNaN(Number(quizId))) return {};
    return apiClient.post(`/api/v1/quizzes/${quizId}/submit`, {
      answer: answerIdx,
    }, { silent401: true });
  },

  /**
   * 모든 업로드된 콘텐츠 목록 조회 (관리자용)
   */
  getAllContents() {
    return AI_CONFIG.useMock ? mockGetAllContents() : realGetAllContents();
  },

  /**
   * 내 오답 목록 조회 → IncorrectInfo[]
   * GET /api/v1/users/me/incorrects
   * IncorrectInfo: { quizId, question, examples, correctAnswer(0-based), explanation, difficulty, conceptName }
   */
  async getIncorrects() {
    if (AI_CONFIG.useMock) {
      await sleep(AI_CONFIG.mockDelayMs);
      return [];
    }
    const data = await apiClient.get('/api/v1/users/me/incorrects');
    const list = data?.incorrects ?? (Array.isArray(data) ? data : []);
    // 백엔드 필드 → 프론트 포맷 변환
    return list.map((item) => ({
      id: String(item.quizId),
      question: item.question,
      options: item.examples ?? [],
      correctIndex: item.correctAnswer != null ? Number(item.correctAnswer) : -1,
      explanation: item.explanation ?? '',
      difficulty: item.difficulty ?? 3,
      topic: item.conceptName ?? '기본 카테고리',
      subjectId: 'server',
      subjectName: '오답 노트',
      wrongCount: item.wrongCount ?? 1,
      lastAttemptAt: item.lastAttemptAt ?? new Date().toISOString(),
      isMastered: false,
    }));
  },
};
