import React, { useState } from 'react';
import { ThemeProvider, Card, Button, Input, Alert } from '../components';

interface LoginFormData {
  badgeNumber: string;
  password: string;
}

interface LoginPageProps {
  onSubmit?: (data: LoginFormData) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<LoginFormData>({
    badgeNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<LoginFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginFormData> = {};

    if (!formData.badgeNumber.trim()) {
      newErrors.badgeNumber = 'Badge number is required';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name as keyof LoginFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorAlert('Please fix the errors above');
      return;
    }

    setIsLoading(true);
    setErrorAlert(null);

    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
      setSuccessAlert(true);
      setFormData({ badgeNumber: '', password: '' });
      setTimeout(() => setSuccessAlert(false), 3000);
    } catch (error) {
      setErrorAlert(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
              SAMRAKSHA
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Law Enforcement Intelligence Platform
            </p>
          </div>

          {/* Success Alert */}
          {successAlert && (
            <Alert
              variant="success"
              title="Login Successful"
              dismissible
              onClose={() => setSuccessAlert(false)}
              className="mb-6"
            >
              You have been logged in successfully.
            </Alert>
          )}

          {/* Error Alert */}
          {errorAlert && (
            <Alert
              variant="danger"
              title="Login Error"
              dismissible
              onClose={() => setErrorAlert(null)}
              className="mb-6"
            >
              {errorAlert}
            </Alert>
          )}

          {/* Login Card */}
          <Card elevation="lg" className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Badge Number Input */}
              <Input
                label="Badge Number"
                name="badgeNumber"
                type="text"
                placeholder="Enter your badge number"
                value={formData.badgeNumber}
                onChange={handleChange}
                error={errors.badgeNumber}
                required
                autoFocus
              />

              {/* Password Input */}
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                helperText="At least 6 characters"
              />

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                loadingText="Logging in..."
                className="w-full"
              >
                Login
              </Button>
            </form>
          </Card>

          {/* Footer Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              For law enforcement personnel only
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              © 2026 SAMRAKSHA. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default LoginPage;
