import React, { useState, useEffect, useMemo } from 'react';
import { Target, BrainCircuit, Activity, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, StatCard, ExpCard, NotificationItem } from '../../components/molecules';
import { Button, Badge } from '../../components/atoms';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { reviewService } from '../../services/reviewService';
import { calcWeaknessScores, normalizeWeakTypes } from '../../utils/weaknessEMA';
import './Dashboard.css';

const Dashboard = () => {
  const { user, notifications, wrongAnswers } = useApp();
  const [dashboardData, setDashboardData] = useState(null);
  const [incorrectData, setIncorrectData] = useState(null);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);
  const [todayReviews, setTodayReviews] = useState([]);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [data, reviewsRes, incorrectRes] = await Promise.all([
          userService.getDashboard(),
          reviewService.getTodayReviews().catch(() => null),
          userService.getIncorrects().catch(() => null),
        ]);
        setDashboardData(data);
        setIncorrectData(incorrectRes);
        if (reviewsRes) {
          if (Array.isArray(reviewsRes.reviews)) {
            setTodayReviews(reviewsRes.reviews);
            setReviewsTotalCount(reviewsRes.totalCount ?? 0);
          } else if (Array.isArray(reviewsRes)) {
            setTodayReviews(reviewsRes);
            setReviewsTotalCount(reviewsRes.length);
          } else {
            setTodayReviews([]);
            setReviewsTotalCount(0);
          }
        } else {
          setTodayReviews([]);
          setReviewsTotalCount(0);
        }
      } catch (error) {
        console.error('대시보드 데이터를 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // 취약 유형 차트 — early return 전에 선언 (Hook 규칙)
  const CHART_HEIGHT_PX = 180;
  const weakChartData = useMemo(() => {
    if (wrongAnswers.length > 0) return calcWeaknessScores(wrongAnswers);
    if (dashboardData?.weakTypes?.length > 0) return normalizeWeakTypes(dashboardData.weakTypes);
    return [];
  }, [wrongAnswers, dashboardData]);

  if (isLoading) {
    return (
      <div className="dashboard__loading">
        <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
        <p>대시보드 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  // API 데이터 매핑 (없을 경우 폴백)
  const toPercent = (val) => {
    if (val === undefined || val === null) return 0;
    return val <= 1 ? Math.round(val * 100) : Math.round(val);
  };

  const stats = {
    weeklyRate: toPercent(dashboardData?.weeklyStats?.thisWeekRate ?? (user.totalSolved ? user.accuracy : 0)),
    changeRate: toPercent(dashboardData?.weeklyStats?.changeRate ?? 0),
    solvedCount: dashboardData?.solvedCount ?? user.totalSolved ?? 0,
    correctRate: toPercent(dashboardData?.correctRate ?? user.accuracy ?? 0),
    growth: dashboardData?.growthIndicator ?? {
      level: user.level ?? 1,
      exp: user.totalExp ?? 0,
      totalExp: user.totalExp ?? 0,
      nextLevelExp: user.nextLevelExp ?? 1000,
    },
    totalCount: incorrectData?.totalCount ?? user.totalSolved ?? 0,
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
          label="이번주 정답률"
          value={`${stats.weeklyRate}%`}
          delta={`${Math.abs(stats.changeRate)}%`}
          deltaType={stats.changeRate >= 0 ? 'up' : 'down'}
          color="success"
          description="이번주 정답률 통계"
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
              {weakChartData.length > 0 ? (
                weakChartData.map((item, idx) => {
                  const barPx = Math.max(16, ((item.relativeRate || 0) / 100) * CHART_HEIGHT_PX);
                  const colors = ['danger', 'warning', 'primary', 'info', 'success'];
                  return (
                    <div
                      key={item.topic}
                      className="chart-bar"
                      style={{
                        height: `${barPx}px`,
                        '--c': `var(--color-${colors[idx % colors.length]})`,
                        '--delay': `${idx * 150}ms`,
                      }}
                    >
                      <span className="chart-bar__tooltip">
                        {item.topic}<br />
                        총 {item.totalWrong}회 오답 · 위험도 {item.relativeRate}%
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="no-data">아직 분석할 데이터가 부족합니다.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="dashboard__col-right">
          {todayReviews.length > 0 && (
            <Card
              title="오늘의 복습 알람"
              headerAction={<Badge variant="warning">{todayReviews.length}</Badge>}
            >
              <div className="dashboard__reviews">
                {(isReviewsExpanded ? todayReviews : todayReviews.slice(0, 3)).map((r) => {
                  const concept = r.conceptName || (r.question && r.question.length > 30 ? r.question.substring(0, 30) + '...' : r.question) || '오답 복습';
                  const subject = r.subjectName || '오답 복습';
                  const count = r.quizCount ?? 1;
                  return (
                    <div key={r.scheduleId} className="dashboard__review-item" onClick={() => navigate('/review')} style={{ cursor: 'pointer' }}>
                      <div className="dashboard__review-info">
                        <p className="dashboard__review-concept">{concept}</p>
                        <p className="dashboard__review-subject">
                          {subject} · <Badge variant="default" size="sm">{count}문제</Badge>
                        </p>
                      </div>
                      <Badge variant="primary">복습</Badge>
                    </div>
                  );
                })}
                {todayReviews.length > 3 && (
                  <button 
                    className="dashboard__reviews-toggle" 
                    onClick={() => setIsReviewsExpanded(!isReviewsExpanded)}
                  >
                    {isReviewsExpanded ? '접기 ▲' : `더 보기 (+${todayReviews.length - 3}개) ▼`}
                  </button>
                )}
              </div>
            </Card>
          )}

          <Card
            title="최근 알림"
            headerAction={<Badge variant="primary">{dashboardData?.unreadNotificationCount ?? notifications.length}</Badge>}
          >
            <div className="dashboard__notifs">
              {(() => {
                const apiNotifs = dashboardData?.recentNotifications;
                const list = apiNotifs?.length > 0 ? apiNotifs : notifications;
                if (!list.length) return <p className="no-data">새로운 알림이 없습니다.</p>;
                return list.map(n => (
                  <NotificationItem
                    key={n.id || n.createdAt}
                    type={n.type?.toLowerCase() || 'info'}
                    title={n.title || n.message}
                    message={n.title ? n.message : undefined}
                    time={n.time || (n.createdAt ? new Date(n.createdAt).toLocaleString('ko-KR') : '')}
                    read={n.read ?? false}
                  />
                ));
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
