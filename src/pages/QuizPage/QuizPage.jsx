import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { QuizEngine } from '../../components/organisms';
import { Button } from '../../components/atoms';
import { useApp } from '../../context/AppContext';
import { aiService } from '../../services/aiService';
import { CheckCircle, Zap, BookOpen, ChevronLeft, Loader2 } from 'lucide-react';
import './QuizPage.css';

// Mock Questions for fallback
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    topic: '자료구조',
    difficulty: 2,
    question: '스택(Stack)의 기본 동작 원리로 알맞은 것은?',
    options: ['FIFO (First In First Out)', 'LIFO (Last In First Out)', 'LILO (Last In Last Out)', 'Random Access', 'Priority Queue'],
    correctIndex: 1,
    explanation: '스택은 나중에 들어간 데이터가 먼저 나오는 후입선출(LIFO) 구조입니다.'
  },
  {
    id: 'q2',
    topic: '운영체제',
    difficulty: 4,
    question: '데드락(Deadlock)의 발생 조건 4가지가 아닌 것은?',
    options: ['상호 배제 (Mutual Exclusion)', '점유 대기 (Hold and Wait)', '비선점 (No Preemption)', '환형 대기 (Circular Wait)', '선점형 스케줄링 (Preemptive Scheduling)'],
    correctIndex: 4,
    explanation: '선점 조건이 불가능해야(비선점) 데드락이 발생하므로 선점형 스케줄링은 오히려 해결책 중 하나가 될 수 있습니다.'
  }
];

