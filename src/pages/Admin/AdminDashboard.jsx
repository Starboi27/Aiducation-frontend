import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import AdminStatCard from '../../components/molecules/AdminStatCard/AdminStatCard';
import { adminService } from '../../services/adminService';

const AdminDashboard = () => {
  const [stats, setStats] = useState([
    { title: '총 가입 사용자',   value: '—',     subValue: '로딩 중', icon: 'people',      trend: 0 },
    { title: '업로드 학습 자료', value: '—',     subValue: '로딩 중', icon: 'description', trend: 0 },
    { title: '생성된 퀴즈',      value: '—',     subValue: '로딩 중', icon: 'quiz',        trend: 0 },
    { title: '평균 정답률',      value: '—',     subValue: '로딩 중', icon: 'analytics',   trend: 0 },
  ]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const [report, users, contents, taskData] = await Promise.all([
        adminService.getReport(),
        adminService.getUsers(),
        adminService.getContents(),
        adminService.getTasks(),
      ]);

      const accuracyRate = report?.quizAccuracy?.accuracyRate ?? 0;
      const totalQuizzes = report?.quizAccuracy?.totalSubmissions ?? 0;

      setStats([
        {
          title: '총 가입 사용자',
          value: `${(users?.totalCount ?? 0).toLocaleString()}명`,
          subValue: '전체 회원',
          icon: 'people',
          trend: 1,
        },
        {
          title: '업로드 학습 자료',
          value: `${(contents?.totalCount ?? 0).toLocaleString()}개`,
          subValue: '파일 및 개념',
          icon: 'description',
          trend: 1,
        },
        {
          title: '총 퀴즈 제출',
          value: `${totalQuizzes.toLocaleString()}회`,
          subValue: '누적 제출 수',
          icon: 'quiz',
          trend: 1,
        },
        {
          title: '평균 정답률',
          value: `${Number(accuracyRate).toFixed(1)}%`,
          subValue: '전체 유저 기준',
          icon: 'analytics',
          trend: accuracyRate >= 70 ? 1 : -1,
        },
      ]);

      setRecentTasks(
        (taskData?.tasks ?? [])
          .sort((a, b) => {
            if (!a.createdAt && !b.createdAt) return 0;
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt) - new Date(a.createdAt);
          })
          .slice(0, 5)
      );
    } catch (err) {
      console.error('관리자 대시보드 로드 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const STATUS_LABEL = {
    COMPLETED:  { label: '완료',    cls: 'success' },
    FAILED:     { label: '실패',    cls: 'error'   },
    PENDING:    { label: '대기',    cls: 'pending' },
    PROCESSING: { label: '처리 중', cls: 'info'    },
  };

  const TYPE_LABEL = {
    FILE_PIPELINE:       'PDF 분석',
    QUIZ_GENERATION:     '퀴즈 생성',
    CONCEPTS_EXTRACTION: '개념 추출',
  };

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
        <div className="admin-recent-section">
          <div className="section-header">
            <h3>최근 AI 작업 로그</h3>
          </div>
          <div className="log-list">
            {isLoading ? (
              <div className="log-item">로딩 중...</div>
            ) : recentTasks.length === 0 ? (
              <div className="log-item">작업 내역이 없습니다.</div>
            ) : (
              recentTasks.map((task) => {
                const s = STATUS_LABEL[task.status] ?? { label: task.status, cls: '' };
                return (
                  <div key={task.taskId} className={`log-item ${s.cls}`}>
                    <span className="log-time">
                      {new Date(task.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="log-msg">
                      {TYPE_LABEL[task.type] ?? task.type} — {s.label}
                      {task.failReason ? ` (${task.failReason})` : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
