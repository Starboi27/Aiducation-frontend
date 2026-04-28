import React from 'react';
import './Icon.css';

const Icon = ({ icon: IconComponent, size = 20, color = 'current', variant = 'default', className = '' }) => {
  if (!IconComponent) return null;
  return (
    <span className={`icon icon--${variant} icon--${color} ${className}`}>
      <IconComponent size={size} />
    </span>
  );
};

export default Icon;
