import React, { useState } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

type AppView = 'login' | 'dashboard';

export const DemoApp: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('login');

  const handleLogin = async (data: { badgeNumber: string; password: string }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('User logged in:', data.badgeNumber);
    setCurrentView('dashboard');
  };

  if (currentView === 'login') {
    return <LoginPage onSubmit={handleLogin} />;
  }

  return (
    <Dashboard
      currentPath="/dashboard"
      metrics={{
        activePersonnel: 847,
        activeCases: 42,
        pendingAlerts: 8,
        completedOperations: 156,
      }}
      onRefresh={() => console.log('Refreshing...')}
    />
  );
};

export default DemoApp;
