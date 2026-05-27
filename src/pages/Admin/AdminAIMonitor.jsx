import React, { useState, useEffect } from 'react';
import './AdminAIMonitor.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import AdminStatCard from '../../components/molecules/AdminStatCard/AdminStatCard';
import { aiService } from '../../services/aiService';
import { adminService } from '../../services/adminService';

const TYPE_LABEL = {
  FILE_PIPELINE:       'PDF 분석',
  QUIZ_GENERATION:     '퀴즈 생성',
  CONCEPTS_EXTRACTION: '개념 추출',
};

const AdminAIMonitor = () => {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({ pendingCount: 0, processingCount: 0, failedCount: 0 });
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [taskData, settingData] = await Promise.all([
        adminService.getTasks(),
        aiService.getSettings(),
      ]);
      const sorted = (taskData?.tasks ?? []).sort((a, b) => {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setTasks(sorted);
      setSummary(taskData?.summary ?? { pendingCount: 0, processingCount: 0, failedCount: 0 });
      setSettings(settingData);
    } catch (err) {
      console.error('AI 모니터링 데이터 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: '작업 유형', render: (task) => TYPE_LABEL[task.type] ?? task.type },
    {
      header: '상태',
      render: (task) => {
        const map = { COMPLETED: '완료', FAILED: '실패', PENDING: '대기', PROCESSING: '처리 중' };
        return (
          <span className={`status-badge ${task.status?.toLowerCase()}`}>
            {map[task.status] ?? task.status}
          </span>
        );
      },
    },
    { header: '실행 일시',  render: (task) => new Date(task.createdAt).toLocaleString('ko-KR') },
    {
      header: '실패 원인',
      render: (task) => task.failReason ? <span className="fail-reason">{task.failReason}</span> : '—',
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">AI 서비스 모니터링</h1>
        <div className="ai-status-indicator">
          <span className={`status-dot ${settings.useMock ? 'mock' : 'real'}`}></span>
          <span className="status-text">{settings.useMock ? 'Mock API 사용 중' : 'Real API 사용 중'}</span>
        </div>
      </div>

      <div className="ai-config-grid">
        <div className="config-card">
          <h3>서비스 구성</h3>
          <div className="config-item">
            <span className="label">모델명:</span>
            <span className="value">{settings.modelName}</span>
          </div>
          <div className="config-item">
            <span className="label">Base URL:</span>
            <span className="value">{settings.baseUrl}</span>
          </div>
          <div className="config-item">
            <span className="label">기본 문제 수:</span>
            <span className="value">{settings.defaultQuizCount}개</span>
          </div>
        </div>

        <div className="ai-usage-stats">
          <AdminStatCard
            title="대기 중 작업"
            value={`${summary.pendingCount}건`}
            icon="hourglass_empty"
            trend={summary.pendingCount > 0 ? -1 : 0}
            subValue="처리 대기 중"
          />
          <AdminStatCard
            title="실패한 작업"
            value={`${summary.failedCount}건`}
            icon="error_outline"
            trend={summary.failedCount > 0 ? -1 : 0}
            subValue="재시도 필요"
          />
        </div>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h3>AI 작업 큐</h3>
          <button className="section-refresh-btn" onClick={loadData}>새로고침</button>
        </div>
        <AdminTable columns={columns} data={tasks} isLoading={isLoading} />
      </div>

      <div className="admin-section prompt-preview">
        <div className="section-header">
          <h3>프롬프트 템플릿 (미리보기)</h3>
        </div>
        <div className="prompt-content">
          <code>
            {`시스템: 당신은 교육 전문가입니다. 다음 텍스트를 분석하여 핵심 토픽을 추출하세요.
사용자: {{document_content}}
형식: JSON { topics: [{ name, description }] }`}
          </code>
        </div>
      </div>
    </div>
  );
};

export default AdminAIMonitor;
