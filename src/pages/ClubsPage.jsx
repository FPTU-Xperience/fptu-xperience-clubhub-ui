import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { PERMISSIONS } from '../auth/permissions'
import { api } from '../services/api'

const CATEGORY_LABELS = {
  SPORTS: 'Thể thao',
  ARTS: 'Nghệ thuật',
  ACADEMIC: 'Học thuật',
  VOLUNTEER: 'Tình nguyện',
  TECHNOLOGY: 'Công nghệ',
  OTHER: 'Khác',
}

const CATEGORY_FIELDS = {
  SPORTS: [
    ['sport', 'Môn thể thao'],
    ['level', 'Trình độ kỹ năng'],
    ['experience', 'Kinh nghiệm'],
  ],
  ARTS: [
    ['artField', 'Lĩnh vực nghệ thuật'],
    ['level', 'Trình độ kỹ năng'],
  ],
  ACADEMIC: [
    ['academicInterest', 'Lĩnh vực học thuật quan tâm'],
    ['learningGoal', 'Mục tiêu học tập'],
  ],
  VOLUNTEER: [
    ['volunteerInterest', 'Lĩnh vực quan tâm'],
    ['socialWorkExperience', 'Kinh nghiệm hoạt động cộng đồng'],
  ],
  TECHNOLOGY: [
    ['programmingLanguages', 'Ngôn ngữ lập trình'],
    ['projects', 'Dự án trước đây'],
  ],
  OTHER: [['other', 'Thông tin bổ sung']],
}

const GENDER_LABELS = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

const VENUE_SUPPORT_LABELS = {
  SUPPORT_NEEDED: 'Cần hỗ trợ',
  SELF_MANAGED: 'Tự quản lý',
}

const FUNDING_SUPPORT_LABELS = {
  SUPPORT_NEEDED: 'Cần hỗ trợ',
  SELF_FUNDED: 'Tự tài trợ',
  COMBINED: 'Kết hợp',
}

const ACTIVITY_FREQUENCY_UNITS = {
  WEEK: 'tuần',
  MONTH: 'tháng',
  YEAR: 'năm',
}

const STATUS_STYLES = {
  PENDING: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  SUBMITTED: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  NEEDSREVISION: 'border-orange-500/30 bg-orange-500/15 text-orange-300',
  APPROVED: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  REJECTED: 'border-rose-500/30 bg-rose-500/15 text-rose-300',
}

const STATUS_LABELS = {
  PENDING: 'Chờ xét duyệt',
  SUBMITTED: 'Đã gửi',
  NEEDSREVISION: 'Cần chỉnh sửa',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

const inputClass = 'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
const labelClass = 'mb-1.5 block text-sm font-semibold text-neutral-700'

function normalizedStatus(value) {
  return value?.replace(/[^a-z]/gi, '').toUpperCase() || ''
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function getAdditionalFieldLabel(category, key) {
  return (CATEGORY_FIELDS[category] || CATEGORY_FIELDS.OTHER)
    .find(([fieldKey]) => fieldKey === key)?.[1] || 'Thông tin bổ sung'
}

function parseActivityFrequency(value) {
  const text = value?.trim() || ''
  const count = text.match(/\d+/)?.[0] || ''
  const unit = /year|n\u0103m/i.test(text) ? 'YEAR' : /week|tu\u1EA7n/i.test(text) ? 'WEEK' : 'MONTH'
  return { count, unit }
}

function formatActivityFrequency(count, unit) {
  return `${Number(count)} lần mỗi ${ACTIVITY_FREQUENCY_UNITS[unit] || ACTIVITY_FREQUENCY_UNITS.MONTH}`
}

function createJoinForm(user) {
  return {
    fullName: user?.name || '',
    dateOfBirth: '',
    gender: '',
    email: user?.email || '',
    phoneNumber: '',
    address: '',
    hobbies: '',
    skills: '',
    reason: '',
    expectations: '',
    contributions: '',
    additionalInfo: {},
    acceptedClubRules: false,
    committedToParticipate: false,
    message: '',
  }
}

function createClubForm(user) {
  return {
    code: '',
    name: '',
    category: 'ACADEMIC',
    purpose: '',
    description: '',
    logoUrl: '',
    founderFullName: user?.name || '',
    founderRole: 'Chủ nhiệm câu lạc bộ',
    founderEmail: user?.email || '',
    founderPhone: '',
    founderOrganization: '',
    foundingMemberCount: 1,
    foundingMembers: [{
      fullName: user?.name || '',
      organization: '',
      email: user?.email || '',
    }],
    foundingMembersCommitted: false,
    mainActivities: '',
    activityFrequencyCount: '',
    activityFrequencyUnit: 'MONTH',
    expectedLocation: '',
    expectedSchedule: '',
    majorEvents: '',
    venueSupport: 'SELF_MANAGED',
    fundingSupport: 'SELF_FUNDED',
    equipmentNeeds: '',
    advisorNeeded: false,
    committedToRules: false,
    committedToResponsibility: false,
    committedToReporting: false,
  }
}

function applicationToForm(application) {
  const activityFrequency = parseActivityFrequency(application.activityFrequency)
  return {
    code: application.code || '',
    name: application.name || '',
    category: application.category || 'OTHER',
    purpose: application.purpose || '',
    description: application.description || '',
    logoUrl: application.logoUrl || '',
    founderFullName: application.requesterName || '',
    founderRole: application.founderRole || '',
    founderEmail: application.contactEmail || '',
    founderPhone: application.contactPhone || '',
    founderOrganization: application.founderOrganization || '',
    foundingMemberCount: application.foundingMemberCount || 1,
    foundingMembers: application.foundingMembers?.length
      ? application.foundingMembers
      : [{ fullName: '', organization: '', email: '' }],
    foundingMembersCommitted: Boolean(application.foundingMembersCommitted),
    mainActivities: application.mainActivities || '',
    activityFrequencyCount: activityFrequency.count,
    activityFrequencyUnit: activityFrequency.unit,
    expectedLocation: application.expectedLocation || '',
    expectedSchedule: application.expectedSchedule || '',
    majorEvents: application.majorEvents || '',
    venueSupport: application.venueSupport || 'SELF_MANAGED',
    fundingSupport: application.fundingSupport || 'SELF_FUNDED',
    equipmentNeeds: application.equipmentNeeds || '',
    advisorNeeded: Boolean(application.advisorNeeded),
    committedToRules: Boolean(application.committedToRules),
    committedToResponsibility: Boolean(application.committedToResponsibility),
    committedToReporting: Boolean(application.committedToReporting),
  }
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}{required ? ' *' : ''}</span>
      {children}
    </label>
  )
}

