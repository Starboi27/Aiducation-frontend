import React, { useState } from 'react';
import './AdminSettings.css';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';

const AdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [quizSettings, setQuizSettings] = useState({
    defaultCount: 5,
    minCount: 3,
    maxCount: 20,
    forceFiveOptions: true
  });

  const [notices, setNotices] = useState([
    { id: 1, title: 'v1.4 업데이트 안내', date: '2024-03-20', status: 'published' },
    { id: 2, title: '정기 점검 공지', date: '2024-03-15', status: 'published' },
    { id: 3, title: 'AI 모델 성능 개선 패치', date: '2024-03-10', status: 'draft' },
  ]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">시스템 설정</h1>
        <Button variant="primary">설정 저장</Button>
      </div>

      <div className="settings-grid">
        <div className="settings-section">
          <h3>일반 설정</h3>
          <div className="setting-control">
            <div className="setting-info">
              <span className="setting-label">유지보수 모드</span>
              <span className="setting-desc">활성화 시 사용자 접근이 제한됩니다.</span>
            </div>
            <div className={`toggle-switch ${maintenanceMode ? 'on' : 'off'}`} onClick={() => setMaintenanceMode(!maintenanceMode)}>
              <div className="toggle-handle"></div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>퀴즈 생성 규칙</h3>
          <div className="setting-field">
            <label>기본 문제 수</label>
            <Input 
              type="number" 
              value={quizSettings.defaultCount} 
              onChange={(e) => setQuizSettings({...quizSettings, defaultCount: parseInt(e.target.value)})}
            />
          </div>
          <div className="setting-control">
            <div className="setting-info">
              <span className="setting-label">5지선다형 강제</span>
              <span className="setting-desc">모든 퀴즈를 반드시 5지선다형으로 생성합니다.</span>
            </div>
            <div className={`toggle-switch ${quizSettings.forceFiveOptions ? 'on' : 'off'}`} onClick={() => setQuizSettings({...quizSettings, forceFiveOptions: !quizSettings.forceFiveOptions})}>
              <div className="toggle-handle"></div>
            </div>
          </div>
        </div>

        <div className="settings-section notice-management">
          <div className="section-header">
            <h3>공지사항 관리</h3>
            <Button variant="outline" size="small">새 공지 등록</Button>
          </div>
          <div className="notice-list">
            {notices.map(notice => (
              <div key={notice.id} className="notice-item">
                <div className="notice-info">
                  <span className="notice-title">{notice.title}</span>
                  <span className="notice-date">{notice.date}</span>
                </div>
                <div className="notice-actions">
                  <span className={`status-badge ${notice.status}`}>{notice.status === 'published' ? '게시됨' : '초안'}</span>
                  <Button variant="outline" size="small">수정</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
