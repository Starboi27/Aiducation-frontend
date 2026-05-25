import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, Sparkles, Check, X, Plus, FileText, BookOpen, PenLine } from 'lucide-react';
import { Button, Badge } from '../../atoms';
import SubjectCard from '../SubjectCard/SubjectCard';
import DifficultyModal from '../../molecules/DifficultyModal/DifficultyModal';
import './SubjectManager.css';

/**
 * Organism: SubjectManager
 * 과목 목록 전체를 관리하는 복합 컴포넌트.
 * - AI pending 배너 (UploadPage → navigate state로 전달된 newSubject)
 * - 수동 과목 추가 인라인 폼
 * - 빈 상태 일러스트
 * - SubjectCard 목록 (organism)
 *
 * Props:
 *   subjects       - 전체 과목 배열
 *   onAddSubject   - (subjectObj) => void
 *   onDeleteSubject- (id) => void
 *   onAddTopic     - (subjectId, topicObj) => void
 */
const SubjectManager = ({ subjects, onAddSubject, onDeleteSubject,
  onAddTopic,
  onDeleteTopic,
  onRenameSubject,
  showManualForm: showManualFormProp,
  onManualFormClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 수동 추가 폼: 외부 prop 또는 내부 state로 제어
  const [showManualFormLocal, setShowManualFormLocal] = useState(false);

  // 외부 prop이 true로 바뀌면 내부 상태도 동기화
  React.useEffect(() => {
    if (showManualFormProp) {
      setShowManualFormLocal(true);
    }
  }, [showManualFormProp]);

  const showManualForm = showManualFormLocal;
  const setShowManualForm = (val) => {
    setShowManualFormLocal(val);
    if (!val && onManualFormClose) onManualFormClose();
  };
  const [manualName, setManualName] = useState('');

  // 펼쳐진 과목 ID
  const [expandedId, setExpandedId] = useState(null);

  // 난이도 모달 상태: { subjectId, topicId } | null
  const [modalTarget, setModalTarget] = useState(null);

  // UploadPage → state로 넘어온 AI 분석 결과 (pending subject)
  const pendingSubject = location.state?.newSubject ?? null;
  const [pendingDismissed, setPendingDismissed] = useState(false);
  const showPending = pendingSubject && !pendingDismissed;

  // URL 해시 확인해서 수동 추가 폼 열기 (하위 호환)
  React.useEffect(() => {
    if (location.hash === '#manual') {
      setShowManualForm(true);
    }
  }, [location.hash]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleAddManual = () => {
    if (!manualName.trim()) return;
    const subj = onAddSubject({ name: manualName.trim(), source: 'manual', topics: [] });
    setManualName('');
    setShowManualForm(false);
    setExpandedId(subj?.id ?? null);
  };

  const handleConfirmPending = () => {
    onAddSubject(pendingSubject);
    setPendingDismissed(true);
  };

  const handleStartQuiz = (subjectId, topicId) => {
    setModalTarget({ subjectId, topicId });
  };

  const handleStartAllQuiz = (subjectId) => {
    setModalTarget({ subjectId, topicId: 'all' });
  };

  const handleDifficultyConfirm = ({ difficulty, count }) => {
    const { subjectId, topicId } = modalTarget;
    setModalTarget(null);
    navigate(`/quiz/${subjectId}/${topicId}?difficulty=${difficulty}&count=${count}`);
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="subject-manager">
      <DifficultyModal
        isOpen={!!modalTarget}
        onClose={() => setModalTarget(null)}
        onConfirm={handleDifficultyConfirm}
      />

      {/* AI 분석 결과 pending 배너 */}
      {showPending && (
        <div className="subject-manager__pending animate-bounce-in">
          <div className="pending__icon">
            <Brain size={24} />
          </div>
          <div className="pending__body">
            <p className="pending__title">
              <Sparkles size={14} />
              AI가 <strong>"{pendingSubject.name ?? pendingSubject.subjectName}"</strong> 파일을 분석했습니다!
            </p>
            <p className="pending__sub">
              {pendingSubject.topics.length}개 주제를 발견했습니다. 과목으로 저장하시겠습니까?
            </p>
            <div className="pending__topics">
              {pendingSubject.topics.map((t) => (
                <Badge key={t.id} variant="primary" size="sm">{t.name}</Badge>
              ))}
            </div>
          </div>
          <div className="pending__actions">
            <button className="pending__btn pending__btn--confirm" onClick={handleConfirmPending}>
              <Check size={16} /> 저장
            </button>
            <button className="pending__btn pending__btn--dismiss" onClick={() => setPendingDismissed(true)}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 수동 과목 추가 인라인 폼 */}
      {showManualForm && (
        <div className="subject-manager__manual-form animate-fade-in">
          <PenLine size={18} className="manual-form__icon" />
          <input
            className="manual-form__input"
            placeholder="과목명 입력 (예: 영상처리, 운영체제…)"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            autoFocus
          />
          <Button size="sm" onClick={handleAddManual} disabled={!manualName.trim()}>
            추가
          </Button>
          <button
            className="manual-form__cancel"
            onClick={() => { setShowManualForm(false); setManualName(''); }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 빈 상태 */}
      {subjects.length === 0 && !showPending ? (
        <div className="subject-manager__empty">
          <div className="empty__illustration">
            <BookOpen size={64} className="empty__icon" />
          </div>
          <h2 className="empty__title">아직 과목이 없어요</h2>
          <p className="empty__desc">
            PDF 파일을 업로드하면 AI가 자동으로 주제를 분류하고,<br />
            주제별 퀴즈 섹션을 만들어 드립니다.
          </p>
          <div className="empty__actions">
            <Button icon={FileText} onClick={() => navigate('/upload')}>
              파일 업로드하기
            </Button>
            <Button variant="secondary" icon={Plus} onClick={() => setShowManualForm(true)}>
              직접 만들기
            </Button>
          </div>
        </div>
      ) : (
        /* 과목 카드 목록 */
        <div className="subject-manager__grid">
          {subjects.map((subj, idx) => (
            <SubjectCard
              key={subj.id}
              subject={subj}
              isExpanded={expandedId === subj.id}
              onToggle={() => setExpandedId(expandedId === subj.id ? null : subj.id)}
              onDelete={() => onDeleteSubject(subj.id)}
              onStartQuiz={handleStartQuiz}
              onStartAll={() => handleStartAllQuiz(subj.id)}
              onAddTopic={(topic) => onAddTopic(subj.id, topic)}
              onDeleteTopic={(topicId) => onDeleteTopic(subj.id, topicId)}
              onRename={(newName) => onRenameSubject?.(subj.id, newName)}
              colorIndex={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 수동 폼 표시 trigger를 외부에서 제어할 수 있도록 ref 패턴 대신 prop 제공
SubjectManager.defaultProps = {
  subjects: [],
};

export default SubjectManager;
export { SubjectManager };
