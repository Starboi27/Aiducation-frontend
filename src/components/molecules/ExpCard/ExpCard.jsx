import React from 'react';
import { Star, Zap } from 'lucide-react';
import { ProgressBar, Badge } from '../../atoms';
import './ExpCard.css';

const RANKS = [
  { name: 'Bronze', min: 0, max: 1000, color: '#cd7f32', badge: 'bronze' },
  { name: 'Silver', min: 1000, max: 3000, color: '#c0c0c0', badge: 'silver' },
  { name: 'Gold', min: 3000, max: 7000, color: '#ffd700', badge: 'gold' },
  { name: 'Platinum', min: 7000, max: 15000, color: '#00b4d8', badge: 'platinum' },
  { name: 'Diamond', min: 15000, max: 999999, color: '#a29bfe', badge: 'diamond' },
];

export const getRank = (exp) => RANKS.find(r => exp >= r.min && exp < r.max) || RANKS[0];

const ExpCard = ({ exp = 0, totalExp = 0, level = 1, compact = false }) => {
  const rank = getRank(totalExp);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1];
  const progress = nextRank
    ? ((totalExp - rank.min) / (rank.max - rank.min)) * 100
    : 100;

  if (compact) {
    return (
      <div className="exp-card-compact">
        <Zap size={14} style={{ color: rank.color }} />
        <span className="exp-card-compact__exp">{totalExp.toLocaleString()} XP</span>
        <Badge variant={rank.badge} size="sm">{rank.name}</Badge>
      </div>
    );
  }

  return (
    <div className="exp-card" style={{ '--rank-color': rank.color }}>
      <div className="exp-card__top">
        <div className="exp-card__rank-icon">
          <Star size={24} fill="currentColor" />
        </div>
        <div className="exp-card__rank-info">
          <Badge variant={rank.badge} size="md" glow>{rank.name}</Badge>
          <p className="exp-card__level">Lv. {level}</p>
        </div>
        <div className="exp-card__xp">
          <span className="exp-card__xp-value">{totalExp.toLocaleString()}</span>
          <span className="exp-card__xp-label">XP</span>
        </div>
      </div>
      <div className="exp-card__progress-section">
        <ProgressBar
          value={totalExp - rank.min}
          max={nextRank ? rank.max - rank.min : 1}
          variant="gold"
          size="md"
          showValue={false}
        />
        <div className="exp-card__progress-labels">
          <span style={{ color: rank.color }}>{rank.name}</span>
          {nextRank && <span style={{ color: nextRank.color }}>{nextRank.name}</span>}
        </div>
      </div>
      {nextRank && (
        <p className="exp-card__next">
          다음 등급까지 <strong>{(rank.max - totalExp).toLocaleString()} XP</strong> 남음
        </p>
      )}
    </div>
  );
};

export default ExpCard;
