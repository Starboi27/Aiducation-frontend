## Architecture

```
src/
├── App.jsx                    # BrowserRouter \& 라우트 정의
├── index.js                   # ReactDOM 진입점
├── components/
│   ├── atoms/                 # Avatar, Badge, Button, Icon, Input, ProgressBar
│   ├── molecules/             # Card, ExpCard, NotificationItem, QuizOption, StatCard, StreakDisplay, TopicRow
│   ├── organisms/             # FileUploader, QuizEngine, RankingTable, Sidebar, SubjectCard, SubjectManager
│   └── templates/             # MainLayout
├── context/
│   └── AppContext.js          # React Context API 전역 상태 관리
├── pages/                     # Dashboard, LoginPage, UploadPage, SubjectPage, QuizPage, ReviewPage, ReportPage, RankingPage, MyPage
└── services/
    ├── authService.js         # 인증 (mock/real API 토글)
    └── aiService.js           # AI 분석 \& 퀴즈 생성 (mock/real API 토글)
```

## 🛠️ Key Technical Decisions

- **Atomic Design**: UI의 일관성을 유지하고, 레고 블록처럼
 컴포넌트를 조합하여 개발 속도를 높이기 위해 선택함.

- **Service Layer (Mock/Real API)**: 실제 백엔드가 없어도
 프런트엔드 기능을 완벽하게 개발하고 테스트할 수 있도록 설계함.
 
- **Context API**: `AppContext.js`를 통해 전역 상태를 한 곳에서
  관리하여 데이터 동기화 문제를 해결함.