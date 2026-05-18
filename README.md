# AIDucation v0.9

AI 기반 맞춤형 학습 플랫폼. PDF/문서를 업로드하면 AI가 자동으로 퀴즈를 생성하고, 학습 진도를 추적합니다.

---

## 현재 구현 현황

### 완료된 기능

#### 사용자 페이지

- **로그인 / 회원가입** — 백엔드 실서버 연동 완료
- **대시보드** — 학습 통계, 스트릭, 최근 활동
- **과목 관리** — 과목 추가/삭제, 토픽별 분류
- **문서 업로드** — PDF 드래그앤드롭 업로드, AI 분석
- **퀴즈** — AI 생성 5지 선다형 퀴즈, 난이도 선택
- **복습** — 오답 복습 및 해설 제공
- **리포트** — 학습 성과 분석 및 시각화
- **랭킹** — 사용자 간 학습량 비교
- **마이페이지** — 프로필 수정, 비밀번호 변경, 회원 탈퇴
- **설정** — 학습 목표, 알림 설정, 비밀번호 변경, 소셜 연동 관리

#### 관리자 페이지 (`/admin`)

- **대시보드** — 전체 현황 통계 (실 API 연동)
- **사용자 관리** — 유저 목록, 정지/활성화/삭제
- **콘텐츠 관리** — 파일/개념 탭 분리, 개념 승인·거절
- **AI 모니터링** — TaskQueue 기반 AI 작업 현황 추적
- **시스템 설정** — 레벨별 경험치·난이도 보상 편집

---

## 2026-05-15 작업 현황 (v0.9)

### 사용자 설정 페이지 신규 구현

#### 신규 파일

| 파일 | 내용 |
|------|------|
| `src/pages/SettingsPage/SettingsPage.jsx` | 설정 페이지 컴포넌트 |
| `src/pages/SettingsPage/SettingsPage.css` | 설정 페이지 스타일 |
| `.claude/docs/SETTINGS_PAGE.md` | 설정 페이지 설계서 |

#### 구현 내용

- **학습 설정** — 하루 목표 문제 수 (1~100), 학습 알림 시간, 퀴즈 난이도 기본값, 오답 복습 주기
- **알림 설정** — 푸시 알림 토글, 학습 리포트 이메일, 랭킹 변동 이메일
- **보안** — 비밀번호 변경 폼 (소셜 전용 계정 비활성 처리), Google 소셜 연동 관리
- 설정값 `localStorage` 저장, 미저장 이탈 시 브라우저 경고
- API 연결 대비 async 구조 (비밀번호: `PATCH /api/v1/users/me/password`, 알림: `PUT /api/v1/notifications/alarm` 연결 예정)
- `/settings` 라우트 기존 Dashboard 임시 연결 → SettingsPage로 교체

---

## 2026-05-13 작업 현황 (v0.8)

### API 명세 v3 전면 반영

#### 버그 수정 (5건)

| 파일 | 수정 내용 |
|------|-----------|
| `aiService.js` | admin contents 경로 오타 수정 (`/api/admin/contents` → `/api/v1/admin/contents`) |
| `aiService.js` | AI 로그 엔드포인트 교체 (`/api/admin/ai-logs` → `/api/v1/admin/tasks`) |
| `authService.js` | 비밀번호 재설정 verify/complete 미존재 엔드포인트 → `useMockReset: true` 고정 |
| `userService.js` | 존재하지 않는 `GET /api/v1/users/me` → localStorage 캐시 사용으로 변경 |
| `aiService.js` | 개념 폴링 응답 형식 불일치 수정 — 배열로 가정하던 코드를 `{ concepts: [...] }` 객체 형식에 맞게 교정 (`data?.concepts` 우선 추출) |

#### 신규 기능 (서비스 레이어)

- **`adminService.js` 신규 생성** — 관리자 전용 18개 엔드포인트 Mock/Real 전체 구현
  - 사용자 관리: 목록/단건/상태변경/삭제/레벨분포
  - 퀴즈 관리: 전체조회/삭제/난이도현황
  - 콘텐츠 관리: 파일·개념 목록, 개념 승인·거절·삭제
  - AI 작업큐: TaskQueueResponse 형식 (`summary` + `tasks[]`)
  - 통계: 리포트·정확도
  - 설정: 레벨별 필요 경험치, 난이도별 경험치 보상 업데이트
