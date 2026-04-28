import React from 'react';
import './Avatar.css';

const Avatar = ({ name = '', size = 'md', src, level, rank, className = '' }) => {
  // 'small' → 'sm', 'medium' → 'md', 'large' → 'lg' 정규화
  const normalizedSize = size === 'small' ? 'sm' : size === 'medium' ? 'md' : size === 'large' ? 'lg' : size;
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colorIndex = name.charCodeAt(0) % 6;
  const colors = ['#6C5CE7', '#00cec9', '#fd79a8', '#fdcb6e', '#00b894', '#0984e3'];

  return (
    <div className={`avatar avatar--${normalizedSize} ${className}`} style={{ '--avatar-color': colors[colorIndex] }}>
      {src ? (
        <img src={src} alt={name} className="avatar__img" />
      ) : (
        <span className="avatar__initials">{initials || '?'}</span>
      )}
      {level && <span className="avatar__level">{level}</span>}
      {rank && <span className={`avatar__rank avatar__rank--${rank}`} />}
    </div>
  );
};

export default Avatar;
