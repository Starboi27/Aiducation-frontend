import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Timer, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button, Badge, ProgressBar } from '../../atoms';
import { QuizOption } from '../../molecules';
import { useApp } from '../../../context/AppContext';
import { aiService } from '../../../services/aiService';
import './QuizEngine.css';

const DIFFICULTY_LABELS = { 1: '매우 쉬움', 2: '쉬움', 3: '보통', 4: '어려움', 5: '매우 어려움' };
const DIFFICULTY_COLORS = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'accent' };

const QuizEngine = ({ questions = [], quizId = 'default_quiz', onComplete, incorrectsMap = {} }) => {
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = localStorage.getItem(`quizProgress_${quizId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentIdx < questions.length) return parsed.currentIdx;
      } catch (e) { console.error('Failed to parse saved progress', e); }
    }
    return 0;
  });

  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem(`quizProgress_${quizId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentIdx < questions.length) return parsed.results || [];
      } catch (e) { console.error('Failed to parse saved results', e); }
    }
    return [];
  });

  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(null); // null | true | false
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const [expGained, setExpGained] = useState(0);
  const [checkingAnswer, setCheckingAnswer] = useState(false); // 서버 단건 제출 로딩
  const [serverExplanation, setServerExplanation] = useState(null);

  // 서버 실시간 제출로 받아온 정답 인덱스 캐시: { [quizId]: number }
  const serverCorrectIndexCache = useRef({});
  // 이미 단건 제출된 quizId → expGained 맵 (최종 submitAll 중복 제출 방지 + XP 합산용)
  const preSubmittedIds = useRef(new Map());

