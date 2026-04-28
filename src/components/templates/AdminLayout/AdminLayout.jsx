import React from 'react';
import { Outlet } from 'react-router-dom';
import './AdminLayout.css';
import AdminSidebar from '../../organisms/AdminSidebar/AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-header-title">
            {/* 페이지별 제목은 Outlet 내부에서 처리하거나 Context로 관리 가능 */}
            <h2>관리자 시스템</h2>
          </div>
          <div className="admin-header-actions">
            {/* 필요한 상단 액션들 (알림, 로그아웃 등) */}
          </div>
        </header>
        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