- **`aiService.js`** — `submitAll`, `getQuizzes`, `getHint`, `getQuiz` 추가
  - 퀴즈 단건 제출 → `POST /api/v1/quizzes/submit-all` 일괄 제출로 교체
  - `GET /api/v1/quizzes/{quizId}` 신규 구현
- **`authService.js`** — `mailCheck` (`POST /oauth/mail_check`) 추가
- **`userService.js`** — `updateProfile`, `updatePassword`, `deleteAccount` 추가
- **`reviewService.js`** — `getAlarmStatus`, `toggleAlarm` (`GET/PUT /api/v1/notifications/alarm`) 추가

#### 관리자 페이지 5개 전면 재구성

| 페이지 | 변경 내용 |
|--------|-----------|
| `AdminDashboard` | `adminService.getReport()` 실 데이터 연동, 최근 작업 로그 표시 |
| `AdminUserManagement` | `adminService.getUsers()` 전환, 정지/활성화/삭제 기능 완성 |
| `AdminAIMonitor` | TaskItem 포맷 기반 재작성 (작업 유형·상태·실패 원인) |
| `AdminContentManagement` | 파일/대기 개념 2탭 구조, 승인·거절 기능 |
| `AdminSettings` | 레벨·난이도 경험치 인라인 편집 및 일괄 저장 |

#### 마이페이지 계정 설정 추가

- 프로필(이름·이메일) 인라인 편집
- 비밀번호 변경 폼 (현재 비밀번호 확인)
- 회원 탈퇴 (경고 문구 + 확인 후 처리)

#### Mock 데이터 스키마 동기화

| 항목 | 변경 내용 |
|------|-----------|
| `MOCK_DASHBOARD` | 스펙 `Dashboard` 스키마 적용 (`WeeklyStats`, `GrowthIndicator`, `WeakTypeStats[]`) |
| `MOCK_INCORRECTS` | `IncorrectList { totalCount, incorrects[] }` 형식, `options` → `examples` |
| `MOCK_RANKING` | `RankingList { totalCount, rankings[] }` 형식, `name` 필드 제거 |
| 랭킹 `page` 기본값 | `1` → `0` (스펙 기본값 일치) |

---

## 2026-05-07 작업 현황

### AI 콜백 비동기 아키텍처 구현 (`설계서.md` 기반)

기존 동기 방식(업로드 → 즉시 개념 조회)에서 **비동기 콜백 + 폴링** 구조로 전환.

```
[Step 1] subjectService.createSubject() → subjectId 확보
    ↓
[Step 2] POST /api/v1/subjects/{id}/files → 백엔드가 AI 서버에 분석 요청 후 즉시 200
    ↓
[Step 3] AI 서버가 분석 완료 후 POST /api/v1/internal/callback/concepts-extracted 호출
    ↓
[Step 4] GET /api/v1/subjects/{id}/concepts 폴링 (3초 간격, 최대 30회)
         → 데이터 수신 시 SubjectPage로 이동
```

#### 변경 파일

- **`aiService.js`** — `realAnalyzeDocument`를 폴링 루프로 교체
  - 파일 업로드 후 개념 데이터 폴링 (최대 90초 대기)
  - `onProgress` 진행률: 0% → 33% (업로드) → 40~90% (폴링 중) → 100% (완료)
- **`FileUploader.jsx`** — 분석 시작 전 `subjectService.createSubject()` 선행 호출
  - `subjectId`를 `analyzeDocument`에 `options`로 전달
  - 알림 메시지 필드명 `name` → `subjectName` 수정

---

## 2026-05-06 작업 현황

### API 연결 설계 전면 적용 (`API_DESIGN.md` 기반)

#### 신규 서비스 레이어 3개 추가

| 파일 | 역할 | 주요 API |
|------|------|---------|
| `subjectService.js` | 과목/파일/개념 관리 | `GET/POST/PATCH/DELETE /api/v1/subjects`, 파일 업로드, 개념 조회 |
| `userService.js` | 사용자/대시보드/랭킹 | `GET /api/v1/users/me`, 대시보드, 랭킹, 오답노트 |
| `reviewService.js` | 복습/알림 | `GET /api/v1/reviews/today`, 복습 완료, 푸시 알림 구독 |

