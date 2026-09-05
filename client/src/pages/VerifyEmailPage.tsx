import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import * as authApi from '../services/auth.api';
import { toApiError } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

/**
 * Landing page for the emailed verification link.
 *
 * authController.register builds the link as
 *   `${protocol}://${host}/verify-email?verificationToken=...`
 * which is served by the SPA fallback in app.js. The token arrives as a QUERY
 * parameter and must be posted back as one — this is why the app needs
 * BrowserRouter rather than the prototype's HashRouter.
 */
export const VerifyEmailPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('verificationToken');
  const { refresh } = useAuth();

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email…');

  // StrictMode double-invokes effects in development; the token is single-use,
  // so guard against firing the request twice.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token. Please use the link from your email.');
      return;
    }

    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Your email has been verified.');
        // The session may already exist from registration; pick up the new
        // isEmailVerified flag so the banner disappears.
        await refresh();
      } catch (e) {
        setStatus('error');
        setMessage(toApiError(e).message || 'That verification link is invalid or has expired.');
      }
    })();
  }, [token, refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xs border border-[#ECEFF3] text-center">
        <div className="flex justify-center mb-4">
          {status === 'pending' && <Loader2 className="w-12 h-12 text-[#FE6349] animate-spin" />}
          {status === 'success' && <CheckCircle className="w-12 h-12 text-emerald-500" />}
          {status === 'error' && <XCircle className="w-12 h-12 text-[#FE6349]" />}
        </div>

        <h1 className="text-xl font-extrabold text-[#1A1B25] mb-2">
          {status === 'pending' && 'Verifying your email'}
          {status === 'success' && 'Email verified'}
          {status === 'error' && 'We could not verify that link'}
        </h1>

        <p className="text-sm text-[#666D80] mb-6 leading-relaxed">{message}</p>

        {status !== 'pending' && (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="px-6 py-2.5 bg-[#FE6349] hover:bg-[#e05234] text-white font-bold rounded-full text-sm transition-all"
            >
              Continue to sign in
            </Link>
            {status === 'error' && (
              <Link to="/confirm-account" className="text-xs font-bold text-[#666D80] hover:underline">
                Send me a new link
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
