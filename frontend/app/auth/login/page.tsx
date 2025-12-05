'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import Logo from '@/components/Logo';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(identifier, password);
      // Tokens are stored in cookies by backend and synced to localStorage by API
      router.push('/app/dashboard');
    } catch (err: any) {
      // If there's no response at all, it's likely a network or backend URL issue
      if (!err.response) {
        setError(
          'Unable to reach the server. Please make sure the backend is running and NEXT_PUBLIC_API_URL is set correctly.'
        );
        return;
      }

      const errorDetail = err.response?.data?.detail;
      
      // Handle specific error cases
      if (errorDetail?.includes('not verified')) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
      } else if (errorDetail?.includes('locked')) {
        setError(errorDetail);
      } else if (errorDetail?.includes('Rate limit')) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError(errorDetail || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-2" />
          <p className="text-slate-600 mt-2">Welcome back to CAD ARENA</p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Sign In</h2>
          <p className="text-center text-slate-600 mb-8">Enter your credentials to continue</p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm">{error}</span>
                {error.includes('not verified') && (
                  <Link
                    href="/auth/resend-verification"
                    className="block mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Resend verification email
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="identifier" className="block text-sm font-semibold text-slate-700 mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="your@email.com or username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pl-10"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#0066FF] focus:ring-[#0066FF] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">
                  Remember me
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#0066FF] hover:text-[#0052CC] font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-[#0066FF] hover:text-[#0052CC] font-semibold transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-slate-600 hover:text-[#0066FF] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
