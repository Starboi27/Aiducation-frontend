"""
AI 로직 품질 평가 하네스 (harness.py)
RAG 파이프라인 출력의 relevance, format, latency를 검증한다.
"""

import asyncio
import json
import os
import time
from datetime import datetime
from typing import List, Dict, Any

# Gemini API 설정
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

# 평가 데이터셋 경로 (없으면 내장 샘플 사용)
DATASET_PATH = ".claude/evals/datasets/raw_docs.json"

# 내장 샘플 데이터셋 (실제 데이터셋 파일이 없을 때 사용)
SAMPLE_DATASET = [
    {
        "id": "sample_001",
        "content": "광합성은 식물이 빛 에너지를 이용해 이산화탄소와 물로부터 포도당을 합성하는 과정이다.",
        "expected_topic": "광합성",
        "expected_min_questions": 5,
    },
    {
        "id": "sample_002",
        "content": "뉴턴의 운동 제1법칙(관성의 법칙): 외부 힘이 작용하지 않으면 물체는 현재의 운동 상태를 유지한다.",
        "expected_topic": "뉴턴의 법칙",
        "expected_min_questions": 5,
    },
]


# ─────────────────────────────────────────────
# 포맷 검증
# ─────────────────────────────────────────────
def validate_json_format(output: Any) -> bool:
    """퀴즈 출력이 올바른 JSON 구조인지 검증."""
    if not isinstance(output, list):
        return False
    for item in output:
        required_keys = {"question", "options", "answer", "explanation"}
        if not required_keys.issubset(item.keys()):
            return False
        if not isinstance(item.get("options"), list) or len(item["options"]) != 5:
            return False
    return True


# ─────────────────────────────────────────────
# 관련성 점수 계산 (Gemini 기반 또는 키워드 기반)
# ─────────────────────────────────────────────
async def calculate_relevance(source_content: str, quiz_output: Any) -> float:
    """생성된 퀴즈가 원본 내용과 얼마나 관련 있는지 0~1 점수로 반환."""
    if not GEMINI_API_KEY:
        # 키워드 기반 단순 계산 (fallback)
        source_words = set(source_content.replace(".", "").replace(",", "").split())
        quiz_text = json.dumps(quiz_output, ensure_ascii=False)
        quiz_words = set(quiz_text.split())
        overlap = len(source_words & quiz_words)
        return min(overlap / max(len(source_words), 1), 1.0)

    prompt = f"""
다음 [원본 텍스트]와 [생성된 퀴즈]의 관련성을 0.0~1.0 사이의 숫자 하나만 출력하세요.
기준: 1.0=완전히 관련, 0.5=부분 관련, 0.0=무관.
숫자 외 다른 텍스트는 출력하지 마세요.

[원본 텍스트]
{source_content}

[생성된 퀴즈]
{json.dumps(quiz_output, ensure_ascii=False)[:500]}
"""
    try:
        result = await call_gemini_raw(prompt)
        return float(result.strip())
    except Exception:
        return 0.5


# ─────────────────────────────────────────────
# Mock RAG 파이프라인 (실제 RAG 연결 전 테스트용)
# ─────────────────────────────────────────────
async def generate_quiz_mock(content: str) -> List[Dict]:
    """Mock 퀴즈 생성 (실제 RAG 파이프라인 대체용)."""
    await asyncio.sleep(0.1)  # 네트워크 지연 시뮬레이션
    return [
        {
            "question": f"다음 중 '{content[:20]}...'에 대한 설명으로 옳은 것은?",
            "options": ["보기 1", "보기 2 (정답)", "보기 3", "보기 4", "보기 5"],
            "answer": 1,
            "explanation": "이것은 Mock 해설입니다. 실제 RAG 파이프라인 연결 후 정확한 해설이 생성됩니다.",
        }
        for _ in range(5)
    ]


async def call_gemini_raw(prompt: str) -> str:
    """Gemini API 원시 호출."""
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


# ─────────────────────────────────────────────
# 메인 하네스 클래스
# ─────────────────────────────────────────────
class EvalHarness:
    def __init__(self, dataset_path: str = DATASET_PATH):
        self.dataset_path = dataset_path
        self.results: List[Dict] = []

    def load_dataset(self) -> List[Dict]:
        """평가 데이터셋 로드. 파일 없으면 내장 샘플 사용."""
        if not os.path.exists(self.dataset_path):
            print(f"⚠️  데이터셋 없음 ({self.dataset_path}) → 내장 샘플 데이터셋 사용")
            return SAMPLE_DATASET
        with open(self.dataset_path, "r", encoding="utf-8") as f:
            return json.load(f)

    async def run_evaluation(self):
        """평가 프로세스 전체 실행."""
        test_cases = self.load_dataset()
        print(f"🚀 총 {len(test_cases)}개의 테스트 케이스 평가 시작...")
        print("-" * 60)

        for case in test_cases:
            print(f"  📝 케이스 [{case['id']}] 평가 중...")

            # RAG 파이프라인 실행 (실제 연결 전 Mock 사용)
            start = time.time()
            generated_output = await generate_quiz_mock(case["content"])
            latency = round(time.time() - start, 3)

            # 검증
            is_valid = validate_json_format(generated_output)
            relevance = await calculate_relevance(case["content"], generated_output)
            question_count = len(generated_output)
            min_q_met = question_count >= case.get("expected_min_questions", 5)

            status = "✅ PASS" if (is_valid and min_q_met) else "❌ FAIL"
            print(f"     {status} | 문제 수: {question_count} | 관련성: {relevance:.2f} | 지연: {latency}s")

            self.results.append({
                "case_id": case["id"],
                "latency": latency,
                "format_pass": is_valid,
                "question_count": question_count,
                "min_question_met": min_q_met,
                "relevance_score": relevance,
                "output": generated_output,
            })

        self.save_report()

    def save_report(self):
        """최종 리포트 생성 및 저장."""
        total = len(self.results)
        avg_relevance = sum(r["relevance_score"] for r in self.results) / total
        format_pass_rate = sum(1 for r in self.results if r["format_pass"]) / total
        min_q_pass_rate = sum(1 for r in self.results if r["min_question_met"]) / total
        avg_latency = sum(r["latency"] for r in self.results) / total

        report = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total_cases": total,
                "avg_relevance": round(avg_relevance, 3),
                "format_pass_rate": round(format_pass_rate, 3),
                "min_question_pass_rate": round(min_q_pass_rate, 3),
                "avg_latency_sec": round(avg_latency, 3),
            },
            "details": self.results,
        }

        output_dir = ".claude/evals/outputs"
        os.makedirs(output_dir, exist_ok=True)
        report_path = f"{output_dir}/harness_{datetime.now().strftime('%Y%m%d_%H%M')}.json"

        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=4, ensure_ascii=False)

        print("\n" + "=" * 60)
        print("📊 평가 요약")
        print(f"  총 케이스       : {total}")
        print(f"  평균 관련성 점수 : {avg_relevance:.3f}")
        print(f"  포맷 통과율     : {format_pass_rate:.0%}")
        print(f"  문제 수 통과율  : {min_q_pass_rate:.0%}")
        print(f"  평균 지연시간   : {avg_latency:.3f}s")
        print(f"  리포트 저장     : {report_path}")
        print("=" * 60)


if __name__ == "__main__":
    harness = EvalHarness()
    asyncio.run(harness.run_evaluation())
