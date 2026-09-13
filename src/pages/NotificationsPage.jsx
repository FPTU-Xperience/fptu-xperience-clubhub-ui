import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { useNotifications } from '../context/NotificationContext'
import { useToast } from '../context/ToastContext'
import { formatDateTime, formatEventType, formatRole } from '../locales/vi'

const formatDate = value => formatDateTime(value)

function getRelatedPath(eventType = '') {
  if (eventType.startsWith('activity.')) return '/activities'
  if (eventType.startsWith('report.') || eventType.startsWith('export.')) return '/reports'
  if (eventType.startsWith('club.')) return '/clubs'
  if (eventType.startsWith('budget.') || eventType.startsWith('settlement.')) return '/finance'
  if (eventType.startsWith('user.')) return '/profile'
  return null
}

function formatRecipient(notification) {
  if (notification?.recipientUserId) return 'Thông báo cá nhân'
  if (notification?.recipientRole) {
    return `Vai trò: ${formatRole(notification.recipientRole)}`
  }
  return 'Thông báo hệ thống'
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const {
    notifications,
    unreadCount,
    isLoading,
    loadError,
    markNotificationRead,
    markAllNotificationsRead,
  } = useNotifications()
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  useEffect(() => {
    if (loadError) {
      error(loadError.message || 'Không thể tải thông báo.')
    }
  }, [error, loadError])

  const filtered = useMemo(() => notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead
    if (filter === 'read') return notification.isRead
    return true
  }), [filter, notifications])
  const selectedNotification = useMemo(
    () => notifications.find(notification => notification.id === selectedId) || null,
    [notifications, selectedId],
  )

  const markRead = async (notification) => {
    if (notification.isRead || busyId) return
    setBusyId(notification.id)
    try {
      await markNotificationRead(notification.id)
    } catch (err) {
      error(err.message || 'Không thể đánh dấu thông báo đã đọc.')
    } finally {
      setBusyId(null)
    }
  }

  const markAllRead = async () => {
    if (unreadCount === 0 || busyId) return
    setBusyId('all')
    try {
      await markAllNotificationsRead()
      success('Đã đánh dấu tất cả thông báo là đã đọc.')
    } catch (err) {
      error(err.message || 'Không thể đánh dấu tất cả thông báo đã đọc.')
    } finally {
      setBusyId(null)
    }
  }

  const openDetails = (notification) => {
    setSelectedId(notification.id)
    if (!notification.isRead) markRead(notification)
  }

  const relatedPath = getRelatedPath(selectedNotification?.eventType)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Thông báo</h2>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          disabled={unreadCount === 0 || Boolean(busyId)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busyId === 'all' ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          ['all', `Tất cả (${notifications.length})`],
          ['unread', `Chưa đọc (${unreadCount})`],
          ['read', `Đã đọc (${notifications.length - unreadCount})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              filter === value
                ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300'
                : 'border-slate-800 bg-slate-900 text-gray-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex min-h-56 items-center justify-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-14 text-center text-gray-500">
          Không có thông báo trong nhóm này.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notification, index) => (
            <motion.button
              key={notification.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.025 }}
              onClick={() => openDetails(notification)}
              disabled={busyId === notification.id}
              className={`w-full rounded-2xl border p-4 text-left transition sm:p-5 ${
                notification.isRead
                  ? 'border-slate-800 bg-slate-900/45'
                  : 'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-600' : 'bg-cyan-400'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className={`text-sm font-bold sm:text-base ${notification.isRead ? 'text-gray-300' : 'text-white'}`}>
                      {notification.title}
                    </h3>
                    <time className="shrink-0 text-xs text-gray-500">{formatDate(notification.createdAtUtc)}</time>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{notification.message}</p>
                  <span className="mt-3 inline-flex rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {formatEventType(notification.eventType)}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedNotification)}
        onClose={() => setSelectedId(null)}
        title="Chi tiết thông báo"
        size="md"
      >
        {selectedNotification && (
          <div className="space-y-5 text-neutral-700">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-700">
                  {formatEventType(selectedNotification.eventType)}
                </span>
                <h4 className="mt-3 text-xl font-bold text-neutral-900">{selectedNotification.title}</h4>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                selectedNotification.isRead
                  ? 'bg-neutral-100 text-neutral-600'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc'}
              </span>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                {selectedNotification.message}
              </p>
            </div>

            <dl className="grid gap-4 rounded-xl border border-neutral-200 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Thời gian nhận</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-800">{formatDate(selectedNotification.createdAtUtc)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Người nhận</dt>
                <dd className="mt-1 text-sm font-medium capitalize text-neutral-800">{formatRecipient(selectedNotification)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Mã thông báo</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-800">#{selectedNotification.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Loại sự kiện</dt>
                <dd className="mt-1 text-sm font-medium text-neutral-800">{formatEventType(selectedNotification.eventType)}</dd>
              </div>
            </dl>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Đóng
              </button>
              {relatedPath && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(null)
                    navigate(relatedPath)
                  }}
                  className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500"
                >
                  Mở trang liên quan
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
