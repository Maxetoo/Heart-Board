import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import * as authApi from '../services/auth.api';
import { toApiError } from '../lib/api';
import { validatePassword } from '../components/AuthModal';

/**
 * Landing page for the emailed password-reset link:
 *   ${CLIENT_URL}/reset-password?token=...
 * Submits PATCH /auth/reset-password (a PATCH, not a POST).
 */
export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is missing its token. Please use the link from your email.');
      return;
    }

    const problem = validatePassword(newPassword);
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Those passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword, confirmPassword });
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xs border border-[#ECEFF3] text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-[#1A1B25] mb-2">Password updated</h1>
          <p className="text-sm text-[#666D80]">Taking you to sign in…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6">
      <form
        onSubmit={handleSubmit}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xs border border-[#ECEFF3]"
      >
        <h1 className="text-2xl font-extrabold text-[#1A1B25] mb-1.5">Choose a new password</h1>
        <p className="text-sm text-[#808897] mb-6">
          Must be at least 5 characters and include an uppercase letter, a lowercase letter, a
          number and a symbol.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-[#FE6349] text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A4ABB8]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              className="w-full pl-11 pr-11 py-3.5 bg-[#F8F9FB] rounded-2xl text-sm font-medium text-[#1A1B25] focus:outline-none focus:bg-[#ECEFF3]/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A4ABB8]"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A4ABB8]" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="w-full pl-11 pr-4 py-3.5 bg-[#F8F9FB] rounded-2xl text-sm font-medium text-[#1A1B25] focus:outline-none focus:bg-[#ECEFF3]/60"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 py-3.5 rounded-2xl bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-sm transition-all disabled:opacity-60"
        >
          {submitting ? 'Updating…' : 'Update password'}
        </button>

        <p className="text-center text-xs text-[#808897] mt-4">
          <Link to="/login" className="font-bold text-[#1A1B25] hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
};
