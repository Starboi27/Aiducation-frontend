import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'default', size = 'md', glow = false, className = '' }) => {
  const classes = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    glow ? 'badge--glow' : '',
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes}>{children}</span>;
};

export default Badge;
