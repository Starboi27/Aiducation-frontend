import React, { useState, useMemo } from "react";
import {
  User,
  Trophy,
  Target,
  Clock,
  Zap,
  Flame,
  BookOpen,
  Camera,
  Award,
  Star,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Brain,
  Upload,
  BarChart3,
  Pencil,
  Save,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Avatar, Badge, ProgressBar, Button } from "../../components/atoms";
import { Card, ExpCard, StreakDisplay } from "../../components/molecules";
import { getRank } from "../../components/molecules/ExpCard/ExpCard";
import { useNavigate } from "react-router-dom";
import "./MyPage.css";

// ── 업적 정의 ──
const ACHIEVEMENTS = [
  {
    id: "first_quiz",
    icon: Brain,
    label: "첫 퀴즈",
    desc: "첫 번째 퀴즈를 완료했습니다",
    condition: (u) => (u.totalSolved || 0) >= 1,
  },
  {
    id: "quiz_10",
    icon: BookOpen,
    label: "문제 사냥꾼",
    desc: "10개 이상의 문제를 풀었습니다",
    condition: (u) => (u.totalSolved || 0) >= 10,
  },
  {
    id: "quiz_50",
    icon: Target,
    label: "퀴즈 마스터",
    desc: "50개 이상의 문제를 풀었습니다",
    condition: (u) => (u.totalSolved || 0) >= 50,
  },
  {
    id: "quiz_100",
    icon: Trophy,
    label: "백전백승",
    desc: "100개 이상의 문제를 풀었습니다",
    condition: (u) => (u.totalSolved || 0) >= 100,
  },
  {
    id: "accuracy_80",
    icon: CheckCircle2,
    label: "정밀 사격",
    desc: "정답률 80% 이상을 달성했습니다",
    condition: (u) => u.accuracy >= 80,
  },
  {
    id: "accuracy_95",
    icon: Star,
    label: "완벽주의자",
    desc: "정답률 95% 이상을 달성했습니다",
    condition: (u) => u.accuracy >= 95,
  },
  {
    id: "streak_3",
    icon: Flame,
    label: "불꽃 시작",
    desc: "3일 연속 학습을 달성했습니다",
    condition: (u) => (u.maxStreak || u.streak || 0) >= 3,
  },
  {
    id: "streak_7",
    icon: Flame,
    label: "일주일 불꽃",
    desc: "7일 연속 학습을 달성했습니다",
    condition: (u) => (u.maxStreak || u.streak || 0) >= 7,
  },
  {
    id: "streak_30",
    icon: Flame,
    label: "한 달 불꽃",
    desc: "30일 연속 학습을 달성했습니다",
    condition: (u) => (u.maxStreak || u.streak || 0) >= 30,
  },
  {
    id: "xp_1000",
    icon: Zap,
    label: "Silver 달성",
    desc: "1,000 XP를 달성했습니다",
    condition: (u) => u.totalExp >= 1000,
  },
  {
    id: "xp_3000",
    icon: Zap,
    label: "Gold 달성",
    desc: "3,000 XP를 달성했습니다",
    condition: (u) => u.totalExp >= 3000,
  },
  {
    id: "upload_first",
    icon: Upload,
    label: "첫 업로드",
    desc: "첫 오답 이미지를 업로드했습니다",
    condition: (u) => (u.uploadCount || 0) >= 1,
  },
];

// ── 주간 히트맵 mock 데이터 생성 ──
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 83; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const intensity = Math.random();
    let level = 0;
    if (intensity > 0.8) level = 4;
    else if (intensity > 0.6) level = 3;
    else if (intensity > 0.35) level = 2;
    else if (intensity > 0.15) level = 1;
    data.push({
      date: date.toISOString().split("T")[0],
      day: date.getDay(),
      level,
    });
  }
  return data;
};

