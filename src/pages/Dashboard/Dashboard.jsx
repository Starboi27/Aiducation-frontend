import React from 'react';
import { Target, Star, BrainCircuit, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card, StatCard, ExpCard, NotificationItem } from '../../components/molecules';
import { Button, Badge } from '../../components/atoms';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, notifications } = useApp();
  const navigate = useNavigate();

  return (
    <div className="dashboard animate-fade-in">
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">
            환영합니다, <span className="gradient-text">{user.name}</span>님! 🚀
          </h1>
          <p className="dashboard__subtitle">오늘도 새로운 지식을 쌓아볼까요?</p>
        </div>
      </header>

      {/* Hero Stats */}
      <section className="dashboard__stats-grid">
        <StatCard
          icon={Target}
          label="이번 주 달성률"
          value="85%"
          delta="15%"
          deltaType="up"
          color="success"
          description="지난주 대비 학습량이 증가했습니다."
        />
        <StatCard
          icon={BrainCircuit}
          label="푼 문제 수"
          value="1,240"
          delta="42"
          deltaType="up"
          color="primary"
          description="최근 7일간 푼 문제"
        />
        <StatCard
          icon={Activity}
          label="정답률"
          value={`${user.accuracy}%`}
          delta="2.5%"
          deltaType="up"
          color="warning"
          description="상위 15% 수준입니다."
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
            <ExpCard exp={user.exp} totalExp={user.totalExp} level={user.level} />

          </Card>

          <Card
            title="취약 유형 분석"
            subtitle="가장 많이 틀린 개념"
            headerAction={<Button variant="ghost" size="sm" onClick={() => navigate('/report')}>상세 리포트</Button>}
          >
            <div className="dashboard__chart-mock">
              <div className="chart-bar" style={{ '--end-height': '80%', '--c': 'var(--color-danger)', '--delay': '0ms' }} title="알고리즘">
                <span className="chart-bar__tooltip">80%</span>
              </div>
              <div className="chart-bar" style={{ '--end-height': '60%', '--c': 'var(--color-warning)', '--delay': '150ms' }} title="운영체제">
                <span className="chart-bar__tooltip">60%</span>
              </div>
              <div className="chart-bar" style={{ '--end-height': '30%', '--c': 'var(--color-primary)', '--delay': '300ms' }} title="데이터베이스">
                <span className="chart-bar__tooltip">30%</span>
              </div>
              <div className="chart-bar" style={{ '--end-height': '45%', '--c': 'var(--color-info)', '--delay': '450ms' }} title="네트워크">
                <span className="chart-bar__tooltip">45%</span>
              </div>
              <div className="chart-bar" style={{ '--end-height': '15%', '--c': 'var(--color-success)', '--delay': '600ms' }} title="자료구조">
                <span className="chart-bar__tooltip">15%</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="dashboard__col-right">
          <Card
            title="최근 알림"
            headerAction={<Badge variant="primary">{notifications.length}</Badge>}
          >
            <div className="dashboard__notifs">
              {notifications.map(n => (
                <NotificationItem key={n.id} {...n} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
