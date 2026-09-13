import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { PERMISSIONS } from '../auth/permissions'

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000

function getNextActivityDate(activity, now = new Date()) {
  const status = activity.status?.toUpperCase()
  if (status === 'COMPLETED' || status === 'CANCELLED') return null

  const meetingDays = Array.isArray(activity.meetingDays)
    ? activity.meetingDays.map(Number).filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
    : []

  if (meetingDays.length === 0) {
    const start = new Date(activity.startTimeUtc)
    return Number.isNaN(start.getTime()) || start <= now ? null : start
  }

  const vietnamNow = new Date(now.getTime() + VIETNAM_OFFSET_MS)
  const scheduleStart = new Date(new Date(activity.startTimeUtc).getTime() + VIETNAM_OFFSET_MS)
  const todayValue = Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), vietnamNow.getUTCDate())
  const scheduleStartValue = Date.UTC(scheduleStart.getUTCFullYear(), scheduleStart.getUTCMonth(), scheduleStart.getUTCDate())

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateValue = todayValue + offset * 24 * 60 * 60 * 1000
    const candidate = new Date(candidateValue)
    if (candidateValue >= scheduleStartValue && meetingDays.includes(candidate.getUTCDay())) {
      return new Date(candidateValue - VIETNAM_OFFSET_MS)
    }
  }

  return null
}

function formatActivityDate(value) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(value)
}

export default function DashboardPage() {
  const { user, clubAccess, hasPermission } = useAuth()
  const { notifications } = useNotifications()
  const [data, setData] = useState({
    clubs: [],
    reports: [],
    activities: [],
    proposals: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadDashboard = async () => {
      const requests = [
        hasPermission(PERMISSIONS.VIEW_CLUBS) ? api.getClubs() : Promise.resolve([]),
        hasPermission(PERMISSIONS.VIEW_REPORTS) ? api.getReports({ page: 1, pageSize: 5 }) : Promise.resolve({ items: [] }),
        hasPermission(PERMISSIONS.VIEW_ACTIVITIES) ? api.getActivities() : Promise.resolve([]),
        hasPermission(PERMISSIONS.VIEW_FINANCE) ? api.getBudgetProposals({ page: 1, pageSize: 5 }) : Promise.resolve({ items: [] }),
      ]
      const results = await Promise.allSettled(requests)
      if (!active) return
      setData({
        clubs: results[0].status === 'fulfilled' && Array.isArray(results[0].value) ? results[0].value : [],
        reports: results[1].status === 'fulfilled' && Array.isArray(results[1].value?.items) ? results[1].value.items : [],
        activities: results[2].status === 'fulfilled' && Array.isArray(results[2].value) ? results[2].value : [],
        proposals: results[3].status === 'fulfilled' && Array.isArray(results[3].value?.items) ? results[3].value.items : [],
      })
      setIsLoading(false)
    }
    loadDashboard()
    return () => { active = false }
  }, [hasPermission])

  const approvedClubs = clubAccess.filter(access => access.isApprovedMember || access.isManager)
  const unreadNotifications = notifications.filter(item => !item.isRead)
  const upcomingActivities = data.activities
    .map(activity => ({ activity, nextDate: getNextActivityDate(activity) }))
    .filter(item => item.nextDate)
    .sort((a, b) => a.nextDate - b.nextDate)
    .slice(0, 4)
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.createdAtUtc) - new Date(a.createdAtUtc))
    .slice(0, 4)

  const cards = [
    { label: 'Câu lạc bộ có quyền truy cập', value: approvedClubs.length, color: 'text-cyan-300', href: '/clubs', show: hasPermission(PERMISSIONS.VIEW_CLUBS) },
    { label: 'Báo cáo có thể xem', value: data.reports.length, color: 'text-purple-300', href: '/reports', show: hasPermission(PERMISSIONS.VIEW_REPORTS) },
    { label: 'Hoạt động', value: data.activities.length, color: 'text-emerald-300', href: '/activities', show: hasPermission(PERMISSIONS.VIEW_ACTIVITIES) },
    { label: 'Thông báo chưa đọc', value: unreadNotifications.length, color: 'text-amber-300', href: '/notifications', show: hasPermission(PERMISSIONS.VIEW_NOTIFICATIONS) },
  ].filter(card => card.show)

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/60 to-purple-500/10 p-6 sm:p-8"
      >
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-300">ClubReportHub</p>
        <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Xin chào, {user?.name || user?.username}</h2>
      </motion.section>

      {isLoading ? (
        <div className="flex min-h-52 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" /></div>
      ) : (
        <>
          <section className={`grid gap-4 ${cards.length > 2 ? 'grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>
            {cards.map((card, index) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Link to={card.href} className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-cyan-500/30">
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">{card.label}</p>
                </Link>
              </motion.div>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            {hasPermission(PERMISSIONS.VIEW_ACTIVITIES) && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Hoạt động sắp tới</h3>
                  <Link to="/activities" className="text-sm font-semibold text-cyan-300">Xem tất cả</Link>
                </div>
                {upcomingActivities.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-gray-500">Chưa có hoạt động sắp tới.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {upcomingActivities.map(({ activity, nextDate }) => (
                      <div key={activity.id} className="rounded-xl bg-slate-950/50 p-4">
                        <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{activity.title}</p><p className="mt-1 text-xs text-cyan-300">{activity.clubName}</p></div><time className="text-right text-xs text-gray-500">{formatActivityDate(nextDate)}</time></div>
                        {activity.meetingDays?.length > 0 && <p className="mt-2 text-xs text-amber-300">Lịch hằng tuần, giờ Việt Nam</p>}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {hasPermission(PERMISSIONS.VIEW_NOTIFICATIONS) && (
              <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Thông báo gần đây</h3>
                  <Link to="/notifications" className="text-sm font-semibold text-cyan-300">Xem tất cả</Link>
                </div>
                {recentNotifications.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-gray-500">Chưa có thông báo.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {recentNotifications.map(notification => (
                      <Link key={notification.id} to="/notifications" className="block rounded-xl bg-slate-950/50 p-4 transition hover:bg-slate-950/80">
                        <div className="flex items-start gap-3">
                          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-slate-600' : 'bg-cyan-400'}`} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold text-white">{notification.title}</p>
                              <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm text-gray-400">{notification.message}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </>
      )}
    </div>
  )
}
