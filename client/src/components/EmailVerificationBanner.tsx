import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as authApi from '../services/auth.api';

/**
 * Persistent nudge for signed-in accounts that have not verified their email.
 *
 * Registration signs the user in immediately (authController.register calls
 * createCookies), so an unverified session is a normal state that needs
 * surfacing. Ported from the old frontend's EmailVerificationBanner.
 */
export const EmailVerificationBanner: React.FC = () => {
  const { user, rawUser, isEmailVerified } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || isEmailVerified || dismissed) return null;

  const email = rawUser?.email;

  const handleResend = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      await authApi.resendVerificationEmail(email);
      setSent(true);
    } catch {
      // The endpoint is intentionally vague; a failure here is not actionable
      // for the user beyond trying again.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 text-amber-900">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <p className="text-xs font-semibold flex-1">
        {sent
          ? 'Verification link sent. Check your inbox.'
          : 'Please verify your email address to unlock everything.'}
      </p>
      {!sent && (
        <button
          type="button"
          onClick={handleResend}
          disabled={sending}
          className="text-xs font-extrabold underline hover:no-underline disabled:opacity-50 shrink-0"
        >
          {sending ? 'Sending…' : 'Resend link'}
        </button>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 p-1 hover:bg-amber-100 rounded-full"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
