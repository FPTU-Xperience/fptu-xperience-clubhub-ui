import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Modal from '../components/Modal'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatActivityStatus, formatAttendanceStatus, formatDateTime } from '../locales/vi'

const emptyForm = {
  kind: 'ONE_TIME',
  clubId: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  meetingDays: [],
}

const WEEK_DAYS = [
  [1, 'T2'], [2, 'T3'], [3, 'T4'], [4, 'T5'], [5, 'T6'], [6, 'T7'], [7, 'CN'],
]

function MeetingDayPicker({ value, onChange }) {
  const toggle = day => onChange(value.includes(day) ? value.filter(item => item !== day) : [...value, day].sort())
  return <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{WEEK_DAYS.map(([day, label]) => (
    <button key={day} type="button" onClick={() => toggle(day)} className={`rounded-lg border px-2 py-2.5 text-sm font-semibold transition ${value.includes(day) ? 'border-cyan-500 bg-cyan-500 text-white' : 'border-neutral-300 bg-white text-neutral-600 hover:border-cyan-400'}`}>{label}</button>
  ))}</div>
}

function formatMeetingDays(days = []) {
  return days.map(day => WEEK_DAYS.find(item => item[0] === day)?.[1]).filter(Boolean).join(', ')
}

function normalizeStatus(status) {
  return status?.toUpperCase() || 'PLANNED'
}

const formatDate = value => formatDateTime(value)

