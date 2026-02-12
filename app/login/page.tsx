'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const supabase = createSupabaseBrowser();
  const supabaseMissing = !supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'login') {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please try again.');
          } else {
            setError(error.message);
          }
          return;
        }

        // Redirect to dashboard on success
        router.push('/admin/dashboard');
        router.refresh();
      } else {
        // Sign up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Please login instead.');
          } else {
            setError(error.message);
          }
          return;
        }

        setSuccess('Account created successfully! Please check your email to verify your account.');
        setMode('login');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-[#0066FF] rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Al Asala</span>
            </div>
          </Link>
          <p className="text-gray-500 mt-2">Restaurant Management Platform</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-gray-500 mt-1">
              {mode === 'login'
                ? 'Sign in to access your dashboard'
                : 'Sign up to get started with Al Asala'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {supabaseMissing && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">Supabase غير مُعد</p>
                <p className="mt-1">أضف <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> و <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> في ملف <code className="bg-amber-100 px-1 rounded">.env.local</code> لتفعيل تسجيل الدخول.</p>
                <p className="mt-2 text-amber-700">يمكنك تصفّح الموقع بدون تسجيل دخول.</p>
              </div>
            )}
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Full Name (Sign up only) */}
            {mode === 'signup' && (
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            )}

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              helperText={mode === 'signup' ? 'Minimum 6 characters' : undefined}
            />

            {/* Forgot Password (Login only) */}
            {mode === 'login' && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#0066FF] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="mt-2"
              disabled={supabaseMissing}
            >
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Toggle Mode */}
            <p className="text-center text-gray-600">
              {mode === 'login' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[#0066FF] font-medium hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[#0066FF] font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          © {new Date().getFullYear()} Al Asala Restaurant. All rights reserved.
        </p>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#0066FF]/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
