# SettingsPage 설계서 (v0.9 API 스펙 기준)

> `0.9_ver_api.json` 실제 스펙을 기준으로 재설계. Gemini 초안 대비 API 불일치 항목 전면 수정.

---

## 라우트

```
/settings
```

---

## API 엔드포인트 매핑

| 섹션 | 엔드포인트 | 메서드 | 요청 스키마 | 응답 스키마 |
|------|-----------|--------|-------------|-------------|
| 학습 설정 조회 | `/api/v1/users/me/settings` | GET | - | `StudySettings` |
| 학습 설정 수정 | `/api/v1/users/me/settings` | PATCH | `UpdateStudySettings` | `Simple` |
| 알림 설정 조회 | `/api/v1/users/me/alarm-settings` | GET | - | `AlarmStatus` |
| 알림 설정 수정 | `/api/v1/users/me/alarm-settings` | PATCH | `UpdateAlarmSettings` | `AlarmStatus` |
| 프로필 수정 | `/api/v1/users/me/profile` | PATCH | `UpdateProfile` | `Simple` |
| 비밀번호 변경 | `/api/v1/users/me/password` | PATCH | `UpdatePassword` | `Simple` |
| 회원 탈퇴 | `/api/v1/users/me` | DELETE | - | `Simple` |

---

## 스키마 정의 (API 스펙 원문)

### StudySettings (GET 응답)
```json
{
  "dailyGoal": integer,
  "studyAlarmTime": { "hour": int, "minute": int, "second": int, "nano": int },
  "defaultDifficulty": integer
}
```

### UpdateStudySettings (PATCH 요청)
```json
{
  "dailyGoal": integer, // required, min:1, max:100
  "defaultDifficulty": integer, // required, min:0, max:5
  "studyAlarmTime": { "hour": int, "minute": int, "second": int, "nano": int }
}
```
> ⚠️ `reviewInterval` 필드 없음 — UI 전용으로 localStorage에만 저장

### AlarmStatus (GET 응답 / PATCH 응답)
```json
{
  "pushAlarm": boolean,
  "mailAlram": boolean,
  "rankingAlarm": boolean
}
```
> ⚠️ `mailAlram` — 백엔드 스펙 오타. `mailAlarm`이 아닌 `mailAlram` 사용 필수

### UpdateAlarmSettings (PATCH 요청)
```json
{
  "pushAlarm": boolean, // required
  "mailAlram": boolean, // required
  "rankingAlarm": boolean // required
}
```
> ⚠️ 3개 필드 모두 required → 개별 토글 시에도 전체 상태를 한 번에 전송

---

## 섹션별 설계

### 섹션 1 — 프로필 설정
- **필드**: 이름(`name`), 이메일(`email`)
- **저장**: `PATCH /api/v1/users/me/profile`
- **특이사항**: 없음

### 섹션 2 — 보안 / 비밀번호
- **필드**: 현재 비밀번호, 새 비밀번호, 확인
- **저장**: `PATCH /api/v1/users/me/password`
- **특이사항**: 클라이언트에서 새 비밀번호 일치 여부 검증 후 전송

### 섹션 3 — 학습 설정
- **필드**:

| 항목 | 상태 키 | API 필드 | 유효범위 | 저장 위치 |
|------|---------|---------|---------|---------|
| 일일 학습 목표 | `dailyGoal` | `dailyGoal` | 1~100 (분) | API |
| 학습 알림 시간 | `studyAlarmTime` | `studyAlarmTime` (LocalTime) | - | API |
| 기본 난이도 | `defaultDifficulty` | `defaultDifficulty` | 0~5 | API |
| 오답 복습 주기 | `reviewInterval` | **없음** | 0,1,3,7,14 | **localStorage만** |

- **저장**: `PATCH /api/v1/users/me/settings` + `localStorage.review_interval`
- **주의**: `studyAlarmTime`은 UI에서 `"HH:mm"` 문자열로 관리 → 전송 시 `LocalTime` 객체로 변환

### 섹션 4 — 알림 수신 설정
- **필드**: pushAlarm, mailAlram, rankingAlarm (모두 boolean)
- **저장**: `PATCH /api/v1/users/me/alarm-settings` (전체 3개 필드 항상 포함)
- **UX**: 토글 즉시 API 호출 → 실패 시 롤백

### 섹션 5 — 위험 구역
- **기능**: 회원 탈퇴
- **처리**: `DELETE /api/v1/users/me` → 성공 시 localStorage 초기화 + `/login` 이동

---

## Gemini 초안 대비 수정 항목

| # | 항목 | 기존 (버그) | 수정 |
|---|------|------------|------|
| 1 | `dailyGoal` UI max | 480 | **100** (API spec 준수) |
| 2 | `dailyGoal` UI label | "분" | "문제" → "분" (실제 의미는 분) |
| 3 | mock `studyAlarmTime` | `{ hour, minute, second, nano }` ✓ | 유지 |
| 4 | 알림 설정 필드명 | `mailAlram` ✓ | 유지 (백엔드 오타 동일하게) |
| 5 | `reviewInterval` API 전송 | localStorage only ✓ | 유지 |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/pages/SettingsPage/SettingsPage.jsx` | 설정 페이지 메인 컴포넌트 |
| `src/pages/SettingsPage/SettingsPage.css` | 스타일 |
| `src/services/userService.js` | 설정 API 서비스 레이어 |
