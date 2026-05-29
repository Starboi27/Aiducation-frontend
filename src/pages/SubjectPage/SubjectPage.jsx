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

  const handleDeleteSubject = async (id) => {
    const subject = subjects.find(s => String(s.id) === String(id));
    deleteSubject(id); // 낙관적 UI 업데이트
    if (!isNaN(Number(id))) {
      try {
        // 1단계: 파일 목록 조회 후 모든 파일 삭제 (백엔드 제약: 파일 먼저 삭제 필요)
        const res = await subjectService.getFiles(id);
        const files = res?.files ?? res?.data ?? (Array.isArray(res) ? res : []);
        for (const file of files) {
          const fid = file?.fileId ?? file?.id;
          if (fid) {
            await subjectService.deleteFile(fid);
          }
        }
        // 2단계: 파일 모두 삭제 후 과목 삭제
        await subjectService.deleteSubject(id);
      } catch (err) {
        console.error("과목 삭제 중 오류:", err);
      }
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
