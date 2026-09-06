import React, { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import App from '../App';
import { AccountSetupPage } from '../pages/AccountSetupPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { useAuth } from '../contexts/AuthContext';

/** Scrolls to the top whenever the path changes. */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

/**
 * Forces a signed-in account with no username through /account-setup.
 *
 * The backend leaves `username` optional, but profile URLs, @handles and
 * board-recipient lookups all require one — and a Google OAuth account never
 * has one on first sign-in. Ported from the old frontend's RequireProfileSetup.
 */
const RequireProfileSetup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready, isAuthenticated, needsProfileSetup } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Paths that must stay reachable while setup is incomplete.
  const exempt =
    pathname.startsWith('/account-setup') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/confirm-account');

  useEffect(() => {
    if (!ready || exempt) return;
    if (isAuthenticated && needsProfileSetup) {
      navigate('/account-setup', { replace: true });
    }
  }, [ready, exempt, isAuthenticated, needsProfileSetup, navigate]);

  return <>{children}</>;
};

/**
 * Route table.
 *
 * Everything that is not a standalone auth screen renders <App />, which
 * derives its own view from the URL (see useUrlSync in App.tsx). That keeps the
 * existing single-component structure while making profiles, hashtags and
 * boards addressable, shareable and refreshable.
 */
export const AppRoutes: React.FC = () => (
  <>
    <ScrollToTop />
    <RequireProfileSetup>
      <Routes>
        {/* Standalone auth screens */}
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage mode="reset" />} />
        <Route path="/confirm-account" element={<ForgotPasswordPage mode="verify" />} />
        <Route path="/account-setup" element={<AccountSetupPage />} />

        {/* Legacy alias from the old frontend */}
        <Route path="/discover" element={<Navigate to="/" replace />} />

        {/* Everything else is the main application shell */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<App />} />
        <Route path="/signup" element={<App />} />
        <Route path="/profile" element={<App />} />
        <Route path="/profile/:username" element={<App />} />
        <Route path="/hashtag/:tag" element={<App />} />
        <Route path="/board/:slug" element={<App />} />
        <Route path="/board/:slug/add-message" element={<App />} />
        <Route path="/board/:slug/edit" element={<App />} />
        <Route path="/message/:id/edit" element={<App />} />
        <Route path="/create" element={<App />} />
        <Route path="*" element={<App />} />
      </Routes>
    </RequireProfileSetup>
  </>
);
