import React from 'react';
import './AdminStatCard.css';
import Icon from '../../atoms/Icon/Icon';

const AdminStatCard = ({ title, value, subValue, icon, trend }) => {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon">
        <Icon name={icon} size={24} color="#6C5CE7" />
      </div>
      <div className="admin-stat-content">
        <h3 className="admin-stat-title">{title}</h3>
        <div className="admin-stat-value">{value}</div>
        {subValue && (
          <div className={`admin-stat-subvalue ${trend > 0 ? 'up' : trend < 0 ? 'down' : ''}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : ''} {subValue}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStatCard;
