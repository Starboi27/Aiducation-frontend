import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './AdminSidebar.css';
import Icon from '../../atoms/Icon/Icon';
import Avatar from '../../atoms/Avatar/Avatar';
import AdminBadge from '../../atoms/AdminBadge/AdminBadge';
import { useApp } from '../../../context/AppContext';

const AdminSidebar = () => {
  const { user } = useApp();

  const menuItems = [
    { path: '/admin', icon: 'dashboard', label: '대시보드', exact: true },
    { path: '/admin/users', icon: 'people', label: '사용자 관리' },
    { path: '/admin/contents', icon: 'description', label: '콘텐츠 관리' },
    { path: '/admin/ai-monitor', icon: 'monitoring', label: 'AI 모니터링' },
    { path: '/admin/settings', icon: 'settings', label: '시스템 설정' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <Link to="/">
          <span className="logo-text">AIducation</span>
          <span className="logo-sub">Admin</span>
        </Link>
      </div>

      <div className="admin-sidebar-profile">
        <Avatar src={user?.avatar} name={user?.name} size="large" />
        <div className="profile-info">
          <span className="profile-name">{user?.name}</span>
          <AdminBadge role={user?.role} />
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={item.exact}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <Link to="/" className="nav-item back-to-user">
          <Icon name="arrow_back" size={20} />
          <span>사용자 페이지로</span>
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
