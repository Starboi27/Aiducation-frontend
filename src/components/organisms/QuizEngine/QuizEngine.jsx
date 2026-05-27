import React, { useState, useEffect } from 'react';
import { ChevronRight, Timer, AlertTriangle } from 'lucide-react';
import { Button, Badge, ProgressBar } from '../../atoms';
import { QuizOption } from '../../molecules';
import { useApp } from '../../../context/AppContext';
import { aiService } from '../../../services/aiService';
import './QuizEngine.css';

const DIFFICULTY_LABELS = { 1: '매우 쉬움', 2: '쉬움', 3: '보통', 4: '어려움', 5: '매우 어려움' };
const DIFFICULTY_COLORS = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'accent' };

const QuizEngine = ({ questions = [], quizId = 'default_quiz', onComplete }) => {
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
        // currentIdx 가드와 동일 조건 — 길이가 다른 이전 세션 결과는 버림
        if (parsed.currentIdx < questions.length) {
          return parsed.results || [];
        }
      } catch (e) { console.error('Failed to parse saved results', e); }
    }
    return [];
  });

  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const { addExp, addWrongAnswer } = useApp();

  // 문제별 서버에서 가져온 정답 인덱스 캐시: { [questionId]: 0-based correctIndex }
  const [fetchedAnswers, setFetchedAnswers] = useState({});

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

  // 현재 문제의 실제 정답 인덱스 (서버 fetch 값 우선, 없으면 question 원본값)
  const effectiveCorrectIndex = current
    ? (fetchedAnswers[current.id] ?? current.correctIndex)
    : null;

  // 문제가 바뀔 때마다 서버에서 정답 사전 fetch
  useEffect(() => {
    if (!current) return;
    const id = current.id;

    // 이미 정답 있으면 스킵
    if (fetchedAnswers[id] != null) return;
    // 백엔드 정수 ID가 아니면 스킵 (mock 퀴즈의 'q_...' 형식 등)
    if (!id || isNaN(Number(id))) return;

    aiService.getExplanation(id)
      .then((data) => {
        const ans = data?.answer ?? data?.correctAnswer ?? data?.correct_answer;
        if (ans != null) {
          setFetchedAnswers(prev => ({ ...prev, [id]: Number(ans) }));
        }
      })
      .catch(() => {});
  }, [currentIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // 진행 상태 저장
  useEffect(() => {
    if (results.length > 0 || currentIdx > 0) {
      localStorage.setItem(
        `quizProgress_${quizId}`,
        JSON.stringify({ currentIdx, results })
      );
    }
  }, [currentIdx, results, quizId]);

  // Timer
  useEffect(() => {
    if (!timerActive || answered || !current) return;
    if (timeLeft <= 0) {
      handleAnswer(null);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, answered, current]); // eslint-disable-line react-hooks/exhaustive-deps

  // 문제 바뀔 때 상태 초기화
  useEffect(() => {
    setTimeLeft(30);
    setTimerActive(true);
    setSelected(null);
    setAnswered(false);
  }, [currentIdx]);

  // 타이머 만료 시에만 호출 — 선택지 클릭은 setSelected만 함
  const handleAnswer = (optionIdx) => {
    if (answered) return;
    setTimerActive(false);
    setSelected(optionIdx);
    setAnswered(true);

    // 시간 초과는 항상 오답
    addWrongAnswer({
      ...current,
      correctIndex: effectiveCorrectIndex,
      userAnswer: '(시간 초과)',
    });

    setResults(prev => [...prev, {
      questionId: current.id,
      correct: false,
      expGained: 0,
      difficulty: current.difficulty,
      timeUsed: 30,
      selectedAnswer: 0,
    }]);
  };

  const handleNext = () => {
    if (answered) {
      // 타이머 만료 후 다음으로
      if (isLast) {
        localStorage.removeItem(`quizProgress_${quizId}`);
        onComplete?.(results);
      } else {
        setCurrentIdx(i => i + 1);
      }
      return;
    }

    // 선택지 클릭 후 다음 버튼으로 정답 처리 + 이동
    const optionIdx = selected;
    const correct = effectiveCorrectIndex != null && optionIdx !== null && optionIdx === effectiveCorrectIndex;
    const expGained = correct ? calculateExp(current.difficulty, timeLeft) : 0;

    setTimerActive(false);

    if (correct) {
      addExp(expGained);
    } else {
      addWrongAnswer({
        ...current,
        correctIndex: effectiveCorrectIndex,
        userAnswer: optionIdx !== null ? current.options[optionIdx] : '(미선택)',
      });
    }

    const newResult = {
      questionId: current.id,
      correct,
      expGained,
      difficulty: current.difficulty,
      timeUsed: 30 - timeLeft,
      selectedAnswer: optionIdx !== null ? optionIdx : 0,
    };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (isLast) {
      localStorage.removeItem(`quizProgress_${quizId}`);
      onComplete?.(newResults);
    } else {
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

  return (
    <div className="quiz-engine">
      {/* Header */}
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

      <ProgressBar
        value={currentIdx + (answered ? 1 : 0)}
        max={questions.length}
        variant="primary"
        size="xs"
      />

      <ProgressBar
        value={timeLeft}
        max={30}
        variant={timerVariant}
        size="xs"
        animated={false}
      />

      {/* Topic */}
      {current.topic && (
        <div className="quiz-engine__topic">
          <span className="quiz-engine__topic-badge">{current.topic}</span>
        </div>
      )}

      {/* Question */}
      <div className="quiz-engine__question">
        <p className="quiz-engine__question-text">{current.question}</p>
      </div>

      {/* Options */}
      <div className="quiz-engine__options">
        {current.options.map((opt, i) => (
          <QuizOption
            key={i}
            label={OPTION_LABELS[i]}
            text={opt}
            selected={selected === i}
            correct={answered && effectiveCorrectIndex != null && i === effectiveCorrectIndex}
            wrong={answered && effectiveCorrectIndex != null && selected === i && i !== effectiveCorrectIndex}
            disabled={answered}
            onClick={() => !answered && setSelected(i)}
          />
        ))}
      </div>

      {/* 다음 버튼: 선택 전 비활성, 선택 후 활성 */}
      <div className="quiz-engine__feedback">
        <Button
          variant="primary"
          size="md"
          icon={ChevronRight}
          iconPosition="right"
          disabled={!answered && selected === null}
          onClick={handleNext}
        >
          {isLast ? '결과 보기' : '다음'}
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
