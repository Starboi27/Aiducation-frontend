import React, { useState, useEffect } from 'react';
import './AdminAIMonitor.css';
import AdminTable from '../../components/organisms/AdminTable/AdminTable';
import AdminStatCard from '../../components/molecules/AdminStatCard/AdminStatCard';
import { aiService } from '../../services/aiService';

const AdminAIMonitor = () => {
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [logData, settingData] = await Promise.all([
        aiService.getAILogs(),
        aiService.getSettings()
      ]);
      setLogs(logData);
      setSettings(settingData);
    } catch (error) {
      console.error('AI 모니터링 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: '서비스명', accessor: 'service' },
    { header: '사용자', accessor: 'user' },
    { 
      header: '상태', 
      render: (log) => (
        <span className={`status-badge ${log.status}`}>
          {log.status === 'success' ? '성공' : '실패'}
        </span>
      )
    },
    { header: '소요 시간', accessor: 'duration' },
    { header: '사용 토큰', accessor: 'tokens' },
    { header: '실행 일시', render: (log) => new Date(log.createdAt).toLocaleString() },
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
          <AdminStatCard title="오늘의 총 호출" value="124회" icon="smart_toy" trend={1} subValue="15% 증가" />
          <AdminStatCard title="평균 응답 속도" value="1.8s" icon="speed" trend={-1} subValue="0.2s 단축" />
        </div>
      </div>

      <div className="admin-section">
        <div className="section-header">
          <h3>최근 실행 로그</h3>
        </div>
        <AdminTable columns={columns} data={logs} isLoading={isLoading} />
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
