# 🗺️ AIducation 웹 구조 (Web Structure)

> 생성일: 2026-04-28 | 버전: v1.7

---

## 1. 기술 스택

| 분류 | 라이브러리 | 버전 |
|------|-----------|------|
| UI 프레임워크 | React | ^19.2.4 |
| 라우팅 | react-router-dom | ^7.13.1 |
| 애니메이션 | framer-motion | ^12.38.0 |
| 차트 | recharts | ^2.10.0 |
| 아이콘 | lucide-react | ^1.7.0 |
| 파일 업로드 | react-dropzone | ^14.2.3 |
| 날짜 처리 | date-fns | ^3.0.0 |
| AI API | Gemini API | (via aiService.js) |

---

## 2. 라우트 구조

```
/login                          ← LoginPage (비로그인 진입점)
/oauth/callback                 ← OAuthCallbackPage (소셜 로그인 콜백)

/ (MainLayout — 로그인 필요)
├── /                           ← Dashboard (홈)
├── /upload                     ← UploadPage (문서 업로드)
├── /subjects                   ← SubjectPage (과목 관리)
├── /quiz                       ← QuizPage (퀴즈)
├── /quiz/:subjectId/:topicId   ← QuizPage (특정 토픽 퀴즈)
├── /review                     ← ReviewPage (오답 복습)
├── /report                     ← ReportPage (학습 리포트)
├── /ranking                    ← RankingPage (랭킹)
├── /mypage                     ← MyPage (마이페이지)
├── /notifications              ← Dashboard (임시 — 알림)
└── /settings                   ← Dashboard (임시 — 설정)

/admin (AdminLayout — 관리자 권한 필요)
├── /admin                      ← AdminDashboard
├── /admin/users                ← AdminUserManagement
├── /admin/contents             ← AdminContentManagement
├── /admin/ai-monitor           ← AdminAIMonitor
└── /admin/settings             ← AdminSettings
```

---

## 3. 소스 디렉토리 구조

```
src/
├── App.jsx                          # BrowserRouter & 라우트 정의, AdminRoute 가드
├── App.css
├── index.js                         # ReactDOM 진입점
├── index.css
│
├── context/
│   └── AppContext.js                # 전역 상태 관리 (React Context API)
│
├── services/
│   ├── aiService.js                 # AI 분석 & 퀴즈 생성 (Mock/Real 토글)
│   ├── authService.js               # 인증 서비스 (Mock/Real 토글)
│   └── apiClient.js                 # HTTP 클라이언트 (실제 API 연결용)
│
├── components/                      # Atomic Design 패턴
│   ├── atoms/                       # 최소 단위 컴포넌트
│   │   ├── AdminBadge/
│   │   ├── Avatar/
│   │   ├── Badge/
│   │   ├── Button/
│   │   ├── Icon/
│   │   ├── Input/
│   │   ├── ProgressBar/
│   │   └── index.js
│   │
│   ├── molecules/                   # atoms 조합 컴포넌트
│   │   ├── AdminStatCard/
│   │   ├── Card/
│   │   ├── ExpCard/
│   │   ├── NotificationItem/
│   │   ├── QuizOption/
│   │   ├── StatCard/
│   │   ├── StreakDisplay/
│   │   ├── TopicRow/
│   │   └── index.js
│   │
│   ├── organisms/                   # 독립 섹션 단위 컴포넌트
│   │   ├── AdminSidebar/
│   │   ├── AdminTable/
│   │   ├── FileUploader/
│   │   ├── QuizEngine/
│   │   ├── RankingTable/
│   │   ├── Sidebar/
│   │   ├── SubjectCard/
│   │   ├── SubjectManager/
│   │   └── index.js
│   │
│   └── templates/                   # 레이아웃 템플릿
│       ├── AdminLayout/             # 관리자 페이지 레이아웃
│       └── MainLayout/              # 일반 사용자 레이아웃
│
└── pages/
    ├── LoginPage/                   # 로그인
    ├── OAuthCallbackPage/           # 소셜 로그인 콜백
    ├── Dashboard/                   # 홈 대시보드
    ├── UploadPage/                  # 문서 업로드
    ├── SubjectPage/                 # 과목 관리
    ├── QuizPage/                    # 퀴즈
    ├── ReviewPage/                  # 오답 복습
    ├── ReportPage/                  # 학습 리포트
    ├── RankingPage/                 # 랭킹
    ├── MyPage/                      # 마이페이지
    ├── Admin/
    │   ├── AdminDashboard/          # 관리자 대시보드
    │   ├── AdminUserManagement/     # 사용자 관리
    │   ├── AdminContentManagement/  # 콘텐츠 관리
    │   ├── AdminAIMonitor/          # AI 모니터링
    │   └── AdminSettings/           # 시스템 설정
    └── index.js
```

