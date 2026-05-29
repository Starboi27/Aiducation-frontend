import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Timer, AlertTriangle, Lightbulb } from 'lucide-react';
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

  // 힌트 상태
  const [hint, setHint] = useState(null);
  const [isHintLoading, setIsHintLoading] = useState(false);

  const latestResults = useRef([]);
  const autoNextTimer = useRef(null);
  const hasAnsweredRef = useRef(false);
  // refs: timer 클로저 안에서 최신 값을 읽기 위함
  const isLastRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  const { addExp, addWrongAnswer, wrongAnswers } = useApp();

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

  const options = React.useMemo(() => {
    if (!current) return [];
    if (current.options && current.options.length > 0) return current.options;
    if (current.examples && current.examples.length > 0) return current.examples;
    return ['선택지 A', '선택지 B', '선택지 C', '선택지 D', '선택지 E'];
  }, [current]);

  // refs 최신화
  useEffect(() => { isLastRef.current = isLast; }, [isLast]);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  // results 상태와 latestResults.current 동기화 (상태 복원 및 누적 일관성 보장)
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
    setHint(null);
    setIsHintLoading(false);
    hasAnsweredRef.current = false;
  }, [currentIdx]);

  // 타이머 — 타임오버 시 직접 처리 (stale closure 방지)
  useEffect(() => {
    if (!timerActive || answered || !current) return;
    if (timeLeft <= 0) {
      if (hasAnsweredRef.current) return;
      hasAnsweredRef.current = true;

      // 타임오버: 아무 것도 선택하지 않은 상태로 간주하고 바로 다음 이동
      setTimerActive(false);

      const timeoutResult = {
        questionId: current.id,
        difficulty: current.difficulty,
        timeUsed: 30,
        selectedAnswer: null,
      };
      
      const newResults = [...latestResults.current, timeoutResult];
      setResults(newResults);
      latestResults.current = newResults;

      // 지연 없이 바로 다음 문제로 넘김
      if (isLastRef.current) {
        localStorage.removeItem(`quizProgress_${quizId}`);
        onCompleteRef.current?.(latestResults.current);
      } else {
        hasAnsweredRef.current = false;
        setCurrentIdx(i => i + 1);
      }
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, answered, current]); // eslint-disable-line react-hooks/exhaustive-deps

  // 버튼 클릭: 답 선택 후 바로 다음 문제로 이동 (일괄 채점 방식)
  const handleNext = async () => {
    if (hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;

    setTimerActive(false);
    const optionIdx = selected;

    const newResult = {
      questionId: current.id,
      difficulty: current.difficulty,
      timeUsed: 30 - timeLeft,
      selectedAnswer: optionIdx !== null ? optionIdx : -1,
    };
    
    const newResults = [...results, newResult];
    setResults(newResults);
    latestResults.current = newResults;

    if (isLast) {
      localStorage.removeItem(`quizProgress_${quizId}`);
      onComplete?.(latestResults.current);
    } else {
      hasAnsweredRef.current = false;
      setCurrentIdx(i => i + 1);
    }
  };

  const handleGetHint = async () => {
    if (!current?.id || hint) return;
    setIsHintLoading(true);
    try {
      // 힌트 대신 해설(explanation)을 불러와서 힌트로 보여줌
      const data = await aiService.getExplanation(current.id);
      setHint(data?.explanation || '제공된 힌트(해설)가 없습니다.');
    } catch (err) {
      const serverMsg = err.response?.data?.msg;
      if (serverMsg) {
        setHint(`😔 ${serverMsg}`);
      } else {
        setHint('힌트를 불러오는데 실패했습니다.');
      }
    } finally {
      setIsHintLoading(false);
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
  const isTimeout = answered && selected === null && correct === false;
  const resultClass = isTimeout
    ? 'quiz-engine__result--timeout'
    : correct === true
      ? 'quiz-engine__result--correct'
      : correct === false
        ? 'quiz-engine__result--wrong'
        : 'quiz-engine__result--unknown';

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
          {!hint && (
            <Button 
              variant="outline" 
              size="sm" 
              icon={Lightbulb} 
              onClick={handleGetHint} 
              disabled={isHintLoading || answered}
              style={{ marginLeft: 'auto', fontSize: '12px' }}
            >
              {isHintLoading ? '로딩 중...' : '힌트 보기'}
            </Button>
          )}
        </div>
      )}

      {hint && (
        <div className="quiz-engine__hint-box animate-fade-in" style={{
          background: '#fffcf0',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <Lightbulb size={20} color="#fdcb6e" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#574b29' }}>
            <strong>💡 힌트:</strong> {hint}
          </p>
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
            correct={false}
            wrong={false}
            disabled={false}
            onClick={() => setSelected(i)}
          />
        ))}
      </div>

      {/* 다음 버튼 */}
      <div className="quiz-engine__feedback">
        <Button
          variant="primary"
          size="md"
          icon={ChevronRight}
          iconPosition="right"
          disabled={selected === null}
          onClick={handleNext}
        >
          {isLast ? '제출하기' : '다음 문제'}
        </Button>
      </div>
    </div>
  );
};

function calculateExp(difficulty, timeLeft) {
  const base = difficulty * 20;
  const speedBonus = Math.floor((timeLeft / 30) * difficulty * 10);
  return base + speedBonus;
}

export default QuizEngine;
