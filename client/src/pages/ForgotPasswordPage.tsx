import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle } from 'lucide-react';
import * as authApi from '../services/auth.api';
import { toApiError } from '../lib/api';

interface Props {
  /** 'reset' -> forgot password; 'verify' -> resend the verification email. */
  mode: 'reset' | 'verify';
}

/**
 * Shared screen for the two "send me an email" flows:
 *   /forgot-password  -> POST /auth/forgot-password
 *   /confirm-account  -> POST /auth/resend-verification-email
 *
 * Both endpoints deliberately return the same message whether or not the
 * address exists, so the copy here must not imply the account was found.
 */
export const ForgotPasswordPage: React.FC<Props> = ({ mode }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isReset = mode === 'reset';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setSubmitting(true);
    try {
      const res = isReset
        ? await authApi.forgotPassword(email.trim())
        : await authApi.resendVerificationEmail(email.trim());
      setMessage(res.message);
      setSent(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xs border border-[#ECEFF3] text-center">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-[#1A1B25] mb-2">Check your inbox</h1>
          <p className="text-sm text-[#666D80] mb-6 leading-relaxed">{message}</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2.5 bg-[#FE6349] hover:bg-[#e05234] text-white font-bold rounded-full text-sm"
          >
            Back to sign in
          </Link>
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
        <h1 className="text-2xl font-extrabold text-[#1A1B25] mb-1.5">
          {isReset ? 'Reset your password' : 'Resend verification link'}
        </h1>
        <p className="text-sm text-[#808897] mb-6">
          {isReset
            ? "Enter your email and we'll send you a link to choose a new password."
            : "Enter your email and we'll send you a fresh verification link."}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 text-[#FE6349] text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A4ABB8]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full pl-11 pr-4 py-3.5 bg-[#F8F9FB] rounded-2xl text-sm font-medium text-[#1A1B25] focus:outline-none focus:bg-[#ECEFF3]/60"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 py-3.5 rounded-2xl bg-[#FE6349] hover:bg-[#e05234] text-white font-extrabold text-sm transition-all disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send link'}
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
