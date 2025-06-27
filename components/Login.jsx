import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, User } from 'lucide-react';
import { config, debugLog } from '../utils/config';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Load default credentials from environment variables
  useEffect(() => {
    const defaultEmail = config.auth.defaultEmail;
    const defaultPassword = config.auth.defaultPassword;
    
    if (defaultEmail && defaultPassword && config.features.showDefaultCredentials) {
      debugLog('Loading default credentials from environment');
      setCredentials({
        email: defaultEmail,
        password: defaultPassword
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoadDefaults = () => {
    const defaultEmail = config.auth.defaultEmail;
    const defaultPassword = config.auth.defaultPassword;
    
    if (defaultEmail && defaultPassword) {
      debugLog('Manually loading default credentials');
      setCredentials({
        email: defaultEmail,
        password: defaultPassword
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    debugLog('Attempting login with:', { email: credentials.email });

    try {
      const response = await fetch(`${config.apiBaseUrl}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Login failed: ${response.status} ${response.statusText}`);
      }

      // Extract token from response
      const token = data.token;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      debugLog('Login successful, token received');

      // Store token in localStorage for persistence
      localStorage.setItem(config.auth.tokenKey, token);
      
      // Call success callback with token and user data
      onLoginSuccess(token, data);

    } catch (err) {
      debugLog('Login error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Login</h2>
        <p className="text-gray-600">Sign in to access your audio library</p>
      </div>

      {/* Development Helper */}
      {config.features.showDefaultCredentials && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">Development Mode</span>
            <button
              type="button"
              onClick={handleLoadDefaults}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Load Default Credentials
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-start">
            <div className="flex-1">
              <p className="font-medium">Login Failed</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={credentials.email}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email"
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !credentials.email || !credentials.password}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Signing In...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* API Connection Status */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Connecting to: {config.apiBaseUrl}
        </p>
        {config.isDevelopment && (
          <p className="text-xs text-blue-500 mt-1">
            Development Mode
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
