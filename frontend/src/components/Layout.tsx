import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout: React.FC = () => {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg-primary)', transition: 'background-color 0.3s ease' }}
    >
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
