# AI 로직 개선 플레이북 (AI Logic)

> 모델 설정: `@configs/models.md` 참고

```
REASONING_MODEL  = claude-opus-4-6      ← 1~2단계: 프롬프트 설계 · 평가 기준 수립
EXECUTE_MODEL    = claude-sonnet-4-6    ← 3~5단계: 코드 수정 · 검증
```

---

## 🧠 REASONING 페이즈 — `claude-opus-4-6`

```
Agent(
  model: "opus",
  prompt: "아래 aiService.js의 현재 로직을 분석하고 개선 방향을 설계해줘.
           [현재 코드 및 문제 상황 전달]
           반환값: { 프롬프트 개선안, 출력 스키마, 테스트 케이스 3개, 주의사항 }"
)
```

### 1단계: 현재 AI 로직 분석

```
- [ ] src/services/aiService.js 의 프롬프트 템플릿 검토
- [ ] 현재 Mock 출력 스키마 확인 (question, options, answer, explanation 구조)
- [ ] @policies/ui_requirements.md 의 퀴즈 규칙 대조
      - 문제 수: 토픽당 5개 이상
      - 형식: 5지 선다형
      - 해설: 모든 문제에 포함 필수
- [ ] Gemini API 호출 방식 (useMock 토글 구조) 파악
```

### 2단계: 개선 설계

```
- [ ] 프롬프트 개선 방향 수립 (출력 품질, 형식 일관성 기준)
- [ ] 출력 JSON 스키마 변경 필요 여부 판단
- [ ] 테스트 케이스 3개 이상 설계
- [ ] Mock 데이터 업데이트 범위 결정
```

---

## ⚡ EXECUTE 페이즈 — `claude-sonnet-4-6`

### 3단계: aiService.js 수정

```
- [ ] 프롬프트 템플릿 수정 (Opus 설계안 적용)
- [ ] 출력 파싱 로직 수정 (스키마 변경 시)
- [ ] Self-Check 로직 유지 확인 (규칙 위반 감지 코드)
- [ ] useMock: true 상태에서 변경 사항 반영
```

### 4단계: Mock 데이터 업데이트

```
- [ ] evals/datasets/ 에 테스트 케이스 JSON 추가
- [ ] buildMockQuestions 함수 출력이 새 스키마와 일치하는지 확인
- [ ] explanation 필드 누락 없는지 전수 확인
```

### 5단계: UI 연동 검증

```
- [ ] python3 .claude/evals/engines/ui_audit.py → PASS
- [ ] 로딩 상태 onProgress 콜백 정상 동작 확인
- [ ] 검증 결과를 보고에 함께 기재
```
