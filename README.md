# AIDucation v1.4

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

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 | React 19, React Router v7 |
| UI | Atomic Design, Framer Motion, Recharts |
| AI | Gemini API (Mock 모드 지원) |
| 상태 관리 | React Context API |
| 아이콘 | Lucide React |

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
