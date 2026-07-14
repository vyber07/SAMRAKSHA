import React from 'react';
import { ThemeProvider, MainLayout, Card, Button, Badge, Input, Alert } from './components';
import './styles/globals.css';

function App() {
  const [alertVisible, setAlertVisible] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  return (
    <ThemeProvider>
      <MainLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              Welcome to SAMRAKSHA
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Modern dashboard built with React, TypeScript, and Tailwind CSS
            </p>
          </div>

          {/* Alert Examples */}
          {alertVisible && (
            <Alert
              variant="info"
              title="Design System Ready"
              dismissible
              onClose={() => setAlertVisible(false)}
            >
              All core components and design tokens have been successfully implemented.
            </Alert>
          )}

          {/* Components Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Button Component */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                Buttons
              </h3>
              <div className="space-y-2">
                <Button variant="primary" className="w-full">Primary Button</Button>
                <Button variant="secondary" className="w-full">Secondary Button</Button>
                <Button variant="danger" className="w-full">Danger Button</Button>
                <Button variant="ghost" className="w-full">Ghost Button</Button>
              </div>
            </Card>

            {/* Badge Component */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                Badges
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Active</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="danger">Error</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="primary">Primary</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
            </Card>

            {/* Input Component */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                Form Inputs
              </h3>
              <div className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="At least 8 characters"
                />
              </div>
            </Card>

            {/* Button Sizes */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                Button Sizes
              </h3>
              <div className="space-y-2">
                <Button size="xs" variant="primary" className="w-full">XS</Button>
                <Button size="sm" variant="primary" className="w-full">Small</Button>
                <Button size="md" variant="primary" className="w-full">Medium</Button>
                <Button size="lg" variant="primary" className="w-full">Large</Button>
                <Button size="xl" variant="primary" className="w-full">XL</Button>
              </div>
            </Card>

            {/* Loading State */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                Loading State
              </h3>
              <Button isLoading={true} className="w-full">Processing...</Button>
            </Card>

            {/* Disabled State */}
            <Card>
              <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                Disabled State
              </h3>
              <Button disabled className="w-full">Disabled Button</Button>
            </Card>
          </div>

          {/* Color Palette */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
              Color Palette
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'Primary', color: 'bg-primary-500' },
                { name: 'Success', color: 'bg-green-500' },
                { name: 'Danger', color: 'bg-red-500' },
                { name: 'Warning', color: 'bg-yellow-500' },
                { name: 'Info', color: 'bg-blue-500' },
                { name: 'Neutral', color: 'bg-neutral-500' },
              ].map((item) => (
                <div key={item.name}>
                  <div className={`${item.color} h-16 rounded-lg mb-2`} />
                  <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {item.name}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Spacing Guide */}
          <Card>
            <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
              Spacing Scale (4px base)
            </h3>
            <div className="space-y-2">
              {[
                { name: 'xs (4px)', value: 'h-1' },
                { name: 'sm (8px)', value: 'h-2' },
                { name: 'md (12px)', value: 'h-3' },
                { name: 'lg (16px)', value: 'h-4' },
                { name: 'xl (24px)', value: 'h-6' },
                { name: '2xl (32px)', value: 'h-8' },
              ].map((item) => (
                <div key={item.name} className="flex items-center gap-4">
                  <span className="w-16 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {item.name}
                  </span>
                  <div className={`${item.value} bg-primary-500 rounded w-full`} />
                </div>
              ))}
            </div>
          </Card>

          {/* Footer */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              SAMRAKSHA Frontend Design System v1.0 | Built with React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </MainLayout>
    </ThemeProvider>
  );
}

export default App;
