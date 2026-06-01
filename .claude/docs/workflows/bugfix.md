# 버그 수정 플레이북 (Bug Fix)

> 모델 설정: `@configs/models.md` 참고

```
REASONING_MODEL  = claude-opus-4-6      ← 1~2단계: 원인 분석 · 전략 수립
EXECUTE_MODEL    = claude-sonnet-4-6    ← 3~5단계: 수정 · 회귀 검증
```

---

## 🧠 REASONING 페이즈 — `claude-opus-4-6`

```
Agent(
  model: "opus",
  prompt: "아래 버그 증상을 분석하고 수정 전략을 수립해줘.
           [증상 및 관련 코드 전달]
           반환값: { 원인, 영향 범위, 수정 파일 목록, 회귀 위험 컴포넌트 }"
)
```

### 1단계: 원인 분석

```
- [ ] 버그 재현 조건 확인
- [ ] Atomic Design 계층 중 어느 레이어에서 발생했는지 특정
      (atom → molecule → organism → template → page → service 순서로 추적)
- [ ] Mock 모드 vs Real 모드 차이 여부 확인
- [ ] AppContext 상태 오염 가능성 점검
```

### 2단계: 수정 전략 수립

```
- [ ] 수정 범위 최소화 원칙 — 관련 없는 코드 손대지 않기
- [ ] @policies/ui_requirements.md 위반 없이 수정 가능한지 확인
- [ ] 회귀 위험 컴포넌트 목록 작성
- [ ] Mock 데이터 스키마 변경 필요 여부 판단
```

---

## ⚡ EXECUTE 페이즈 — `claude-sonnet-4-6`

### 3단계: 수정 적용

```
- [ ] 수정 범위 내 파일만 편집
- [ ] 테마 컬러 (#6C5CE7) 변경되지 않도록 주의
- [ ] 퀴즈 옵션 수 (5개) 유지 확인
```

### 4단계: 회귀 영향 검토

```
- [ ] Opus가 지정한 회귀 위험 컴포넌트 직접 확인
- [ ] 연결된 서비스(aiService.js / authService.js) 동작 유지 확인
- [ ] AppContext를 통해 연결된 다른 페이지 영향 없는지 확인
```

### 5단계: 하네스 검증 (필수)

```
- [ ] python3 .claude/evals/engines/ui_audit.py → PASS
- [ ] 검증 결과를 수정 보고에 함께 기재
```