function TextInput({ value, onChange, required, type = 'text', maxLength, placeholder, ariaLabel }) {
  return (
    <input
      type={type}
      value={value}
      onChange={event => onChange(event.target.value)}
      required={required}
      maxLength={maxLength}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={inputClass}
    />
  )
}

function TextArea({ value, onChange, required, rows = 3, maxLength = 1000, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={event => onChange(event.target.value)}
      required={required}
      rows={rows}
      maxLength={maxLength}
      placeholder={placeholder}
      className={inputClass}
    />
  )
}

function Checkbox({ checked, onChange, children, required = false }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={event => onChange(event.target.checked)}
        required={required}
        className="mt-0.5 h-4 w-4 accent-cyan-600"
      />
      <span>{children}</span>
    </label>
  )
}

function SectionTitle({ number, title, description }) {
  return (
    <div className="border-b border-neutral-200 pb-2">
      <h3 className="font-bold text-neutral-900">{number}. {title}</h3>
      {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const normalized = normalizedStatus(status)
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[normalized] || STATUS_STYLES.SUBMITTED}`}>
      {STATUS_LABELS[normalized] || 'Không xác định'}
    </span>
  )
}

function Detail({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">{String(value)}</dd>
    </div>
  )
}

export default function ClubsPage() {
  const { success, error } = useToast()
  const {
    user,
    clubAccess,
    hasPermission,
    refreshClubAccess,
  } = useAuth()

  const canJoinClub = hasPermission(PERMISSIONS.JOIN_CLUB)
  const canApplyForClub = hasPermission(PERMISSIONS.APPLY_FOR_CLUB)
  const canReviewApplications = hasPermission(PERMISSIONS.REVIEW_CLUB_APPLICATIONS)
  const canDeleteClubs = hasPermission(PERMISSIONS.MANAGE_CLUB_GOVERNANCE)
  const managedClubIds = useMemo(
    () => new Set(clubAccess.filter(access => access.isManager).map(access => access.clubId)),
    [clubAccess],
  )

  const [clubs, setClubs] = useState([])
  const [memberships, setMemberships] = useState([])
  const [pendingMemberReviews, setPendingMemberReviews] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [clubApplications, setClubApplications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clubToDelete, setClubToDelete] = useState(null)

  const [selectedClub, setSelectedClub] = useState(null)
  const [joinForm, setJoinForm] = useState(() => createJoinForm(user))
  const [membershipReview, setMembershipReview] = useState(null)
  const [membershipReviewAction, setMembershipReviewAction] = useState('approve')
  const [membershipReviewNote, setMembershipReviewNote] = useState('')

  const [creationModalOpen, setCreationModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
  const [clubForm, setClubForm] = useState(() => createClubForm(user))
  const [applicationReview, setApplicationReview] = useState(null)
  const [applicationReviewAction, setApplicationReviewAction] = useState('approve')
  const [applicationReviewForm, setApplicationReviewForm] = useState({
    note: '',
    conditions: '',
    reviewerSignature: '',
  })

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [clubResult, membershipResult, myApplicationResult, applicationResult] = await Promise.all([
        api.getClubs(),
        canJoinClub ? api.getMyMemberships() : Promise.resolve([]),
        canApplyForClub ? api.getMyClubApplications() : Promise.resolve([]),
        canReviewApplications ? api.getClubApplications() : Promise.resolve([]),
      ])

      setClubs(Array.isArray(clubResult) ? clubResult : [])
      setMemberships(Array.isArray(membershipResult) ? membershipResult : [])
      setMyApplications(Array.isArray(myApplicationResult) ? myApplicationResult : [])
      setClubApplications(Array.isArray(applicationResult) ? applicationResult : [])

      if (managedClubIds.size > 0) {
        const reviewLists = await Promise.all(
          [...managedClubIds].map(clubId => api.getClubMemberships(clubId)),
        )
        setPendingMemberReviews(
          reviewLists
            .flat()
            .filter(item => normalizedStatus(item.status) === 'PENDING')
            .sort((a, b) => new Date(a.requestedAtUtc) - new Date(b.requestedAtUtc)),
        )
      } else {
        setPendingMemberReviews([])
      }
    } catch (err) {
      error(err.message || 'Không thể tải dữ liệu câu lạc bộ.')
    } finally {
      setIsLoading(false)
    }
  }, [
    canApplyForClub,
    canJoinClub,
    canReviewApplications,
    error,
    managedClubIds,
  ])

  useEffect(() => {
    loadData()
  }, [loadData])

  const membershipByClub = useMemo(
    () => new Map(memberships.map(item => [item.clubId, item])),
    [memberships],
  )

  const filteredClubs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return clubs
    return clubs.filter(club =>
      [club.name, club.code, club.description, CATEGORY_LABELS[club.category]]
        .some(value => value?.toLowerCase().includes(query)),
    )
  }, [clubs, searchQuery])

  const pendingClubApplications = clubApplications.filter(
    item => normalizedStatus(item.status) === 'SUBMITTED',
  )

  const openJoinForm = club => {
    setSelectedClub(club)
    setJoinForm(createJoinForm(user))
  }

  const closeJoinForm = () => {
    if (isSubmitting) return
    setSelectedClub(null)
  }

  const updateJoinField = (field, value) => {
    setJoinForm(current => ({ ...current, [field]: value }))
  }

  const submitJoinRequest = async event => {
    event.preventDefault()
    if (!selectedClub || isSubmitting) return
    if (!joinForm.acceptedClubRules || !joinForm.committedToParticipate) {
      error('Bạn phải đồng ý với cả hai cam kết tham gia.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.joinClub(selectedClub.id, {
        ...joinForm,
        address: joinForm.address.trim() || null,
        hobbies: joinForm.hobbies.trim() || null,
        skills: joinForm.skills.trim() || null,
        expectations: joinForm.expectations.trim() || null,
        contributions: joinForm.contributions.trim() || null,
        message: joinForm.message.trim() || null,
      })
      success(`Đơn xin tham gia ${selectedClub.name} đã được gửi đến chủ nhiệm câu lạc bộ để xét duyệt.`)
      setSelectedClub(null)
      await loadData()
    } catch (err) {
      error(err.message || 'Không thể gửi đơn xin tham gia câu lạc bộ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitMembershipReview = async event => {
    event.preventDefault()
    if (!membershipReview || isSubmitting) return
    setIsSubmitting(true)
    try {
      if (membershipReviewAction === 'approve') {
        await api.approveClubMembership(membershipReview.id, membershipReviewNote.trim())
        success(`Đã duyệt ${membershipReview.fullName} tham gia ${membershipReview.clubName}.`)
      } else {
        await api.rejectClubMembership(membershipReview.id, membershipReviewNote.trim())
        success(`Đã từ chối đơn của ${membershipReview.fullName}.`)
      }
      setMembershipReview(null)
      await Promise.all([loadData(), refreshClubAccess?.()])
    } catch (err) {
      error(err.message || 'Không thể xét duyệt đơn tham gia câu lạc bộ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openMembershipReview = (membership, action = 'approve') => {
    setMembershipReview(membership)
    setMembershipReviewAction(action)
    setMembershipReviewNote('')
  }

  const deleteClub = async () => {
    if (!clubToDelete || isSubmitting) return
    setIsSubmitting(true)
    try {
      await api.deleteClub(clubToDelete.id)
      setClubs(current => current.filter(club => club.id !== clubToDelete.id))
      setMemberships(current => current.filter(item => item.clubId !== clubToDelete.id))
      setPendingMemberReviews(current => current.filter(item => item.clubId !== clubToDelete.id))
      success(`Đã xóa câu lạc bộ ${clubToDelete.name}.`)
      setClubToDelete(null)
      await refreshClubAccess?.()
    } catch (err) {
      error(err.message || 'Không thể xóa câu lạc bộ này.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openCreationForm = application => {
    setEditingApplication(application || null)
    setClubForm(application ? applicationToForm(application) : createClubForm(user))
    setCreationModalOpen(true)
  }

  const updateClubForm = (field, value) => {
    setClubForm(current => ({ ...current, [field]: value }))
  }

  const updateFoundingMember = (index, field, value) => {
    setClubForm(current => ({
      ...current,
      foundingMembers: current.foundingMembers.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member,
      ),
    }))
  }

  const addFoundingMember = () => {
    setClubForm(current => ({
      ...current,
      foundingMemberCount: Math.max(current.foundingMemberCount, current.foundingMembers.length + 1),
      foundingMembers: [...current.foundingMembers, { fullName: '', organization: '', email: '' }],
    }))
  }

  const removeFoundingMember = index => {
    setClubForm(current => ({
      ...current,
      foundingMembers: current.foundingMembers.filter((_, memberIndex) => memberIndex !== index),
    }))
  }

  const submitClubApplication = async event => {
    event.preventDefault()
    if (isSubmitting) return
    if (!/^[1-9][0-9]{0,2}$/.test(clubForm.activityFrequencyCount)) {
      error('Tần suất hoạt động phải là một số từ 1 đến 999.')
      return
    }
    if (!clubForm.foundingMembersCommitted
      || !clubForm.committedToRules
      || !clubForm.committedToResponsibility
      || !clubForm.committedToReporting) {
      error('Bạn phải đồng ý với tất cả cam kết trước khi gửi đơn.')
      return
    }

    setIsSubmitting(true)
    try {
      const {
        activityFrequencyCount,
        activityFrequencyUnit,
        ...applicationFields
      } = clubForm
      const payload = {
        ...applicationFields,
        code: clubForm.code.trim() || null,
        logoUrl: clubForm.logoUrl.trim() || null,
        activityFrequency: formatActivityFrequency(
          activityFrequencyCount,
          activityFrequencyUnit,
        ),
        expectedLocation: clubForm.expectedLocation.trim() || null,
        expectedSchedule: clubForm.expectedSchedule.trim() || null,
        majorEvents: clubForm.majorEvents.trim() || null,
        equipmentNeeds: clubForm.equipmentNeeds.trim() || null,
        foundingMemberCount: Number(clubForm.foundingMemberCount),
      }
      if (editingApplication) {
        await api.updateClubApplication(editingApplication.id, payload)
        success('Đã cập nhật và gửi lại đơn thành lập câu lạc bộ.')
      } else {
        await api.createClubApplication(payload)
        success('Đơn thành lập câu lạc bộ đã được gửi đến quản trị viên để xét duyệt.')
      }
      setCreationModalOpen(false)
      setEditingApplication(null)
      await loadData()
    } catch (err) {
      error(err.message || 'Không thể gửi đơn thành lập câu lạc bộ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openApplicationReview = (application, action) => {
    setApplicationReview(application)
    setApplicationReviewAction(action)
    setApplicationReviewForm({ note: '', conditions: '', reviewerSignature: user?.name || '' })
  }

  const submitApplicationReview = async event => {
    event.preventDefault()
    if (!applicationReview || isSubmitting) return
    const review = {
      note: applicationReviewForm.note.trim() || null,
      conditions: applicationReviewForm.conditions.trim() || null,
      reviewerSignature: applicationReviewForm.reviewerSignature.trim() || null,
    }
    setIsSubmitting(true)
    try {
      if (applicationReviewAction === 'approve') {
        await api.approveClubApplication(applicationReview.id, review)
        success(`Đã phê duyệt câu lạc bộ ${applicationReview.name}.`)
      } else if (applicationReviewAction === 'revision') {
        await api.requestClubApplicationRevision(applicationReview.id, review)
        success('Đã gửi yêu cầu chỉnh sửa đến người nộp đơn.')
      } else {
        await api.rejectClubApplication(applicationReview.id, review)
        success(`Đã từ chối đơn thành lập ${applicationReview.name}.`)
      }
      setApplicationReview(null)
      await Promise.all([loadData(), refreshClubAccess?.()])
    } catch (err) {
      error(err.message || 'Không thể xét duyệt đơn thành lập câu lạc bộ.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div>
          <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Câu lạc bộ
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white">Khám phá và tham gia câu lạc bộ</h2>
          <p className="mt-1 max-w-3xl text-sm text-gray-400">
            Quyền thành viên chỉ được kích hoạt sau khi chủ nhiệm câu lạc bộ phê duyệt. Bạn cũng có thể đăng ký thành lập câu lạc bộ mới.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          {canApplyForClub && (
            <button
              type="button"
              onClick={() => openCreationForm(null)}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-3 font-semibold text-white transition hover:shadow-lg hover:shadow-purple-500/20"
            >
              + Đăng ký thành lập câu lạc bộ
            </button>
          )}
          <input
            aria-label="Tìm kiếm câu lạc bộ"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Tìm theo tên, mã hoặc lĩnh vực..."
            className="min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500 sm:w-72"
          />
        </div>
      </motion.header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ['Câu lạc bộ đang hoạt động', clubs.filter(club => club.isActive).length, 'text-cyan-300'],
          ['Câu lạc bộ đã tham gia', memberships.filter(item => normalizedStatus(item.status) === 'APPROVED').length, 'text-emerald-300'],
          ['Đơn tham gia đang chờ duyệt', memberships.filter(item => normalizedStatus(item.status) === 'PENDING').length, 'text-amber-300'],
          ['Đơn thành lập đang chờ duyệt', pendingClubApplications.length, 'text-purple-300'],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {canApplyForClub && myApplications.length > 0 && (
        <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <h3 className="text-lg font-bold text-white">Đơn thành lập câu lạc bộ của tôi</h3>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {myApplications.map(application => (
              <div key={application.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-white">{application.name}</h4>
                    <p className="mt-1 text-xs text-gray-500">Đã gửi: {formatDate(application.submittedAtUtc)}</p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                {application.reviewNote && (
                  <p className="mt-3 rounded-lg bg-slate-900 p-3 text-sm text-gray-300">
                    <span className="font-semibold text-gray-400">Nhận xét:</span> {application.reviewNote}
                  </p>
                )}
                {normalizedStatus(application.status) === 'NEEDSREVISION' && (
                  <button
                    type="button"
                    onClick={() => openCreationForm(application)}
                    className="mt-3 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Chỉnh sửa và gửi lại
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {canReviewApplications && pendingClubApplications.length > 0 && (
        <section className="rounded-2xl border border-purple-500/25 bg-purple-500/5 p-5">
          <h3 className="text-lg font-bold text-white">Đơn thành lập câu lạc bộ đang chờ duyệt</h3>
          <p className="mt-1 text-sm text-gray-400">Kiểm tra toàn bộ thông tin đã gửi trước khi đưa ra quyết định.</p>
          <div className="mt-4 space-y-3">
            {pendingClubApplications.map(application => (
              <div
                key={application.id}
                role="button"
                tabIndex={0}
                aria-label={`Xem đơn thành lập câu lạc bộ ${application.name}`}
                onClick={() => openApplicationReview(application, 'approve')}
                onKeyDown={event => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openApplicationReview(application, 'approve')
                  }
                }}
                className="cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-purple-400/50 hover:bg-purple-500/[0.07] focus:outline-none focus:ring-2 focus:ring-purple-400/60"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-white">{application.name}</h4>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
                        {CATEGORY_LABELS[application.category] || application.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">Người sáng lập: {application.requesterName} · {application.founderOrganization}</p>
                    <p className="mt-1 text-sm text-gray-500">Đã gửi: {formatDate(application.submittedAtUtc)}</p>
                    <p className="mt-2 text-xs font-semibold text-purple-300">Nhấn để xem toàn bộ đơn</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={event => { event.stopPropagation(); openApplicationReview(application, 'reject') }} className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm font-semibold text-rose-300">Từ chối</button>
                    <button type="button" onClick={event => { event.stopPropagation(); openApplicationReview(application, 'revision') }} className="rounded-lg border border-orange-500/30 px-3 py-2 text-sm font-semibold text-orange-300">Yêu cầu chỉnh sửa</button>
                    <button type="button" onClick={event => { event.stopPropagation(); openApplicationReview(application, 'approve') }} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Phê duyệt</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingMemberReviews.length > 0 && (
        <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <h3 className="text-lg font-bold text-white">Đơn xin tham gia đang chờ chủ nhiệm xét duyệt</h3>
          <div className="mt-4 space-y-3">
            {pendingMemberReviews.map(membership => (
              <div
                key={membership.id}
                role="button"
                tabIndex={0}
                aria-label={`Xem đơn xin tham gia của ${membership.fullName}`}
                onClick={() => openMembershipReview(membership)}
                onKeyDown={event => {
                  if (event.target !== event.currentTarget) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openMembershipReview(membership)
                  }
                }}
                className="flex cursor-pointer flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-emerald-400/50 hover:bg-emerald-500/[0.07] focus:outline-none focus:ring-2 focus:ring-emerald-400/60 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <h4 className="font-semibold text-white">{membership.fullName}</h4>
                  <p className="mt-1 text-sm text-gray-400">{membership.clubName} · {membership.email} · {membership.phoneNumber}</p>
                  <p className="mt-2 line-clamp-2 text-sm text-gray-300">{membership.reason}</p>
                  <p className="mt-2 text-xs font-semibold text-emerald-300">Nhấn để xem toàn bộ đơn</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={event => { event.stopPropagation(); openMembershipReview(membership, 'reject') }} className="rounded-lg border border-rose-500/30 px-4 py-2 text-sm font-semibold text-rose-300">Từ chối</button>
                  <button type="button" onClick={event => { event.stopPropagation(); openMembershipReview(membership, 'approve') }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Xem và phê duyệt</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isLoading ? (
        <div className="flex min-h-72 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 py-16 text-center text-gray-500">
          Không tìm thấy câu lạc bộ phù hợp.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredClubs.map((club, index) => {
            const membership = membershipByClub.get(club.id)
            const status = normalizedStatus(membership?.status)
            const isManaged = managedClubIds.has(club.id)
            const approvedMemberCount = (club.members || []).filter(
              item => normalizedStatus(item.status) === 'APPROVED',
            ).length
            return (
              <motion.article
                key={club.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/65 transition hover:-translate-y-1 hover:border-cyan-500/40"
              >
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    {club.logoUrl ? (
                      <img src={club.logoUrl} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xl font-bold text-cyan-300">
                        {club.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {status && <StatusBadge status={status} />}
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">{club.code}</p>
                  <h3 className="mt-1 text-xl font-bold text-white">{club.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-purple-300">{CATEGORY_LABELS[club.category] || 'Khác'}</p>
                  <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-gray-400">{club.description || 'Chưa có mô tả.'}</p>
                  <dl className="mt-5 space-y-2 border-t border-slate-800 pt-4 text-sm">
                    <div className="flex justify-between"><dt className="text-gray-500">Thành viên</dt><dd className="font-semibold text-white">{approvedMemberCount}</dd></div>
                    <div className="flex justify-between gap-3"><dt className="text-gray-500">Liên hệ</dt><dd className="truncate text-gray-300">{club.contactEmail}</dd></div>
                  </dl>
                  {status === 'REJECTED' && membership?.reviewNote && (
                    <p className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200">Lý do: {membership.reviewNote}</p>
                  )}
                </div>
                <div className="border-t border-slate-800 bg-black/20 p-4">
                  {canDeleteClubs || isManaged ? (
                    <div className="grid gap-2">
                      <Link
                        to={`/clubs/${club.id}/members`}
                        className="w-full rounded-xl bg-cyan-500/15 px-4 py-3 text-center font-semibold text-cyan-300 transition hover:bg-cyan-500/25"
                      >
                        Quản lý thành viên
                      </Link>
                      {canDeleteClubs && (
                        <button
                          type="button"
                          onClick={() => setClubToDelete(club)}
                          className="w-full rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-semibold text-rose-300 transition hover:bg-rose-500/20"
                        >
                          Xóa câu lạc bộ
                        </button>
                      )}
                    </div>
                  ) : status === 'APPROVED' ? (
                    <p className="text-center text-sm font-semibold text-emerald-300">Tư cách thành viên đang hoạt động</p>
                  ) : status === 'PENDING' ? (
                    <p className="text-center text-sm font-semibold text-amber-300">Đơn đang chờ chủ nhiệm câu lạc bộ xét duyệt</p>
                  ) : canJoinClub ? (
                    <button type="button" onClick={() => openJoinForm(club)} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-3 font-semibold text-white">
                      {status === 'REJECTED' ? 'Gửi lại đơn' : 'Đăng ký tham gia'}
                    </button>
                  ) : (
                    <p className="text-center text-sm text-gray-500">Tài khoản này không thể gửi đơn xin tham gia</p>
                  )}
                </div>
              </motion.article>
            )
          })}
        </div>
      )}

      <Modal isOpen={Boolean(selectedClub)} onClose={closeJoinForm} title={selectedClub ? `Đăng ký tham gia ${selectedClub.name}` : 'Đơn xin tham gia câu lạc bộ'} size="xl">
        <form onSubmit={submitJoinRequest} className="space-y-6">
          <p className="rounded-lg bg-cyan-50 p-3 text-sm text-cyan-900">
            Việc gửi đơn chưa đồng nghĩa với việc trở thành thành viên. Quyền truy cập chỉ được kích hoạt sau khi chủ nhiệm câu lạc bộ phê duyệt.
          </p>
          <section className="space-y-4">
            <SectionTitle number="1" title="Thông tin cá nhân" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Họ và tên" required><TextInput value={joinForm.fullName} onChange={value => updateJoinField('fullName', value)} required maxLength={200} /></Field>
              <Field label="Ngày sinh" required><TextInput type="date" value={joinForm.dateOfBirth} onChange={value => updateJoinField('dateOfBirth', value)} required /></Field>
              <Field label="Giới tính" required>
                <select value={joinForm.gender} onChange={event => updateJoinField('gender', event.target.value)} required className={inputClass}>
                  <option value="">Chọn giới tính</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option>
                </select>
              </Field>
              <Field label="Thư điện tử" required><TextInput type="email" value={joinForm.email} onChange={value => updateJoinField('email', value)} required maxLength={255} /></Field>
              <Field label="Số điện thoại" required><TextInput type="tel" value={joinForm.phoneNumber} onChange={value => updateJoinField('phoneNumber', value)} required placeholder="0912345678" /></Field>
              <Field label="Địa chỉ"><TextInput value={joinForm.address} onChange={value => updateJoinField('address', value)} maxLength={500} /></Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle number="2" title="Cam kết tham gia" />
            <Checkbox checked={joinForm.acceptedClubRules} onChange={value => updateJoinField('acceptedClubRules', value)} required>Tôi đã đọc và đồng ý tuân thủ nội quy câu lạc bộ</Checkbox>
            <Checkbox checked={joinForm.committedToParticipate} onChange={value => updateJoinField('committedToParticipate', value)} required>Tôi cam kết tham gia đầy đủ các hoạt động của câu lạc bộ</Checkbox>
          </section>

          <section className="space-y-4">
            <SectionTitle number="3" title="Thông tin bổ sung" description={`Thông tin dành cho lĩnh vực ${CATEGORY_LABELS[selectedClub?.category] || 'Khác'}`} />
            <div className="grid gap-4 md:grid-cols-2">
              {(CATEGORY_FIELDS[selectedClub?.category] || CATEGORY_FIELDS.OTHER).map(([key, label]) => (
                <Field key={key} label={label}>
                  <TextArea value={joinForm.additionalInfo[key] || ''} onChange={value => setJoinForm(current => ({ ...current, additionalInfo: { ...current.additionalInfo, [key]: value } }))} rows={2} />
                </Field>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle number="4" title="Câu hỏi chung" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Sở thích của bạn"><TextArea value={joinForm.hobbies} onChange={value => updateJoinField('hobbies', value)} /></Field>
              <Field label="Kỹ năng nổi bật"><TextArea value={joinForm.skills} onChange={value => updateJoinField('skills', value)} /></Field>
              <Field label="Lý do tham gia" required><TextArea value={joinForm.reason} onChange={value => updateJoinField('reason', value)} required /></Field>
              <Field label="Bạn mong đợi điều gì từ câu lạc bộ?"><TextArea value={joinForm.expectations} onChange={value => updateJoinField('expectations', value)} /></Field>
              <Field label="Bạn có thể đóng góp gì cho câu lạc bộ?"><TextArea value={joinForm.contributions} onChange={value => updateJoinField('contributions', value)} /></Field>
              <Field label="Lời nhắn bổ sung"><TextArea value={joinForm.message} onChange={value => updateJoinField('message', value)} /></Field>
            </div>
          </section>
          <div className="sticky -bottom-6 z-10 -mx-6 flex gap-3 border-t border-neutral-200 bg-white px-6 py-4 shadow-[0_-12px_24px_rgba(15,23,42,0.08)]">
            <button type="button" onClick={closeJoinForm} disabled={isSubmitting} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 px-4 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={creationModalOpen} onClose={() => !isSubmitting && setCreationModalOpen(false)} title={editingApplication ? 'Chỉnh sửa đơn thành lập câu lạc bộ' : 'Đơn thành lập câu lạc bộ'} size="xl">
        <form onSubmit={submitClubApplication} className="space-y-7">
          <section className="space-y-4">
            <SectionTitle number="1" title="Thông tin câu lạc bộ đề xuất" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tên câu lạc bộ đề xuất" required><TextInput value={clubForm.name} onChange={value => updateClubForm('name', value)} required maxLength={200} /></Field>
              <Field label="Lĩnh vực hoạt động" required>
                <select value={clubForm.category} onChange={event => updateClubForm('category', event.target.value)} required className={inputClass}>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Tên viết tắt (không bắt buộc)"><TextInput value={clubForm.code} onChange={value => updateClubForm('code', value.toUpperCase())} maxLength={20} placeholder="Để trống để hệ thống tự tạo" /></Field>
              <Field label="Logo/biểu tượng (URL không bắt buộc)"><TextInput type="url" value={clubForm.logoUrl} onChange={value => updateClubForm('logoUrl', value)} maxLength={1000} /></Field>
            </div>
            <Field label="Mục tiêu" required><TextArea value={clubForm.purpose} onChange={value => updateClubForm('purpose', value)} required /></Field>
            <Field label="Mô tả ngắn về câu lạc bộ" required><TextArea value={clubForm.description} onChange={value => updateClubForm('description', value)} required /></Field>
          </section>

          <section className="space-y-4">
            <SectionTitle number="2" title="Thông tin người sáng lập / chủ nhiệm câu lạc bộ" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Họ và tên" required><TextInput value={clubForm.founderFullName} onChange={value => updateClubForm('founderFullName', value)} required /></Field>
              <Field label="Vai trò đề xuất" required><TextInput value={clubForm.founderRole} onChange={value => updateClubForm('founderRole', value)} required /></Field>
              <Field label="Thư điện tử" required><TextInput type="email" value={clubForm.founderEmail} onChange={value => updateClubForm('founderEmail', value)} required /></Field>
              <Field label="Số điện thoại" required><TextInput type="tel" value={clubForm.founderPhone} onChange={value => updateClubForm('founderPhone', value)} required /></Field>
              <Field label="Lớp / Khoa / Phòng ban" required><TextInput value={clubForm.founderOrganization} onChange={value => updateClubForm('founderOrganization', value)} required /></Field>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <SectionTitle number="3" title="Thành viên sáng lập" />
              <button type="button" onClick={addFoundingMember} className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white">+ Thêm thành viên</button>
            </div>
            <Field label="Số thành viên sáng lập" required><input type="number" min="1" max="200" value={clubForm.foundingMemberCount} onChange={event => updateClubForm('foundingMemberCount', Number(event.target.value))} required className={inputClass} /></Field>
            <div className="space-y-3">
              {clubForm.foundingMembers.map((member, index) => (
                <div key={`${index}-${member.email}`} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-semibold text-neutral-800">Thành viên #{index + 1}</p>
                    {clubForm.foundingMembers.length > 1 && <button type="button" onClick={() => removeFoundingMember(index)} className="text-sm font-semibold text-rose-600">Xóa</button>}
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput value={member.fullName} onChange={value => updateFoundingMember(index, 'fullName', value)} required placeholder="Họ và tên" ariaLabel={`Họ và tên thành viên sáng lập ${index + 1}`} />
                    <TextInput value={member.organization} onChange={value => updateFoundingMember(index, 'organization', value)} required placeholder="Lớp/Khoa" ariaLabel={`Lớp hoặc khoa của thành viên sáng lập ${index + 1}`} />
                    <TextInput type="email" value={member.email} onChange={value => updateFoundingMember(index, 'email', value)} required placeholder="Thư điện tử" ariaLabel={`Thư điện tử của thành viên sáng lập ${index + 1}`} />
                  </div>
                </div>
              ))}
            </div>
            <Checkbox checked={clubForm.foundingMembersCommitted} onChange={value => updateClubForm('foundingMembersCommitted', value)} required>Các thành viên sáng lập đã đồng ý và cam kết tham gia</Checkbox>
          </section>

          <section className="space-y-4">
            <SectionTitle number="4" title="Kế hoạch hoạt động" />
            <Field label="Các hoạt động chính dự kiến" required><TextArea value={clubForm.mainActivities} onChange={value => updateClubForm('mainActivities', value)} required rows={4} maxLength={2000} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tần suất hoạt động" required>
                <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[1-9][0-9]*"
                    maxLength={3}
                    value={clubForm.activityFrequencyCount}
                    onChange={event => updateClubForm(
                      'activityFrequencyCount',
                      event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3),
                    )}
                    required
                    aria-label="Số lần hoạt động"
                    placeholder="Số lần"
                    className={inputClass}
                  />
                  <select
                    value={clubForm.activityFrequencyUnit}
                    onChange={event => updateClubForm('activityFrequencyUnit', event.target.value)}
                    aria-label="Đơn vị tần suất"
                    className={inputClass}
                  >
                    {Object.entries(ACTIVITY_FREQUENCY_UNITS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </Field>
              <Field label="Địa điểm đề xuất"><TextInput value={clubForm.expectedLocation} onChange={value => updateClubForm('expectedLocation', value)} /></Field>
              <Field label="Lịch dự kiến"><TextInput value={clubForm.expectedSchedule} onChange={value => updateClubForm('expectedSchedule', value)} placeholder="Khung giờ/ngày" /></Field>
              <Field label="Sự kiện lớn dự kiến"><TextArea value={clubForm.majorEvents} onChange={value => updateClubForm('majorEvents', value)} /></Field>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle number="5" title="Nguồn lực cần thiết" />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Phòng họp / địa điểm">
                <select value={clubForm.venueSupport} onChange={event => updateClubForm('venueSupport', event.target.value)} className={inputClass}><option value="SUPPORT_NEEDED">Cần hỗ trợ</option><option value="SELF_MANAGED">Tự quản lý</option></select>
              </Field>
              <Field label="Kinh phí">
                <select value={clubForm.fundingSupport} onChange={event => updateClubForm('fundingSupport', event.target.value)} className={inputClass}><option value="SUPPORT_NEEDED">Cần hỗ trợ</option><option value="SELF_FUNDED">Tự tài trợ</option><option value="COMBINED">Kết hợp</option></select>
              </Field>
              <Field label="Thiết bị cần thiết"><TextArea value={clubForm.equipmentNeeds} onChange={value => updateClubForm('equipmentNeeds', value)} /></Field>
              <Checkbox checked={clubForm.advisorNeeded} onChange={value => updateClubForm('advisorNeeded', value)}>Cần cố vấn hoặc người hướng dẫn</Checkbox>
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle number="6" title="Cam kết" />
            <Checkbox checked={clubForm.committedToRules} onChange={value => updateClubForm('committedToRules', value)} required>Đảm bảo mọi hoạt động tuân thủ quy định hiện hành</Checkbox>
            <Checkbox checked={clubForm.committedToResponsibility} onChange={value => updateClubForm('committedToResponsibility', value)} required>Chịu trách nhiệm trước ban quản trị</Checkbox>
            <Checkbox checked={clubForm.committedToReporting} onChange={value => updateClubForm('committedToReporting', value)} required>Nộp báo cáo hoạt động định kỳ</Checkbox>
          </section>
          <div className="sticky -bottom-6 z-10 -mx-6 flex gap-3 border-t border-neutral-200 bg-white px-6 py-4 shadow-[0_-12px_24px_rgba(15,23,42,0.08)]">
            <button type="button" onClick={() => setCreationModalOpen(false)} disabled={isSubmitting} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Đang gửi...' : editingApplication ? 'Gửi lại đơn' : 'Gửi đơn thành lập'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(membershipReview)} onClose={() => !isSubmitting && setMembershipReview(null)} title={membershipReviewAction === 'approve' ? 'Xét duyệt đơn tham gia' : 'Từ chối đơn tham gia'} size="lg">
        <form onSubmit={submitMembershipReview} className="space-y-5">
          {membershipReview && (
            <div className="grid gap-4 rounded-xl bg-neutral-50 p-4 md:grid-cols-2">
              <Detail label="Họ và tên" value={membershipReview.fullName} />
              <Detail label="Ngày sinh" value={membershipReview.dateOfBirth} />
              <Detail label="Giới tính" value={GENDER_LABELS[membershipReview.gender] || 'Không xác định'} />
              <Detail label="Thư điện tử" value={membershipReview.email} />
              <Detail label="Số điện thoại" value={membershipReview.phoneNumber} />
              <Detail label="Địa chỉ" value={membershipReview.address} />
              <Detail label="Sở thích" value={membershipReview.hobbies} />
              <Detail label="Kỹ năng" value={membershipReview.skills} />
              <Detail label="Lý do tham gia" value={membershipReview.reason} />
              <Detail label="Mong đợi" value={membershipReview.expectations} />
              <Detail label="Khả năng đóng góp" value={membershipReview.contributions} />
              <Detail label="Lời nhắn bổ sung" value={membershipReview.requestMessage} />
              <Detail label="Cam kết tuân thủ nội quy" value={membershipReview.acceptedClubRules ? 'Đã xác nhận' : 'Chưa xác nhận'} />
              <Detail label="Cam kết tham gia hoạt động" value={membershipReview.committedToParticipate ? 'Đã xác nhận' : 'Chưa xác nhận'} />
              {Object.entries(membershipReview.additionalInfo || {}).map(([key, value]) => (
                <Detail
                  key={key}
                  label={getAdditionalFieldLabel(membershipReview.clubCategory, key)}
                  value={value}
                />
              ))}
            </div>
          )}
          <Field label={membershipReviewAction === 'reject' ? 'Lý do từ chối' : 'Nhận xét xét duyệt'} required={membershipReviewAction === 'reject'}>
            <TextArea value={membershipReviewNote} onChange={setMembershipReviewNote} required={membershipReviewAction === 'reject'} />
          </Field>
          <div className="flex gap-3">
            <button type="button" onClick={() => setMembershipReview(null)} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700">Hủy</button>
            <button type="submit" disabled={isSubmitting} className={`flex-1 rounded-lg px-4 py-3 font-semibold text-white ${membershipReviewAction === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'}`}>{isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(applicationReview)} onClose={() => !isSubmitting && setApplicationReview(null)} title="Xét duyệt của quản trị viên" size="xl">
        <form onSubmit={submitApplicationReview} className="space-y-6">
          {applicationReview && (
            <div className="space-y-5">
              <div className="grid gap-4 rounded-xl bg-neutral-50 p-4 md:grid-cols-3">
                <Detail label="Tên câu lạc bộ" value={applicationReview.name} />
                <Detail label="Lĩnh vực" value={CATEGORY_LABELS[applicationReview.category] || 'Khác'} />
                <Detail label="Ngày gửi" value={formatDate(applicationReview.submittedAtUtc)} />
                <Detail label="Mã câu lạc bộ" value={applicationReview.code} />
                <Detail label="Logo/biểu tượng" value={applicationReview.logoUrl} />
                <Detail label="Mục tiêu" value={applicationReview.purpose} />
                <Detail label="Mô tả" value={applicationReview.description} />
                <Detail label="Người sáng lập" value={`${applicationReview.requesterName} – ${applicationReview.founderRole}`} />
                <Detail label="Liên hệ" value={`${applicationReview.contactEmail} · ${applicationReview.contactPhone}`} />
                <Detail label="Đơn vị" value={applicationReview.founderOrganization} />
                <Detail label="Thành viên sáng lập" value={applicationReview.foundingMemberCount} />
                <Detail label="Hoạt động chính" value={applicationReview.mainActivities} />
                <Detail label="Tần suất" value={applicationReview.activityFrequency} />
                <Detail label="Địa điểm/lịch" value={`${applicationReview.expectedLocation || '—'} · ${applicationReview.expectedSchedule || '—'}`} />
                <Detail label="Sự kiện lớn" value={applicationReview.majorEvents} />
                <Detail label="Phòng họp / địa điểm" value={VENUE_SUPPORT_LABELS[applicationReview.venueSupport] || 'Không xác định'} />
                <Detail label="Kinh phí" value={FUNDING_SUPPORT_LABELS[applicationReview.fundingSupport] || 'Không xác định'} />
                <Detail label="Thiết bị" value={applicationReview.equipmentNeeds} />
                <Detail label="Cần cố vấn" value={applicationReview.advisorNeeded ? 'Có' : 'Không'} />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-xl border border-neutral-200 p-4">
                  <h3 className="font-semibold text-neutral-900">Thành viên sáng lập</h3>
                  <div className="mt-3 space-y-2">
                    {(applicationReview.foundingMembers || []).map((member, index) => (
                      <div key={`${member.email}-${index}`} className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
                        <p className="font-semibold text-neutral-900">{index + 1}. {member.fullName}</p>
                        <p>{member.organization} · {member.email}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-neutral-700">
                    Cam kết của thành viên: <span className="font-semibold">{applicationReview.foundingMembersCommitted ? 'Đã xác nhận' : 'Chưa xác nhận'}</span>
                  </p>
                </section>
                <section className="rounded-xl border border-neutral-200 p-4">
                  <h3 className="font-semibold text-neutral-900">Cam kết của người sáng lập</h3>
                  <div className="mt-3 space-y-2 text-sm text-neutral-700">
                    <p>Tuân thủ quy định: <span className="font-semibold">{applicationReview.committedToRules ? 'Đã xác nhận' : 'Chưa xác nhận'}</span></p>
                    <p>Chịu trách nhiệm quản lý: <span className="font-semibold">{applicationReview.committedToResponsibility ? 'Đã xác nhận' : 'Chưa xác nhận'}</span></p>
                    <p>Nộp báo cáo hoạt động định kỳ: <span className="font-semibold">{applicationReview.committedToReporting ? 'Đã xác nhận' : 'Chưa xác nhận'}</span></p>
                  </div>
                </section>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-neutral-700">Quyết định *</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {[['approve', 'Phê duyệt'], ['revision', 'Yêu cầu chỉnh sửa'], ['reject', 'Từ chối']].map(([value, label]) => (
                    <label key={value} className={`cursor-pointer rounded-lg border p-3 text-center font-semibold ${applicationReviewAction === value ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-neutral-200 text-neutral-600'}`}>
                      <input type="radio" name="decision" value={value} checked={applicationReviewAction === value} onChange={() => setApplicationReviewAction(value)} className="sr-only" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <Field label={applicationReviewAction === 'approve' ? 'Ghi chú' : 'Nhận xét / nội dung cần chỉnh sửa'} required={applicationReviewAction !== 'approve'}><TextArea value={applicationReviewForm.note} onChange={value => setApplicationReviewForm(current => ({ ...current, note: value }))} required={applicationReviewAction !== 'approve'} /></Field>
          <Field label="Điều kiện"><TextArea value={applicationReviewForm.conditions} onChange={value => setApplicationReviewForm(current => ({ ...current, conditions: value }))} /></Field>
          <Field label="Chữ ký người xét duyệt"><TextInput value={applicationReviewForm.reviewerSignature} onChange={value => setApplicationReviewForm(current => ({ ...current, reviewerSignature: value }))} maxLength={200} /></Field>
          <div className="flex gap-3">
            <button type="button" onClick={() => setApplicationReview(null)} className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{isSubmitting ? 'Đang xử lý...' : 'Xác nhận quyết định'}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(clubToDelete)}
        onClose={() => !isSubmitting && setClubToDelete(null)}
        title="Xóa câu lạc bộ"
        size="md"
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <p className="font-semibold">Xóa {clubToDelete?.name}?</p>
            <p className="mt-2">
              Câu lạc bộ sẽ bị vô hiệu hóa và xóa khỏi danh sách đang hoạt động. Các phân công chủ nhiệm hiện tại cũng sẽ kết thúc.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setClubToDelete(null)}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-neutral-100 px-4 py-3 font-semibold text-neutral-700 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={deleteClub}
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-rose-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Đang xóa...' : 'Xóa câu lạc bộ'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
