import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../../organisms';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
