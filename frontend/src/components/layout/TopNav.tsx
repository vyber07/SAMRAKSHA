import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export const TopNav: React.FC = () => {
  const { isDark, setTheme } = useTheme();

  return (
    <header className="fixed top-0 right-0 left-0 md:left-64 h-14 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 z-30 transition-colors duration-200">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left */}
        <div className="hidden md:flex items-center gap-4">
          <h2 className="text-sm font-medium text-neutral-900 dark:text-white">Dashboard</h2>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
            aria-label="Toggle theme"
          >
            <span className="text-xl">{isDark ? '☀️' : '🌙'}</span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-4 border-l border-neutral-200 dark:border-neutral-800">
            <button
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              aria-label="User profile"
            >
              <span className="text-xl">👤</span>
            </button>
            <button
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-danger"
              aria-label="Logout"
            >
              <span className="text-xl">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

TopNav.displayName = 'TopNav';
