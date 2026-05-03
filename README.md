# AIDucation v0.5

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
- **마이페이지** — 프로필, 학습 기록

#### 관리자 페이지 (`/admin`)

- **대시보드** — 전체 현황 통계
- **사용자 관리** — 유저 목록, 권한 관리
- **콘텐츠 관리** — 업로드 문서 및 퀴즈 관리
- **AI 모니터링** — AI 응답 품질 추적
- **시스템 설정** — 플랫폼 설정

---

## 2026-05-03 작업 현황

### 인증 시스템 개선

- **토큰 자동 갱신 (Token Refresh)** — Access Token 만료 시 Refresh Token으로 자동 재발급 후 원래 요청 재시도. 재발급 실패 시에만 로그인 페이지로 이동.
- **공개 경로 토큰 분리** — 로그인/회원가입 등 공개 엔드포인트에 만료된 토큰을 함께 보내 Spring Security가 401 반환하던 버그 수정.
- **로그아웃 API 연동** — 기존 localStorage 토큰 삭제만 하던 방식에서 `POST /api/v1/auth/logout` 백엔드 호출 후 로컬 정리로 변경. 서버 오류 시에도 로컬 토큰은 반드시 삭제.
- **Refresh Token 저장 버그 수정** — 백엔드 응답에 `refreshToken`이 없을 때 문자열 `"undefined"`가 저장되던 문제 수정.
- **초기화 실패 시 토큰 정리 통일** — 앱 시작 시 토큰 검증 실패할 경우 `auth_token`만 삭제하던 것을 `refresh_token`, `user_info`까지 전부 정리하도록 수정.

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

- **구글 로그인:** 프론트엔드 UI는 준비되었으나, 백엔드 `application.yml` 설정 및 API 명세가 누락되어 작동하지 않음.
- **리다이렉트 주소:** 백엔드 설정의 `redirect-uri`가 `8080` 포트로 되어 있어, 리액트 개발 서버(`3000`)로의 정상적인 복귀가 불가능한 상태. (수정 필요)

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
    ├── aiService.js   # AI 분석 & 퀴즈 생성
    └── authService.js # 인증
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
