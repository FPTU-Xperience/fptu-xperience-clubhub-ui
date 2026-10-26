import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, session } from '../services/api';
import { observeSession } from '../services/session-client.js';
import { hasPermission as userHasPermission, ROLES } from '../auth/permissions';
import { PersonalMediaProvider } from '../components/media/PersonalMediaContext';

const AuthContext = createContext(null);
// Local-only escape hatch while backend authentication is unavailable during UI work.
// `import.meta.env.DEV` keeps this impossible to enable in a production build.
const AUTH_BYPASS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DISABLE_AUTH === 'true';
const BYPASS_USER = Object.freeze({
  id: 'local-dev-admin',
  username: 'local-dev-admin',
  name: 'Local development admin',
  email: 'local-dev-admin@fpt.edu.vn',
  roles: [ROLES.ADMIN],
  isActive: true,
  isLocked: false,
  avatar: 'LD',
});
const CLUB_ACCESS_ROLES = new Set([
  ROLES.ADMIN,
  ROLES.STUDENT_AFFAIRS_ADMIN,
  ROLES.CLUB_MANAGER,
  ROLES.TREASURER,
  ROLES.CLUB_MEMBER,
]);

function canLoadClubAccess(actor) {
  return actor?.roles?.some(role => CLUB_ACCESS_ROLES.has(role)) || false;
}

function toAuthUser(summary) {
  return {
    id: summary.id,
    username: summary.username,
    name: summary.fullName,
    email: summary.email,
    roles: summary.roles,
    isActive: summary.isActive,
    isLocked: summary.isLocked,
    avatar: summary.fullName ? summary.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U',
    avatarUrl: summary.avatarUrl || '',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(AUTH_BYPASS_ENABLED ? BYPASS_USER : null);
  const [clubAccess, setClubAccess] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(AUTH_BYPASS_ENABLED);
  const [loading, setLoading] = useState(!AUTH_BYPASS_ENABLED);
  const [authError, setAuthError] = useState('');

  const loadClubAccess = useCallback(async (actor) => {
    const sessionId = session.read()?.id;
    if (!canLoadClubAccess(actor)) {
      setClubAccess([]);
      return [];
    }

    try {
      const access = await api.getMyClubAccess();
      if (session.read()?.id !== sessionId) return [];
      const normalizedAccess = Array.isArray(access) ? access : [];
      setClubAccess(normalizedAccess);
      return normalizedAccess;
    } catch {
      if (session.read()?.id === sessionId) setClubAccess([]);
      return [];
    }
  }, []);

  useEffect(() => {
    if (AUTH_BYPASS_ENABLED) return undefined;
    return observeSession(session, {
      loadUser: () => api.getCurrentUser(),
      onUser: (actor, pending) => {
        const currentUser = actor ? toAuthUser(actor) : null;
        setUser(currentUser);
        setIsAuthenticated(Boolean(currentUser));
        setLoading(pending);
        setClubAccess([]);
        if (currentUser) {
          setAuthError('');
          localStorage.setItem('user', JSON.stringify(currentUser));
          loadClubAccess(currentUser);
        }
      },
      onError: (error) => setAuthError(error?.message || 'Không thể xác minh tài khoản sau đăng nhập. Vui lòng thử lại.'),
    });
  }, [loadClubAccess]);

  const login = useCallback(async (email, password) => {
    if (AUTH_BYPASS_ENABLED) return BYPASS_USER;

    try {
      const response = await api.login(email, password);
      const userData = toAuthUser(response.user);

      return userData;
    } catch (error) {
      console.error('Email login failed:', error);
      throw error;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    if (AUTH_BYPASS_ENABLED) return BYPASS_USER;

    try {
      const response = await api.loginWithGoogle(credential);

      const userData = toAuthUser(response.user);

      return userData;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (AUTH_BYPASS_ENABLED) return;

    await api.logout();
  }, []);

  const updateProfile = useCallback((updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role) || false;
  }, [user]);

  const isAdmin = useCallback(() => {
    return hasRole(ROLES.ADMIN);
  }, [hasRole]);

  const isClubManager = useCallback(() => {
    return hasRole(ROLES.CLUB_MANAGER) || clubAccess.some(access => access.isManager);
  }, [clubAccess, hasRole]);

  const isTreasurer = useCallback(() => {
    return hasRole(ROLES.TREASURER) || clubAccess.some(access => access.isTreasurer);
  }, [clubAccess, hasRole]);

  const hasPermission = useCallback((permission) => {
    return userHasPermission(user, clubAccess, permission);
  }, [clubAccess, user]);

  const refreshClubAccess = useCallback(() => loadClubAccess(user), [loadClubAccess, user]);

  return (
    <AuthContext.Provider value={{
      user,
      clubAccess,
      isAuthenticated,
      loading,
      authError,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      hasRole,
      hasPermission,
      isAdmin,
      isClubManager,
      isTreasurer,
      refreshClubAccess,
      api,
    }}>
      <PersonalMediaProvider key={user?.id || user?.email || 'anonymous'} user={user} api={api}>
        {children}
      </PersonalMediaProvider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
