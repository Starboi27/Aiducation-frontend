import React, { useState, useEffect } from 'react';
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
  const navigate = useNavigate();
  const { subjectId, topicId } = useParams();
  const { getSubjectById, topicQuestions, setTopicQuestions, submitQuizResult } = useApp();

  const location = useLocation();
  const difficulty = new URLSearchParams(location.search).get('difficulty') ?? 'normal';

  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // subject / topic 정보 조회
  const subject = subjectId ? getSubjectById(subjectId) : null;
  const topic = subject && topicId && topicId !== 'all'
    ? subject.topics.find(t => t.id === topicId)
    : null;

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

  useEffect(() => {
    // URL param으로 들어온 topic 처리가 아니라면 기본 mock 제공
    if (!subjectId) {
      setQuestions(MOCK_QUESTIONS);
      return;
    }

    // AI Service를 통해 문제 생성(또는 캐시에서 로드)
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        if (topicId === 'all') {
          // 모든 토픽 퀴즈 가져오기
          const allTopics = subject?.topics || [];
          if (allTopics.length === 0) {
            setQuestions(MOCK_QUESTIONS);
            setLoading(false);
            return;
          }

          // 병렬로 여러 토픽의 문제 로드
          const promises = allTopics.map(async (t) => {
            // 캐시에 있으면 캐시 사용
            if (topicQuestions[t.id]) return topicQuestions[t.id];
            
            const generated = await aiService.generateQuiz(t.name, subject.name, { count: t.quizCount, difficulty });
            const enhanced = generated.map(q => ({
              ...q, subjectId: subject.id, subjectName: subject.name
            }));
            
            setTopicQuestions(t.id, enhanced); // 캐시에 저장
            return enhanced;
          });

          const results = await Promise.all(promises);
          const combined = results.flat(); // 모든 문제들을 1차원 배열로 합침
          
          setQuestions(combined);
          
        } else {
          // 특정 토픽의 문제만 가져오기
          const currentTopic = subject?.topics?.find(t => t.id === topicId);
          if (!currentTopic) {
            setQuestions(MOCK_QUESTIONS);
            setLoading(false);
            return;
          }

          // 캐시 확인
          if (topicQuestions[currentTopic.id]) {
            setQuestions(topicQuestions[currentTopic.id]);
            setLoading(false);
            return;
          }

          const generated = await aiService.generateQuiz(currentTopic.name, subject.name, {
            count: currentTopic.quizCount,
            difficulty,
          });
          const enhanced = generated.map(q => ({
            ...q, subjectId: subject.id, subjectName: subject.name
          }));
          
          setTopicQuestions(currentTopic.id, enhanced);
          setQuestions(enhanced);
        }
      } catch (err) {
        console.error('Quiz Generation Error: ', err);
        setError(err.message);
        setQuestions(MOCK_QUESTIONS); // 실패 시 Fallback 지원
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subjectId, topicId, subject, topicQuestions, setTopicQuestions]);

  const handleComplete = (res) => {
    // 퀴즈 완료 시 정답수와 전체 문제수를 계산합니다.
    const correctCount = res.filter(r => r.correct).length;
    const totalCount = res.length;

    // AI 가중치 정답률 계산기 및 경험치 보상 시스템 작동! 🚀
    if (submitQuizResult) {
      submitQuizResult(correctCount, totalCount);
    }

    setResults(res);
    setComplete(true);
  };

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