#### 기존 서비스 실제 API 경로 전면 교체

- **`aiService.js`** — 구 경로(`/api/ai/*`) → 개념 기반 신규 경로로 전환
  - 파일 업로드: `POST /api/v1/subjects/{subjectId}/files`
  - 개념 조회: `GET /api/v1/subjects/{subjectId}/concepts`
  - 퀴즈 생성: `POST /api/v1/concepts/{conceptId}/generate-quiz`
  - 정답 제출: `POST /api/v1/quizzes/{quizId}/submit` (신규)
  - 힌트/해설: `GET /api/v1/quizzes/{quizId}/hint|explanation` (신규)
- **`authService.js`** — `findEmail` body 수정, `signup` 파라미터 분리(`userId`/`email`)
- **`apiClient.js`** — `PUBLIC_AUTH_PATHS`에 `/api/v1/auth/send-find-id` 추가

### 아이디 찾기 2단계 프로세스 재설계

기존 단순 조회 → **2단계 검증** 방식으로 개선 (동명이인 대응)

```
[input]  이름 입력 → POST /api/v1/auth/find-id
    ↓
[list]   마스킹 이메일 목록 표시 → 본인 이메일 클릭
    ↓
[complete] POST /api/v1/auth/send-find-id → 완료
```

- **`LoginPage.jsx`** — 3단계 UI 상태(`findEmailStep`: input / list / complete) 구현
- **`LoginPage.css`** — 이메일 선택 버튼 스타일 추가

### 버그 수정

- `realSendFindId` 경로 앞 `/` 누락 수정 (서버 연결 불가 오류)
- 이메일 선택 시 마스킹 이메일 대신 `fullEmail`(실제 이메일) 전송하도록 수정
- `authService.js` `realFindEmail` 함수 문법 오류(`name))`) 수정

---

## 2026-05-05 작업 현황

### 구글 소셜 로그인 디버깅 및 연동

- **`redirect_uri_mismatch` 에러 원인 확인** — Google Cloud Console에 `http://bbasung.iptime.org:8080/login/oauth2/code/google` URI 미등록이 원인. 콘솔에 직접 등록 필요.
- **토큰 발급 성공 확인** — Google OAuth 인증 자체는 정상 동작. `accessToken` / `refreshToken` 모두 정상 발급 확인.
- **리다이렉트 포트 오류 확인** — 백엔드가 OAuth 성공 후 `http://localhost:8080/oauth2/callback`(백엔드 포트)으로 리다이렉트하는 문제 발견. `http://localhost:3000`(프론트 포트)으로 변경 요청 필요.
- **유저 이름 `google_c5e3385f` 표시 문제 확인** — JWT 페이로드에 `name` 필드가 없어 내부 ID가 이름으로 표시되는 문제. 백엔드에 JWT 발급 시 `name`, `email` 클레임 추가 요청 필요. (구글 OAuth `profile` 스코프로 실명 획득 가능)
- **프론트 코드 이상 없음** — `OAuthCallbackPage.jsx`(토큰 저장 → 메인 이동), `apiClient.js`(Bearer 자동 주입) 모두 정상 구현 확인.

### 백엔드 요청 사항 (미완료)

| 항목 | 내용 |
|------|------|
| 리다이렉트 URL 수정 | OAuth 성공 후 `http://localhost:3000/oauth2/callback` 으로 리다이렉트 |
| JWT 클레임 추가 | `name`, `email` 필드 포함 |

---

## 2026-05-03 작업 현황

### 인증 시스템 개선

- **토큰 자동 갱신 (Token Refresh)** — Access Token 만료 시 Refresh Token으로 자동 재발급 후 원래 요청 재시도. 재발급 실패 시에만 로그인 페이지로 이동.
- **공개 경로 토큰 분리** — 로그인/회원가입 등 공개 엔드포인트에 만료된 토큰을 함께 보내 Spring Security가 401 반환하던 버그 수정.
- **로그아웃 API 연동** — 기존 localStorage 토큰 삭제만 하던 방식에서 `POST /api/v1/auth/logout` 백엔드 호출 후 로컬 정리로 변경. 서버 오류 시에도 로컬 토큰은 반드시 삭제.
- **Refresh Token 저장 버그 수정** — 백엔드 응답에 `refreshToken`이 없을 때 문자열 `"undefined"`가 저장되던 문제 수정.
- **초기화 실패 시 토큰 정리 통일** — 앱 시작 시 토큰 검증 실패할 경우 `accessToken`만 삭제하던 것을 `refresh_token`, `user_info`까지 전부 정리하도록 수정.

