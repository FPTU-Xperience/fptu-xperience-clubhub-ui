import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { Menu } from 'lucide-react'
import { formatRole, PERMISSIONS } from '../auth/permissions'

const SEARCH_DESTINATIONS = [
  { label: 'Tổng quan', path: '/dashboard', permission: PERMISSIONS.VIEW_DASHBOARD, keywords: 'dashboard tổng quan trang chủ' },
  { label: 'Câu lạc bộ', path: '/clubs', permission: PERMISSIONS.VIEW_CLUBS, keywords: 'club thành viên đơn đăng ký' },
  { label: 'Báo cáo', path: '/reports', permission: PERMISSIONS.VIEW_REPORTS, keywords: 'report chỉ số hạn nộp' },
  { label: 'KPI', path: '/kpi', permission: PERMISSIONS.VIEW_KPI, keywords: 'kpi score performance ranking rating' },
  { label: 'Hoạt động', path: '/activities', permission: PERMISSIONS.VIEW_ACTIVITIES, keywords: 'activity sự kiện lịch' },
  { label: 'Tài chính', path: '/finance', permission: PERMISSIONS.VIEW_FINANCE, keywords: 'budget quyết toán' },
  { label: 'Thông báo', path: '/notifications', permission: PERMISSIONS.VIEW_NOTIFICATIONS, keywords: 'alert chưa đọc' },
  { label: 'Hồ sơ', path: '/profile', permission: PERMISSIONS.VIEW_PROFILE, keywords: 'tài khoản cài đặt' },
  { label: 'Người dùng', path: '/users', permission: PERMISSIONS.MANAGE_USERS, keywords: 'tài khoản vai trò' },
]

export default function Header({ title, onMenuClick }) {
  const navigate = useNavigate()
  const { user, logout, hasPermission } = useAuth()
  const { unreadCount } = useNotifications()
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const searchInputRef = useRef(null)

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return []

    return SEARCH_DESTINATIONS
      .filter(item => hasPermission(item.permission))
      .filter(item => `${item.label} ${item.keywords}`.toLowerCase().includes(query))
      .slice(0, 5)
  }, [hasPermission, searchQuery])

  useEffect(() => {
    const focusSearch = (event) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const tagName = event.target?.tagName?.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tagName)) return
      event.preventDefault()
      searchInputRef.current?.focus()
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const openSearchResult = (item) => {
    navigate(item.path)
    setSearchQuery('')
  }

  const handleSearchKeyDown = (event) => {
    if (event.key === 'Escape') {
      setSearchQuery('')
      event.currentTarget.blur()
      return
    }

    if (event.key === 'Enter' && searchResults[0]) {
      event.preventDefault()
      openSearchResult(searchResults[0])
    }
  }

  const currentTime = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const currentDate = now.toLocaleDateString('vi-VN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  const handleLogout = async () => {
    setShowProfileMenu(false)
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-[72px] vanguard-header flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Left - Hamburger, Title & Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 min-w-[200px]"
      >
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Mở menu điều hướng"
          title="Mở menu điều hướng"
          className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">{title || 'Tổng quan'}</h1>
        </div>
      </motion.div>

      {/* Center - Search */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="hidden md:flex items-center flex-1 max-w-xl mx-8"
      >
        <div className="relative w-full group">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Tìm kiếm trang..."
            aria-label="Tìm kiếm trang"
            autoComplete="off"
            className="w-full pl-10 pr-12 py-2.5 bg-white/[0.03] border border-white/5 rounded-[12px] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#83effa]/30 focus:bg-white/[0.05] focus:ring-1 focus:ring-[#83effa]/20 transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-500 group-focus-within:text-[#83effa] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-bold text-gray-500 bg-black/20 border border-white/5 rounded">
            /
          </kbd>
          {searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1a] shadow-2xl shadow-black/70">
              {searchResults.length > 0 ? searchResults.map(item => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => openSearchResult(item)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-white/5 hover:text-white"
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-600">Mở</span>
                </button>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500">Không tìm thấy trang phù hợp</p>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Right - Actions */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Date/Time Display */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="hidden xl:flex flex-col items-end mr-3 px-4 py-1 rounded-[10px] bg-white/[0.02] border border-white/5"
        >
          <span className="text-[13px] font-bold text-[#f8faff]">{currentTime}</span>
          <span className="text-[10px] text-gray-500 font-semibold">{currentDate}</span>
        </motion.div>

        {/* Notifications */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="relative p-2 rounded-xl text-gray-400 hover:text-[#83effa] hover:bg-[#83effa]/10 transition-all border border-transparent hover:border-[#83effa]/20"
          onClick={() => navigate('/notifications')}
          aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
          title="Thông báo"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-[18px] text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </motion.button>

        {/* User Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative ml-1 lg:ml-2"
          onMouseEnter={() => setShowProfileMenu(true)}
          onMouseLeave={() => setShowProfileMenu(false)}
        >
          <button
            type="button"
            onClick={() => setShowProfileMenu(current => !current)}
            className="relative block cursor-pointer"
            aria-label="Mở menu tài khoản"
            aria-expanded={showProfileMenu}
          >
            <div className="w-[34px] h-[34px] rounded-xl bg-gradient-to-br from-[#bff8ff] via-[#75e6f3] to-[#95a7ff] flex items-center justify-center font-bold text-[10px] text-[#081017] shadow-lg shadow-cyan-500/20">
              {user?.avatar || 'AC'}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#52e0bd] rounded-full border-[2px] border-[#05070d]" />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 p-3 rounded-[14px] bg-[#0a0f1a] border border-white/10 shadow-2xl shadow-black/80 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 pb-3 px-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#bff8ff] to-[#95a7ff] flex items-center justify-center text-[10px] font-bold text-[#081017]">
                    {user?.avatar || 'AC'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#f8faff] text-[13px] truncate">{user?.name || 'Người dùng'}</p>
                    <p className="text-[11px] text-gray-500 truncate">{user?.email || ''}</p>
                    <p className="mt-1 text-[11px] text-[#83effa] truncate">{user?.roles?.map(formatRole).join(', ') || ''}</p>
                  </div>
                </div>
                <div className="mt-2 space-y-0.5">
                  <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12px] font-medium text-gray-300 hover:text-[#f8faff] hover:bg-white/5 transition-colors">
                    <svg className="w-4 h-4 text-[#83effa]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Hồ sơ
                  </Link>
                  <button type="button" onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[12px] font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors">
                    <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </header>
  )
}
