import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Brain, Zap, Trophy, BarChart3,
  BookOpen, ChevronLeft, ChevronRight, Bell, Settings, LogOut, FolderOpen, User
} from 'lucide-react';
import { Avatar } from '../../atoms';
import { StreakDisplay, ExpCard } from '../../molecules';
import { useApp } from '../../../context/AppContext';
import { tokenStorage } from '../../../services/authService';
import './Sidebar.css';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/subjects', icon: FolderOpen, label: '내 과목' },
  { to: '/review', icon: BookOpen, label: '오답 복습' },
  { to: '/report', icon: BarChart3, label: '분석 리포트' },
  { to: '/ranking', icon: Trophy, label: '랭킹' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, setUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    tokenStorage.remove();
    setUser(null);
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
        <div className="sidebar__user" onClick={() => navigate('/mypage')} style={{ cursor: 'pointer' }}>
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
            <NavLink to="/notifications" className="sidebar__action">
              <Bell size={18} />
              <span>알림</span>
              {user.unreadNotifications > 0 && (
                <span className="sidebar__notif-dot">{user.unreadNotifications}</span>
              )}
            </NavLink>
            <NavLink to="/settings" className="sidebar__action">
              <Settings size={18} />
              <span>설정</span>
            </NavLink>
            <NavLink to="/mypage" className="sidebar__action">
              <User size={18} />
              <span>마이페이지</span>
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
