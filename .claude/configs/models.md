# 모델 설정 (Model Configuration)

> **Single Source of Truth** — 모델 ID 변경 시 이 파일만 수정한다.

```
MODEL_VERSION    = 4.6
REASONING_MODEL  = claude-opus-4-6      ← 분석 · 설계 · 의사결정
EXECUTE_MODEL    = claude-sonnet-4-6    ← 코드 구현 · 파일 생성 · 검증
```

## 역할 분담 원칙

| 역할 | 모델 | 담당 작업 |
|------|------|-----------|
| 🧠 Reasoning | `claude-opus-4-6` | 요구사항 분석, Atomic 계층 결정, policies 대조, 복잡한 의사결정 |
| ⚡ Execute | `claude-sonnet-4-6` | JSX/JS 코드 작성, 파일 생성, 하네스 실행, PASS/FAIL 검증 |

## Reasoning 페이즈에서 Opus를 호출하는 방법

```
Agent(
  model: "opus",
  prompt: "[분석 대상 및 컨텍스트 전달]
           반환값: { 결정사항, 설계안, 주의사항 }"
)
```

## 워크플로우별 플레이북

각 워크플로우의 단계별 체크리스트는 `@docs/workflows/` 참고.

- **기능 구현** → `@docs/workflows/feature-impl.md`
- **버그 수정** → `@docs/workflows/bugfix.md`
- **AI 로직 개선** → `@docs/workflows/ai-logic.md`