---

## 4. 전역 상태 (AppContext.js)

| 상태 | 타입 | 설명 |
|------|------|------|
| `user` | Object \| null | 로그인한 사용자 정보 |
| `isInitializing` | boolean | 자동 로그인 검사 진행 여부 |
| `notifications` | Array | 알림 목록 |
| `wrongAnswers` | Array | 오답 목록 |
| `subjects` | Array | 과목 목록 |
| `topicQuestions` | Object | 토픽별 퀴즈 문제 캐시 |
| `dailyGoal` | Object | 일일 학습 목표 (localStorage 저장) |

### 주요 액션

- `login(token, userObj)` / `logout()` — 인증 상태 전환
- `addSubject` / `updateSubject` / `deleteSubject` — 과목 CRUD
- `addTopicToSubject` / `deleteTopicFromSubject` — 토픽 CRUD
- `setTopicQuestions(topicId, questions)` — 퀴즈 캐시 저장
- `addExp(exp)` / `submitQuizResult(correct, total)` — 경험치 & 퀴즈 결과

---

## 5. 서비스 레이어

### aiService.js

| 함수 | 설명 |
|------|------|
| `analyzeDocument(file, onProgress)` | 문서 분석 → 토픽 추출 |
| `generateQuiz(topicName, subjectName, options)` | 퀴즈 생성 (5지 선다, 5문제 이상) |
| `analyzeWrongAnswer(question, userAnswerText)` | 오답 분석 |
| `getAllContents()` | 관리자용 콘텐츠 목록 |
| `getAILogs()` | 관리자용 AI 처리 로그 |

> `AI_CONFIG.useMock: true` — 현재 Mock 모드 운영 중

### authService.js

| 함수 | 설명 |
|------|------|
| `login(email, password)` | 이메일 로그인 |
| `signup(email, password, name)` | 회원가입 |
| `findEmail(name)` | 이메일 찾기 |
| `resetPassword(email)` | 비밀번호 재설정 |
| `getMe(token)` | 내 정보 조회 |
| `getAllUsers()` | 관리자용 전체 사용자 조회 |
| `socialLogin(provider)` | 소셜 로그인 (Google 등) |

> `AUTH_CONFIG.useMock: true` — 현재 Mock 모드 운영 중

---

## 6. 레이아웃 구조

```
MainLayout
└── Sidebar (좌측 네비게이션)
    └── <Outlet> (각 페이지 렌더링)

AdminLayout
└── AdminSidebar (관리자 좌측 네비게이션)
    └── <Outlet> (관리자 페이지 렌더링)
```

---

## 7. 인증 흐름

```
앱 로드
  └── AppContext 초기화
        ├── URL에 ?token= 파라미터 존재? → OAuth 콜백 처리
        └── localStorage에 accessToken 존재?
              ├── 있음 → authService.getMe(token) → user 상태 설정
              └── 없음 → /login으로 리다이렉트

AdminRoute
  └── user.role === 'admin' 확인
        ├── 아님 → / 로 리다이렉트
        └── 맞음 → AdminLayout 렌더링
```
