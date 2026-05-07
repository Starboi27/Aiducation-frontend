import React, { useState, useEffect } from 'react';
import { Target, Star, BrainCircuit, Activity, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, StatCard, ExpCard, NotificationItem } from '../../components/molecules';
import { Button, Badge } from '../../components/atoms';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import './Dashboard.css';

const Dashboard = () => {
  const { user, notifications } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await userService.getDashboard();
        setDashboardData(data);
      } catch (error) {
        console.error('대시보드 데이터를 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard__loading">
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
        <p>대시보드 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  // API 데이터 매핑 (없을 경우 폴백)
  const stats = {
    weeklyRate: dashboardData?.weeklyStats?.thisWeekRate ?? 0,
    changeRate: dashboardData?.weeklyStats?.changeRate ?? 0,
    solvedCount: dashboardData?.solvedCount ?? 0,
    correctRate: dashboardData?.correctRate ?? user.accuracy ?? 0,
    growth: dashboardData?.growthIndicator ?? {
      level: user.level,
      exp: user.exp,
      totalExp: user.totalExp,
      nextLevelExp: user.nextLevelExp || 3000
    }
  };

  return (
    <div className="dashboard animate-fade-in">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            환영합니다, <span className="gradient-text">{dashboardData?.userName || user.name}</span>님! 🚀
          </h1>
          <p className="dashboard__subtitle">오늘도 새로운 지식을 쌓아볼까요?</p>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="dashboard__stats-grid">
        <StatCard
          icon={Target}
          label="이번 주 정답률"
          value={`${stats.weeklyRate}%`}
          delta={`${Math.abs(stats.changeRate)}%`}
          deltaType={stats.changeRate >= 0 ? 'up' : 'down'}
          color="success"
          description="지난주 대비 정답률 변화"
        />
        <StatCard
          icon={BrainCircuit}
          label="총 푼 문제 수"
          value={stats.solvedCount.toLocaleString()}
          color="primary"
          description="지금까지 도전한 총 문제 수"
        />
        <StatCard
          icon={Activity}
          label="평균 정답률"
          value={`${stats.correctRate}%`}
          color="warning"
          description="전체 기간 평균 학습 성과"
        />
      </section>

      {/* Main Content */}
      <div className="dashboard__main-grid">
        <div className="dashboard__col-left">
          <Card
            title="나의 성장 지표"
            subtitle="경험치 및 등급"
            variant="glass"
            padding="lg"
            glow
          >
            <ExpCard 
              exp={stats.growth.exp} 
              totalExp={stats.growth.totalExp} 
              level={stats.growth.level} 
              nextLevelExp={stats.growth.nextLevelExp}
            />
          </Card>

          <Card
            title="취약 유형 분석"
            subtitle="가장 많이 틀린 개념"
            headerAction={<Button variant="ghost" size="sm" onClick={() => navigate('/report')}>상세 리포트</Button>}
          >
            <div className="dashboard__chart-mock">
              {dashboardData?.weakTypes?.length > 0 ? (
                dashboardData.weakTypes.map((type, idx) => (
                  <div 
                    key={type.subjectName} 
                    className="chart-bar" 
                    style={{ 
                      '--end-height': `${type.incorrectRate}%`, 
                      '--c': `var(--color-${['danger', 'warning', 'primary', 'info', 'success'][idx % 5]})`, 
                      '--delay': `${idx * 150}ms` 
                    }} 
                    title={type.subjectName}
                  >
                    <span className="chart-bar__tooltip">{type.subjectName}: {type.incorrectRate}%</span>
                  </div>
                ))
              ) : (
                <p className="no-data">아직 분석할 데이터가 부족합니다.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="dashboard__col-right">
          <Card
            title="최근 알림"
            headerAction={<Badge variant="primary">{dashboardData?.unreadNotificationCount ?? notifications.length}</Badge>}
          >
            <div className="dashboard__notifs">
              {(dashboardData?.recentNotifications || notifications).map(n => (
                <NotificationItem key={n.id || n.createdAt} {...n} />
              ))}
              {(!dashboardData?.recentNotifications?.length && !notifications.length) && (
                <p className="no-data">새로운 알림이 없습니다.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
