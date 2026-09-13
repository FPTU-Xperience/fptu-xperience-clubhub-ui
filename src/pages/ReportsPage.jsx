import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, CheckCircle2, ChevronRight, FilePlus2, FileText, Pencil, Search, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { PERMISSIONS } from '../auth/permissions'
import ReportStatusBadge, { normalizeReportStatus, reportStatusLabel } from '../components/reports/ReportStatusBadge'
import { formatDate as formatViDate, formatReportType } from '../locales/vi'

const FILTERS = ['ALL', 'DRAFT', 'SUBMITTED', 'UNDERREVIEW', 'APPROVED', 'REJECTED']

function asDate(value) {
  const date = value ? new Date(value) : null
  return date && !Number.isNaN(date.valueOf()) ? date : null
}

function formatDate(value) {
  const date = asDate(value)
  return date ? formatViDate(date) : 'Chưa cập nhật'
}

function daysUntil(value) {
  const date = asDate(value)
  if (!date) return null
  return Math.ceil((date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000)
}

function deriveSummary(reports, remoteSummary) {
  const counts = reports.reduce((acc, report) => {
    const status = normalizeReportStatus(report.status)
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  return {
    total: remoteSummary?.total ?? reports.length,
    draft: remoteSummary?.draft ?? counts.DRAFT ?? 0,
    submitted: remoteSummary?.submitted ?? counts.SUBMITTED ?? 0,
    underReview: remoteSummary?.underReview ?? counts.UNDERREVIEW ?? 0,
    approved: remoteSummary?.approved ?? counts.APPROVED ?? 0,
    rejected: remoteSummary?.rejected ?? counts.REJECTED ?? 0,
    dueSoon: reports.filter((report) => {
      const due = daysUntil(report.dueDate)
      return due !== null && due >= 0 && due <= 7 && !['APPROVED', 'REJECTED'].includes(normalizeReportStatus(report.status))
    }).length,
  }
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const { clubAccess, hasPermission } = useAuth()
  const { error } = useToast()
  const canCreateReport = hasPermission(PERMISSIONS.AUTHOR_REPORTS)
  const isManager = clubAccess.some((access) => access.isManager)

  const [reports, setReports] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [clubFilter, setClubFilter] = useState('ALL')
  const [periodFilter, setPeriodFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState('UPDATED')

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const [listResult, summaryResult] = await Promise.all([
        api.getReports({ page: 1, pageSize: 100 }),
        api.getReportSummary().catch(() => null),
      ])
      setReports(Array.isArray(listResult?.items) ? listResult.items : Array.isArray(listResult) ? listResult : [])
      setSummary(summaryResult || null)
    } catch (err) {
      error(err.message || 'Không thể tải danh sách báo cáo.')
    } finally {
      setIsLoading(false)
    }
  }, [error])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const clubs = useMemo(() => [...new Set(reports.map((report) => report.clubName).filter(Boolean))].sort(), [reports])
  const periods = useMemo(() => [...new Set(reports.map((report) => report.period).filter(Boolean))].sort().reverse(), [reports])
  const reportTypes = useMemo(() => [...new Set(reports.map((report) => report.reportType).filter(Boolean))].sort(), [reports])
  const overview = useMemo(() => deriveSummary(reports, summary), [reports, summary])

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return reports
      .filter((report) => {
        const matchesQuery = !query || [report.id, report.clubName, report.period, report.reportType]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
        return matchesQuery
          && (statusFilter === 'ALL' || normalizeReportStatus(report.status) === statusFilter)
          && (clubFilter === 'ALL' || report.clubName === clubFilter)
          && (periodFilter === 'ALL' || report.period === periodFilter)
          && (typeFilter === 'ALL' || report.reportType === typeFilter)
      })
      .sort((a, b) => {
        if (sortBy === 'DEADLINE') return (asDate(a.dueDate)?.valueOf() || Infinity) - (asDate(b.dueDate)?.valueOf() || Infinity)
        if (sortBy === 'CLUB') return (a.clubName || '').localeCompare(b.clubName || '')
        return (asDate(b.updatedAtUtc || b.submittedAtUtc || b.createdAtUtc)?.valueOf() || 0) - (asDate(a.updatedAtUtc || a.submittedAtUtc || a.createdAtUtc)?.valueOf() || 0)
      })
  }, [reports, searchQuery, statusFilter, clubFilter, periodFilter, typeFilter, sortBy])

  const hasFilters = searchQuery || statusFilter !== 'ALL' || clubFilter !== 'ALL' || periodFilter !== 'ALL' || typeFilter !== 'ALL' || sortBy !== 'UPDATED'
  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('ALL')
    setClubFilter('ALL')
    setPeriodFilter('ALL')
    setTypeFilter('ALL')
    setSortBy('UPDATED')
  }

  const metrics = [
    { label: 'Tổng báo cáo', value: overview.total, helper: 'Tất cả kỳ báo cáo', tone: 'text-slate-100', icon: FileText },
    { label: 'Cần xử lý', value: overview.draft + overview.rejected, helper: `${overview.draft} bản nháp, ${overview.rejected} cần chỉnh sửa`, tone: 'text-amber-200', icon: FilePlus2 },
    { label: 'Chờ xét duyệt', value: overview.submitted + overview.underReview, helper: 'Đã nộp hoặc đang xét duyệt', tone: 'text-sky-200', icon: CalendarClock },
    { label: 'Đã duyệt', value: overview.approved, helper: 'Đã hoàn tất xét duyệt', tone: 'text-emerald-200', icon: CheckCircle2 },
    { label: 'Sắp đến hạn', value: overview.dueSoon, helper: 'Trong 7 ngày tới', tone: 'text-rose-200', icon: CalendarClock },
  ]

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pb-10">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/75 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-orbitron text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Quản lý báo cáo</h1>
        </div>
        {canCreateReport && isManager && (
          <button onClick={() => navigate('/reports/create')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 active:translate-y-px">
            <FilePlus2 size={18} strokeWidth={2} />
            Tạo báo cáo mới
          </button>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(({ label, value, helper, tone, icon: Icon }) => (
          <div key={label} className="min-h-[132px] rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-300">{label}</p>
              <Icon size={18} className="text-cyan-300" strokeWidth={1.75} />
            </div>
            <p className={`mt-4 font-orbitron text-3xl font-bold ${tone}`}>{value}</p>
            <p className="mt-2 text-sm text-slate-500">{helper}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo mã, câu lạc bộ, kỳ hoặc loại báo cáo" className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 pl-10 pr-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-wrap">
            <select value={clubFilter} onChange={(event) => setClubFilter(event.target.value)} className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"><option value="ALL">Tất cả câu lạc bộ</option>{clubs.map((club) => <option key={club} value={club}>{club}</option>)}</select>
            <select value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)} className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"><option value="ALL">Tất cả kỳ</option>{periods.map((period) => <option key={period} value={period}>{period}</option>)}</select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"><option value="ALL">Tất cả loại</option>{reportTypes.map((type) => <option key={type} value={type}>{formatReportType(type)}</option>)}</select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-11 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-300 focus:border-cyan-400 focus:outline-none"><option value="UPDATED">Cập nhật gần nhất</option><option value="DEADLINE">Hạn gần nhất</option><option value="CLUB">Tên câu lạc bộ</option></select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3">
          <SlidersHorizontal size={16} className="text-slate-500" />
          {FILTERS.map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${statusFilter === status ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>{status === 'ALL' ? 'Tất cả trạng thái' : reportStatusLabel(status)}</button>)}
          {hasFilters && <button onClick={clearFilters} className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-100"><X size={16} /> Xóa bộ lọc</button>}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/75">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div><h2 className="text-lg font-semibold text-slate-100">Danh sách báo cáo</h2><p className="mt-1 text-sm text-slate-500">{isLoading ? 'Đang tải dữ liệu' : `${filteredReports.length} báo cáo phù hợp`}</p></div>
          <button onClick={loadReports} className="text-sm font-medium text-cyan-300 hover:text-cyan-200">Làm mới</button>
        </div>
        {isLoading ? <div className="space-y-3 p-5">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-slate-800/60" />)}</div> : filteredReports.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center"><FileText size={36} className="text-slate-600" /><h3 className="mt-4 text-lg font-semibold text-slate-200">Không tìm thấy báo cáo</h3><p className="mt-2 max-w-md text-sm text-slate-500">Hãy điều chỉnh bộ lọc hoặc tạo báo cáo đầu tiên cho kỳ hiện tại.</p>{hasFilters && <button onClick={clearFilters} className="mt-4 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Xóa bộ lọc</button>}</div>
        ) : (
          <div className="overflow-x-auto"><table className="min-w-[1050px] w-full text-left"><thead className="bg-slate-950/60 text-xs font-semibold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3.5">Báo cáo</th><th className="px-4 py-3.5">Kỳ và loại</th><th className="px-4 py-3.5">Hoạt động</th><th className="px-4 py-3.5">Hạn nộp</th><th className="px-4 py-3.5">Cập nhật</th><th className="px-4 py-3.5">Trạng thái</th><th className="px-5 py-3.5 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-800/80">
            {filteredReports.map((report) => {
              const status = normalizeReportStatus(report.status)
              const canEdit = clubAccess.some((access) => access.clubId === report.clubId && access.isManager) && ['DRAFT', 'REJECTED'].includes(status)
              const dueIn = daysUntil(report.dueDate)
              const needsAttention = ['DRAFT', 'REJECTED'].includes(status) || (dueIn !== null && dueIn <= 7 && dueIn >= 0)
              return <tr key={report.id} className={`group transition hover:bg-cyan-400/[0.035] ${needsAttention ? 'bg-amber-400/[0.018]' : ''}`}><td className="px-5 py-4"><p className="font-mono text-sm font-semibold text-cyan-300">#{report.id}</p><p className="mt-1 max-w-[240px] truncate text-base font-semibold text-slate-100">{report.clubName || 'Câu lạc bộ không xác định'}</p></td><td className="px-4 py-4"><p className="font-medium text-slate-200">{report.period || 'Chưa cập nhật'}</p><p className="mt-1 text-sm text-slate-500">{formatReportType(report.reportType)}</p></td><td className="px-4 py-4"><p className="text-base font-semibold text-slate-100">{report.totalActivities || report.details?.length || 0}</p><p className="mt-1 text-sm text-slate-500">hoạt động</p></td><td className="px-4 py-4"><p className={`${dueIn !== null && dueIn <= 7 && dueIn >= 0 ? 'text-amber-200' : 'text-slate-300'} font-medium`}>{formatDate(report.dueDate)}</p><p className="mt-1 text-sm text-slate-500">{dueIn === null ? 'Không có hạn nộp' : dueIn < 0 ? 'Đã quá hạn' : dueIn === 0 ? 'Đến hạn hôm nay' : `Còn ${dueIn} ngày`}</p></td><td className="px-4 py-4 text-sm text-slate-400">{formatDate(report.updatedAtUtc || report.submittedAtUtc || report.createdAtUtc)}</td><td className="px-4 py-4"><ReportStatusBadge status={status} /></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => navigate(`/reports/${report.id}`)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 hover:text-cyan-200">Xem <ChevronRight size={15} /></button>{canEdit && <button onClick={() => navigate(`/reports/${report.id}/edit`)} className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15"><Pencil size={14} /> Sửa</button>}</div></td></tr>
            })}
          </tbody></table></div>
        )}
      </section>
    </div>
  )
}
