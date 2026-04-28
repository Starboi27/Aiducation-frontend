import React from 'react';
import './AdminDashboard.css';
import AdminStatCard from '../../components/molecules/AdminStatCard/AdminStatCard';

const AdminDashboard = () => {
  // 실제 환경에서는 useEffect 등으로 서버에서 데이터를 받아옵니다.
  const stats = [
    { title: '총 가입 사용자', value: '1,284명', subValue: '12명 증가', icon: 'people', trend: 1 },
    { title: '업로드 학습 자료', value: '3,452개', subValue: '45개 신규', icon: 'description', trend: 1 },
    { title: '생성된 퀴즈', value: '15,820문항', subValue: '120문항 생성', icon: 'quiz', trend: 1 },
    { title: '평균 정답률', value: '72.5%', subValue: '1.2% 하락', icon: 'analytics', trend: -1 },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h1 className="admin-page-title">대시보드</h1>
        <p className="admin-page-subtitle">서비스 운영 현황 및 주요 지표를 확인하세요.</p>
      </div>

      <div className="admin-stats-grid">
        {stats.map((stat, index) => (
          <AdminStatCard key={index} {...stat} />
        ))}
      </div>

      <div className="admin-dashboard-main-grid">
        <div className="admin-chart-section">
          <div className="section-header">
            <h3>일별 퀴즈 생성 트렌드</h3>
          </div>
          <div className="chart-placeholder">
            {/* Recharts 등이 도입되면 여기에 차트를 그립니다. */}
            <div className="placeholder-content">
              <span>차트 데이터 로딩 중...</span>
            </div>
          </div>
        </div>

        <div className="admin-recent-section">
          <div className="section-header">
            <h3>최근 AI 분석 로그</h3>
          </div>
          <div className="log-list">
            <div className="log-item success">
              <span className="log-time">10:24:12</span>
              <span className="log-msg">PDF 분석 성공 (2.4MB)</span>
            </div>
            <div className="log-item success">
              <span className="log-time">10:21:05</span>
              <span className="log-msg">퀴즈 15문항 생성 완료</span>
            </div>
            <div className="log-item error">
              <span className="log-time">10:15:30</span>
              <span className="log-msg">Gemini API 응답 지연 (Timeout)</span>
            </div>
            <div className="log-item success">
              <span className="log-time">09:58:44</span>
              <span className="log-msg">새 사용자 가입: test@example.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
