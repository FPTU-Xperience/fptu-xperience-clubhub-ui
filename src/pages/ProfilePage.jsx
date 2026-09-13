import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { formatRole } from '../auth/permissions'

import SystemAdminProfile from '../features/profile/SystemAdminProfile'

function ExistingProfile() {
  const { user, clubAccess } = useAuth()
  const approvedClubs = clubAccess.filter(access => access.isApprovedMember || access.isManager)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Hồ sơ tài khoản</h2>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 text-center"
        >
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 p-1">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-950 text-3xl font-bold text-white">
              {user?.avatar || '?'}
            </div>
          </div>
          <h3 className="mt-5 text-xl font-bold text-white">{user?.name || 'Người dùng'}</h3>
          <p className="mt-1 text-sm text-cyan-300">@{user?.username || ''}</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${user?.isActive && !user?.isLocked ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="text-sm text-gray-300">
              {user?.isLocked ? 'Đã khóa' : user?.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
            </span>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6 lg:col-span-2"
        >
          <h3 className="text-lg font-bold text-white">Thông tin tài khoản</h3>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <dt className="text-xs uppercase tracking-wider text-gray-500">Họ và tên</dt>
              <dd className="mt-2 break-words font-semibold text-white">{user?.name || '-'}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <dt className="text-xs uppercase tracking-wider text-gray-500">Thư điện tử</dt>
              <dd className="mt-2 break-words font-semibold text-white">{user?.email || '-'}</dd>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-gray-500">Vai trò hệ thống</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {(user?.roles || []).map(role => (
                  <span key={role} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-200">
                    {formatRole(role)}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </motion.section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/65 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Câu lạc bộ đã duyệt</h3>
          </div>
          <Link to="/clubs" className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-center text-sm font-semibold text-cyan-300">
            Xem câu lạc bộ
          </Link>
        </div>

        {approvedClubs.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center text-gray-500">
            Tài khoản này chưa thuộc câu lạc bộ nào.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {approvedClubs.map(access => (
              <div key={access.clubId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="font-semibold text-white">{access.clubName}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {access.isManager && <span className="rounded-full bg-purple-500/15 px-2.5 py-1 text-purple-300">Chủ nhiệm</span>}
                  {access.isTreasurer && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-300">Thủ quỹ</span>}
                  {access.isApprovedMember && <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300">Thành viên</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  
  const isSystemAdmin = user?.roles?.includes('SYSTEM_ADMIN')
  
  return isSystemAdmin ? (
    <SystemAdminProfile user={user} />
  ) : (
    <ExistingProfile />
  )
}