function FormField({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-neutral-700">
      <span className="mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}

export default function ActivitiesPage() {
  const { user, clubAccess } = useAuth()
  const { success, error } = useToast()
  const managedClubs = clubAccess.filter(access => access.isManager)
  const accessByClub = useMemo(
    () => new Map(clubAccess.map(access => [access.clubId, access])),
    [clubAccess],
  )

  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [editingSchedule, setEditingSchedule] = useState(null)
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const loadActivities = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await api.getActivities()
      setActivities(Array.isArray(result) ? result : [])
    } catch (err) {
      error(err.message || 'Không thể tải danh sách hoạt động.')
    } finally {
      setIsLoading(false)
    }
  }, [error])

  useEffect(() => {
    loadActivities()
  }, [loadActivities])

  useEffect(() => {
    if (!selectedActivity?.meetingDays?.length) {
      setAttendanceSummary(null)
      return
    }
    setSummaryLoading(true)
    api.getMyActivityAttendance(selectedActivity.id)
      .then(setAttendanceSummary)
      .catch(err => error(err.message || 'Không thể tải lịch sử điểm danh.'))
      .finally(() => setSummaryLoading(false))
  }, [selectedActivity, error])

  const filteredActivities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return activities.filter(activity => {
      const matchesQuery = !query
        || activity.title.toLowerCase().includes(query)
        || activity.clubName.toLowerCase().includes(query)
        || activity.location.toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'ALL' || normalizeStatus(activity.status) === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [activities, searchQuery, statusFilter])

  const registerForActivity = async (activity) => {
    if (busyId) return
    setBusyId(activity.id)
    try {
      const updated = await api.registerParticipant(activity.id, null, user?.name)
      setActivities(current => current.map(item => item.id === activity.id ? updated : item))
      success('Đã đăng ký tham gia hoạt động.')
    } catch (err) {
      error(err.message || 'Không thể đăng ký hoạt động này.')
    } finally {
      setBusyId(null)
    }
  }

  const completeActivity = async (activity) => {
    if (busyId) return
    setBusyId(activity.id)
    try {
      const updated = await api.completeActivity(activity.id)
      setActivities(current => current.map(item => item.id === activity.id ? updated : item))
      setSelectedActivity(updated)
      success('Đã đánh dấu hoạt động hoàn thành.')
    } catch (err) {
      error(err.message || 'Không thể hoàn thành hoạt động này.')
    } finally {
      setBusyId(null)
    }
  }

  const checkIn = async activity => {
    if (busyId) return
    setBusyId(`check-in-${activity.id}`)
    try {
      const updated = await api.checkInActivity(activity.id)
      setActivities(current => current.map(item => item.id === activity.id ? updated : item))
      setSelectedActivity(updated)
      const summary = await api.getMyActivityAttendance(activity.id)
      setAttendanceSummary(summary)
      success('Đã ghi nhận điểm danh hôm nay theo giờ Việt Nam.')
    } catch (err) {
      error(err.message || 'Hôm nay không mở điểm danh.')
    } finally {
      setBusyId(null)
    }
  }

  const saveSchedule = async event => {
    event.preventDefault()
    if (!editingSchedule || busyId) return
    if (!editingSchedule.meetingDays.length) {
      error('Vui lòng chọn ít nhất một ngày trong tuần.')
      return
    }
    setBusyId(`schedule-${editingSchedule.id}`)
    try {
      const updated = await api.updateActivity(editingSchedule.id, {
        title: editingSchedule.title,
        description: editingSchedule.description || '',
        startTimeUtc: editingSchedule.startTimeUtc,
        endTimeUtc: editingSchedule.endTimeUtc,
        location: editingSchedule.location,
        status: editingSchedule.status,
        meetingDays: editingSchedule.meetingDays,
      })
      setActivities(current => current.map(item => item.id === updated.id ? updated : item))
      setSelectedActivity(updated)
      setEditingSchedule(null)
      success('Đã cập nhật lịch họp hằng tuần.')
    } catch (err) {
      error(err.message || 'Không thể cập nhật lịch họp hằng tuần.')
    } finally {
      setBusyId(null)
    }
  }

  const createActivity = async (event) => {
    event.preventDefault()
    if (busyId) return
    const club = managedClubs.find(item => item.clubId === Number(formData.clubId))
    const isWeekly = formData.kind === 'WEEKLY'
    if (!club || !formData.title.trim() || !formData.location.trim()
      || (isWeekly ? formData.meetingDays.length === 0 : (!formData.startTime || !formData.endTime))) {
      error('Vui lòng nhập câu lạc bộ, tên, lịch và địa điểm.')
      return
    }
    if (!isWeekly && new Date(formData.endTime) <= new Date(formData.startTime)) {
      error('Thời gian kết thúc phải sau thời gian bắt đầu.')
      return
    }

    setBusyId('create')
    try {
      const created = await api.createActivity({
        clubId: club.clubId,
        clubName: club.clubName,
        title: formData.title.trim(),
        description: formData.description.trim(),
        startTimeUtc: isWeekly ? null : new Date(formData.startTime).toISOString(),
        endTimeUtc: isWeekly ? null : new Date(formData.endTime).toISOString(),
        location: formData.location.trim(),
        meetingDays: isWeekly ? formData.meetingDays : [],
      })
      setActivities(current => [...current, created].sort((a, b) => new Date(a.startTimeUtc) - new Date(b.startTimeUtc)))
      setShowCreate(false)
      setFormData(emptyForm)
      success(isWeekly ? 'Đã tạo lịch họp hằng tuần.' : 'Đã tạo hoạt động.')
    } catch (err) {
      error(err.message || 'Không thể tạo hoạt động.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Hoạt động câu lạc bộ</h2>
        </div>
        {managedClubs.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 font-semibold text-white"
          >
            Tạo hoạt động hoặc lịch họp
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Tổng hoạt động', activities.length, 'text-cyan-300'],
          ['Sắp diễn ra', activities.filter(item => normalizeStatus(item.status) !== 'COMPLETED' && new Date(item.startTimeUtc) > new Date()).length, 'text-purple-300'],
          ['Đã hoàn thành', activities.filter(item => normalizeStatus(item.status) === 'COMPLETED').length, 'text-emerald-300'],
          ['Lịch họp hằng tuần', activities.filter(item => item.meetingDays?.length).length, 'text-amber-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-label="Tìm kiếm hoạt động"
          value={searchQuery}
          onChange={event => setSearchQuery(event.target.value)}
          placeholder="Tìm hoạt động, câu lạc bộ hoặc địa điểm..."
          className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
        />
        <select
          aria-label="Lọc hoạt động theo trạng thái"
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="SCHEDULED">Đã lên lịch</option>
          <option value="COMPLETED">Đã hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center text-gray-500">
          Chưa có hoạt động phù hợp với quyền truy cập của bạn.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredActivities.map((activity, index) => {
            const status = normalizeStatus(activity.status)
            const access = accessByClub.get(activity.clubId)
            const registered = activity.participants?.some(participant => participant.userId === user?.id)
            const canParticipate = Boolean(access?.isApprovedMember || access?.isManager || access?.isTreasurer)
            const isWeekly = Boolean(activity.meetingDays?.length)

            return (
              <motion.article
                key={activity.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.035 }}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-300">
                    {activity.clubName}, {isWeekly ? 'Họp hằng tuần' : 'Hoạt động'}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-purple-500/15 text-purple-300'
                  }`}>
                    {formatActivityStatus(activity.status)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{activity.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-400">{activity.description || 'Chưa có mô tả.'}</p>
                <dl className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">{isWeekly ? 'Ngày họp' : 'Bắt đầu'}</dt><dd className="text-right text-gray-200">{isWeekly ? formatMeetingDays(activity.meetingDays) : formatDate(activity.startTimeUtc)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Địa điểm</dt><dd className="text-right text-gray-200">{activity.location}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Đã đăng ký</dt><dd className="font-semibold text-white">{activity.participants?.length || 0}</dd></div>
                </dl>
                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => setSelectedActivity(activity)}
                    className="flex-1 rounded-xl border border-slate-700 px-3 py-2.5 text-sm font-semibold text-gray-300"
                  >
                    Chi tiết
                  </button>
                  {isWeekly && status !== 'COMPLETED' && canParticipate ? (
                    <button
                      type="button"
                      onClick={() => checkIn(activity)}
                      disabled={busyId === `check-in-${activity.id}`}
                      className="flex-1 rounded-xl bg-emerald-500/15 px-3 py-2.5 text-sm font-semibold text-emerald-300 disabled:opacity-45"
                    >
                      {busyId === `check-in-${activity.id}` ? 'Đang điểm danh...' : 'Điểm danh hôm nay'}
                    </button>
                  ) : status !== 'COMPLETED' && canParticipate && (
                    <button
                      type="button"
                      onClick={() => registerForActivity(activity)}
                      disabled={registered || busyId === activity.id}
                      className="flex-1 rounded-xl bg-cyan-500/15 px-3 py-2.5 text-sm font-semibold text-cyan-300 disabled:opacity-45"
                    >
                      {registered ? 'Đã đăng ký' : busyId === activity.id ? 'Đang xử lý...' : 'Tham gia'}
                    </button>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Tạo hoạt động hoặc lịch họp hằng tuần" size="lg">
        <form onSubmit={createActivity} className="space-y-4">
          <FormField label="Loại *">
            <select value={formData.kind} onChange={event => setFormData(current => ({ ...current, kind: event.target.value }))} className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900">
              <option value="ONE_TIME">Hoạt động một lần</option>
              <option value="WEEKLY">Họp câu lạc bộ hằng tuần</option>
            </select>
          </FormField>
          <FormField label="Câu lạc bộ *">
            <select
              value={formData.clubId}
              onChange={event => setFormData(current => ({ ...current, clubId: event.target.value }))}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900"
            >
              <option value="">Chọn câu lạc bộ bạn quản lý</option>
              {managedClubs.map(club => <option key={club.clubId} value={club.clubId}>{club.clubName}</option>)}
            </select>
          </FormField>
          <FormField label="Tên hoạt động *">
            <input
              value={formData.title}
              onChange={event => setFormData(current => ({ ...current, title: event.target.value }))}
              required
              maxLength={200}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900"
            />
          </FormField>
          <FormField label="Mô tả">
            <textarea
              value={formData.description}
              onChange={event => setFormData(current => ({ ...current, description: event.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900"
            />
          </FormField>
          {formData.kind === 'WEEKLY' ? (
            <FormField label="Ngày họp hằng tuần theo giờ Việt Nam *">
              <MeetingDayPicker value={formData.meetingDays} onChange={meetingDays => setFormData(current => ({ ...current, meetingDays }))} />
              <span className="mt-2 block text-xs font-normal text-neutral-500">Thành viên được điểm danh một lần vào mỗi ngày đã chọn.</span>
            </FormField>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-neutral-700">Thời gian bắt đầu
                <input type="datetime-local" value={formData.startTime} onChange={event => setFormData(current => ({ ...current, startTime: event.target.value }))} required className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900" />
              </label>
              <label className="text-sm font-semibold text-neutral-700">Thời gian kết thúc
                <input type="datetime-local" value={formData.endTime} onChange={event => setFormData(current => ({ ...current, endTime: event.target.value }))} required className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900" />
              </label>
            </div>
          )}
          <FormField label="Địa điểm *">
            <input
              value={formData.location}
              onChange={event => setFormData(current => ({ ...current, location: event.target.value }))}
              required
              maxLength={200}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-neutral-900"
            />
          </FormField>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700">Hủy</button>
            <button type="submit" disabled={busyId === 'create'} className="flex-1 rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-50">
              {busyId === 'create' ? 'Đang tạo...' : formData.kind === 'WEEKLY' ? 'Tạo lịch họp' : 'Tạo hoạt động'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selectedActivity)} onClose={() => setSelectedActivity(null)} title={selectedActivity?.title || 'Chi tiết hoạt động'} size="lg">
        {selectedActivity && (
          <div className="space-y-4 text-neutral-700">
            <p>{selectedActivity.description || 'Chưa có mô tả.'}</p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-neutral-50 p-3"><dt className="text-xs text-neutral-500">Câu lạc bộ</dt><dd className="mt-1 font-semibold">{selectedActivity.clubName}</dd></div>
              <div className="rounded-lg bg-neutral-50 p-3"><dt className="text-xs text-neutral-500">Địa điểm</dt><dd className="mt-1 font-semibold">{selectedActivity.location}</dd></div>
              {selectedActivity.meetingDays?.length ? (
                <div className="rounded-lg bg-neutral-50 p-3 sm:col-span-2"><dt className="text-xs text-neutral-500">Ngày họp hằng tuần, giờ Việt Nam</dt><dd className="mt-1 font-semibold">{formatMeetingDays(selectedActivity.meetingDays)}</dd></div>
              ) : <>
                <div className="rounded-lg bg-neutral-50 p-3"><dt className="text-xs text-neutral-500">Bắt đầu</dt><dd className="mt-1 font-semibold">{formatDate(selectedActivity.startTimeUtc)}</dd></div>
                <div className="rounded-lg bg-neutral-50 p-3"><dt className="text-xs text-neutral-500">Kết thúc</dt><dd className="mt-1 font-semibold">{formatDate(selectedActivity.endTimeUtc)}</dd></div>
              </>}
            </dl>
            {selectedActivity.meetingDays?.length && (
              <section className="space-y-3 rounded-xl border border-neutral-200 p-4">
                <div className="flex items-center justify-between"><h3 className="font-bold">Điểm danh của tôi</h3>{summaryLoading && <span className="text-xs text-neutral-500">Đang tải...</span>}</div>
                {attendanceSummary && <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-cyan-50 p-3"><p className="text-xl font-bold text-cyan-700">{attendanceSummary.scheduledDays}</p><p className="text-xs text-neutral-500">Buổi đã lên lịch</p></div>
                    <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xl font-bold text-emerald-700">{attendanceSummary.attendedDays}</p><p className="text-xs text-neutral-500">Buổi có mặt</p></div>
                    <div className="rounded-lg bg-purple-50 p-3"><p className="text-xl font-bold text-purple-700">{Number(attendanceSummary.attendanceRate).toFixed(2)}%</p><p className="text-xs text-neutral-500">Tỷ lệ</p></div>
                  </div>
                  <p className={`rounded-lg p-3 text-sm font-semibold ${attendanceSummary.canCheckInToday ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {attendanceSummary.alreadyCheckedInToday ? 'Bạn đã điểm danh hôm nay.' : attendanceSummary.isScheduledToday ? 'Điểm danh đang mở hôm nay.' : 'Hôm nay không phải ngày họp theo lịch.'}
                  </p>
                  <div className="max-h-48 divide-y divide-neutral-200 overflow-y-auto rounded-lg border border-neutral-200">
                    {attendanceSummary.history.length ? attendanceSummary.history.map(item => <div key={item.id} className="flex items-center justify-between p-3 text-sm"><span>{new Date(`${item.attendanceDate}T00:00:00`).toLocaleDateString('vi-VN')}</span><span className="font-semibold text-emerald-700">{formatAttendanceStatus(item.status)}</span></div>) : <p className="p-4 text-center text-sm text-neutral-500">Chưa có lịch sử điểm danh.</p>}
                  </div>
                  <button type="button" onClick={() => checkIn(selectedActivity)} disabled={!attendanceSummary.canCheckInToday || busyId === `check-in-${selectedActivity.id}`} className="w-full rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-40">
                    {busyId === `check-in-${selectedActivity.id}` ? 'Đang điểm danh...' : attendanceSummary.alreadyCheckedInToday ? 'Đã điểm danh' : 'Điểm danh hôm nay'}
                  </button>
                </>}
              </section>
            )}
            {accessByClub.get(selectedActivity.clubId)?.isManager && selectedActivity.meetingDays?.length > 0 && (
              <button type="button" onClick={() => { setEditingSchedule({ ...selectedActivity, meetingDays: [...selectedActivity.meetingDays] }); setSelectedActivity(null) }} className="w-full rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white">Chỉnh sửa lịch họp hằng tuần</button>
            )}
            {accessByClub.get(selectedActivity.clubId)?.isManager && normalizeStatus(selectedActivity.status) !== 'COMPLETED' && (
              <button
                type="button"
                onClick={() => completeActivity(selectedActivity)}
                disabled={busyId === selectedActivity.id}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {busyId === selectedActivity.id ? 'Đang xử lý...' : 'Đánh dấu hoàn thành'}
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={Boolean(editingSchedule)} onClose={() => setEditingSchedule(null)} title="Chỉnh sửa lịch họp hằng tuần" size="lg">
        {editingSchedule && <form onSubmit={saveSchedule} className="space-y-5">
          <div><p className="font-semibold text-neutral-900">{editingSchedule.title}</p><p className="text-sm text-neutral-500">Chọn các ngày thành viên được phép điểm danh.</p></div>
          <MeetingDayPicker value={editingSchedule.meetingDays} onChange={meetingDays => setEditingSchedule(current => ({ ...current, meetingDays }))} />
          <div className="flex gap-3"><button type="button" onClick={() => setEditingSchedule(null)} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700">Hủy</button><button type="submit" disabled={busyId === `schedule-${editingSchedule.id}`} className="flex-1 rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{busyId === `schedule-${editingSchedule.id}` ? 'Đang lưu...' : 'Lưu lịch họp'}</button></div>
        </form>}
      </Modal>
    </div>
  )
}
