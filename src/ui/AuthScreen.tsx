import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminPinEntry } from './AdminPinEntry';

export function AuthScreen({ onStaffLogin }: { onStaffLogin?: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('lastEmail') || '';
  });
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(() => {
    return localStorage.getItem('keepSignedIn') === 'true';
  });
  const [pendingApproval, setPendingApproval] = useState(() => {
    return localStorage.getItem('pendingApproval') === 'true';
  });
  const [approvalEmail, setApprovalEmail] = useState(() => {
    return localStorage.getItem('approvalEmail') || '';
  });
  const [showAdminPin, setShowAdminPin] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      if (keepSignedIn) {
        localStorage.setItem('keepSignedIn', 'true');
        localStorage.setItem('lastEmail', email);
      } else {
        localStorage.removeItem('keepSignedIn');
        localStorage.removeItem('lastEmail');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName, orgName);
      // Show pending approval screen instead of logging in
      localStorage.setItem('approvalEmail', email);
      localStorage.setItem('pendingApproval', 'true');
      setApprovalEmail(email);
      setPendingApproval(true);
      setEmail('');
      setPassword('');
      setFullName('');
      setOrgName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Show admin PIN entry when admin dashboard is clicked
  if (showAdminPin) {
    return (
      <AdminPinEntry
        onSubmit={() => {
          // Set flag to show admin dashboard
          localStorage.setItem('adminPinVerified', 'true');
          // Reload to trigger App to show admin dashboard
          window.location.reload();
        }}
        onBack={() => setShowAdminPin(false)}
        correctPin="8739"
      />
    );
  }

  // Show pending approval screen after registration
  if (pendingApproval) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
        <div className="max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-red-700 text-white px-8 py-4 rounded-lg inline-block">
              <h1 className="text-3xl font-bold">HOTEL Ready</h1>
              <p className="text-sm text-red-100 mt-1">Staff Training Platform</p>
            </div>
          </div>

          {/* Pending Approval Card */}
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-6xl mb-4">⏳</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Waiting for Approval
            </h2>
            <p className="text-gray-600 mb-6">
              Your registration request has been received. An administrator will review your request and authorize your access within 24 hours.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Confirmation email sent to: <span className="font-semibold">{approvalEmail}</span>
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('pendingApproval');
                localStorage.removeItem('approvalEmail');
                setPendingApproval(false);
                setApprovalEmail('');
                setIsLogin(true);
              }}
              className="w-full bg-red-700 text-white font-semibold py-2 rounded-lg hover:bg-red-800 transition"
            >
              Return
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-red-700 text-white px-8 py-4 rounded-lg inline-block">
            <h1 className="text-3xl font-bold">HOTEL Ready</h1>
            <p className="text-sm text-red-100 mt-1">Staff Training Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hotel/Organization Name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your hotel name"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {isLogin && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="keepSignedIn"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 text-red-700 border-gray-300 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="keepSignedIn" className="text-sm text-gray-600 cursor-pointer">
                  Keep me signed in
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 text-white font-semibold py-2 rounded-lg hover:bg-red-800 disabled:opacity-50 transition"
            >
              {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                  }}
                  className="text-red-700 font-semibold hover:underline"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={() => setShowAdminPin(true)}
                className="w-full bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-800 transition"
              >
                🔑 Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
