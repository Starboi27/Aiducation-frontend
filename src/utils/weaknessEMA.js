/**
 * 취약 유형 EMA(지수 이동 평균) 계산 유틸
 *
 * 반감기 10일 기준 지수 감쇠:
 *   decay(days) = e^(-0.07 × days)
 *   → 10일 전 오답은 현재 오답 대비 약 50% 가중치
 *
 * @param {Array} wrongAnswers - AppContext wrongAnswers 배열
 *   각 항목: { topic, wrongCount, lastAttemptAt, isMastered }
 * @param {number} [topN=5] - 반환할 최대 토픽 수
 * @returns {{ topic, emaScore, relativeRate, totalWrong }[]}
 */
const LAMBDA = 0.07;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function calcWeaknessScores(wrongAnswers, topN = 5) {
  const now = Date.now();

  // isMastered 제외 후 topic 기준 그룹화
  const topicMap = {};
  wrongAnswers
    .filter((w) => !w.isMastered)
    .forEach((w) => {
      const topic = w.topic || w.subjectName || '기타';
      if (!topicMap[topic]) topicMap[topic] = [];
      topicMap[topic].push(w);
    });

  if (Object.keys(topicMap).length === 0) return [];

  // 각 토픽별 EMA 점수 계산
  const scores = Object.entries(topicMap).map(([topic, wrongs]) => {
    const totalWrong = wrongs.reduce((acc, w) => acc + (w.wrongCount || 1), 0);
    const emaScore = wrongs.reduce((acc, w) => {
      const ts = w.lastAttemptAt ? new Date(w.lastAttemptAt).getTime() : now;
      const daysAgo = (now - ts) / MS_PER_DAY;
      const decay = Math.exp(-LAMBDA * Math.max(0, daysAgo));
      return acc + (w.wrongCount || 1) * decay;
    }, 0);
    return { topic, emaScore, totalWrong };
  });

  // 내림차순 정렬 후 상위 N개
  scores.sort((a, b) => b.emaScore - a.emaScore);
  const top = scores.slice(0, topN);

  // 최대 점수 기준 상대 비율(0~100) 정규화
  const maxScore = top[0]?.emaScore || 1;
  return top.map((s) => ({
    ...s,
    relativeRate: Math.round((s.emaScore / maxScore) * 100),
  }));
}

/**
 * 서버 weakTypes 데이터를 동일 형식으로 정규화 (시간 정보 없어 EMA 미적용)
 * @param {Array} weakTypes - { subjectName, incorrectRate, incorrectCount, totalAttempted }[]
 */
export function normalizeWeakTypes(weakTypes) {
  if (!weakTypes?.length) return [];
  const sorted = [...weakTypes].sort((a, b) => b.incorrectRate - a.incorrectRate);
  const maxRate = sorted[0].incorrectRate || 1;
  return sorted.slice(0, 5).map((t) => ({
    topic: t.subjectName,
    emaScore: t.incorrectRate,
    totalWrong: t.incorrectCount ?? 0,
    relativeRate: Math.round((t.incorrectRate / maxRate) * 100),
  }));
}
