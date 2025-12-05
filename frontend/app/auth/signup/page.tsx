'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import Logo from '@/components/Logo';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | string[]>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('Password must be at least 8 characters long');
    if (!/[A-Z]/.test(pwd)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(pwd)) errors.push('Password must contain at least one digit');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push('Password must contain at least one special character');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate username
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return;
    }

    // Validate password
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors);
      return;
    }

    setLoading(true);

    try {
      const user = await authAPI.signup(username, email, password);
      
      // If user is already verified (email disabled), auto-login
      if (user.is_verified) {
        await authAPI.login(email, password);
        // Tokens are stored in cookies by backend and synced to localStorage by API
        document.cookie = `cadarena_refresh=${encodeURIComponent(loginResponse.refresh_token)}; Path=/; Max-Age=${maxAge}`;
        router.push('/app/dashboard');
        return;
      }
      
      setSuccess(true);
      // User needs to verify email
    } catch (err: any) {
      // Network / config issue (no response from backend)
      if (!err.response) {
        setError(
          'Unable to reach the server. Please make sure the backend is running and NEXT_PUBLIC_API_URL is set correctly.'
        );
        return;
      }

      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'object' && errorDetail.errors) {
        setError(errorDetail.errors);
      } else {
        setError(errorDetail || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordErrors = password ? validatePassword(password) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-2" />
          <p className="text-slate-600 mt-2">Create your CadArena account</p>
        </div>

        {/* Signup Card */}
        <div className="card p-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Get Started</h2>
          <p className="text-center text-slate-600 mb-8">Sign up to start designing with AI</p>
          
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Account Created Successfully!</h3>
                  <p className="text-sm text-green-700 mb-4">
                    We&apos;ve sent a verification email to <strong>{email}</strong>. 
                    Please check your inbox and click the verification link to activate your account.
                    Once verified, you can log in.
                  </p>
                  <Link
                    href="/auth/login"
                    className="text-sm text-green-700 hover:text-green-900 font-medium underline"
                  >
                    Go to Login →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {Array.isArray(error) ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {error.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </span>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      required
                      minLength={3}
                      maxLength={50}
                      className="input-field pl-10"
                      placeholder="johndoe"
                      pattern="[a-zA-Z0-9_-]+"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">3-50 characters, letters, numbers, _, -</p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field pl-10"
                      placeholder="you@example.com"
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
                      placeholder="At least 8 characters"
                    />
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      {passwordErrors.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">Strong password</span>
                        </div>
                      ) : (
                        <ul className="text-xs text-slate-500 space-y-1">
                          {passwordErrors.map((err, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                              {err}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="input-field pl-10"
                      placeholder="Confirm your password"
                    />
                  </div>
                  {confirmPassword && password === confirmPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-600">Passwords match</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#0066FF] hover:text-[#0052CC] font-semibold transition-colors">
                Sign in
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