const QuizPage = () => {
  const [complete, setComplete] = useState(false);
  const [results, setResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { subjectId, topicId } = useParams();
  const { getSubjectById, topicQuestions, setTopicQuestions, submitQuizResult, updateWrongAnswerCorrectIndex } = useApp();

  const location = useLocation();
  const _params = new URLSearchParams(location.search);
  const difficulty = Number(_params.get('difficulty')) || 3;

  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // subject / topic 정보 조회
  const subject = subjectId ? getSubjectById(subjectId) : null;
  const topic = subject && topicId && topicId !== 'all'
    ? subject.topics.find(t => String(t.id) === String(topicId))
    : null;

  const count = Number(_params.get('count')) || (topic ? topic.quizCount : 10) || 10;

  const quizTitle = topic
    ? `${topic.name} 퀴즈`
    : subject
      ? `${subject.name} — 전체 퀴즈`
      : '실전 학습 퀴즈';

  const quizDesc = topic
    ? `"${subject.name}" 과목의 ${topic.name} 주제 퀴즈입니다.`
    : subject
      ? `"${subject.name}" 과목의 전체 주제 퀴즈입니다.`
      : '제한 시간 내에 문제를 풀고 최고 경험치를 획득하세요.';

  // ref로 최신값 유지 — 이펙트 의존성에 넣지 않기 위함 (불필요한 재실행 방지)
  const topicQuestionsRef = useRef(topicQuestions);
  const setTopicQuestionsRef = useRef(setTopicQuestions);
  const getSubjectByIdRef = useRef(getSubjectById);
  useEffect(() => { topicQuestionsRef.current = topicQuestions; });
  useEffect(() => { setTopicQuestionsRef.current = setTopicQuestions; });
  useEffect(() => { getSubjectByIdRef.current = getSubjectById; });

  useEffect(() => {
    if (!subjectId) {
      setQuestions(MOCK_QUESTIONS);
      return;
    }

    // ref에서 최신값 읽기 (의존성 배열 변화 없이 항상 최신 상태 접근)
    const fetchQuestions = async () => {
      const tqCache = topicQuestionsRef.current;
      const setTQ = setTopicQuestionsRef.current;
      const subj = getSubjectByIdRef.current(subjectId);

      setLoading(true);
      try {
        if (topicId === 'all') {
          const allTopics = subj?.topics || [];
          if (allTopics.length === 0) {
            setQuestions(MOCK_QUESTIONS);
            setLoading(false);
            return;
          }

          if (count === null) {
            // 전체 퀴즈: 캐시된 문제만 사용, 새 생성 없음
            const cached = allTopics.flatMap(t =>
              (tqCache[t.id] || []).map(q => ({ ...q, subjectId: subj.id, subjectName: subj.name }))
            );
            setQuestions(cached.length > 0 ? cached : MOCK_QUESTIONS);
          } else {
            // 난이도/문제 수 지정 퀴즈: 토픽별 균등 생성
            const limitPerTopic = Math.ceil(count / allTopics.length);
            const promises = allTopics.map(async (t) => {
              let questionsOfTopic = [];
              if (tqCache[t.id]) {
                questionsOfTopic = tqCache[t.id];
              } else {
                const generated = await aiService.generateQuiz(t.name, subj.name, {
                  count: limitPerTopic,
                  difficulty,
                  conceptId: t.id,
                });
                questionsOfTopic = generated.map(q => ({
                  ...q, subjectId: subj.id, subjectName: subj.name
                }));
                setTQ(t.id, questionsOfTopic);
              }
              return questionsOfTopic.slice(0, limitPerTopic);
            });
            const results = await Promise.all(promises);
            setQuestions(results.flat().slice(0, count));
          }

        } else {
          const currentTopic = subj?.topics?.find(t => String(t.id) === String(topicId));
          if (!currentTopic) {
            setQuestions(MOCK_QUESTIONS);
            setLoading(false);
            return;
          }

          if (tqCache[currentTopic.id]) {
            setQuestions(tqCache[currentTopic.id]);
            setLoading(false);
            return;
          }

          const generated = await aiService.generateQuiz(currentTopic.name, subj.name, {
            count,
            difficulty,
            conceptId: currentTopic.id,
          });
          const enhanced = generated.map(q => ({
            ...q, subjectId: subj.id, subjectName: subj.name
          }));
          setTQ(currentTopic.id, enhanced);
          setQuestions(enhanced);
        }
      } catch (err) {
        console.error('Quiz Generation Error: ', err);
        setError(err.message);
        setQuestions(MOCK_QUESTIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  // subjectId·topicId·count·difficulty 변경 시에만 재실행 (함수·캐시 참조 변화 무시)
  }, [subjectId, topicId, count, difficulty]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = useCallback(async (res) => {
    setSubmitting(true);
    // submitAll로 서버 정답 판정을 받아 correctIndex null 문제를 해결
    const answers = res.map(r => ({
      quizId: r.questionId,
      answer: r.selectedAnswer ?? 0,
    }));

    let finalRes = res;
    try {
      const submitResponse = await aiService.submitAll(answers);
      console.log('[DEBUG] submitAll 응답:', JSON.stringify(submitResponse));

      if (submitResponse?.results?.length) {
        finalRes = res.map((r, i) => {
          const srv = submitResponse.results.find(s => String(s.quizId) === String(r.questionId))
            ?? submitResponse.results[i];
          return srv ? { ...r, correct: srv.correct } : r;
        });

        // 백엔드 필드명이 다를 수 있어 다양한 이름으로 시도
        submitResponse.results.forEach((srv) => {
          const correctAns =
            srv.correctAnswer ?? srv.answer ?? srv.correct_answer ??
            srv.correctOption ?? srv.correctIdx;
          if (correctAns != null) {
            updateWrongAnswerCorrectIndex(String(srv.quizId), Number(correctAns) - 1);
          }
        });
      }
    } catch (e) {
      console.warn('submitAll 실패 — 로컬 정답 판정 사용:', e.message);
    }

    const correctCount = finalRes.filter(r => r.correct).length;
    const totalCount = finalRes.length;

    if (submitQuizResult) {
      submitQuizResult(correctCount, totalCount);
    }

    setResults(finalRes);
    setSubmitting(false);
    setComplete(true);
  }, [submitQuizResult, updateWrongAnswerCorrectIndex]);

  if (submitting) {
    return (
      <div className="quiz-page__loading">
        <Loader2 size={48} className="animate-spin text-primary" style={{ margin: '0 auto', marginBottom: '16px' }} />
        <h2>결과를 집계하고 있습니다...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (complete) {
    const totalExp = results.reduce((acc, curr) => acc + curr.expGained, 0);
    const correctCount = results.filter(r => r.correct).length;

    return (
      <div className="quiz-result animate-fade-in">
        <div className="quiz-result__icon">
          <CheckCircle size={64} className="text-success" />
        </div>
        <h1 className="quiz-result__title">학습 완료!</h1>
        <p className="quiz-result__desc">수고하셨습니다. 이번 학습의 성과입니다.</p>

        <div className="quiz-result__stats">
          <div className="quiz-result__stat">
            <span className="quiz-result__stat-label">정답 수</span>
            <span className="quiz-result__stat-val">{correctCount} / {results.length}</span>
          </div>
          <div className="quiz-result__divider" />
          <div className="quiz-result__stat text-gold">
            <span className="quiz-result__stat-label"><Zap size={14} /> 획득 경험치</span>
            <span className="quiz-result__stat-val">+{totalExp} XP</span>
          </div>
        </div>

        <div className="quiz-result__actions">
          {subjectId && (
            <Button variant="secondary" size="lg" icon={BookOpen} onClick={() => navigate('/subjects')}>
              과목으로 돌아가기
            </Button>
          )}
          <Button variant="primary" size="lg" onClick={() => navigate('/review')}>오답 확인하기</Button>
          <Button variant="ghost" size="lg" onClick={() => navigate('/')}>대시보드로</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page animate-fade-in">
      <header className="page-header">
        {subjectId && (
          <button className="quiz-page__back-btn" onClick={() => navigate('/subjects')}>
            <ChevronLeft size={16} /> 과목 목록
          </button>
        )}
        <h1 className="page-title">{quizTitle}</h1>
        <p className="page-desc">{quizDesc}</p>
      </header>

      {loading ? (
        <div className="quiz-page__loading">
          <Loader2 size={48} className="animate-spin text-primary" style={{ margin: '0 auto', marginBottom: '16px' }} />
          <h2>AI가 맞춤형 퀴즈를 생성하고 있습니다...</h2>
          <p>잠시만 기다려주세요.</p>
        </div>
      ) : error ? (
        <div className="quiz-page__error">
          <p>퀴즈 생성 중 오류가 발생했습니다.</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: '0.5rem' }}>{error}</p>
          <Button onClick={() => navigate('/subjects')} style={{ marginTop: '1rem' }}>돌아가기</Button>
        </div>
      ) : questions && questions.length > 0 ? (
        <QuizEngine 
          questions={questions} 
          quizId={subjectId && topicId ? `${subjectId}_${topicId}` : 'fallback_quiz'} 
          onComplete={handleComplete} 
        />
      ) : (
        <div className="quiz-page__error">
          <p>문제를 불러오지 못했습니다.</p>
          <Button onClick={() => navigate('/subjects')}>돌아가기</Button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;
