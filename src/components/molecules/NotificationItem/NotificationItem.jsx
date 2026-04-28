import React from 'react';
import { Bell, BellOff, Clock } from 'lucide-react';
import './NotificationItem.css';

const NotificationItem = ({ type = 'info', title, message, time, read = false, onRead }) => {
  const typeConfig = {
    review: { icon: Clock, color: '#0984e3', bg: 'rgba(9,132,227,0.1)', label: '복습 알림' },
    streak: { icon: Bell, color: '#e17055', bg: 'rgba(225,112,85,0.1)', label: '스트릭 알림' },
    rank: { icon: Bell, color: '#ffd700', bg: 'rgba(255,215,0,0.1)', label: '등급 변경' },
    info: { icon: Bell, color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)', label: '일반' },
  };
  const config = typeConfig[type] || typeConfig.info;
  const IconComp = config.icon;

  return (
    <div className={`notif-item ${read ? 'notif-item--read' : 'notif-item--unread'}`} onClick={onRead}>
      <div className="notif-item__icon" style={{ background: config.bg, color: config.color }}>
        <IconComp size={16} />
      </div>
      <div className="notif-item__content">
        <p className="notif-item__title">{title}</p>
        <p className="notif-item__message">{message}</p>
        <p className="notif-item__time">{time}</p>
      </div>
      {!read && <span className="notif-item__dot" />}
    </div>
  );
};

export default NotificationItem;
