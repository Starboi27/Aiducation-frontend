# 기능 구현 플레이북 (Feature Implementation)

> 모델 설정: `@configs/models.md` 참고

```
REASONING_MODEL  = claude-opus-4-6      ← 1~3단계: 분석 · 설계
EXECUTE_MODEL    = claude-sonnet-4-6    ← 4~7단계: 구현 · 검증
```

---

## 🧠 REASONING 페이즈 — `claude-opus-4-6`

1~3단계는 **Agent 툴로 Opus를 호출**하여 실행한다.

```
Agent(
  model: "opus",
  prompt: "아래 기능 요구사항을 분석하고 구현 설계안을 작성해줘.
           [요구사항 전달]
           반환값: { Atomic 계층, 컴포넌트 목록, props 인터페이스, 주의사항 }"
)
```

### 1단계: 요구사항 분석

```
- [ ] 기능 요구사항을 @policies/ui_requirements.md 와 대조
- [ ] 위반 항목 또는 추가 필요 사항 식별
- [ ] 영향받는 기존 컴포넌트 목록 파악
```

### 2단계: Atomic Design 계층 결정

```
- [ ] 신규 컴포넌트의 계층 결정 (atom / molecule / organism / template)
      기준: 단일 역할이면 atom, 조합이면 molecule, 독립 섹션이면 organism
- [ ] 재사용 가능한 기존 컴포넌트 식별 (중복 생성 방지)
- [ ] AppContext 상태 변경 필요 여부 판단
```

### 3단계: 구현 설계 (Opus → Sonnet 인계)

```
- [ ] 컴포넌트별 props 인터페이스 정의
- [ ] Mock 데이터 스키마 설계 (aiService.js 또는 authService.js)
- [ ] 라우트 추가 필요 여부 확인 (App.jsx)
```

**Opus 인계 문서 형식:**
```
{
  "components": [
    { "name": "ComponentName", "layer": "molecule", "path": "src/components/molecules/", "props": {...} }
  ],
  "context_changes": [...],
  "route_changes": [...],
  "warnings": [...]
}
```

---

## ⚡ EXECUTE 페이즈 — `claude-sonnet-4-6`

Opus의 설계안을 받아 4~7단계를 현재 세션(Sonnet)이 직접 실행한다.

### 4단계: 컴포넌트 구현

```
- [ ] Atomic 계층에 맞는 경로에 JSX 파일 생성
- [ ] 보라색 테마 (#6C5CE7) 일관 적용
- [ ] 퀴즈 관련 UI는 반드시 5지 선다형 구성
- [ ] AI 처리 중 onProgress 콜백 연결
```

### 5단계: 서비스 레이어 연동

```
- [ ] aiService.js 또는 authService.js 수정 (Mock 우선)
- [ ] Mock 함수에 해설(explanation) 필드 포함 확인
- [ ] useMock: true 상태에서 정상 동작 검증
```

### 6단계: 상태 및 라우트 연결

```
- [ ] AppContext.js 상태 추가/수정 (필요 시)
- [ ] App.jsx 라우트 등록 (필요 시)
- [ ] Sidebar 메뉴 노출 여부 반영 (role 조건 포함)
```

### 7단계: 하네스 검증 (필수 — 보고 전 반드시 실행)

```
- [ ] python3 .claude/evals/engines/ui_audit.py 실행 → PASS 확인
- [ ] FAIL 항목 즉시 수정 후 재실행
- [ ] 검증 결과를 사용자 보고에 포함
```
