import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Brain, Trophy, BarChart3,
  BookOpen, ChevronLeft, ChevronRight, Bell, Settings, LogOut, FolderOpen,
  CheckCheck, BookMarked, Zap, Info
} from 'lucide-react';
import { Avatar } from '../../atoms';
import { StreakDisplay } from '../../molecules';
import { useApp } from '../../../context/AppContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/subjects', icon: FolderOpen, label: '내 과목' },
  { to: '/review', icon: BookOpen, label: '오답 복습' },
  { to: '/report', icon: BarChart3, label: '분석 리포트' },
  { to: '/ranking', icon: Trophy, label: '랭킹' },
];

const NOTIF_ICONS = {
  review:  BookMarked,
  streak:  Zap,
  default: Info,
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const { user, logout, notifications, markNotificationRead } = useApp();
  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.read).length;
  const [dropdownPos, setDropdownPos] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotifToggle = () => {
    if (!notifOpen && notifRef.current) {
      const rect = notifRef.current.getBoundingClientRect();
      setDropdownPos({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left,
      });
    }
    setNotifOpen(o => !o);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-icon">
          <Brain size={22} />
        </div>
        {!collapsed && <span className="sidebar__logo-text">AI<span>ducation</span></span>}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="sidebar__user">
          <Avatar name={user.name} size="md" level={user.level} />
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">{user.name}</p>
            <p className="sidebar__user-exp">{user.totalExp?.toLocaleString()} XP</p>
          </div>
        </div>
      )}

      {/* Streak compact */}
      {collapsed && (
        <div className="sidebar__streak-compact">
          <StreakDisplay streak={user.streak} compact />
        </div>
      )}

      {!collapsed && (
        <div className="sidebar__streak">
          <StreakDisplay streak={user.streak} maxStreak={user.maxStreak} />
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
          >
            <Icon size={20} className="sidebar__nav-icon" />
            {!collapsed && <span className="sidebar__nav-label">{label}</span>}
            {!collapsed && to === '/review' && user.wrongCount > 0 && (
              <span className="sidebar__nav-badge">{user.wrongCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="sidebar__bottom">
        {!collapsed && (
          <>
            <div className="sidebar__notif-wrap" ref={notifRef}>
              <button
                className="sidebar__action sidebar__action--btn"
                onClick={handleNotifToggle}
              >
                <Bell size={18} />
                <span>알림</span>
                {unread > 0 && <span className="sidebar__notif-dot">{unread}</span>}
              </button>

              {notifOpen && (
                <div
                  className="sidebar__notif-dropdown"
                  style={{ bottom: dropdownPos.bottom, left: dropdownPos.left }}
                >
                  <div className="sidebar__notif-header">
                    <span>알림</span>
                    {unread > 0 && (
                      <button
                        className="sidebar__notif-read-all"
                        onClick={() => notifications.filter(n => !n.read).forEach(n => markNotificationRead(n.id))}
                      >
                        <CheckCheck size={13} /> 모두 읽음
                      </button>
                    )}
                  </div>

                  <div className="sidebar__notif-list">
                    {notifications.length === 0 ? (
                      <p className="sidebar__notif-empty">새 알림이 없습니다.</p>
                    ) : (
                      notifications.map(n => {
                        const Icon = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.default;
                        return (
                          <div
                            key={n.id}
                            className={`sidebar__notif-item ${n.read ? '' : 'sidebar__notif-item--unread'}`}
                            onClick={() => markNotificationRead(n.id)}
                          >
                            <div className="sidebar__notif-item-icon">
                              <Icon size={14} />
                            </div>
                            <div className="sidebar__notif-item-body">
                              <p className="sidebar__notif-item-title">{n.title}</p>
                              <p className="sidebar__notif-item-msg">{n.message}</p>
                              <p className="sidebar__notif-item-time">{n.time}</p>
                            </div>
                            {!n.read && <div className="sidebar__notif-unread-dot" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/settings" className="sidebar__action">
              <Settings size={18} />
              <span>설정</span>
            </NavLink>

          </>
        )}
        <button className="sidebar__logout-btn" onClick={handleLogout}>
          <LogOut size={18} />
          {!collapsed && <span>로그아웃</span>}
        </button>
        <button className="sidebar__collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
