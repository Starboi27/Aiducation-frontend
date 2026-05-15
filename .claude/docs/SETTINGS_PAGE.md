# SettingPage 설계서

> 일반 사용자용 앱 동작 방식 제어 페이지. MyPage(프로필·활동 통계)와 역할 분리.

---

## 라우트

```
/settings
```

## 페이지 구조

```
SettingPage
├── 학습 설정 (LearningSettings)
├── 알림 설정 (NotificationSettings)
├── 화면 설정 (DisplaySettings)
└── 보안 (SecuritySettings)
```

---

## 섹션별 상세

### 1. 학습 설정

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| 하루 목표 문제 수 | number input (1~100) | 20 | 대시보드 목표 달성률에 반영 |
| 학습 알림 시간 | time picker | 09:00 | 알림 발송 기준 시각 |
| 퀴즈 난이도 기본값 | select (쉬움/보통/어려움) | 보통 | 퀴즈 생성 시 초기값으로 사용 |
| 오답 복습 주기 | select (1일/3일/7일/끄기) | 3일 | ReviewPage 재출제 간격 |

---

### 2. 알림 설정

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| 푸시 알림 | toggle | ON | 학습 리마인더 등 앱 푸시 |
| 학습 리포트 이메일 | toggle | ON | 주간 리포트 이메일 수신 |
| 랭킹 변동 이메일 | toggle | OFF | 랭킹 순위 변동 알림 이메일 |

---

### 3. 화면 설정

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| 다크모드 | toggle | OFF | 전체 테마 다크/라이트 전환 |

---

### 4. 보안

| 항목 | 타입 | 설명 |
|------|------|------|
| 비밀번호 변경 | form (현재 PW → 새 PW → 확인) | 이메일 계정 전용 (소셜 로그인 시 비활성) |
| 소셜 연동 관리 | 연동/해제 버튼 | Google OAuth 연결 상태 표시 및 해제 |

---

## 상태 관리

- 설정값은 `AppContext`의 `userSettings` 필드로 관리
- 저장 버튼 클릭 시 `authService.updateSettings()` 호출 (Mock 우선)
- 저장 성공 시 토스트 알림 표시

## Mock 데이터 스키마

```js
userSettings: {
  learning: {
    dailyGoal: 20,
    reminderTime: "09:00",
    defaultDifficulty: "보통",   // "쉬움" | "보통" | "어려움"
    reviewInterval: "3일",       // "1일" | "3일" | "7일" | "끄기"
  },
  notification: {
    pushEnabled: true,
    reportEmail: true,
    rankingEmail: false,
  },
  display: {
    darkMode: false,
  },
  security: {
    isSocialOnly: false,         // true면 비밀번호 변경 폼 비활성
    googleLinked: true,
  }
}
```

---

## UI 규칙 체크리스트

- [ ] 섹션 헤더 강조 색상: `#6C5CE7`
- [ ] 저장 버튼: 보라색 계열
- [ ] 변경 사항 저장 전 페이지 이탈 시 경고 모달 표시
- [ ] 비밀번호 변경 폼: 소셜 전용 계정이면 비활성(disabled) 처리 + 안내 문구

---

## Atomic 계층 계획

| 컴포넌트 | 계층 | 경로 |
|---------|------|------|
| `SettingSection` | molecule | `components/molecules/SettingSection` |
| `ToggleSetting` | molecule | `components/molecules/ToggleSetting` |
| `SettingPage` | page | `pages/SettingPage/SettingPage.jsx` |

---

## 관련 문서

- UI/UX 법전: `@policies/ui_requirements.md`
- 인증 서비스: `src/services/authService.js`
- 전역 상태: `src/context/AppContext.js`
