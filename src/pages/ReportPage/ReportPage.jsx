import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/molecules';
import { Activity, Target, Brain, TrendingUp, Flame, BookOpen, Award } from 'lucide-react';
import './ReportPage.css';

const ReportPage = () => {
  const { user, wrongAnswers } = useApp();

  // 1. 오답 데이터를 기반으로 "세부 주제(Topic)"별 취약점 통계 추출
  const topicStats = useMemo(() => {
    const stats = {};
    wrongAnswers.forEach(ans => {
      const sId = ans.subjectId || 'unknown';
      const sName = ans.subjectName || '일반 상식';
      const tName = ans.topic || '기본 개념';
      
      // "과목 + 주제"를 고유 키로 삼아서 상세하게 셈
      const key = `${sId}::${tName}`;

      if (!stats[key]) {
        stats[key] = { 
          id: key, 
          subjectName: sName, 
          topicName: tName, 
          wrongCount: 0 
        };
      }
      stats[key].wrongCount += 1; 
    });

    // 오답 수가 많은 주제(Topic) 순으로 정렬
    return Object.values(stats).sort((a, b) => b.wrongCount - a.wrongCount);
  }, [wrongAnswers]);

  // 상위 5개의 취약 세부 주제 추출
  const topTopics = [...topicStats].slice(0, 5);
  
  // 막대가 애니메이션으로 차오르게 하기 위한 지연(딜레이) 스위치
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 1등(최다 오답 주제)의 횟수를 100% 기준점으로 삼습니다.
  const maxWrongCount = topTopics.length > 0 ? topTopics[0].wrongCount : 1;

  // 2. 가장 취약한 세부 주제(Topic)들에 대한 AI 피드백 동적 생성기
  const aiFeedbacks = useMemo(() => {
    if (topTopics.length === 0) return [];
    
    // 가장 많이 틀린 스킬 토픽 상위 4개까지 피드백 제공 (너무 길어지지 않게)
    return topTopics.slice(0, 4).map((topic, idx) => {

      let textColor = 'var(--color-gold)';
      let IconComponent = Target;
      let badgeLabel = '선택 복습 권장';
      let urgencyText = '가벼운 복습과 오답 노트 정독을 추천합니다.';

      if (idx === 0 || idx === 1) { // 1, 2위는 심각한 위험으로 인지
        textColor = '#ff7675';
        IconComponent = Activity;
        badgeLabel = '치명적 약점';
        urgencyText = '가장 시급히 약점을 보완해야 하는 구간입니다. 관련 강의나 교재를 집중적으로 재학습하시길 강력히 권장합니다.';
      }

      return {
        id: topic.id,
        textColor,
        IconComponent,
        badgeLabel,
        title: `[${topic.subjectName}] - '${topic.topicName}'`,
        desc: `최근 데이터상 '${topic.topicName}' 개념에 대해 총 ${topic.wrongCount}회의 잦은 오답이 누적 확인되었습니다. ${urgencyText}`
      };
    });
  }, [topTopics]);

  // 3. 상단에 띄워줄 전체 통계 요약 (Summary)
  // 단 한 문제라도 풀었을 때만 진짜 내 정답률을 보여주고, 안 풀었으면 '- %' 로 표시하여 하드코딩 오해 방지
  const hasPlayedQuiz = user?.totalSolved > 0;
  const displayAccuracy = hasPlayedQuiz ? `${user.accuracy}%` : '0%';

  const summaryStats = [
    { label: '종합 정답률', value: displayAccuracy, icon: TrendingUp, color: 'var(--color-primary)' },
    { label: '연속 학습일', value: `${user?.streak || 0}일`, icon: Flame, color: '#fdcb6e' },
    { label: '누적 오답 발견', value: `${wrongAnswers.length}문제`, icon: BookOpen, color: '#ff7675' },
  ];

  return (
    <div className="report-page animate-fade-in">
      <header className="page-header">
        <h1 className="page-title">학습 취약점 AI 리포트</h1>
        <p className="page-desc">회원님이 푼 퀴즈 메타데이터를 기반으로 생성된, 데이터 맞춤형 분석 리포트입니다.</p>
      </header>

      {/* ── 0. 종합 요약 지표 (Summary Widgets) ── */}
      <div className="report-summary-cards animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {summaryStats.map((st, i) => (
          <div key={i} className="summary-widget">
            <div className="summary-widget__icon" style={{ backgroundColor: `${st.color}22`, color: st.color }}>
              <st.icon size={26} strokeWidth={2.5} />
            </div>
            <div className="summary-widget__info">
              <span className="summary-widget__label">{st.label}</span>
              <strong className="summary-widget__value">{st.value}</strong>
            </div>
          </div>
        ))}
      </div>

      {wrongAnswers.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
          <Brain size={64} style={{ opacity: 0.3, margin: '0 auto 20px', color: 'var(--color-primary)' }} />
          <h3>아직 분석할 데이터가 부족합니다!</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>더 많은 과목을 배우고 퀴즈를 풀어보세요. AI가 완벽한 리포트를 제공할 준비를 마쳤습니다.</p>
        </div>
      ) : (
        <div className="report-grid">
          {/* ── 1. 취약점 막대 그래프 (Bar Chart) ── */}
          <Card title="세부 취약 개념 랭킹" subtitle="가장 많이 틀린 토픽 비교" variant="elevated">
            <div className="report-bar-chart">
              {topTopics.map((item, i) => {
                // 제일 많이 틀린 개념을 100% 기준으로 비율 계산 (최소 5% 보장)
                const percentage = Math.max(5, Math.floor((item.wrongCount / maxWrongCount) * 100));
                
                return (
                  <div key={item.id} className="bar-row">
                    <div className="bar-info">
                      <span className="bar-name">{i + 1}. {item.topicName} <span style={{fontSize:'11px', color:'var(--text-muted)'}}>({item.subjectName})</span></span>
                      <span className="bar-count">오답 {item.wrongCount}회</span>
                    </div>
                    <div className="bar-track">
                      <div 
                        // 첫 번째, 두 번째로 위험한 항목 붉은색 및 약간 붉은색 적용
                        className={`bar-fill ${i === 0 ? 'danger-fill' : ''}`} 
                        style={{ width: loaded ? `${percentage}%` : '0%', ...(i===1 && { background: 'linear-gradient(90deg, #e15f41, #f3a683)' }) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── 2. 동적 AI 피드백 ── */}
          <Card title="데이터 맞춤 AI 가이드" subtitle="개선 전략 AI 제안" variant="glass">
            <ul className="report__ai-feedback">
              {aiFeedbacks.map((feedback) => {
                const Icon = feedback.IconComponent;
                return (
                  <li key={feedback.id}>
                    <div className="feedback-icon" style={{ color: feedback.textColor }}>
                      <Icon size={18} />
                    </div>
                    <div className="feedback-content">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          background: `${feedback.textColor}22`, 
                          color: feedback.textColor,
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          {feedback.badgeLabel}
                        </span>
                      </div>
                      <strong style={{ display: 'block', fontSize: '15px', marginBottom: '8px' }}>
                        {feedback.title}
                      </strong>
                      <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)' }}>
                        {feedback.desc}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}

      {/* ── 3. 나의 강점 및 동기부여 (채찍엔 당근 구역) ── */}
      {wrongAnswers.length > 0 && (
        <div className="report-strength animate-fade-in" style={{ animationDelay: '0.3s', marginTop: 'var(--spacing-xl)' }}>
          <Card title="🌟 AI가 발견한 나의 학습 강점" subtitle="다른 파트에 비해 오답률이 현저히 낮고 성과가 탁월한 분석 결과입니다." variant="glass">
            <div className="strength-content">
              <div className="strength-icon-wrap">
                <Award size={40} color="var(--color-gold)" />
              </div>
              <div className="strength-text">
                <strong className="strength-title">
                  {hasPlayedQuiz 
                    ? `학습 페이스가 매우 좋습니다! (상위 ${Math.max(1, 100 - user.accuracy)}% 궤도 진입)` 
                    : '기본기가 매우 탄탄한 예비 우등생! (앞으로의 성장이 기대됩니다)'}
                </strong>
                <p className="strength-desc">
                  현재 회원님은 <b>종합 정답률 {displayAccuracy}</b>라는 훌륭한 성과를 기록 중입니다. 
                  무엇보다 최근 연속 <b>{user?.streak || 0}일째</b> 꾸준히 학습하며 좋은 폼을 유지하고 계신 것이 가장 큰 무기입니다! 
                  지금처럼 기초를 탄탄하게 다진 상태에서, 가장 치명적 약점으로 분석된 <b>'{topTopics[0]?.topicName || '핵심 개념'}'</b>만 집중적으로 보완하신다면 실력이 비약적으로 상승할 것입니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
