import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface MainLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPath = '/' }) => {
  const navItems = [
    { icon: '📊', label: 'Dashboard', href: '/', active: currentPath === '/' },
    { icon: '👥', label: 'Personnel', href: '/personnel', active: currentPath.startsWith('/personnel') },
    { icon: '📁', label: 'Cases', href: '/cases', active: currentPath.startsWith('/cases') },
    { icon: '⚙️', label: 'Settings', href: '/settings', active: currentPath === '/settings' },
  ];

  const handleNavClick = (href: string) => {
    // Navigation handling - can be connected to router
    window.history.pushState({}, '', href);
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 transition-colors duration-200">
      <Sidebar navItems={navItems} onNavClick={handleNavClick} />
      <div className="flex-1 flex flex-col md:ml-64">
        <TopNav />
        <main className="flex-1 overflow-auto pt-14">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

MainLayout.displayName = 'MainLayout';
