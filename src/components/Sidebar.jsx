import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { X } from 'lucide-react'
import { formatRole, PERMISSIONS } from '../auth/permissions'

const navItems = [
  {
    path: '/dashboard',
    name: 'Tổng quan',
    permission: PERMISSIONS.VIEW_DASHBOARD,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  },
  {
    path: '/clubs',
    name: 'Câu lạc bộ',
    permission: PERMISSIONS.VIEW_CLUBS,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0M7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    path: '/reports',
    name: 'Báo cáo',
    permission: PERMISSIONS.VIEW_REPORTS,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  {
    path: '/kpi',
    name: 'KPI',
    permission: PERMISSIONS.VIEW_KPI,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.5l4.5-4.5 4 4L20 4.5M16 4.5h4v4M5 20h14" />
      </svg>
    )
  },
  {
    path: '/activities',
    name: 'Hoạt động',
    permission: PERMISSIONS.VIEW_ACTIVITIES,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  {
    path: '/finance',
    name: 'Tài chính',
    permission: PERMISSIONS.VIEW_FINANCE,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  {
    path: '/notifications',
    name: 'Thông báo',
    permission: PERMISSIONS.VIEW_NOTIFICATIONS,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )
  },
  {
    path: '/profile',
    name: 'Hồ sơ',
    permission: PERMISSIONS.VIEW_PROFILE,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  {
    path: '/users',
    name: 'Người dùng',
    permission: PERMISSIONS.MANAGE_USERS,
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
]

export default function Sidebar({ isMobileOpen, setIsMobileOpen }) {
  const location = useLocation()
  const { user, logout, hasPermission } = useAuth()
  const { unreadCount } = useNotifications()
  const visibleNavItems = navItems.filter(item => hasPermission(item.permission))

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-[250px] transform transition-transform duration-300 vanguard-sidebar flex flex-col ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      
      {/* Logo Section */}
      <div className="h-[72px] flex items-center justify-between px-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3 w-full cursor-pointer">
          <div className="vanguard-brand-mark">
            <svg className="w-5 h-5 text-[#071015]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <strong className="block text-[18px] tracking-[0.12em] font-podium text-white leading-tight">CLUBHUB</strong>
          <small className="block mt-[3px] text-[9px] tracking-[0.22em] text-[#e6ecf8]/40 uppercase">HỆ THỐNG BÁO CÁO</small>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Đóng menu điều hướng"
          title="Đóng menu điều hướng"
          className="lg:hidden text-gray-400 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <p className="mx-6 mt-[15px] mb-[10px] text-[9px] font-semibold tracking-[0.28em] text-[#dde5f5]/35 uppercase">KHU VỰC LÀM VIỆC</p>

      {/* Navigation */}
      <nav className="flex-1 px-3.5 overflow-y-auto space-y-1 flex flex-col pb-4">
        {visibleNavItems.map((item) => {
          const badge = item.path === '/notifications' ? unreadCount : 0
          return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) => `vanguard-nav-item ${isActive ? 'is-active' : ''}`}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-[#83effa]' : 'opacity-80'}>
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium tracking-wide">{item.name}</span>
                {isActive && badge === 0 && <span className="vanguard-active-dot" />}
                {badge > 0 && (
                  <span className="ml-auto min-w-[24px] h-5 px-1.5 flex items-center justify-center text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
          )
        })}
        
        <div className="flex-1 min-h-[20px]"></div>

        {/* System Status / Availability */}
        <div className="vanguard-panel mx-1 mt-6 mb-3 p-3 flex items-center gap-2.5">
          <div className="vanguard-orb">
            <span />
          </div>
          <div>
            <strong className="block text-[11px] font-semibold text-[#f8faff]/90">Phiên an toàn</strong>
            <small className="block mt-1 text-[9px] text-[#dee6f5]/40">Đã bật phân quyền theo vai trò</small>
          </div>
        </div>

        {/* User Section */}
        <div className="vanguard-panel mx-1 p-3 flex items-center gap-2.5 group relative">
          <div className="w-[34px] h-[34px] rounded-[11px] bg-gradient-to-br from-[#bff8ff] via-[#75e6f3] to-[#95a7ff] flex items-center justify-center text-[#081017] font-bold text-[10px]">
            {user?.avatar || 'AC'}
          </div>
          <div className="flex-1 min-w-0">
            <strong className="block text-[11px] font-semibold text-[#f8faff]/90 truncate">{user?.name || 'Khách'}</strong>
            <small className="block mt-1 text-[9px] text-[#dee6f5]/40 truncate">{user?.roles?.map(formatRole).join(', ') || 'Khách'}</small>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Đăng xuất"
            className="text-gray-400 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 absolute right-3"
            title="Đăng xuất"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </nav>
    </aside>
  )
}
