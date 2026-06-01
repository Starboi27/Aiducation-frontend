# 🏗️ Harness Engineering Guide (v1.4)

<<<<<<< HEAD
UI/UX 일관성을 자동 검증하는 하네스 엔지니어링 가이드.
=======
AI 답변 품질과 UI/UX 일관성을 자동 검증하는 하네스 엔지니어링 가이드.
>>>>>>> f46af16e5480fcbca8192040eb84f2ea0eb9a28a
**규칙(MD) → 코드(JSX) → AI 검증(Audit)** 흐름.

> UI/UX 규칙 원본은 `@policies/ui_requirements.md` 참고 (중복 서술 금지).

## 핵심 구성요소
- `.claude/policies/ui_requirements.md` — UI/UX 법전 (Single Source of Truth).
- `.claude/evals/engines/ui_audit.py` — 코드가 법전을 준수하는지 검사하는 AI 검사관.
<<<<<<< HEAD
=======
- `.claude/evals/engines/harness.py` — RAG/AI 출력 품질 평가 (relevance, format, latency).
>>>>>>> f46af16e5480fcbca8192040eb84f2ea0eb9a28a
- `src/services/aiService.js` — 실시간 자가 검토(Self-Check) 로직 삽입 지점.

## 실행
```bash
python3 .claude/evals/engines/ui_audit.py   # UI 법전 준수 검사
<<<<<<< HEAD
=======
python3 .claude/evals/engines/harness.py    # AI 출력 품질 평가
>>>>>>> f46af16e5480fcbca8192040eb84f2ea0eb9a28a
```

## Audit Log
- **2026-04-06**: `aiService.js` 테마 컬러가 오렌지(`#FF9F43`)로 잘못 설정 → 하네스가 즉시 `FAIL` 감지.
- **2026-04-06**: 관리자 페이지 대규모 구현 후 자율 검증 누락 사건 (→ `RETROSPECTIVE.md`).
