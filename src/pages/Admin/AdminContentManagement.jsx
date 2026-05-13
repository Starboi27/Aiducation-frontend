import React, { useState, useEffect } from 'react';
import './AdminContentManagement.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import { adminService } from '../../services/adminService';
import Button from '../../components/atoms/Button/Button';

const TYPE_LABEL = { FILE: '파일', CONCEPT: '개념', QUIZ: '퀴즈' };

const AdminContentManagement = () => {
  const [contents, setContents] = useState([]);
  const [pendingConcepts, setPendingConcepts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contents');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contentData, conceptData] = await Promise.all([
        adminService.getContents(),
        adminService.getPendingConcepts(),
      ]);
      setContents(contentData?.contents ?? []);
      setPendingConcepts(conceptData?.concepts ?? []);
    } catch (err) {
      console.error('콘텐츠 목록 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContent = async (item) => {
    if (!window.confirm(`"${item.name}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await adminService.deleteFile(item.id);
      setContents((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const handleConceptStatus = async (concept, status) => {
    try {
      await adminService.updateConceptStatus(concept.conceptId, status);
      setPendingConcepts((prev) =>
        prev.map((c) => (c.conceptId === concept.conceptId ? { ...c, status } : c))
      );
    } catch (err) {
      alert(`상태 변경 실패: ${err.message}`);
    }
  };

  const handleDeleteConcept = async (concept) => {
    if (!window.confirm(`"${concept.name}" 개념을 삭제하시겠습니까?`)) return;
    try {
      await adminService.deleteConcept(concept.conceptId);
      setPendingConcepts((prev) => prev.filter((c) => c.conceptId !== concept.conceptId));
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  const contentColumns = [
    { header: '이름',      accessor: 'name'        },
    { header: '유형',      render: (c) => TYPE_LABEL[c.type] ?? c.type },
    { header: '소유자',    accessor: 'ownerUserId' },
    { header: '등록 일시', render: (c) => new Date(c.createdAt).toLocaleString('ko-KR') },
    {
      header: '관리',
      render: (c) => (
        <div className="table-actions">
          <Button variant="danger" size="small" onClick={() => handleDeleteContent(c)}>삭제</Button>
        </div>
      ),
    },
  ];

  const conceptColumns = [
    { header: '개념명',   accessor: 'name'        },
    { header: '과목',     accessor: 'subjectName' },
    {
      header: '상태',
      render: (c) => {
        const map = { PENDING: '대기', PROCESSING: '처리 중', APPROVED: '승인', REJECTED: '거절' };
        return <span className={`status-badge ${c.status?.toLowerCase()}`}>{map[c.status] ?? c.status}</span>;
      },
    },
    {
      header: '관리',
      render: (c) => (
        <div className="table-actions">
          {(c.status === 'PENDING' || c.status === 'PROCESSING') && (
            <>
              <Button variant="outline" size="small" onClick={() => handleConceptStatus(c, 'APPROVED')}>승인</Button>
              <Button variant="outline" size="small" onClick={() => handleConceptStatus(c, 'REJECTED')}>거절</Button>
            </>
          )}
          <Button variant="danger" size="small" onClick={() => handleDeleteConcept(c)}>삭제</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">콘텐츠 관리</h1>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'contents' ? 'active' : ''}`}
          onClick={() => setActiveTab('contents')}
        >
          파일 / 콘텐츠 ({contents.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'concepts' ? 'active' : ''}`}
          onClick={() => setActiveTab('concepts')}
        >
          대기 중 개념 ({pendingConcepts.length})
        </button>
      </div>

      {activeTab === 'contents' && (
        <AdminTable columns={contentColumns} data={contents} isLoading={isLoading} />
      )}
      {activeTab === 'concepts' && (
        <AdminTable columns={conceptColumns} data={pendingConcepts} isLoading={isLoading} />
      )}
    </div>
  );
};

export default AdminContentManagement;
