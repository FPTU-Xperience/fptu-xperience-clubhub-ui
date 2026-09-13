import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import { api } from '../services/api'
import { useToast } from '../context/ToastContext'
import {
  formatActivityStatus,
  formatAttendanceStatus,
  formatClubStatus,
  formatDate as formatViDate,
} from '../locales/vi'

const initialFilters = { search: '', status: 'Approved', role: 'All', sortBy: 'name', sortDirection: 'asc', page: 1, pageSize: 10 }

const formatDate = value => formatViDate(value)

function formatMemberRole(role) {
  if (role === 'CLUB_OWNER') return 'Chủ nhiệm'
  if (role === 'TREASURER') return 'Thủ quỹ'
  if (role === 'MEMBER' || role === 'CLUB_MEMBER') return 'Thành viên'
  return 'Không xác định'
}

function Participation({ value }) {
  const rate = Number(value?.participationRate || 0)
  return (
    <div className="min-w-36">
      <div className="flex justify-between text-xs"><span>{value?.attendedActivities || 0}/{value?.eligibleActivities || 0}</span><strong className="text-cyan-300">{rate.toFixed(2)}%</strong></div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400" style={{ width: `${Math.min(rate, 100)}%` }} /></div>
    </div>
  )
}

export default function ClubMembersPage() {
  const { clubId } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [club, setClub] = useState(null)
  const [filters, setFilters] = useState(initialFilters)
  const [data, setData] = useState({ items: [], totalItems: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pendingTreasurer, setPendingTreasurer] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const treasurerCount = (club?.members || []).filter(member => member.status === 'Approved' && member.role === 'TREASURER').length
  const treasurerSlotsRemaining = Math.max(0, 2 - treasurerCount)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [clubResult, memberResult] = await Promise.all([
        api.getClub(clubId),
        api.getClubMembers(clubId, filters),
      ])
      setClub(clubResult)
      setData(memberResult)
    } catch (err) {
      error(err.message || 'Không thể tải danh sách thành viên.')
      if (err.status === 403 || err.status === 404) navigate('/clubs')
    } finally {
      setLoading(false)
    }
  }, [clubId, error, filters, navigate])

  useEffect(() => {
    const timer = setTimeout(load, filters.search ? 250 : 0)
    return () => clearTimeout(timer)
  }, [load, filters.search])

  const updateFilter = (name, value) => setFilters(current => ({ ...current, [name]: value, page: name === 'page' ? value : 1 }))

  const openDetail = async member => {
    setDetailLoading(true)
    setSelected(null)
    try {
      setSelected(await api.getClubMember(clubId, member.id, { historyPage: 1, historyPageSize: 20 }))
    } catch (err) {
      error(err.message || 'Không thể tải chi tiết thành viên.')
    } finally {
      setDetailLoading(false)
    }
  }

  const removeMember = async () => {
    if (!pendingDelete || busy) return
    setBusy(true)
    try {
      await api.deleteClubMember(clubId, pendingDelete.id)
      setPendingDelete(null)
      success('Đã xóa thành viên. Lịch sử điểm danh vẫn được lưu.')
      await load()
    } catch (err) {
      error(err.message || 'Không thể xóa thành viên này.')
    } finally {
      setBusy(false)
    }
  }

  const assignTreasurer = async () => {
    if (!pendingTreasurer || busy) return
    setBusy(true)
    try {
      await api.assignClubTreasurer(clubId, pendingTreasurer.userId, pendingTreasurer.fullName)
      success(`${pendingTreasurer.fullName} đã được chỉ định làm thủ quỹ.`)
      setPendingTreasurer(null)
      await load()
    } catch (err) {
      error(err.message || 'Không thể chỉ định thành viên này làm thủ quỹ.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <button type="button" onClick={() => navigate('/clubs')} className="mb-3 text-sm font-semibold text-cyan-400 hover:text-cyan-300">← Quay lại câu lạc bộ</button>
          <h2 className="text-2xl font-bold text-white">Thành viên {club?.name || 'câu lạc bộ'}</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-purple-300">Thủ quỹ</p><p className="mt-1 font-bold text-white">Đã chỉ định {treasurerCount}/2</p></div>
          <Link to={`/clubs/${clubId}/attendance`} className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-5 py-3 text-center font-semibold text-white">Quản lý điểm danh</Link>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:grid-cols-5">
        <input aria-label="Tìm kiếm thành viên" value={filters.search} onChange={event => updateFilter('search', event.target.value)} placeholder="Tên, thư điện tử hoặc số điện thoại..." className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500 md:col-span-2" />
        <select value={filters.status} onChange={event => updateFilter('status', event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"><option value="Approved">Đã duyệt</option><option value="Pending">Chờ duyệt</option><option value="Rejected">Từ chối</option><option value="All">Tất cả</option></select>
        <select value={filters.role} onChange={event => updateFilter('role', event.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"><option value="All">Tất cả vị trí</option><option value="MEMBER">Thành viên</option><option value="TREASURER">Thủ quỹ</option></select>
        <select value={`${filters.sortBy}:${filters.sortDirection}`} onChange={event => { const [sortBy, sortDirection] = event.target.value.split(':'); setFilters(current => ({ ...current, sortBy, sortDirection, page: 1 })) }} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"><option value="name:asc">Tên A-Z</option><option value="name:desc">Tên Z-A</option><option value="joinedAt:desc">Thành viên mới nhất</option><option value="joinedAt:asc">Thành viên lâu nhất</option><option value="role:asc">Vị trí</option></select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        {loading ? <div className="flex min-h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" /></div> : data.items.length === 0 ? (
          <div className="py-16 text-center text-gray-500">Không có thành viên phù hợp với bộ lọc.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-950/60 text-xs uppercase tracking-wider text-gray-500"><tr><th className="px-5 py-4">Thành viên</th><th className="px-5 py-4">Liên hệ</th><th className="px-5 py-4">Vị trí</th><th className="px-5 py-4">Ngày tham gia</th><th className="px-5 py-4">Mức tham gia</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {data.items.map(member => <tr key={member.id} className="hover:bg-cyan-500/5">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 font-bold text-cyan-300">{member.fullName.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase()}</div><div><p className="font-semibold text-white">{member.fullName}</p><p className="text-xs text-gray-500">{formatClubStatus(member.status)}</p></div></div></td>
                  <td className="px-5 py-4 text-gray-300"><p>{member.email}</p><p className="text-xs text-gray-500">{member.phoneNumber || 'Chưa có số điện thoại'}</p></td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${member.role === 'CLUB_OWNER' ? 'bg-amber-500/10 text-amber-300' : 'bg-purple-500/10 text-purple-300'}`}>{formatMemberRole(member.role)}</span></td>
                  <td className="px-5 py-4 text-gray-300">{formatDate(member.joinedAtUtc)}</td>
                  <td className="px-5 py-4"><Participation value={member.participation} /></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => openDetail(member)} className="rounded-lg bg-cyan-500/10 px-3 py-2 font-semibold text-cyan-300">Xem</button>{member.status === 'Approved' && !['TREASURER', 'CLUB_OWNER'].includes(member.role) && <button type="button" onClick={() => setPendingTreasurer(member)} disabled={treasurerSlotsRemaining === 0} title={treasurerSlotsRemaining === 0 ? 'Câu lạc bộ đã có đủ hai thủ quỹ.' : 'Chỉ định làm thủ quỹ'} className="rounded-lg bg-purple-500/10 px-3 py-2 font-semibold text-purple-300 disabled:cursor-not-allowed disabled:opacity-40">Chỉ định thủ quỹ</button>}{member.role !== 'CLUB_OWNER' && <button type="button" onClick={() => setPendingDelete(member)} className="rounded-lg bg-rose-500/10 px-3 py-2 font-semibold text-rose-300">Xóa</button>}</div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-slate-800 px-5 py-4 text-sm text-gray-400 sm:flex-row sm:items-center sm:justify-between"><span>{data.totalItems || 0} thành viên</span><div className="flex items-center gap-2"><button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-30">Trước</button><span>Trang {filters.page}/{Math.max(data.totalPages || 1, 1)}</span><button disabled={filters.page >= data.totalPages} onClick={() => updateFilter('page', filters.page + 1)} className="rounded-lg border border-slate-700 px-3 py-2 disabled:opacity-30">Tiếp</button></div></div>
      </div>

      <Modal isOpen={detailLoading || Boolean(selected)} onClose={() => setSelected(null)} title="Chi tiết thành viên" size="xl">
        {detailLoading ? <div className="py-16 text-center text-neutral-500">Đang tải chi tiết thành viên...</div> : selected && <div className="space-y-6 text-neutral-800">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-neutral-500">Họ và tên</p><p className="font-semibold">{selected.member.fullName}</p></div><div><p className="text-xs text-neutral-500">Thư điện tử</p><p className="font-semibold">{selected.member.email}</p></div><div><p className="text-xs text-neutral-500">Điện thoại</p><p className="font-semibold">{selected.member.phoneNumber || '-'}</p></div><div><p className="text-xs text-neutral-500">Ngày tham gia</p><p className="font-semibold">{formatDate(selected.joinedAtUtc)}</p></div></div>
          <div className="rounded-xl bg-neutral-100 p-4"><p className="text-sm font-semibold">Tỷ lệ tham gia</p><p className="mt-1 text-3xl font-bold text-cyan-700">{Number(selected.participation.participationRate).toFixed(2)}%</p><p className="text-sm text-neutral-500">Có mặt {selected.participation.attendedActivities}/{selected.participation.eligibleActivities} hoạt động hợp lệ</p></div>
          <div><h3 className="font-bold">Lịch sử hoạt động</h3><div className="mt-3 divide-y divide-neutral-200 rounded-xl border border-neutral-200">{selected.activityHistory.length ? selected.activityHistory.map(item => <div key={item.activityId} className="flex items-center justify-between gap-4 p-3"><div><p className="font-semibold">{item.title}</p><p className="text-xs text-neutral-500">{formatDate(item.startTimeUtc)}, {formatActivityStatus(item.activityStatus)}</p></div><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold">{formatAttendanceStatus(item.attendanceStatus)}</span></div>) : <p className="p-6 text-center text-neutral-500">Chưa có hoạt động hợp lệ.</p>}</div></div>
        </div>}
      </Modal>

      <Modal isOpen={Boolean(pendingTreasurer)} onClose={() => !busy && setPendingTreasurer(null)} title="Chỉ định thủ quỹ" size="sm">
        <div className="space-y-5 text-neutral-800"><p>Chỉ định <strong>{pendingTreasurer?.fullName}</strong> làm thủ quỹ câu lạc bộ?</p><div className="rounded-lg bg-purple-50 p-3 text-sm text-purple-900">Còn <strong>{treasurerSlotsRemaining}</strong>/2 vị trí thủ quỹ. Thủ quỹ sẽ được truy cập các chức năng tài chính của câu lạc bộ.</div><div className="flex gap-3"><button type="button" onClick={() => setPendingTreasurer(null)} disabled={busy} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold disabled:opacity-50">Hủy</button><button type="button" onClick={assignTreasurer} disabled={busy || treasurerSlotsRemaining === 0} className="flex-1 rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang chỉ định...' : 'Chỉ định thủ quỹ'}</button></div></div>
      </Modal>

      <Modal isOpen={Boolean(pendingDelete)} onClose={() => !busy && setPendingDelete(null)} title="Xóa thành viên" size="sm">
        <div className="space-y-5 text-neutral-800"><p>Xóa <strong>{pendingDelete?.fullName}</strong> khỏi câu lạc bộ? Lịch sử điểm danh trước đây vẫn được lưu.</p><div className="flex gap-3"><button type="button" onClick={() => setPendingDelete(null)} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold">Hủy</button><button type="button" onClick={removeMember} disabled={busy} className="flex-1 rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Đang xóa...' : 'Xóa thành viên'}</button></div></div>
      </Modal>
    </div>
  )
}
