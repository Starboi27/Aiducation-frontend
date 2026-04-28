# 🚀 기능 명세서: 난이도 선택 시스템 구현

## 1. 개요
사용자가 학습 또는 테스트를 시작하기 전, 본인의 수준에 맞는 난이도를 선택할 수 있는 기능을 구현합니다. 기존의 즉시 시작 방식 대신, 난이도를 선택한 후 퀴즈로 진입하도록 로직을 수정합니다.

## 2. 위치 및 경로
- **URL**: `http://localhost:3000/subjects`
- **대상 페이지**: 과목(Subjects) 목록 페이지 (`src/pages/SubjectPage/SubjectPage.jsx`)
- **로직 컨트롤러**: `src/components/organisms/SubjectManager/SubjectManager.jsx`

## 3. 트리거 및 UI 동작
- **트리거**: 
    - `TopicRow` 컴포넌트 내의 `topic-row__start` 클래스를 가진 버튼 클릭 시
    - `SubjectCard` 컴포넌트 내의 `subject-card__all-quiz-btn` 클래스를 가진 버튼 클릭 시
- **동작**: 클릭 시 중앙 모달(Modal) 형태의 난이도 선택 UI가 노출됩니다.
    - 배경은 반투명 블러(Backdrop blur) 처리를 권장합니다.
    - 사용자는 5가지 난이도 중 하나를 반드시 선택해야 진행할 수 있습니다.

## 4. 난이도 옵션 (5단계)
제공되는 난이도와 내부 전달 값(Value)은 다음과 같습니다.

1. **Very Easy** (매우 쉬움) - `very_easy`
2. **Easy** (쉬움) - `easy`
3. **Normal** (보통) - `normal`
4. **Hard** (어려움) - `hard`
5. **Very Hard** (매우 어려움) - `very_hard`

## 5. 구현 시 상세 참고 사항

### [데이터 전달]
- 선택된 난이도 값은 퀴즈 페이지로 이동할 때 **URL Query Parameter**로 전달되어야 합니다.
- **예시**: `/quiz/:subjectId/:topicId?difficulty=normal` 또는 `/quiz/:subjectId/all?difficulty=hard`

### [UI/UX 디자인 가이드]
- 기존의 Purple 테마와 Glassmorphism 스타일을 유지합니다.
- `lucide-react` 아이콘을 활용하여 각 난이도를 시각화합니다.
    - 예: Smile, Meh, Frown, Flame 등
- 모달 외부 클릭 시 닫기(Close on backdrop click) 기능을 포함합니다.

### [컴포넌트 구조]
- `src/components/molecules/DifficultyModal/` (또는 유사한 경로)에 독립적인 컴포넌트로 분리하여 구현할 것을 권장합니다.
- `SubjectManager`에서 모달의 표시 여부와 현재 선택 중인 대상(subjectId, topicId)을 상태로 관리합니다.
