import React, { useState, useEffect, useCallback } from 'react';
import './AdminContentManagement.css';
import './admin-common.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import { adminService } from '../../services/adminService';
import Button from '../../components/atoms/Button/Button';

const TYPE_LABEL     = { FILE: '파일', CONCEPT: '개념', QUIZ: '퀴즈' };
const DIFFICULTY_LABEL = { 1: '매우쉬움', 2: '쉬움', 3: '보통', 4: '어려움', 5: '매우어려움' };

const TABS = [
  { key: 'contents', label: '파일'       },
  { key: 'concepts', label: '대기 중 개념' },
  { key: 'quizzes',  label: '퀴즈'       },
];

const AdminContentManagement = () => {
  const [allContents, setAllContents]         = useState([]);  // API 원본 전체
  const [pendingConcepts, setPendingConcepts] = useState([]);
  const [quizzes, setQuizzes]                 = useState([]);
  const [loadingMap, setLoadingMap] = useState({ contents: true, concepts: true, quizzes: true });
  const setLoading = (key, val) => setLoadingMap((prev) => ({ ...prev, [key]: val }));
  const [activeTab, setActiveTab]             = useState('contents');


  // ── 데이터 로드 ────────────────────────────────────────────
  const loadContents = useCallback(async () => {
    setLoading('contents', true);
    try {
      const data = await adminService.getContents({ type: 'all' });
      setAllContents(data?.contents ?? []);
    } catch (err) {
      console.error('콘텐츠 목록 로드 실패:', err);
    } finally {
      setLoading('contents', false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConcepts = useCallback(async () => {
    setLoading('concepts', true);
    try {
      const data = await adminService.getPendingConcepts();
      setPendingConcepts(data?.concepts ?? []);
    } catch (err) {
      console.error('개념 목록 로드 실패:', err);
    } finally {
      setLoading('concepts', false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuizzes = useCallback(async () => {
    setLoading('quizzes', true);
    try {
      const data = await adminService.getQuizzes();
      setQuizzes(data?.quizzes ?? []);
    } catch (err) {
      console.error('퀴즈 목록 로드 실패:', err);
    } finally {
      setLoading('quizzes', false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 초기 마운트: 세 탭 데이터 병렬 로드
  useEffect(() => {
    loadContents();
    loadConcepts();
    loadQuizzes();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 탭 전환 시 해당 데이터 갱신
  useEffect(() => {
    if (activeTab === 'contents') loadContents();
    if (activeTab === 'concepts') loadConcepts();
    if (activeTab === 'quizzes')  loadQuizzes();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps


  // ── 삭제 핸들러 ───────────────────────────────────────────
  const handleDeleteContent = async (item) => {
    const reason = window.prompt(`"${item.name}" 삭제 사유를 입력하세요.`);
    if (reason === null) return;
    if (!reason.trim()) { alert('삭제 사유를 입력해주세요.'); return; }
    try {
      const numericId = String(item.id).replace(/\D/g, '');
      await adminService.deleteFile(numericId || item.id, reason.trim());
      setAllContents((prev) => prev.filter((c) => c.id !== item.id));
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

  const handleDeleteQuiz = async (quiz) => {
    if (!window.confirm(`퀴즈 #${quiz.quizId}를 삭제하시겠습니까?`)) return;
    try {
      await adminService.deleteQuiz(quiz.quizId, '관리자 삭제');
      setQuizzes((prev) => prev.filter((q) => q.quizId !== quiz.quizId));
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
    }
  };

  // ── 컬럼 정의 ─────────────────────────────────────────────
  const contentColumns = [
    { header: '유형',      render: (c) => <span className={`ct-badge ct-badge--${c.type?.toLowerCase()}`}>{TYPE_LABEL[c.type] ?? c.type}</span> },
    { header: '이름',      accessor: 'name'        },
    { header: '소유자 ID', accessor: 'ownerUserId' },
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
    { header: '개념명', accessor: 'name'        },
    { header: '과목',   accessor: 'subjectName' },
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

  const quizColumns = [
    { header: 'ID',     accessor: 'quizId' },
    { header: '문제',   accessor: 'quiz'   },
    { header: '사용자', accessor: 'userId' },
    { header: '난이도', render: (q) => DIFFICULTY_LABEL[q.difficulty] ?? q.difficulty },
    { header: '정답',   render: (q) => `${q.answer}번` },
    { header: '생성일', render: (q) => new Date(q.createTime).toLocaleDateString('ko-KR') },
    {
      header: '관리',
      render: (q) => (
        <div className="table-actions">
          <Button variant="danger" size="small" onClick={() => handleDeleteQuiz(q)}>삭제</Button>
        </div>
      ),
    },
  ];

  const tabCount = { contents: allContents.length, concepts: pendingConcepts.length, quizzes: quizzes.length };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">콘텐츠 관리</h1>
      </div>

      {/* 탭 */}
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} ({tabCount[tab.key]})
          </button>
        ))}
      </div>

      {/* 테이블 */}
      {activeTab === 'contents' && <AdminTable columns={contentColumns} data={allContents}    isLoading={loadingMap.contents} />}
      {activeTab === 'concepts' && <AdminTable columns={conceptColumns} data={pendingConcepts} isLoading={loadingMap.concepts} />}
      {activeTab === 'quizzes'  && <AdminTable columns={quizColumns}   data={quizzes}         isLoading={loadingMap.quizzes}  />}
    </div>
  );
};

export default AdminContentManagement;
