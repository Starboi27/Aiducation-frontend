/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║               Subject / File / Concept Service Layer             ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * API 인터페이스:
 *   GET    /api/v1/subjects                        → Subject[]
 *   POST   /api/v1/subjects                        { subjectName } → Subject
 *   PATCH  /api/v1/subjects/{subjectId}            { newName } → Subject
 *   DELETE /api/v1/subjects/{subjectId}            → 204
 *
 *   GET    /api/v1/subjects/{subjectId}/files      → File[]
 *   POST   /api/v1/subjects/{subjectId}/files      FormData { file } → File
 *   DELETE /api/v1/files/{fileId}                  → 204
 *
 *   GET    /api/v1/subjects/{subjectId}/concepts   → Concept[]
 *
 * Types:
 *   Subject = { subjectId, subjectName, fileCount, conceptCount, createdAt }
 *   File    = { fileId, fileName, size, createdAt }
 *   Concept = { conceptId, conceptName, description, quizCount }
 */
import { apiClient } from './apiClient';

// ── Configuration ──────────────────────────────────────────────────────────────
export const SUBJECT_CONFIG = {
  useMock: false,
  mockDelayMs: 500,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Mock DB ────────────────────────────────────────────────────────────────────
let MOCK_SUBJECTS = [
  { subjectId: 'sub_001', subjectName: '운영체제', fileCount: 2, conceptCount: 3, createdAt: '2024-02-01T10:00:00Z' },
  { subjectId: 'sub_002', subjectName: '데이터베이스', fileCount: 1, conceptCount: 2, createdAt: '2024-02-10T14:00:00Z' },
  { subjectId: 'sub_003', subjectName: '알고리즘',    fileCount: 3, conceptCount: 4, createdAt: '2024-02-20T09:00:00Z' },
];

const MOCK_FILES = {
  sub_001: [
    { fileId: 'file_001', fileName: '운영체제_기말정리.pdf',   size: '2.4MB', createdAt: '2024-03-01T10:00:00Z' },
    { fileId: 'file_002', fileName: '프로세스_스레드.pdf',     size: '1.1MB', createdAt: '2024-03-05T14:00:00Z' },
  ],
  sub_002: [
    { fileId: 'file_003', fileName: '데이터베이스_기초.docx', size: '0.8MB', createdAt: '2024-03-02T11:00:00Z' },
  ],
  sub_003: [
    { fileId: 'file_004', fileName: '알고리즘_문제집.pdf',    size: '4.8MB', createdAt: '2024-03-10T09:00:00Z' },
    { fileId: 'file_005', fileName: '정렬알고리즘_정리.pdf',  size: '1.3MB', createdAt: '2024-03-12T13:00:00Z' },
    { fileId: 'file_006', fileName: '그래프이론.pdf',          size: '2.1MB', createdAt: '2024-03-15T16:00:00Z' },
  ],
};

const MOCK_CONCEPTS = {
  sub_001: [
    { conceptId: 'con_001', conceptName: '프로세스 관리', description: '프로세스 생명주기와 스케줄링',  quizCount: 5 },
    { conceptId: 'con_002', conceptName: '메모리 관리',   description: '가상 메모리와 페이징 기법',    quizCount: 5 },
    { conceptId: 'con_003', conceptName: 'CPU 스케줄링',  description: '스케줄링 알고리즘 비교 분석', quizCount: 5 },
  ],
  sub_002: [
    { conceptId: 'con_004', conceptName: 'SQL 기초',      description: 'SELECT/JOIN/GROUP BY 핵심',   quizCount: 5 },
    { conceptId: 'con_005', conceptName: '정규화',         description: '1NF~3NF 정규화 이론',         quizCount: 5 },
  ],
  sub_003: [
    { conceptId: 'con_006', conceptName: '분할 정복',      description: '재귀 기반 알고리즘 설계',      quizCount: 5 },
    { conceptId: 'con_007', conceptName: '동적 프로그래밍', description: 'DP 테이블 설계 패턴',          quizCount: 5 },
    { conceptId: 'con_008', conceptName: '그래프 탐색',     description: 'BFS/DFS 및 최단경로',         quizCount: 5 },
    { conceptId: 'con_009', conceptName: '탐욕 알고리즘',   description: 'Greedy 선택 조건과 증명',      quizCount: 5 },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function mockGetSubjects() {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  return [...MOCK_SUBJECTS];
}

async function mockCreateSubject(subjectName) {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  const newSubject = {
    subjectId: `sub_${Date.now()}`,
    subjectName,
    fileCount: 0,
    conceptCount: 0,
    createdAt: new Date().toISOString(),
  };
  MOCK_SUBJECTS.push(newSubject);
  MOCK_FILES[newSubject.subjectId] = [];
  MOCK_CONCEPTS[newSubject.subjectId] = [];
  return newSubject;
}

async function mockUpdateSubject(subjectId, newName) {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  const subject = MOCK_SUBJECTS.find((s) => s.subjectId === subjectId);
  if (!subject) throw new Error('과목을 찾을 수 없습니다.');
  subject.subjectName = newName;
  return subject;
}

async function mockDeleteSubject(subjectId) {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  MOCK_SUBJECTS = MOCK_SUBJECTS.filter((s) => s.subjectId !== subjectId);
  return null;
}

async function mockGetFiles(subjectId) {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  return MOCK_FILES[subjectId] ?? [];
}

async function mockUploadFile(subjectId, file) {
  await sleep(SUBJECT_CONFIG.mockDelayMs * 2);
  const newFile = {
    fileId: `file_${Date.now()}`,
    fileName: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(1)}MB`,
    createdAt: new Date().toISOString(),
  };
  if (!MOCK_FILES[subjectId]) MOCK_FILES[subjectId] = [];
  MOCK_FILES[subjectId].push(newFile);
  const subject = MOCK_SUBJECTS.find((s) => s.subjectId === subjectId);
  if (subject) subject.fileCount += 1;
  return newFile;
}

async function mockDeleteFile(fileId) {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  for (const subjectId of Object.keys(MOCK_FILES)) {
    const before = MOCK_FILES[subjectId].length;
    MOCK_FILES[subjectId] = MOCK_FILES[subjectId].filter((f) => f.fileId !== fileId);
    if (MOCK_FILES[subjectId].length < before) {
      const subject = MOCK_SUBJECTS.find((s) => s.subjectId === subjectId);
      if (subject) subject.fileCount -= 1;
    }
  }
  return null;
}

async function mockGetConcepts(subjectId) {
  await sleep(SUBJECT_CONFIG.mockDelayMs);
  return MOCK_CONCEPTS[subjectId] ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL API IMPLEMENTATIONS
// ─────────────────────────────────────────────────────────────────────────────
const realGetSubjects    = ()                       => apiClient.get('/api/v1/subjects');
const realCreateSubject  = (subjectName)            => apiClient.post('/api/v1/subjects', { subjectName });
const realUpdateSubject  = (subjectId, newName)     => apiClient.patch(`/api/v1/subjects/${subjectId}`, { newName });
const realDeleteSubject  = (subjectId)              => apiClient.delete(`/api/v1/subjects/${subjectId}`);

const realGetFiles       = (subjectId)              => apiClient.get(`/api/v1/subjects/${subjectId}/files`);
const realDeleteFile     = (fileId)                 => apiClient.delete(`/api/v1/files/${fileId}`);
const realGetConcepts    = (subjectId)              => apiClient.get(`/api/v1/subjects/${subjectId}/concepts`);

async function realUploadFile(subjectId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.postForm(`/api/v1/subjects/${subjectId}/files`, formData);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────
const isMockEnabled = () => SUBJECT_CONFIG.useMock;

export const subjectService = {
  /** 과목 목록 조회 → Subject[] */
  getSubjects() {
    return isMockEnabled() ? mockGetSubjects() : realGetSubjects();
  },

  /** 과목 생성 → Subject */
  createSubject(subjectName) {
    return isMockEnabled() ? mockCreateSubject(subjectName) : realCreateSubject(subjectName);
  },

  /** 과목명 수정 → Subject */
  updateSubject(subjectId, newName) {
    return isMockEnabled() ? mockUpdateSubject(subjectId, newName) : realUpdateSubject(subjectId, newName);
  },

  /** 과목 삭제 */
  deleteSubject(subjectId) {
    return isMockEnabled() ? mockDeleteSubject(subjectId) : realDeleteSubject(subjectId);
  },

  /** 과목별 파일 목록 조회 → FileItem[] */
  getFiles(subjectId) {
    return isMockEnabled() ? mockGetFiles(subjectId) : realGetFiles(subjectId);
  },

  /** 파일 업로드 */
  uploadFile(subjectId, file) {
    return isMockEnabled() ? mockUploadFile(subjectId, file) : realUploadFile(subjectId, file);
  },

  /** 파일 삭제 */
  deleteFile(fileId) {
    return isMockEnabled() ? mockDeleteFile(fileId) : realDeleteFile(fileId);
  },

  /** 과목별 핵심 개념 목록 조회 → Concept[] */
  getConcepts(subjectId) {
    return isMockEnabled() ? mockGetConcepts(subjectId) : realGetConcepts(subjectId);
  }
};