const latestResults = useRef([]);
  const autoNextTimer = useRef(null);
  const hasCheckedRef = useRef(false); // 정답 확인 중복 실행 방지
  const isLastRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  const { addExp, addWrongAnswer, wrongAnswers, updateWrongAnswerCorrectIndex } = useApp();

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

  const options = React.useMemo(() => {
    if (!current) return [];
    if (current.options && current.options.length > 0) return current.options;
    if (current.examples && current.examples.length > 0) return current.examples;
    return ['선택지 A', '선택지 B', '선택지 C', '선택지 D', '선택지 E'];
  }, [current]);

  // 정답 인덱스: 문제 객체 → 서버 실시간 캐시 → wrongAnswers 캐시 순으로 참조
  const effectiveCorrectIndex = React.useMemo(() => {
    if (!current) return -1;
    if (current.correctIndex != null && current.correctIndex !== -1) return Number(current.correctIndex);
    const fromServer = serverCorrectIndexCache.current[String(current.id)];
    if (fromServer != null) return Number(fromServer);
    const fromWrong = wrongAnswers.find(w => String(w.id) === String(current.id));
    if (fromWrong?.correctIndex != null) return Number(fromWrong.correctIndex);
    return -1;
  }, [current, wrongAnswers]);

  // refs 최신화
  useEffect(() => { isLastRef.current = isLast; }, [isLast]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // results 상태와 latestResults.current 동기화
  useEffect(() => {
    latestResults.current = results;
  }, [results]);

  // 진행 상태 저장
  useEffect(() => {
    if (results.length > 0 || currentIdx > 0) {
      localStorage.setItem(
        `quizProgress_${quizId}`,
        JSON.stringify({ currentIdx, results })
      );
    }
  }, [currentIdx, results, quizId]);

  // 문제 바뀔 때 상태 초기화
  useEffect(() => {
    clearTimeout(autoNextTimer.current);
    setTimeLeft(30);
    setTimerActive(true);
    setSelected(null);
    setAnswered(false);
    setCorrect(null);
    setExpGained(0);
    setServerExplanation(null);
    hasCheckedRef.current = false;
  }, [currentIdx]);

  // 타이머 — 타임오버 시 정답 공개 후 사용자가 직접 넘김
  useEffect(() => {
    if (!timerActive || answered || !current) return;
    if (timeLeft <= 0) {
      if (hasCheckedRef.current) return;
      hasCheckedRef.current = true;

      setTimerActive(false);
      setAnswered(true);
      setCorrect(false);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, answered, current]); // eslint-disable-line react-hooks/exhaustive-deps

  // 정답 확인: 정답 인덱스를 알면 즉시 피드백, 모르면 서버 단건 제출
  const handleCheck = async () => {
    if (hasCheckedRef.current || selected === null) return;
    hasCheckedRef.current = true;
    setTimerActive(false);

    // 이미 정답 인덱스를 알고 있는 경우 즉시 피드백
    if (effectiveCorrectIndex !== -1) {
      const isCorrect = selected === effectiveCorrectIndex;
      setAnswered(true);
      setCorrect(isCorrect);
      if (isCorrect) {
        const gained = calculateExp(current.difficulty, timeLeft);
        setExpGained(gained);
        addExp(gained);
      } else {
        aiService.getExplanation(current.id)
          .then(data => { if (data?.explanation) setServerExplanation(data.explanation); })
          .catch(() => {});
      }
      return;
    }

    // 정답 모름 → 서버에 단건 제출해서 실시간 판정
    setCheckingAnswer(true);
    try {
      const res = await aiService.submitAll([{ quizId: current.id, answer: selected }]);
      const srv = res?.results?.[0];
      if (srv) {
        const serverIdx = srv.correctAnswer != null ? Number(srv.correctAnswer) : -1;
        if (serverIdx !== -1) {
          serverCorrectIndexCache.current[String(current.id)] = serverIdx;
          updateWrongAnswerCorrectIndex?.(String(current.id), serverIdx);
        }
        const isCorrect = srv.correct === true;
        const earnedExp = res?.expGained ?? srv.expGained ?? 0;
        preSubmittedIds.current.set(String(current.id), earnedExp);
        setAnswered(true);
        setCorrect(isCorrect);
        if (isCorrect) {
          const gained = earnedExp || calculateExp(current.difficulty, timeLeft);
          setExpGained(gained);
          addExp(gained);
        } else {
          aiService.getExplanation(current.id)
            .then(data => { if (data?.explanation) setServerExplanation(data.explanation); })
            .catch(() => {});
        }
      } else {
        // 응답 파싱 실패 시 피드백 없이 넘김
        setAnswered(true);
        setCorrect(null);
      }
    } catch {
      setAnswered(true);
      setCorrect(null);
    } finally {
      setCheckingAnswer(false);
    }
  };

  // 다음 문제로 이동 또는 최종 제출
  const handleAdvance = () => {
    const isTimeout = answered && selected === null;
    const newResult = {
      questionId: current.id,
      difficulty: current.difficulty,
      timeUsed: isTimeout ? 30 : 30 - timeLeft,
      selectedAnswer: selected !== null ? selected : -1,
      correct: correct,
      _preSubmitted: preSubmittedIds.current.has(String(current.id)),
      _preSubmittedExp: preSubmittedIds.current.get(String(current.id)) ?? 0,
    };

    const newResults = [...latestResults.current, newResult];
    setResults(newResults);
    latestResults.current = newResults;

    if (isLast) {
      localStorage.removeItem(`quizProgress_${quizId}`);
      onComplete?.(latestResults.current);
    } else {
      hasCheckedRef.current = false;
      setCurrentIdx(i => i + 1);
    }
  };


  if (!questions.length) {
    return (
      <div className="quiz-engine__empty">
        <AlertTriangle size={48} />
        <p>퀴즈 문제가 없습니다. 먼저 파일을 업로드해주세요.</p>
      </div>
    );
  }

  const timerVariant = timeLeft > 15 ? 'success' : timeLeft > 8 ? 'warning' : 'danger';
  const isTimeout = answered && selected === null;

  // 피드백 패널 스타일
  const resultClass = isTimeout
    ? 'quiz-engine__result--timeout'
    : correct === true
      ? 'quiz-engine__result--correct'
      : correct === false
        ? 'quiz-engine__result--wrong'
        : 'quiz-engine__result--unknown';

  const wrongAnswerExplanation = wrongAnswers.find(w => String(w.id) === String(current.id))?.explanation || '';
  const explanation = serverExplanation || current.explanation || wrongAnswerExplanation;

  return (
    <div className="quiz-engine">
      {/* 헤더 */}
      <div className="quiz-engine__header">
        <div className="quiz-engine__progress-info">
          <span className="quiz-engine__counter">{currentIdx + 1} / {questions.length}</span>
          <Badge variant={DIFFICULTY_COLORS[current.difficulty]} size="sm">
            {DIFFICULTY_LABELS[current.difficulty]}
          </Badge>
        </div>
        <div className="quiz-engine__timer">
          <Timer size={14} className={timeLeft <= 8 ? 'animate-pulse' : ''} />
          <span className={`quiz-engine__timer-val ${timeLeft <= 8 ? 'quiz-engine__timer-val--urgent' : ''}`}>
            {timeLeft}s
          </span>
        </div>
      </div>

      <ProgressBar value={currentIdx + (answered ? 1 : 0)} max={questions.length} variant="primary" size="xs" />
      <ProgressBar value={timeLeft} max={30} variant={timerVariant} size="xs" animated={false} />

      {current.topic && (
        <div className="quiz-engine__topic">
          <span className="quiz-engine__topic-badge">{current.topic}</span>
        </div>
      )}


      <div className="quiz-engine__question">
        <p className="quiz-engine__question-text">{current.question}</p>
      </div>

      <div className="quiz-engine__options">
        {options.map((opt, i) => (
          <QuizOption
            key={i}
            label={OPTION_LABELS[i]}
            text={opt}
            selected={selected === i}
            correct={answered && effectiveCorrectIndex !== -1 && i === effectiveCorrectIndex}
            wrong={answered && selected === i && effectiveCorrectIndex !== -1 && i !== effectiveCorrectIndex}
            disabled={answered}
            onClick={() => !answered && setSelected(i)}
          />
        ))}
      </div>

      {/* 정답 확인 후 피드백 패널 */}
      {answered && (
        <div className={`quiz-engine__result ${resultClass} animate-fade-in`}>
          <div className="quiz-engine__result-header">
            <span className="quiz-engine__result-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isTimeout ? (
                <><Clock size={18} color="#fdcb6e" /> 시간 초과</>
              ) : correct === true ? (
                <><CheckCircle2 size={18} color="#00b894" /> 정답이에요!{expGained > 0 && <span className="quiz-engine__xp-text">+{expGained} XP</span>}</>
              ) : correct === false ? (
                <><XCircle size={18} color="#ff7675" /> 오답이에요.</>
              ) : (
                '확인 완료'
              )}
            </span>
          </div>

          {/* 오답/타임오버 시 정답 표시 */}
          {(correct === false || isTimeout) && effectiveCorrectIndex !== -1 && (
            <p style={{ margin: '4px 0 8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              정답: <strong style={{ color: 'var(--text-primary)' }}>
                {OPTION_LABELS[effectiveCorrectIndex]}. {options[effectiveCorrectIndex]}
              </strong>
            </p>
          )}

          {(correct === false || isTimeout) && explanation && (
            <p className="quiz-engine__explanation">{explanation}</p>
          )}
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="quiz-engine__feedback">
        {!answered ? (
          <Button
            variant="primary"
            size="md"
            disabled={selected === null || checkingAnswer}
            loading={checkingAnswer}
            onClick={handleCheck}
          >
            {checkingAnswer ? '채점 중...' : '정답 확인'}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon={ChevronRight}
            iconPosition="right"
            onClick={handleAdvance}
          >
            {isLast ? '제출하기' : '다음 문제'}
          </Button>
        )}
      </div>
    </div>
  );
};

function calculateExp(difficulty, timeLeft) {
  const d = difficulty || 1;
  const base = d * 20;
  const speedBonus = Math.floor((timeLeft / 30) * d * 10);
  return Math.max(base + speedBonus, 10);
}

export default QuizEngine;
