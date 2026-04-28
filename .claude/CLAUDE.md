# 🧠 AIDucation v1.4 - AI Context Hub

> **Mission**: AI 기반 맞춤형 학습 플랫폼의 무결점 구현 및 유지보수.

## 🤖 모델 설정 (Model Configuration)

> 상세 역할 정의 및 호출 방법: **@configs/models.md**

```
REASONING_MODEL  = claude-opus-4-6      ← 분석 · 설계 · 의사결정
EXECUTE_MODEL    = claude-sonnet-4-6    ← 코드 구현 · 파일 생성 · 검증
```

| 페이즈 | 모델 | 적용 시점 |
|--------|------|-----------|
| 🧠 Reasoning | Opus | 요구사항 분석, Atomic 계층 결정, 버그 원인 추론, 프롬프트 설계 |
| ⚡ Execute | Sonnet | JSX/JS 작성, 서비스 수정, 하네스 실행 |

## ⚖️ 핵심 코딩 규칙 (Core Mandates)

- **UI/UX 기준**: 모든 작업은 반드시 **@policies/ui_requirements.md** 법전을 준수해야 함.
- **아키텍처**: **Atomic Design** 패턴 기반 구현 (상세: @docs/ARCHITECTURE.md)
- **언어 및 주석**: 모든 커뮤니케이션과 코딩 주석은 **한국어** 필수.
- **품질 관리 (Audit)**:
  - UI/UX 수정 후: @evals/engines/ui_audit.py 실행
<<<<<<< HEAD
=======
  - AI 로직 수정 후: @evals/engines/harness.py 실행
>>>>>>> f46af16e5480fcbca8192040eb84f2ea0eb9a28a

## 🛠️ Operational Context

- **Tech Stack**: React 19, Gemini API, LangChain (상세: @docs/ARCHITECTURE.md)
- **Status**: **Mock 모드 우선** 개발 중 (`useMock: true`)
- **Key Routes**: App.jsx 의 BrowserRouter 라우트 정의 참고

## 🏛️ Knowledge Base (@docs)

- **설계 및 구조**: @docs/ARCHITECTURE.md
<<<<<<< HEAD
- **하네스 가이드**: @docs/HARNESS.md
- **개발 회고**: @docs/RETROSPECTIVE.md

## 📋 워크플로우 플레이북 (@docs/workflows)

- **기능 구현**: @docs/workflows/feature-impl.md
- **버그 수정**: @docs/workflows/bugfix.md
- **AI 로직 개선**: @docs/workflows/ai-logic.md
=======
- **API 명세서**: @docs/API_SPEC.md
- **하네스 가이드**: @docs/HARNESS.md
- **개발 회고**: @docs/RETROSPECTIVE.md
- **관리자 페이지 시나리오**: @docs/관리자.md
>>>>>>> f46af16e5480fcbca8192040eb84f2ea0eb9a28a

## 🚀 Essential Commands

- `npm start`: 개발 서버 구동
- `python3 .claude/evals/engines/ui_audit.py`: UI/UX 하네스 검증
<<<<<<< HEAD
=======
- `python3 .claude/evals/engines/harness.py`: AI 로직/정확도 검증
>>>>>>> f46af16e5480fcbca8192040eb84f2ea0eb9a28a

---

_모든 상세 비즈니스 로직과 시스템 설계도는 @docs/ 에서 관리됩니다._
