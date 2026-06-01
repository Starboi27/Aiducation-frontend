# 📔 AIducation v1.4 개발 회고 (Retrospective)

## 🕒 2026-04-06: 관리자 페이지 구현 및 검증 누락 사건

### 1. 사건 개요
- **상황**: `Phase 1~3`에 걸친 관리자 페이지(대시보드, 사용자 관리, 콘텐츠 관리, AI 모니터링, 시스템 설정)의 대규모 기능 구현 완료.
- **문제**: `.claude/CLAUDE.md`의 핵심 Mandate인 "검증은 완결을 위한 유일한 길(Validation is the only path to finality)"을 어기고, **사용자가 질문하기 전까지 자발적인 하네스(Harness) 검증을 수행하지 않음.**

### 2. 원인 분석
- **기능 구현 편중**: 방대한 분량의 Atomic Design 컴포넌트와 서비스 레이어 확장에 매몰되어, 작업의 '완결' 조건인 '검증(Validate)' 단계를 '수동적'으로 처리함.
- **프로세스 해이**: "사용자가 만족하면 끝"이라는 안일한 생각으로 프로젝트 고유의 품질 관리 도구(`harnees.py`, `ui_audit.py`) 활용을 소홀히 함.

### 3. 재발 방지 대책 (Mandate 강화)
- **자율 검증 필수화**: 모든 `Directives`(지시) 수행 후, 사용자에게 보고하기 전 반드시 아래 명령어를 스스로 실행하고 결과를 분석할 것.
  - `python3 .claude/evals/engines/ui_audit.py`
  - `python3 .claude/evals/engines/harness.py`
- **검증 결과 선보고**: "작업 완료" 보고 시, 위 검증 도구들의 패스 여부를 함께 기재하여 신뢰성을 확보할 것.

### 4. 최종 교훈
> **"사용자가 묻기 전에 증명하는 것이 시니어 프로그래머의 기본이다."**

---
*이 문서는 향후 동일한 실수를 방지하기 위해 작성되었습니다.*

---

## 🕒 2026-05-29: 퀴즈 정답 피드백 & 파일 삭제 버그 수정

### 1. 작업 내용

#### [버그 1] 과목 삭제 시 500 에러 (SubjectPage)
- **증상**: 과목 삭제 버튼 클릭 → `DELETE /api/v1/subjects/{id}` → 500
- **원인 분석**:
  - `GET /api/v1/subjects/{id}/files` 응답이 `{ "files": [] }` (빈 배열)
  - `deleteFile()` 호출이 스킵되어 파일이 남은 채로 `deleteSubject()` 호출
  - 백엔드가 파일이 남아있으면 과목 삭제를 거부
- **결론**: 테스트 계정 데이터 불일치 문제. 다른 계정에서는 정상 동작 확인.
- **수정 파일**: `src/pages/SubjectPage/SubjectPage.jsx` (응답 포맷 파싱 개선)

#### [버그 2] 퀴즈 정답 피드백 미반영 (QuizEngine)
- **증상**: 5문제 퀴즈 풀 때 정오답 피드백(✅/❌)이 표시되지 않음
- **원인 분석**:
  1. **타이밍 문제**: 퀴즈 생성 후 `getIncorrects()`를 비동기(fire-and-forget)로 호출 → 사용자가 먼저 답변
  2. **우선순위 문제**: `effectiveCorrectIndex`에서 `wrongAnswers` 데이터가 최하위 우선순위
  3. **범위 누락**: all 주제 퀴즈에서는 `getIncorrects()` 호출 자체 없음
- **해결 방향**: `GET /api/v1/users/me/incorrects`의 `correctAnswer`를 퀴즈 시작 전에 `wrongAnswers`에 반영 후 프론트 비교
- **수정 파일**:
  - `src/context/AppContext.js` — `loadWrongAnswers()` 액션 추가
  - `src/pages/QuizPage/QuizPage.jsx` — 퀴즈 생성 후 `await loadWrongAnswers()` → `setQuestions()` 순서로 타이밍 해결 (단일/전체/캐시 3개 분기 모두 적용)
  - `src/components/organisms/QuizEngine/QuizEngine.jsx` — `effectiveCorrectIndex` 우선순위 변경: `wrongAnswers` → `current.correctIndex` → 기타

### 2. 이번 세션 교훈
- **계획 먼저, 코드 나중**: 사용자 컨펌 없이 코드를 먼저 수정하는 실수 발생 (SubjectPage). 앞으로는 **설계서 작성 → 컨펌 → 구현** 순서 철저히 준수.
- **문제 파악 우선**: Playwright로 실제 네트워크 흐름을 확인한 후 원인을 특정하는 방식이 효과적.
