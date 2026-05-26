import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Plus, FileText } from 'lucide-react';
import { Button } from '../../components/atoms';
import { SubjectManager } from '../../components/organisms';
import { useApp } from '../../context/AppContext';
import { subjectService } from '../../services/subjectService';
import './SubjectPage.css';

/**
 * Page: SubjectPage  (/subjects)
 * Atomic Design 역할: 페이지 레이아웃 + Context 연결만 담당.
 * 실제 UI 로직은 SubjectManager organism에 위임.
 */
const SubjectPage = () => {
  const navigate = useNavigate();
  const { subjects, addSubject, deleteSubject, addTopicToSubject, deleteTopicFromSubject, mergeTopicsInSubject, updateSubject } = useApp();
  const [showManualForm, setShowManualForm] = useState(false);

  const handleDeleteSubject = (id) => {
    deleteSubject(id);
    // 로컬 생성 ID(subj_xxx)는 서버에 없으므로 숫자 ID일 때만 API 호출
    if (!isNaN(Number(id))) {
      subjectService.deleteSubject(id).catch(() => {});
    }
  };

  return (
    <div className="subject-page animate-fade-in">
      {/* ── 페이지 헤더 */}
      <header className="page-header subject-page__header">
        <div>
          <h1 className="page-title">
            <FolderOpen size={28} className="subject-page__title-icon" />
            내 과목 &amp; 학습 자료
          </h1>
          <p className="page-desc">
            과목을 직접 만들거나, AI가 파일에서 자동 분류한 주제를 확인하세요.
          </p>
        </div>
        <div className="subject-page__header-actions">
          <Button variant="secondary" icon={Plus} onClick={() => setShowManualForm(true)}>
            수동으로 과목 추가
          </Button>
          <Button variant="primary" icon={FileText} onClick={() => navigate('/upload')}>
            파일 업로드
          </Button>
        </div>
      </header>

      {/* ── SubjectManager Organism */}
      <SubjectManager
        subjects={subjects}
        onAddSubject={addSubject}
        onDeleteSubject={handleDeleteSubject}
        onAddTopic={addTopicToSubject}
        onDeleteTopic={deleteTopicFromSubject}
        onMergeTopic={async (subjectId, sourceId, targetId) => {
          const result = await subjectService.mergeConcepts(sourceId, targetId);
          mergeTopicsInSubject(subjectId, sourceId, targetId, result.mergedQuizCount ?? 0);
        }}
        onRenameSubject={(id, newName) => updateSubject(id, { name: newName })}
        showManualForm={showManualForm}
        onManualFormClose={() => setShowManualForm(false)}
      />
    </div>
  );
};

export default SubjectPage;