// ── 최근 퀴즈 기록 mock ──
const RECENT_QUIZZES = [
  {
    id: 1,
    subject: "알고리즘",
    topic: "정렬",
    score: 8,
    total: 10,
    date: "오늘",
    color: "var(--color-primary)",
  },
  {
    id: 2,
    subject: "운영체제",
    topic: "프로세스",
    score: 6,
    total: 10,
    date: "어제",
    color: "var(--color-warning)",
  },
  {
    id: 3,
    subject: "데이터베이스",
    topic: "SQL",
    score: 9,
    total: 10,
    date: "2일 전",
    color: "var(--color-success)",
  },
  {
    id: 4,
    subject: "네트워크",
    topic: "TCP/IP",
    score: 7,
    total: 10,
    date: "3일 전",
    color: "var(--color-info)",
  },
];

const MyPage = () => {
  const { user, subjects, wrongAnswers, dailyGoal, updateDailyGoal } = useApp();
  const navigate = useNavigate();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(dailyGoal);
  const dailyProgress = 42; // 오늘 학습한 시간 (분) - mock

  const rank = getRank(user.totalExp);
  const heatmapData = useMemo(() => generateHeatmapData(), []);

  const unlockedAchievements = ACHIEVEMENTS.filter((a) => a.condition(user));
  const lockedAchievements = ACHIEVEMENTS.filter((a) => !a.condition(user));
  const goalPercent = Math.min(
    100,
    Math.round((dailyProgress / dailyGoal.studyTime) * 100),
  );

  const handleGoalSave = () => {
    updateDailyGoal(goalDraft);
    setIsEditingGoal(false);
  };

  const handleGoalCancel = () => {
    setGoalDraft(dailyGoal);
    setIsEditingGoal(false);
  };

  const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="mypage animate-fade-in">
      {/* ── 프로필 히어로 ── */}
      <section className="mypage__hero">
        <div className="mypage__hero-bg" />
        <div className="mypage__hero-content">
          <div className="mypage__avatar-wrap">
            <Avatar name={user.name} size="xl" level={user.level} />
          </div>
          <div className="mypage__hero-info">
            <div className="mypage__name-row">
              <h1 className="mypage__name">{user.name}</h1>
              <Badge variant={rank.badge} size="md" glow>
                {rank.name}
              </Badge>
            </div>
            <p className="mypage__level">Lv. {user.level}</p>
            <div className="mypage__hero-meta">
              <span className="mypage__meta-item">
                <Zap size={14} /> {user.totalExp?.toLocaleString()} XP
              </span>
              <span className="mypage__meta-item">
                <Flame size={14} /> {user.streak}일 연속 학습
              </span>
              <span className="mypage__meta-item">
                <Calendar size={14} /> 가입 30일째
              </span>
            </div>
          </div>
          <div className="mypage__hero-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/report")}
            >
              <BarChart3 size={16} /> 분석 리포트
            </Button>
          </div>
        </div>
      </section>

      {/* ── 핵심 스탯 ── */}
      <section className="mypage__stats-grid">
        <div className="mypage__stat-card">
          <div
            className="mypage__stat-icon"
            style={{ "--stat-color": "var(--color-primary)" }}
          >
            <Brain size={22} />
          </div>
          <div className="mypage__stat-info">
            <span className="mypage__stat-value">
              {(user.totalSolved || 0).toLocaleString()}
            </span>
            <span className="mypage__stat-label">푼 문제 수</span>
          </div>
        </div>
        <div className="mypage__stat-card">
          <div
            className="mypage__stat-icon"
            style={{ "--stat-color": "var(--color-success)" }}
          >
            <Target size={22} />
          </div>
          <div className="mypage__stat-info">
            <span className="mypage__stat-value">{user.accuracy}%</span>
            <span className="mypage__stat-label">정답률</span>
          </div>
        </div>
        <div className="mypage__stat-card">
          <div
            className="mypage__stat-icon"
            style={{ "--stat-color": "var(--color-warning)" }}
          >
            <BookOpen size={22} />
          </div>
          <div className="mypage__stat-info">
            <span className="mypage__stat-value">{wrongAnswers.length}</span>
            <span className="mypage__stat-label">오답 노트</span>
          </div>
        </div>
        <div className="mypage__stat-card">
          <div
            className="mypage__stat-icon"
            style={{ "--stat-color": "var(--color-accent)" }}
          >
            <Clock size={22} />
          </div>
          <div className="mypage__stat-info">
            <span className="mypage__stat-value">12.5h</span>
            <span className="mypage__stat-label">총 학습 시간</span>
          </div>
        </div>
      </section>

      {/* ── 메인 그리드 ── */}
      <div className="mypage__main-grid">
        {/* 좌측 컬럼 */}
        <div className="mypage__col-left">
          {/* XP & 등급 */}
          <Card
            title="경험치 & 등급"
            subtitle="학습할수록 성장합니다"
            variant="glass"
            padding="lg"
            glow
          >
            <ExpCard
              exp={user.exp}
              totalExp={user.totalExp}
              level={user.level}
            />
          </Card>

          {/* 학습 활동 히트맵 */}
          <Card title="학습 활동" subtitle="최근 12주간 학습 기록">
            <div className="mypage__heatmap">
              <div className="mypage__heatmap-days">
                {["", "월", "", "수", "", "금", ""].map((d, i) => (
                  <span key={i} className="mypage__heatmap-day-label">
                    {d}
                  </span>
                ))}
              </div>
              <div className="mypage__heatmap-grid">
                {heatmapData.map((d, i) => (
                  <div
                    key={i}
                    className={`mypage__heatmap-cell mypage__heatmap-cell--${d.level}`}
                    title={`${d.date} — ${DAY_LABELS[d.day]}`}
                  />
                ))}
              </div>
              <div className="mypage__heatmap-legend">
                <span className="mypage__heatmap-legend-text">적음</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <div
                    key={l}
                    className={`mypage__heatmap-cell mypage__heatmap-cell--${l}`}
                  />
                ))}
                <span className="mypage__heatmap-legend-text">많음</span>
              </div>
            </div>
          </Card>

          {/* 업적 */}
          <Card
            title="업적"
            subtitle={`${unlockedAchievements.length}/${ACHIEVEMENTS.length} 달성`}
            headerAction={
              <Badge variant="primary" size="sm">
                {Math.round(
                  (unlockedAchievements.length / ACHIEVEMENTS.length) * 100,
                )}
                %
              </Badge>
            }
          >
            <div className="mypage__achievements">
              {unlockedAchievements.map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.id}
                    className="mypage__achievement mypage__achievement--unlocked"
                  >
                    <div className="mypage__achievement-icon">
                      <Icon size={20} />
                    </div>
                    <div className="mypage__achievement-info">
                      <span className="mypage__achievement-label">
                        {a.label}
                      </span>
                      <span className="mypage__achievement-desc">{a.desc}</span>
                    </div>
                    <CheckCircle2
                      size={16}
                      className="mypage__achievement-check"
                    />
                  </div>
                );
              })}
              {lockedAchievements.slice(0, 3).map((a) => {
                const Icon = a.icon;
                return (
                  <div
                    key={a.id}
                    className="mypage__achievement mypage__achievement--locked"
                  >
                    <div className="mypage__achievement-icon">
                      <Icon size={20} />
                    </div>
                    <div className="mypage__achievement-info">
                      <span className="mypage__achievement-label">
                        {a.label}
                      </span>
                      <span className="mypage__achievement-desc">{a.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* 우측 컬럼 */}
        <div className="mypage__col-right">
          {/* 오늘의 목표 */}
          <Card
            title="오늘의 목표"
            variant="glass"
            headerAction={
              !isEditingGoal ? (
                <button
                  className="mypage__goal-edit-btn"
                  onClick={() => {
                    setGoalDraft(dailyGoal);
                    setIsEditingGoal(true);
                  }}
                >
                  <Pencil size={14} />
                </button>
              ) : null
            }
          >
            <div className="mypage__goal">
              <div className="mypage__goal-ring">
                <svg viewBox="0 0 120 120" className="mypage__goal-svg">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="mypage__goal-track"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="mypage__goal-progress"
                    style={{ "--goal-percent": goalPercent }}
                  />
                </svg>
                <div className="mypage__goal-center">
                  <span className="mypage__goal-percent">{goalPercent}%</span>
                  <span className="mypage__goal-sub">달성</span>
                </div>
              </div>
              <div className="mypage__goal-details">
                {isEditingGoal ? (
                  <>
                    <div className="mypage__goal-row">
                      <Clock size={14} />
                      <span>학습 시간</span>
                      <div className="mypage__goal-input-wrap">
                        <input
                          type="number"
                          min="1"
                          max="480"
                          className="mypage__goal-input"
                          value={goalDraft.studyTime}
                          onChange={(e) =>
                            setGoalDraft((prev) => ({
                              ...prev,
                              studyTime: Number(e.target.value) || 1,
                            }))
                          }
                        />
                        <span>분</span>
                      </div>
                    </div>
                    <div className="mypage__goal-row">
                      <Brain size={14} />
                      <span>문제 풀기</span>
                      <div className="mypage__goal-input-wrap">
                        <input
                          type="number"
                          min="1"
                          max="200"
                          className="mypage__goal-input"
                          value={goalDraft.quizCount}
                          onChange={(e) =>
                            setGoalDraft((prev) => ({
                              ...prev,
                              quizCount: Number(e.target.value) || 1,
                            }))
                          }
                        />
                        <span>문제</span>
                      </div>
                    </div>
                    <div className="mypage__goal-row">
                      <BookOpen size={14} />
                      <span>오답 복습</span>
                      <div className="mypage__goal-input-wrap">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="mypage__goal-input"
                          value={goalDraft.reviewCount}
                          onChange={(e) =>
                            setGoalDraft((prev) => ({
                              ...prev,
                              reviewCount: Number(e.target.value) || 1,
                            }))
                          }
                        />
                        <span>문제</span>
                      </div>
                    </div>
                    <div className="mypage__goal-actions">
                      <button
                        className="mypage__goal-save-btn"
                        onClick={handleGoalSave}
                      >
                        <Save size={14} /> 저장
                      </button>
                      <button
                        className="mypage__goal-cancel-btn"
                        onClick={handleGoalCancel}
                      >
                        취소
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mypage__goal-row">
                      <Clock size={14} />
                      <span>학습 시간</span>
                      <strong>
                        {dailyProgress}분 / {dailyGoal.studyTime}분
                      </strong>
                    </div>
                    <div className="mypage__goal-row">
                      <Brain size={14} />
                      <span>문제 풀기</span>
                      <strong>8 / {dailyGoal.quizCount}문제</strong>
                    </div>
                    <div className="mypage__goal-row">
                      <BookOpen size={14} />
                      <span>오답 복습</span>
                      <strong>3 / {dailyGoal.reviewCount}문제</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* 스트릭 */}
          <Card title="학습 스트릭">
            <StreakDisplay streak={user.streak} maxStreak={user.maxStreak} />
          </Card>

          {/* 최근 퀴즈 기록 */}
          <Card
            title="최근 퀴즈"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/review")}
              >
                전체 보기
              </Button>
            }
          >
            <div className="mypage__quiz-history">
              {RECENT_QUIZZES.map((q) => (
                <div key={q.id} className="mypage__quiz-item">
                  <div
                    className="mypage__quiz-color"
                    style={{ background: q.color }}
                  />
                  <div className="mypage__quiz-info">
                    <span className="mypage__quiz-subject">{q.subject}</span>
                    <span className="mypage__quiz-topic">{q.topic}</span>
                  </div>
                  <div className="mypage__quiz-score">
                    <span className="mypage__quiz-score-value">
                      {q.score}/{q.total}
                    </span>
                    <span className="mypage__quiz-date">{q.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 빠른 실행 */}
          <Card title="빠른 실행">
            <div className="mypage__quick-actions">
              <button
                className="mypage__quick-btn"
                onClick={() => navigate("/upload")}
              >
                <Upload size={18} />
                <span>오답 스캔</span>
              </button>
              <button
                className="mypage__quick-btn"
                onClick={() => navigate("/quiz")}
              >
                <Brain size={18} />
                <span>퀴즈 풀기</span>
              </button>
              <button
                className="mypage__quick-btn"
                onClick={() => navigate("/review")}
              >
                <BookOpen size={18} />
                <span>오답 복습</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
