'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createSupabaseBrowser();
  const supabaseMissing = !supabase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
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
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
            <p className="text-gray-500 mt-1">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {success ? (
            <div className="p-8">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Check your email</span>
                </div>
                <p className="mt-2 text-sm">
                  We&apos;ve sent a password reset link to <strong>{email}</strong>
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" fullWidth>
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {supabaseMissing && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium">Supabase غير مُعد</p>
                  <p className="mt-1">أضف متغيرات Supabase في <code className="bg-amber-100 px-1 rounded">.env.local</code> لاستخدام استعادة كلمة المرور.</p>
                </div>
              )}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Button type="submit" fullWidth size="lg" isLoading={isLoading} disabled={supabaseMissing}>
                Send Reset Link
              </Button>

              <p className="text-center text-gray-600 text-sm">
                Remember your password?{' '}
                <Link href="/login" className="text-[#0066FF] font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>

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
