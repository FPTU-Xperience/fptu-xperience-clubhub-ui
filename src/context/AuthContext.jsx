import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { hasPermission as userHasPermission, ROLES } from '../auth/permissions';

const AuthContext = createContext(null);
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [clubAccess, setClubAccess] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadClubAccess = useCallback(async (actor) => {
    if (!canLoadClubAccess(actor)) {
      setClubAccess([]);
      return [];
    }

    try {
      const access = await api.getMyClubAccess();
      const normalizedAccess = Array.isArray(access) ? access : [];
      setClubAccess(normalizedAccess);
      return normalizedAccess;
    } catch {
      setClubAccess([]);
      return [];
    }
  }, []);

  // Initialize from stored tokens on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          await loadClubAccess(parsedUser);
        } catch (e) {
          // Invalid stored data, clear it
          api.clearTokens();
          localStorage.removeItem('user');
          setClubAccess([]);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [loadClubAccess]);

  const login = useCallback(async (email) => {
    try {
      const response = await api.login(email);
      const userData = {
        id: response.user.id,
        username: response.user.username,
        name: response.user.fullName,
        email: response.user.email,
        roles: response.user.roles,
        isActive: response.user.isActive,
        isLocked: response.user.isLocked,
        avatar: response.user.fullName ? response.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U',
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      await loadClubAccess(userData);
      return userData;
    } catch (error) {
      console.error('Email login failed:', error);
      throw error;
    }
  }, [loadClubAccess]);

  const loginWithGoogle = useCallback(async (credential) => {
    try {
      const response = await api.loginWithGoogle(credential);

      const userData = {
        id: response.user.id,
        username: response.user.username,
        name: response.user.fullName,
        email: response.user.email,
        roles: response.user.roles,
        isActive: response.user.isActive,
        isLocked: response.user.isLocked,
        avatar: response.user.fullName ? response.user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U',
      };

      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      await loadClubAccess(userData);

      return userData;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }, [loadClubAccess]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout API errors
    } finally {
      api.clearTokens();
      localStorage.removeItem('user');
      setUser(null);
      setClubAccess([]);
      setIsAuthenticated(false);
    }
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
      {children}
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
