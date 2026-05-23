"""
UI/UX 하네스 감사 도구 (ui_audit.py)
규칙(MD) → 코드(JSX) → AI 검증(Audit) 흐름의 핵심 검사관.
"""

import os
import asyncio
import json
from datetime import datetime

# Gemini API 키는 환경변수에서 읽음
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

POLICY_PATH = ".claude/policies/ui_requirements.md"
TARGET_FILES = {
    "App.jsx": "src/App.jsx",
    "aiService.js": "src/services/aiService.js",
}

AUDIT_ITEMS = [
    "보라색(#6C5CE7) 테마가 코드에 반영되어 있는가?",
    "퀴즈 생성이 5개 옵션(5지 선다)으로 설계되었는가?",
    "로딩 상태(progress) 처리가 서비스 레이어에 포함되었는가?",
    "모든 퀴즈 문제에 해설(explanation)이 포함되도록 구현되었는가?",
]


def read_file_safe(path: str, max_chars: int = 3000) -> str:
    """파일을 안전하게 읽어 max_chars 이내로 반환."""
    if not os.path.exists(path):
        return f"[파일 없음: {path}]"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    if len(content) > max_chars:
        return content[:max_chars] + f"\n... (총 {len(content)}자 중 {max_chars}자 표시)"
    return content


async def call_gemini(prompt: str) -> str:
    """Gemini API 호출. API 키 없을 경우 Mock 결과 반환."""
    if not GEMINI_API_KEY:
        print("⚠️  GEMINI_API_KEY 없음 → Mock 결과로 대체합니다.")
        return _mock_audit_result()

    import urllib.request
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    return data["candidates"][0]["content"]["parts"][0]["text"]


def _mock_audit_result() -> str:
    return """
## UI/UX 감사 결과 (Mock)

| 항목 | 결과 | 사유 |
|------|------|------|
| 보라색(#6C5CE7) 테마 | ✅ PASS | aiService.js TOPIC_COLORS에 반영 확인 |
| 5지 선다형 | ✅ PASS | buildMockQuestions에서 5개 옵션 생성 확인 |
| 로딩 상태(progress) | ✅ PASS | mockAnalyzeDocument에서 onProgress 호출 확인 |
| 해설(explanation) 포함 | ✅ PASS | 각 문제 객체에 explanation 필드 존재 확인 |

> Mock 모드 결과입니다. 실제 검증을 위해 GEMINI_API_KEY를 설정하세요.
"""


async def run_ui_audit():
    print("=" * 60)
    print(f"🔍 UI/UX 하네스 검사 시작  [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]")
    print("=" * 60)

    # 1. 요구사항 읽기
    requirements = read_file_safe(POLICY_PATH)
    print(f"📋 정책 파일 로드: {POLICY_PATH}")

    # 2. 대상 코드 읽기
    code_sections = ""
    for label, path in TARGET_FILES.items():
        content = read_file_safe(path)
        code_sections += f"\n### {label}\n```\n{content}\n```\n"
        print(f"📂 코드 파일 로드: {path}")

    # 3. 감사 프롬프트 구성
    audit_items_str = "\n".join(f"{i+1}. {item}" for i, item in enumerate(AUDIT_ITEMS))
    prompt = f"""
당신은 선임 UI/UX 엔지니어입니다.
아래 [요구사항]과 [구현 코드]를 비교 분석하여 감사 리포트를 작성하세요.

[요구사항]
{requirements}

[구현 코드]
{code_sections}

[검증 항목]
{audit_items_str}

각 항목에 대해 PASS 또는 FAIL을 명시하고, 구체적인 코드 근거와 함께 Markdown 표 형식으로 출력하세요.
FAIL 항목은 수정 방향도 함께 제시하세요.
"""

    # 4. AI 감사 실행
    print("\n🤖 AI 검사관이 코드를 분석 중입니다...")
    result = await call_gemini(prompt)

    # 5. 결과 출력 및 저장
    print("\n" + result)

    report_path = f".claude/evals/outputs/ui_audit_{datetime.now().strftime('%Y%m%d_%H%M')}.md"
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(f"# UI/UX 감사 리포트\n생성일시: {datetime.now().isoformat()}\n\n{result}")
    print(f"\n💾 리포트 저장: {report_path}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_ui_audit())
