# AIducation Frontend

> AI 기반 맞춤형 학습 플랫폼 — 파일 업로드 한 번으로 퀴즈 생성부터 오답 복습까지

## 기술 스택

| 항목 | 내용 |
|------|------|
| Framework | React 19 |
| Routing | React Router v7 |
| AI | Gemini API |
| 상태 관리 | Context API |
| 애니메이션 | Framer Motion |
| 차트 | Recharts |
| 아이콘 | Lucide React |

## 주요 기능

### 파일 업로드 & AI 분석
- PDF, TXT, DOCX, MD, PPTX 업로드 지원
- Gemini AI가 핵심 개념을 자동 추출해 주제별로 분류
- 업로드 진행 상태 실시간 표시

### 퀴즈
- 주제별 / 전체 / 난이도별 퀴즈 생성
- **실시간 피드백**: 문제마다 정답 확인 버튼 → 즉시 정오답 + 해설 표시
- 30초 타이머, 힌트 보기
- 퀴즈 완료 후 결과 화면에 정답 수 + 획득 경험치 표시

### 오답 복습 (ReviewPage)
- 틀린 문제 자동 수집, 토픽별 분류
- 복습 카드에서 다시 풀기 / 이해 완료 처리

### 랭킹 & 리포트
- 전체 사용자 경험치 랭킹
- 주간 학습 통계 차트

### 성장 시스템
- 레벨 / 경험치 / 연속 학습일 추적
- 정답 시 경험치 즉시 반영, 레벨업 알림

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm start

# 프로덕션 빌드
npm run build
```

## 프로젝트 구조

```
src/
├── components/
│   ├── atoms/          # Button, Badge, Input, ProgressBar ...
│   ├── molecules/      # Card, QuizOption, TopicRow ...
│   ├── organisms/      # FileUploader, QuizEngine, SubjectCard ...
│   └── templates/      # MainLayout
├── context/
│   └── AppContext.js   # 전역 상태 (user, subjects, wrongAnswers ...)
├── pages/              # Dashboard, QuizPage, ReviewPage, SubjectPage ...
└── services/
    ├── aiService.js    # AI 분석 & 퀴즈 생성 (mock/real 토글)
    ├── authService.js  # 인증
    └── subjectService.js
```

## 환경 변수

| 변수 | 설명 |
|------|------|
| `REACT_APP_API_BASE_URL` | 백엔드 API 주소 |

## 최근 업데이트 (v0.4)

- 퀴즈 실시간 피드백 — 문제마다 정답 확인 후 즉시 해설 표시
- 첫 시도 채점 — 서버 단건 제출로 정답 미공개 상태에서도 실시간 판정
- 결과 화면 경험치 합산 수정 (실시간 채점 XP 누락 버그 수정)
- 빈 과목 카드에 클릭 / 드래그앤드롭 업로드 존 추가
- 수동 과목 추가 플로우, 레벨업 알림
