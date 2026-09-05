import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { UNAUTHORIZED_EVENT, toApiError } from '../lib/api';
import { userToRegisteredUser } from '../lib/adapters';
import * as authApi from '../services/auth.api';
import * as userApi from '../services/user.api';
import type { UserDTO } from '../types/api';
import type { RegisteredUser } from '../types';

interface AuthState {
  user: RegisteredUser | null;
  /** The raw server document, for fields the view model does not carry. */
  rawUser: UserDTO | null;
  loading: boolean;
  /** True once the initial /user/me check has settled. */
  ready: boolean;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  /** Signed in but has not chosen a username yet -> must complete /account-setup. */
  needsProfileSetup: boolean;
  isEmailVerified: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<string>;
  logout(): Promise<void>;
  refresh(): Promise<RegisteredUser | null>;
  loginWithGoogle(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Optional render-optimisation cache. The cookie on the server is the ONLY
 * authority for identity; this just avoids a signed-out flash on first paint
 * and is always re-validated by /user/me on mount.
 */
const CACHE_KEY = 'heartboard_current_user';

function readCache(): RegisteredUser | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as RegisteredUser) : null;
  } catch {
    return null;
  }
}

function writeCache(user: RegisteredUser | null) {
  try {
    if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    /* private mode / blocked storage — non-fatal */
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: readCache(),
    rawUser: null,
    loading: true,
    ready: false,
  });

  const applyUser = useCallback((dto: UserDTO | null) => {
    const view = dto ? userToRegisteredUser(dto) : null;
    writeCache(view);
    setState({ user: view, rawUser: dto, loading: false, ready: true });
    return view;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const dto = await userApi.getMyProfile();
      return applyUser(dto);
    } catch (e) {
      // 401 is the normal signed-out state, not an error worth surfacing.
      const err = toApiError(e);
      if (err.status !== 401 && !err.isNetworkError) {
        console.warn('Failed to load profile:', err.message);
      }
      return applyUser(null);
    }
  }, [applyUser]);

  // Initial session check.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Any 401 anywhere means the cookie expired or was cleared.
  useEffect(() => {
    const onUnauthorized = () => {
      setState((s) => (s.user ? { ...s, user: null, rawUser: null } : s));
      writeCache(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true }));
      try {
        await authApi.login(email, password);
        // The login response carries a partial user; fetch the full profile so
        // stats, username and verification status are populated.
        await refresh();
      } catch (e) {
        setState((s) => ({ ...s, loading: false }));
        throw toApiError(e);
      }
    },
    [refresh],
  );

  /**
   * The response body carries only a message, but authController.register also
   * calls createCookies(), so the user IS signed in straight after registering
   * — just with isEmailVerified false. Refresh so the session is picked up and
   * the account-setup gate can run.
   */
  const register = useCallback(
    async (email: string, password: string) => {
      setState((s) => ({ ...s, loading: true }));
      try {
        const res = await authApi.register(email, password);
        await refresh();
        return res.message;
      } catch (e) {
        setState((s) => ({ ...s, loading: false }));
        throw toApiError(e);
      }
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* clear locally regardless */
    }
    applyUser(null);
  }, [applyUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.user),
      needsProfileSetup: Boolean(state.user && !state.rawUser?.username),
      isEmailVerified: state.rawUser?.isEmailVerified !== false,
      login,
      register,
      logout,
      refresh,
      loginWithGoogle: authApi.startGoogleLogin,
    }),
    [state, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
