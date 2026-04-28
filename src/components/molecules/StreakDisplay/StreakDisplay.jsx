import React from 'react';
import { Flame } from 'lucide-react';
import './StreakDisplay.css';

const StreakDisplay = ({ streak = 0, maxStreak = 0, compact = false }) => {
  const isActive = streak > 0;

  if (compact) {
    return (
      <div className={`streak-compact ${isActive ? 'streak-compact--active' : ''}`}>
        <Flame size={16} />
        <span>{streak}</span>
      </div>
    );
  }

  return (
    <div className={`streak-display ${isActive ? 'streak-display--active' : ''}`}>
      <div className="streak-display__flame-wrap">
        <Flame size={32} className={`streak-display__flame ${isActive ? 'streak-display__flame--burning' : ''}`} />
        {isActive && (
          <>
            <span className="streak-particle" style={{ '--tx': '-12px', '--ty': '-20px', '--delay': '0s' }} />
            <span className="streak-particle" style={{ '--tx': '10px', '--ty': '-25px', '--delay': '0.3s' }} />
            <span className="streak-particle" style={{ '--tx': '0px', '--ty': '-30px', '--delay': '0.6s' }} />
          </>
        )}
      </div>
      <div className="streak-display__info">
        <p className="streak-display__count">{streak}</p>
        <p className="streak-display__label">연속 학습일</p>
        {maxStreak > 0 && <p className="streak-display__max">최고 기록: {maxStreak}일</p>}
      </div>
    </div>
  );
};

export default StreakDisplay;