### 프로젝트 정리

- `.claude/` 디렉토리 정리 — 중복된 `config/`, `configs/` 폴더 통합, `settings.local.json` 루트 하나로 일원화
- 임시 계획 문서(PLAN, SPEC 등) 정리

---

## ⚠️ API 명세 및 연동 이슈

현재 백엔드 API 명세(`doc_api.json`)와 실제 구현 및 프론트엔드 요구사항 간의 차이점입니다.

### 1. 비밀번호 찾기 (Password Reset)

- **명세 불일치:** `POST /api/v1/auth/reset-password` 호출 시 명세상 `userId`와 `email`이 모두 필수이나, 현재 프론트는 이메일 기반으로 설계됨.
- **API 누락:** 인증번호 검증(`/verify`) 및 비밀번호 변경 완료(`/complete`) 엔드포인트가 공식 명세에 없으며, 현재 호출 시 `401 Unauthorized` 에러 발생. (비로그인 접근 허용 필요)

### 2. 소셜 로그인 (Social Login)

- **구글 로그인:** 토큰 발급까지는 성공. Google Cloud Console에 리다이렉트 URI 등록 및 백엔드 2가지 수정 후 완전 동작 예정.
- **리다이렉트 주소:** 백엔드가 OAuth 성공 후 `localhost:8080`(백엔드)으로 리다이렉트 → `localhost:3000`(프론트)으로 수정 요청 필요.
- **JWT 유저 정보 누락:** JWT에 `name`, `email` 미포함으로 유저명이 내부 ID(`google_c5e3385f`)로 표시됨. 백엔드에 클레임 추가 요청 필요.

---

## 기술 스택

| 분류       | 기술                                   |
| ---------- | -------------------------------------- |
| 프론트엔드 | React 19, React Router v7              |
| UI         | Atomic Design, Framer Motion, Recharts |
| AI         | Gemini API (Mock 모드 지원)            |
| 상태 관리  | React Context API                      |
| 아이콘     | Lucide React                           |

---

## 아키텍처

```
src/
├── components/
│   ├── atoms/        # Button, Input, Badge, ProgressBar 등
│   ├── molecules/    # Card, QuizOption, StatCard 등
│   ├── organisms/    # QuizEngine, FileUploader, Sidebar 등
│   └── templates/    # MainLayout, AdminLayout
├── context/          # AppContext (전역 상태)
├── pages/            # 각 라우트 페이지
└── services/
    ├── apiClient.js      # 공통 HTTP 클라이언트 (JWT 자동 주입, 토큰 갱신)
    ├── authService.js    # 인증 (로그인, 회원가입, 아이디/비밀번호 찾기)
    ├── aiService.js      # AI 분석 & 퀴즈 생성/제출/힌트/단건조회
    ├── subjectService.js # 과목/파일/개념 관리
    ├── userService.js    # 사용자 정보, 대시보드, 랭킹, 오답노트
    ├── reviewService.js  # 복습 스케줄, 푸시 알림, 메일 알람
    └── adminService.js   # 관리자 전용 (사용자·콘텐츠·퀴즈·통계·설정)
```

---

## 시작하기

```bash
npm install
npm start
```

> 현재 Mock 모드로 동작합니다. 실제 AI 연동 시 `GEMINI_API_KEY` 환경변수를 설정하세요.

---

## 개발 진행 상태

- [x] Atomic Design 컴포넌트 시스템
- [x] Mock 서비스 레이어 (AI)
- [x] 사용자 전체 페이지
- [x] 관리자 페이지
- [x] 로그인 / 회원가입 백엔드 연동
- [ ] 나머지 기능 백엔드 API 연동
- [ ] Gemini API 실서비스 연동
