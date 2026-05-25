import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import QuizOption from '../../components/molecules/QuizOption/QuizOption';
import { Button, Badge } from '../../components/atoms';
import {
  BookX, CheckCircle2, FolderOpen, ChevronLeft, ChevronRight,
  AlertCircle, Bookmark, RotateCcw, CheckCheck,
} from 'lucide-react';
import './ReviewPage.css';

// ── 상수 ───────────────────────────────────────────────────────────────────
const LABELS = ['A', 'B', 'C', 'D', 'E'];

// QuizEngine과 동일한 난이도 표시 콘스턴
const DIFFICULTY_LABELS = { 1: '매우 쉬움', 2: '쉬움', 3: '보통', 4: '어려움', 5: '매우 어려움' };
const DIFFICULTY_COLORS = { 1: 'success', 2: 'info', 3: 'warning', 4: 'danger', 5: 'accent' };

// 배열 셔플 유틸 (Fisher-Yates)
function shuffleWithCorrect(options, correctIndex) {
  const items = options.map((text, idx) => ({ text, isCorrect: idx === correctIndex }));
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  const newCorrectIndex = items.findIndex(it => it.isCorrect);
  return { shuffledOptions: items.map(it => it.text), newCorrectIndex };
}

// ── 단일 오답 복습 카드 ─────────────────────────────────────────────────────
const ReviewCard = ({ question, onMastered, onNext, isLast }) => {
  const { updateWrongAnswerCorrectIndex } = useApp();

  // 원본 options 확정
  const rawOptions = useMemo(() => {
    if (question.options && question.options.length > 0) return question.options;
    const fakes = ['선택지 가', '선택지 나', '선택지 다', '선택지 라', '선택지 마'];
    return fakes;
  }, [question.options]);

  // correctIndex: question prop이 업데이트되면 반영
  const rawCorrectIndex = useMemo(() => {
    if (question.correctIndex != null && typeof question.correctIndex === 'number') {
      return question.correctIndex;
    }
    return -1;
  }, [question.correctIndex]);

  // 서버에서 정답·해설 가져오기 (마운트 시 1회)
  const [fetchedExplanation, setFetchedExplanation] = useState('');
  useEffect(() => {
    const id = question.id;
    if (!id || isNaN(Number(id))) return;

    aiService.getExplanation(id)
      .then((data) => {
        console.log('[DEBUG] getExplanation 응답:', JSON.stringify(data));
        // 해설 저장
        const exp = typeof data === 'string' ? data : (data?.explanation ?? '');
        if (exp) setFetchedExplanation(exp);

        // 정답 인덱스 업데이트 (아직 없는 경우)
        const ans = data?.answer ?? data?.correctAnswer ?? data?.correct_answer;
        if (ans != null && rawCorrectIndex < 0) {
          updateWrongAnswerCorrectIndex(String(id), Number(ans) - 1);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // 초기 셔플 (마운트 시 1회)
  const [shuffledOptions, setShuffledOptions] = useState(
    () => shuffleWithCorrect(rawOptions, rawCorrectIndex).shuffledOptions
  );
  const [correctIndex, setCorrectIndex] = useState(
    () => shuffleWithCorrect(rawOptions, rawCorrectIndex).newCorrectIndex
  );

  // rawCorrectIndex가 늦게 업데이트되면 셔플된 배열에서 올바른 위치로 sync
  useEffect(() => {
    if (rawCorrectIndex < 0) return;
    const correctText = rawOptions[rawCorrectIndex];
    const newCI = shuffledOptions.findIndex(o => o === correctText);
    if (newCI >= 0) setCorrectIndex(newCI);
  }, [rawCorrectIndex, rawOptions, shuffledOptions]);

  // 풀이 상태 (step 제거 — 제출 즉시 정답+해설 공개)
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answered,      setAnswered]      = useState(false);
  const [isCorrect,     setIsCorrect]     = useState(false);

  const noAnswer = correctIndex < 0;
  const displayExplanation = question.explanation || fetchedExplanation;
  // 셔플된 선택지 기준으로 정답 텍스트 표시
  const correctAnswerText = correctIndex >= 0 ? shuffledOptions[correctIndex] : null;

  // ── 보기 선택 ───────────────────────────────────────────────────────────
  const handleSelect = (idx) => {
    if (answered) return;
    setSelectedIndex(idx);
  };

  // ── 제출: 맞든 틀리든 즉시 정답+해설 공개 ──────────────────────────────
  const handleSubmit = () => {
    if (selectedIndex === null || answered) return;
    const correct = !noAnswer && selectedIndex === correctIndex;
    setAnswered(true);
    setIsCorrect(correct);
  };

  // ── 다시 시도: 선택지 셔플 후 재도전 ────────────────────────────────────
  const handleRetry = () => {
    const { shuffledOptions: newOpts, newCorrectIndex: newCI } =
      shuffleWithCorrect(rawOptions, rawCorrectIndex);
    setShuffledOptions(newOpts);
    setCorrectIndex(newCI);
    setSelectedIndex(null);
    setAnswered(false);
    setIsCorrect(false);
  };

  // ── 렌더 ────────────────────────────────────────────────────────────────
  return (
    <div className="review-card animate-fade-in">
      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <div className="review-card__header">
        <div className="review-card__badges">
          <Badge variant="warning"><AlertCircle size={12} style={{ marginRight: 4 }} />오답</Badge>
          {question.difficulty && (
            <Badge variant={DIFFICULTY_COLORS[question.difficulty] || 'info'} size="sm">
              {DIFFICULTY_LABELS[question.difficulty] || '보통'}
            </Badge>
          )}
          {question.wrongCount > 1 && (
            <Badge variant="danger" size="sm">
              <RotateCcw size={10} style={{ marginRight: 3 }} />{question.wrongCount}회 틀림
            </Badge>
          )}
        </div>
        <span className="review-step-label">
          {answered ? '해설 확인' : '다시 풀기'}
        </span>
      </div>

      {/* ── 내 이전 답변 ───────────────────────────────────────────── */}
      <div className="review-my-answer">
        <span className="review-my-answer__label">내 이전 답변</span>
        <span className="review-my-answer__text">{question.userAnswer || '(기록 없음)'}</span>
      </div>

      {/* ── 문제 ─────────────────────────────────────────────────────── */}
      <h3 className="review-card__question">{question.question}</h3>

      {/* ── 선택지 ─────────────────────────────────────────────────── */}
      <div className="review-options">
        {shuffledOptions.map((opt, idx) => (
          <QuizOption
            key={idx}
            label={LABELS[idx] || String(idx + 1)}
            text={opt}
            selected={selectedIndex === idx && !answered}
            correct={answered && idx === correctIndex}
            wrong={answered && selectedIndex === idx && idx !== correctIndex}
            disabled={answered}
            onClick={() => handleSelect(idx)}
          />
        ))}
      </div>

      {/* ── 제출 버튼 (미답변 시) ──────────────────────────────────── */}
      {!answered && (
        <div className="review-card__actions">
          <Button
            variant="primary"
            disabled={selectedIndex === null}
            onClick={handleSubmit}
          >
            정답 확인
          </Button>
        </div>
      )}

      {/* ── 제출 후: 결과 배너 + 정답 + 해설 + 액션 ───────────────── */}
      {answered && (
        <>
          {/* 결과 배너 */}
          <div className={`review-result-banner${isCorrect ? ' review-result-banner--correct' : ' review-result-banner--wrong'}`}>
            {isCorrect ? (
              <><CheckCircle2 size={20} /><span>정답입니다! 🎉</span></>
            ) : (
              <><AlertCircle size={20} /><span>오답이에요. 정답과 해설을 확인하세요.</span></>
            )}
          </div>

          {/* 정답 표시 */}
          {correctAnswerText && (
            <div className="review-answer-correct">
              <span className="review-answer-correct__label">정답</span>
              <span className="review-answer-correct__text">{correctAnswerText}</span>
            </div>
          )}

          {/* 해설 */}
          <div className="review-explanation">
            <strong>해설</strong>
            {displayExplanation ? (
              <p>{displayExplanation}</p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                해설을 불러오는 중이거나 백엔드에서 제공하지 않습니다.
              </p>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="review-card__actions review-card__actions--done">
            <Button variant="ghost" icon={RotateCcw} onClick={handleRetry}>
              다시 풀기
            </Button>
            <Button variant="primary" icon={CheckCheck} onClick={() => onMastered(question.id)}>
              이해했어요
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

// ── 메인 ReviewPage ────────────────────────────────────────────────────────
const TOPIC_COLORS = [
  '#6C5CE7', '#00cec9', '#fd79a8', '#fdcb6e',
  '#00b894', '#e17055', '#0984e3', '#a29bfe',
];

const ReviewPage = () => {
  const { wrongAnswers, masterWrongAnswer } = useApp();

  // 아코디언: 펼쳐진 과목 ID
  const [expandedId,   setExpandedId]   = useState(null);
  // 복습 모드: 선택된 과목+토픽
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedTopicId,   setSelectedTopicId]   = useState(null);
  const [currentIndex,      setCurrentIndex]      = useState(0);

  // 마스터 안 된 오답만 복습 대상
  const pendingAnswers = wrongAnswers.filter(q => !q.isMastered);

  // 과목 트리
  const subjectTree = useMemo(() => {
    const map = new Map();
    pendingAnswers.forEach(q => {
      const sId   = q.subjectId   || 'unknown';
      const sName = q.subjectName || '기타/기본 퀴즈';
      const tName = q.topic       || '기본 카테고리';
      if (!map.has(sId)) map.set(sId, { id: sId, name: sName, totalCount: 0, topics: new Map() });
      const subj = map.get(sId);
      subj.totalCount += 1;
      subj.topics.set(tName, (subj.topics.get(tName) || 0) + 1);
    });
    return Array.from(map.values()).map(subj => ({
      ...subj,
      topics: Array.from(subj.topics.entries()).map(([name, count]) => ({
        id: `${subj.id}_${name}`, name, count,
      })),
    }));
  }, [pendingAnswers]);

  // 선택된 토픽의 오답 목록
  const filteredAnswers = useMemo(() => {
    if (!selectedSubjectId || !selectedTopicId) return [];
    return pendingAnswers.filter(q => {
      const sId   = q.subjectId || 'unknown';
      const tName = q.topic     || '기본 카테고리';
      return sId === selectedSubjectId && `${sId}_${tName}` === selectedTopicId;
    });
  }, [pendingAnswers, selectedSubjectId, selectedTopicId]);

  const validIndex      = Math.min(currentIndex, Math.max(0, filteredAnswers.length - 1));
  const currentQuestion = filteredAnswers[validIndex];

  const isReviewing = selectedSubjectId && selectedTopicId;

  const handleMastered = (id) => {
    masterWrongAnswer(id);
    if (validIndex >= filteredAnswers.length - 1) {
      setCurrentIndex(Math.max(0, validIndex - 1));
    }
  };

  const handleSelectTopic = (subjectId, topicId) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId(topicId);
    setCurrentIndex(0);
  };

  const handleBackToList = () => {
    setSelectedSubjectId(null);
    setSelectedTopicId(null);
    setCurrentIndex(0);
  };

  // ── 뷰 분기 0: 오답 없음 ──────────────────────────────────────────────
  if (pendingAnswers.length === 0) {
    return (
      <div className="review-page animate-fade-in">
        <header className="page-header">
          <h1 className="page-title">오답 노트</h1>
        </header>
        <div className="review-empty">
          <BookX size={64} className="text-muted" />
          <h2 style={{ color: 'var(--text-primary)', marginTop: '16px' }}>완벽합니다!</h2>
          <p>모든 과목을 마스터하셨군요! 복습할 오답이 없습니다.</p>
        </div>
      </div>
    );
  }

  // ── 뷰: 복습 풀이 화면 ───────────────────────────────────────────────
  if (isReviewing) {
    const currentSubjectTree = subjectTree.find(s => s.id === selectedSubjectId);
    const currentTopicTree = currentSubjectTree?.topics.find(t => t.id === selectedTopicId);

    return (
      <div className="review-page animate-fade-in">
        <header className="page-header">
          <button className="review-page__back-btn" onClick={handleBackToList}>
            <ChevronLeft size={16} /> 목록으로
          </button>
          <h1 className="page-title">{currentSubjectTree?.name} — {currentTopicTree?.name}</h1>
          <p className="page-desc">총 {filteredAnswers.length}개의 복습할 문항이 있습니다.</p>
        </header>

        {filteredAnswers.length === 0 ? (
          <div className="review-empty">
            <CheckCircle2 size={48} style={{ color: 'var(--color-success)' }} />
            <h2 style={{ color: 'var(--text-primary)', marginTop: 16 }}>이 카테고리 완료!</h2>
            <p>모든 오답을 마스터했습니다.</p>
            <Button variant="secondary" onClick={handleBackToList} style={{ marginTop: 16 }}>
              목록으로
            </Button>
          </div>
        ) : (
          <div className="review-flashcard-container">
            <div className="review-flashcard-progress">
              <span className="review-flashcard-counter">{validIndex + 1} / {filteredAnswers.length}</span>
            </div>

            <ReviewCard
              key={`${currentQuestion.id}_${validIndex}`}
              question={currentQuestion}
              onMastered={handleMastered}
              onNext={() => setCurrentIndex(validIndex + 1)}
              isLast={validIndex === filteredAnswers.length - 1}
            />

            <div className="review-flashcard-controls">
              <Button
                variant="outline"
                icon={ChevronLeft}
                disabled={validIndex === 0}
                onClick={() => setCurrentIndex(validIndex - 1)}
              >
                이전 문제
              </Button>
              <Button
                variant="primary"
                icon={ChevronRight}
                iconPosition="right"
                disabled={validIndex === filteredAnswers.length - 1}
                onClick={() => setCurrentIndex(validIndex + 1)}
              >
                다음 문제
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── 뷰: 아코디언 과목/토픽 리스트 ────────────────────────────────────
  return (
    <div className="review-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">오답 노트</h1>
        <p className="page-desc">과목을 펼쳐서 복습할 토픽을 선택하세요.</p>
      </header>

      <div className="review-manager__grid">
        {subjectTree.map((subj, idx) => {
          const isExpanded = expandedId === subj.id;
          const accentColor = TOPIC_COLORS[idx % TOPIC_COLORS.length];

          return (
            <div
              key={subj.id}
              className={`review-accordion ${isExpanded ? 'review-accordion--expanded' : ''}`}
              style={{ '--accent': accentColor }}
            >
              {/* 아코디언 헤더 */}
              <div
                className="review-accordion__header"
                onClick={() => setExpandedId(isExpanded ? null : subj.id)}
              >
                <div className="review-accordion__header-left">
                  <div className="review-accordion__icon">
                    <FolderOpen size={20} />
                  </div>
                  <div className="review-accordion__title-block">
                    <h3 className="review-accordion__name">{subj.name}</h3>
                    <div className="review-accordion__meta">
                      <Badge variant="danger" size="sm">
                        <AlertCircle size={10} style={{ marginRight: 3 }} />
                        {subj.totalCount}개 오답
                      </Badge>
                      <span className="review-accordion__topic-count">
                        {subj.topics.length}개 토픽
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className={`review-accordion__chevron ${isExpanded ? 'review-accordion__chevron--open' : ''}`}
                />
              </div>

              {/* 아코디언 바디: 토픽 목록 */}
              {isExpanded && (
                <div className="review-accordion__body animate-fade-in">
                  {subj.topics.map(topic => (
                    <div
                      key={topic.id}
                      className="review-accordion__topic-row"
                      onClick={() => handleSelectTopic(subj.id, topic.id)}
                    >
                      <div className="review-accordion__topic-left">
                        <Bookmark size={14} className="review-accordion__topic-icon" />
                        <span className="review-accordion__topic-name">{topic.name}</span>
                      </div>
                      <div className="review-accordion__topic-right">
                        <Badge variant="warning" size="sm">{topic.count}문제</Badge>
                        <ChevronRight size={14} className="review-accordion__topic-arrow" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewPage;
