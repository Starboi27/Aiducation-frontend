import React from 'react';
import './StatCard.css';

const StatCard = ({ icon: Icon, label, value, delta, deltaType = 'neutral', color = 'primary', description }) => {
  const colors = {
    primary: '#6C5CE7',
    success: '#00b894',
    warning: '#fdcb6e',
    danger: '#d63031',
    info: '#0984e3',
    accent: '#fd79a8',
  };

  return (
    <div className={`stat-card stat-card--${color}`} style={{ '--stat-color': colors[color] || colors.primary }}>
      <div className="stat-card__icon-wrap">
        <Icon size={22} />
      </div>
      <div className="stat-card__content">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {delta !== undefined && (
          <p className={`stat-card__delta stat-card__delta--${deltaType}`}>
            {deltaType === 'up' ? '↑' : deltaType === 'down' ? '↓' : '•'} {delta}
          </p>
        )}
        {description && <p className="stat-card__desc">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
