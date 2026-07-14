import React, { useState } from 'react';
import { ThemeProvider, MainLayout, Card, CardHeader, CardContent, CardFooter, Button, Badge, Alert } from '../components';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  type: 'case' | 'alert' | 'update' | 'info';
}

interface DashboardMetrics {
  activePersonnel: number;
  activeCases: number;
  pendingAlerts: number;
  completedOperations: number;
}

interface DashboardProps {
  currentPath?: string;
  metrics?: DashboardMetrics;
  onRefresh?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentPath = '/dashboard',
  metrics = {
    activePersonnel: 847,
    activeCases: 42,
    pendingAlerts: 8,
    completedOperations: 156,
  },
  onRefresh,
}) => {
  const [showAlert, setShowAlert] = useState(true);

  const metricCards: MetricCard[] = [
    {
      title: 'Active Personnel',
      value: metrics.activePersonnel,
      change: '+12%',
      changeType: 'positive',
      icon: '👥',
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Active Cases',
      value: metrics.activeCases,
      change: '+3',
      changeType: 'positive',
      icon: '📁',
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    },
    {
      title: 'Pending Alerts',
      value: metrics.pendingAlerts,
      change: '-2',
      changeType: 'negative',
      icon: '🚨',
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    },
    {
      title: 'Completed Operations',
      value: metrics.completedOperations,
      change: '+24',
      changeType: 'positive',
      icon: '✓',
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    },
  ];

  const recentActivities: ActivityItem[] = [
    { id: '1', title: 'Case #2024-0847 assigned to Officer Davis', time: '2 minutes ago', type: 'case' },
    { id: '2', title: 'Security alert: Unauthorized access attempt', time: '15 minutes ago', type: 'alert' },
    { id: '3', title: 'Personnel database updated', time: '1 hour ago', type: 'update' },
    { id: '4', title: 'System maintenance scheduled for tonight', time: '3 hours ago', type: 'info' },
    { id: '5', title: 'Case #2024-0846 marked as resolved', time: '5 hours ago', type: 'case' },
  ];

  const getActivityBadgeVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'case':
        return 'info';
      case 'alert':
        return 'danger';
      case 'update':
        return 'warning';
      case 'info':
        return 'neutral';
      default:
        return 'primary' as const;
    }
  };

  const getChangeColor = (type?: string) => {
    switch (type) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  return (
    <ThemeProvider>
      <MainLayout currentPath={currentPath}>
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                Dashboard
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Overview of your law enforcement operations
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={onRefresh}
              className="hidden sm:inline-flex"
            >
              🔄 Refresh
            </Button>
          </div>

          {/* System Alert */}
          {showAlert && (
            <Alert
              variant="info"
              title="System Status"
              dismissible
              onClose={() => setShowAlert(false)}
            >
              All systems operational. Last update: 5 minutes ago.
            </Alert>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricCards.map((metric, index) => (
              <Card key={index} elevation="md" className={`border ${metric.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      {metric.title}
                    </p>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                      {metric.value}
                    </p>
                  </div>
                  <span className="text-3xl">{metric.icon}</span>
                </div>
                {metric.change && (
                  <div className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                    {metric.changeType === 'negative' ? '↓' : '↑'} {metric.change} vs last month
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <Card elevation="md" className="lg:col-span-1">
              <CardHeader
                title="Quick Actions"
                subtitle="Frequently used operations"
              />
              <CardContent>
                <div className="space-y-3">
                  <Button variant="primary" size="md" className="w-full justify-start">
                    📋 Create New Case
                  </Button>
                  <Button variant="secondary" size="md" className="w-full justify-start">
                    👤 Add Personnel
                  </Button>
                  <Button variant="secondary" size="md" className="w-full justify-start">
                    📊 Generate Report
                  </Button>
                  <Button variant="secondary" size="md" className="w-full justify-start">
                    ⚙️ System Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card elevation="md" className="lg:col-span-2">
              <CardHeader
                title="Recent Activities"
                subtitle="Latest updates from your operations"
              />
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-700 last:border-b-0 last:pb-0"
                    >
                      <Badge
                        variant={getActivityBadgeVariant(activity.type) as any}
                        className="flex-shrink-0 mt-1"
                      >
                        {activity.type === 'case' && '📁'}
                        {activity.type === 'alert' && '🚨'}
                        {activity.type === 'update' && '📝'}
                        {activity.type === 'info' && 'ⓘ'}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {activity.title}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case Status Distribution */}
            <Card elevation="md">
              <CardHeader
                title="Case Status Distribution"
                action={
                  <select className="text-xs px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>Last Quarter</option>
                  </select>
                }
              />
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Open', count: 18, color: 'bg-blue-500', percentage: 43 },
                    { label: 'In Progress', count: 15, color: 'bg-yellow-500', percentage: 36 },
                    { label: 'Closed', count: 9, color: 'bg-green-500', percentage: 21 },
                  ].map((status) => (
                    <div key={status.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {status.label}
                        </span>
                        <span className="text-sm font-bold text-neutral-900 dark:text-white">
                          {status.count}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div
                          className={`${status.color} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${status.percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-500">
                        {status.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Department Statistics */}
            <Card elevation="md">
              <CardHeader
                title="Department Statistics"
              />
              <CardContent>
                <div className="space-y-3">
                  {[
                    { department: 'Narcotics', officers: 85, status: 'active' },
                    { department: 'Homicide', officers: 62, status: 'active' },
                    { department: 'Cyber Crimes', officers: 45, status: 'active' },
                    { department: 'Vice', officers: 38, status: 'warning' },
                  ].map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {dept.department}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">
                          {dept.officers} officers
                        </p>
                      </div>
                      <Badge
                        variant={dept.status === 'active' ? 'success' : 'warning'}
                      >
                        {dept.status === 'active' ? '✓ Active' : '⚠ Review'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer Actions */}
          <Card elevation="md" className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
            <CardHeader
              title="Need Help?"
              subtitle="Access documentation and support resources"
            />
            <CardFooter>
              <Button variant="secondary" size="md">
                📚 View Docs
              </Button>
              <Button variant="ghost" size="md">
                💬 Contact Support
              </Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    </ThemeProvider>
  );
};

export default Dashboard;
