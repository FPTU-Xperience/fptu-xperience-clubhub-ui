import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PERMISSIONS } from '../auth/permissions'
import { api } from '../services/api'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { isAuthenticated, loading: authLoading, hasPermission, user } = useAuth()
  const canViewNotifications = isAuthenticated && hasPermission(PERMISSIONS.VIEW_NOTIFICATIONS)
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const refreshNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!canViewNotifications) {
      setNotifications([])
      setLoadError(null)
      setIsLoading(false)
      return []
    }

    if (!silent) setIsLoading(true)
    try {
      const result = await api.getNotifications(false)
      const rows = Array.isArray(result) ? result : []
      setNotifications(rows)
      setLoadError(null)
      return rows
    } catch (error) {
      setLoadError(error)
      throw error
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [canViewNotifications])

  useEffect(() => {
    if (authLoading) return
    refreshNotifications().catch(() => {})

    if (!canViewNotifications) return undefined

    const refreshSilently = () => refreshNotifications({ silent: true }).catch(() => {})
    const intervalId = window.setInterval(refreshSilently, 15000)
    const handleFocus = () => refreshSilently()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshSilently()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [authLoading, canViewNotifications, refreshNotifications, user?.id])

  const markNotificationRead = useCallback(async (id) => {
    await api.markNotificationRead(id)
    setNotifications(current => current.map(item =>
      item.id === id ? { ...item, isRead: true } : item,
    ))
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    await api.markAllNotificationsRead()
    setNotifications(current => current.map(item => ({ ...item, isRead: true })))
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.isRead).length,
    [notifications],
  )

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      loadError,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
