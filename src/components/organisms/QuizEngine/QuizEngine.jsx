import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronRight, Zap, Timer, AlertTriangle } from 'lucide-react';
import { Button, Badge, ProgressBar } from '../../atoms';
import { QuizOption } from '../../molecules';
import { useApp } from '../../../context/AppContext';
import './QuizEngine.css';

const DIFFICULTY_LABELS = { 1: '매우 쉬움', 2: '쉬움', 3: '보통', 4: '어려움', 5: '매우 어려움' };
const DIFFICULTY_COLORS = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'accent' };

const QuizEngine = ({ questions = [], quizId = 'default_quiz', onComplete }) => {
  const [currentIdx, setCurrentIdx] = useState(() => {
    const saved = localStorage.getItem(`quizProgress_${quizId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 저장된 위치가 문제 개수를 넘지 않을 경우에만 이어서 시작
        if (parsed.currentIdx < questions.length) return parsed.currentIdx;
      } catch (e) { console.error('Failed to parse saved progress', e); }
    }
    return 0;
  });

  const [results, setResults] = useState(() => {
    const saved = localStorage.getItem(`quizProgress_${quizId}`);
    if (saved) {
      try {
        return JSON.parse(saved).results || [];
      } catch (e) { console.error('Failed to parse saved results', e); }
    }
    return [];
  });

  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(true);
  const [showExplanation, setShowExplanation] = useState(false);
  const { addExp, addWrongAnswer } = useApp();

  const current = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;
  const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'];

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
      handleAnswer(null); // timeout
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, answered, current]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(30);
    setTimerActive(true);
    setSelected(null);
    setAnswered(false);
    setShowExplanation(false);
  }, [currentIdx]);

  const handleAnswer = (optionIdx) => {
    if (answered) return;
    setTimerActive(false);
    setSelected(optionIdx);
    setAnswered(true);
    const correct = optionIdx === current.correctIndex;

    const expGained = correct ? calculateExp(current.difficulty, timeLeft) : 0;
    if (correct) addExp(expGained);
    else addWrongAnswer({
      ...current,
      // 사용자가 선택한 실제 답변 텍스트 기록 (ReviewPage 내 이전 답변에 표시됨)
      userAnswer: optionIdx !== null ? current.options[optionIdx] : '(시간 초과)',
    });

    setResults(prev => [...prev, {
      questionId: current.id,
      correct,
      expGained,
      difficulty: current.difficulty,
      timeUsed: 30 - timeLeft,
    }]);
  };

  const handleNext = () => {
    if (isLast) {
      localStorage.removeItem(`quizProgress_${quizId}`);
      onComplete?.(results);
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

  const timerPercent = (timeLeft / 30) * 100;
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
            selected={selected === i && !answered}
            correct={answered && i === current.correctIndex}
            wrong={answered && selected === i && i !== current.correctIndex}
            disabled={answered}
            onClick={() => handleAnswer(i)}
          />
        ))}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`quiz-engine__feedback quiz-engine__feedback--${selected === current.correctIndex ? 'correct' : 'wrong'}`}>
          <div className="quiz-engine__feedback-icon">
            {selected === current.correctIndex
              ? <CheckCircle size={24} />
              : selected === null ? <Timer size={24} /> : <XCircle size={24} />
            }
          </div>
          <div className="quiz-engine__feedback-content">
            <p className="quiz-engine__feedback-title">
              {selected === current.correctIndex ? '정답입니다! 🎉'
                : selected === null ? '시간 초과!'
                : '오답입니다'}
            </p>
            {selected === current.correctIndex && results[results.length - 1]?.expGained > 0 && (
              <p className="quiz-engine__feedback-exp">
                +{results[results.length - 1].expGained} XP 획득!
              </p>
            )}
            {!showExplanation && current.explanation && (
              <button className="quiz-engine__explain-btn" onClick={() => setShowExplanation(true)}>
                해설 보기
              </button>
            )}
            {showExplanation && current.explanation && (
              <p className="quiz-engine__explanation">{current.explanation}</p>
            )}
          </div>
          <Button
            variant={selected === current.correctIndex ? 'success' : 'secondary'}
            size="md"
            icon={ChevronRight}
            iconPosition="right"
            onClick={handleNext}
          >
            {isLast ? '결과 보기' : '다음'}
          </Button>
        </div>
      )}
    </div>
  );
};

function calculateExp(difficulty, timeLeft) {
  const base = difficulty * 20;
  const speedBonus = Math.floor((timeLeft / 30) * difficulty * 10);
  return base + speedBonus;
}

export default QuizEngine;
