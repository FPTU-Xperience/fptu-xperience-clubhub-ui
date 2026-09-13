import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileUp, FileText, Upload, Trash2, RefreshCw, AlertCircle, CheckCircle2, Save, Calendar, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'

const REPORT_TYPES = [
  { value: 'QUARTERLY', label: 'Báo cáo quý (Quarterly)' },
  { value: 'MONTHLY', label: 'Báo cáo tháng (Monthly)' },
  { value: 'SEMESTER', label: 'Báo cáo học kỳ (Semester)' },
  { value: 'ANNUAL', label: 'Báo cáo năm (Annual)' },
  { value: 'AD_HOC', label: 'Báo cáo đột xuất (Ad-hoc)' },
  { value: 'FUTURE_EVENT', label: 'Báo cáo sự kiện sắp tới (Future Event)' },
]

const DEFAULT_PERIODS = [
  { period: '2026-Q3', label: 'Quý III / 2026', dueDate: '2026-09-30' },
  { period: '2026-Q4', label: 'Quý IV / 2026', dueDate: '2026-12-31' },
  { period: '2026-Q2', label: 'Quý II / 2026', dueDate: '2026-06-30' },
  { period: '2026-HK1', label: 'Học kỳ I / 2026-2027', dueDate: '2026-11-15' },
]

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

function generateUniqueId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export default function CreateReportPage() {
  const { id } = useParams()
  const isEditMode = Boolean(id)
  const navigate = useNavigate()
  const { user, clubAccess } = useAuth()
  const { success, error } = useToast()

  const [creationMode, setCreationMode] = useState('FORM') // 'FORM' | 'UPLOAD'
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(isEditMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deadlines, setDeadlines] = useState([])
  const [managedClubs, setManagedClubs] = useState([])

  // Shared metadata
  const [clubId, setClubId] = useState('')
  const [period, setPeriod] = useState('2026-Q3')
  const [reportType, setReportType] = useState('QUARTERLY')

  // Form mode fields
  const [executiveSummary, setExecutiveSummary] = useState('')
  const [achievements, setAchievements] = useState('')
  const [challenges, setChallenges] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [nextPeriodPlan, setNextPeriodPlan] = useState('')
  const [activities, setActivities] = useState([
    {
      id: generateUniqueId(),
      dbId: null,
      activityName: '',
      activityType: 'Chuyên môn',
      activityDate: new Date().toISOString().split('T')[0],
      location: '',
      partnerUnit: '',
      objective: '',
      description: '',
      targetParticipantCount: 50,
      participantCount: 0,
      outcome: '',
      budgetSpent: 0,
      evidenceUrl: '',
    },
  ])

  // Upload mode fields
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadNote, setUploadNote] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef(null)

  const isFutureEvent = reportType === 'FUTURE_EVENT'

  const userManagedClubs = useMemo(() => {
    return clubAccess.filter((access) => access.isManager)
  }, [clubAccess])

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [clubsRes, deadlinesRes] = await Promise.all([
          api.getClubs(),
          api.getReportingDeadlines().catch(() => []),
        ])

        const clubsList = Array.isArray(clubsRes) ? clubsRes : []
        const managedIds = new Set(userManagedClubs.map((c) => c.clubId))
        const filteredManaged = clubsList.filter((c) => managedIds.has(c.id))

        setManagedClubs(filteredManaged)
        if (filteredManaged.length > 0 && !clubId) {
          setClubId(filteredManaged[0].id)
        }

        if (Array.isArray(deadlinesRes) && deadlinesRes.length > 0) {
          setDeadlines(deadlinesRes)
        } else {
          setDeadlines(DEFAULT_PERIODS)
        }
      } catch (err) {
        console.error('Error loading report creation dependencies:', err)
      }
    }
    loadInitialData()
  }, [clubAccess, userManagedClubs])

  useEffect(() => {
    if (!isEditMode) return
    async function loadReportForEdit() {
      setIsLoading(true)
      try {
        const rep = await api.getReport(id)
        setClubId(rep.clubId)
        setPeriod(rep.period || '2026-Q3')
        setReportType(rep.reportType || 'QUARTERLY')
        setExecutiveSummary(rep.executiveSummary || '')
        setAchievements(rep.achievements || '')
        setChallenges(rep.challenges || '')
        setRecommendations(rep.recommendations || '')
        setNextPeriodPlan(rep.nextPeriodPlan || '')

        if (rep.contentSource === 'UPLOADED_FILE') {
          setCreationMode('UPLOAD')
        }

        if (Array.isArray(rep.details) && rep.details.length > 0) {
          setActivities(
            rep.details.map((d) => ({
              id: generateUniqueId(),
              dbId: d.id,
              activityName: d.activityName || '',
              activityType: d.activityType || 'Chuyên môn',
              activityDate: d.activityDate || new Date().toISOString().split('T')[0],
              location: d.location || '',
              partnerUnit: d.partnerUnit || '',
              objective: d.objective || '',
              description: d.description || '',
              targetParticipantCount: d.targetParticipantCount || 0,
              participantCount: d.participantCount || 0,
              outcome: d.outcome || '',
              budgetSpent: d.budgetSpent || 0,
              evidenceUrl: d.evidenceUrl || '',
            })),
          )
        }
      } catch (err) {
        error(err.message || 'Không thể tải thông tin báo cáo để chỉnh sửa.')
        navigate('/reports')
      } finally {
        setIsLoading(false)
      }
    }
    loadReportForEdit()
  }, [id, isEditMode, navigate, error])

  const currentDueDate = useMemo(() => {
    const matched = deadlines.find((d) => d.period === period)
    return matched?.dueDate || matched?.DueDate || 'Chưa quy định'
  }, [deadlines, period])

  const totals = useMemo(() => {
    const totalActivities = activities.length
    const totalParticipants = activities.reduce((acc, curr) => acc + (Number(curr.participantCount) || 0), 0)
    const totalBudget = activities.reduce((acc, curr) => acc + (Number(curr.budgetSpent) || 0), 0)
    return { totalActivities, totalParticipants, totalBudget }
  }, [activities])

  const validateFile = (file) => {
    if (!file) {
      return 'Vui lòng chọn tệp báo cáo.'
    }
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return 'Định dạng tệp không được hỗ trợ. Chỉ chấp nhận các tệp .pdf, .docx, .xlsx.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Dung lượng tệp vượt quá giới hạn cho phép (tối đa 20 MB).'
    }
    return ''
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) {
      setUploadError(err)
      setSelectedFile(null)
    } else {
      setUploadError('')
      setSelectedFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const err = validateFile(file)
    if (err) {
      setUploadError(err)
      setSelectedFile(null)
    } else {
      setUploadError('')
      setSelectedFile(file)
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!clubId) {
      error('Vui lòng chọn câu lạc bộ.')
      return
    }
    const fileErr = validateFile(selectedFile)
    if (fileErr) {
      setUploadError(fileErr)
      error(fileErr)
      return
    }

    setIsSubmitting(true)
    setUploadProgress(30)
    try {
      const formData = new FormData()
      formData.append('clubId', clubId)
      formData.append('period', period)
      formData.append('reportType', reportType)
      if (uploadNote.trim()) {
        formData.append('note', uploadNote.trim())
      }
      formData.append('file', selectedFile)

      setUploadProgress(70)
      const res = await api.uploadReportFile(formData)
      setUploadProgress(100)
      success('Tải lên báo cáo thành công!')
      navigate(`/reports/${res.id}`)
    } catch (err) {
      error(err.message || 'Không thể tải lên báo cáo.')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const saveReport = async (submitAfterSave = false) => {
    if (!clubId) {
      error('Vui lòng chọn câu lạc bộ.')
      return
    }
    if (activities.length === 0 || !activities[0].activityName.trim()) {
      error('Báo cáo phải chứa ít nhất một hoạt động có tên.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        clubId: Number(clubId),
        period,
        reportType,
        executiveSummary,
        achievements,
        challenges,
        recommendations,
        nextPeriodPlan,
        details: activities.map((act, index) => ({
          id: act.dbId,
          activityName: act.activityName.trim(),
          activityDate: act.activityDate,
          description: act.description.trim(),
          participantCount: Number(act.participantCount) || 0,
          outcome: act.outcome.trim(),
          activityType: act.activityType,
          location: act.location.trim(),
          partnerUnit: act.partnerUnit.trim(),
          objective: act.objective.trim(),
          targetParticipantCount: Number(act.targetParticipantCount) || 0,
          budgetSpent: Number(act.budgetSpent) || 0,
          evidenceUrl: act.evidenceUrl.trim(),
          sortOrder: index,
        })),
      }

      let targetId = id
      if (isEditMode) {
        await api.updateReport(id, payload)
        success('Đã cập nhật báo cáo thành công!')
      } else {
        const created = await api.createReport(payload)
        targetId = created.id
        success('Đã tạo dự thảo báo cáo thành công!')
      }

      if (submitAfterSave && targetId) {
        await api.submitReport(targetId)
        success(isFutureEvent ? 'Đã gửi báo cáo sự kiện kết hợp cho thủ quỹ!' : 'Đã nộp báo cáo để xét duyệt!')
      }

      navigate(targetId ? `/reports/${targetId}` : '/reports')
    } catch (err) {
      error(err.message || 'Không thể lưu báo cáo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="cyber-spinner" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-orbitron text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
            {isEditMode ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo hoạt động'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Lựa chọn phương thức nộp báo cáo hoạt động định kỳ cho câu lạc bộ.
          </p>
        </div>
      </div>

      {/* Method Selector Tabs */}
      {!isEditMode && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setCreationMode('FORM')}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left transition ${
              creationMode === 'FORM'
                ? 'border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-400/30'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              creationMode === 'FORM' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              <FileText size={24} />
            </div>
            <div>
              <h3 className={`font-semibold ${creationMode === 'FORM' ? 'text-cyan-300' : 'text-slate-200'}`}>
                Nhập trực tiếp trên hệ thống
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Khai báo theo mẫu chuẩn 4 bước: Thông tin chung, Hoạt động, Đánh giá và Phê duyệt.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCreationMode('UPLOAD')}
            className={`flex items-center gap-4 rounded-xl border p-5 text-left transition ${
              creationMode === 'UPLOAD'
                ? 'border-cyan-400/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/5 ring-1 ring-cyan-400/30'
                : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
              creationMode === 'UPLOAD' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              <FileUp size={24} />
            </div>
            <div>
              <h3 className={`font-semibold ${creationMode === 'UPLOAD' ? 'text-cyan-300' : 'text-slate-200'}`}>
                Tải báo cáo có sẵn
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Tải lên tệp văn bản báo cáo có sẵn từ máy tính (.pdf, .docx, .xlsx, tối đa 20 MB).
              </p>
            </div>
          </button>
        </div>
      )}

      {/* METHOD 2: UPLOAD WORKFLOW */}
      {creationMode === 'UPLOAD' && (
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Upload size={20} className="text-cyan-400" /> Thông tin tệp báo cáo nộp
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Câu lạc bộ <span className="text-rose-400">*</span>
                </label>
                <select
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                >
                  {managedClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name} ({club.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Kỳ báo cáo <span className="text-rose-400">*</span>
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                >
                  {deadlines.map((d) => (
                    <option key={d.period} value={d.period}>
                      {d.label || d.period}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Loại báo cáo
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Hạn nộp (từ hệ thống)
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentDueDate}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-amber-300 font-semibold cursor-not-allowed"
                />
              </div>
            </div>

            {/* Drop Zone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Chọn tệp báo cáo (.pdf, .docx, .xlsx) <span className="text-rose-400">*</span>
              </label>
              
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                  uploadError
                    ? 'border-rose-500/50 bg-rose-500/5'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-700 bg-slate-950/40 hover:border-cyan-400/50 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                      <CheckCircle2 size={24} />
                    </div>
                    <p className="font-semibold text-slate-100">{selectedFile.name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{formatBytes(selectedFile.size)}</span>
                      <span>•</span>
                      <span className="uppercase font-mono text-cyan-300">
                        {selectedFile.name.split('.').pop()}
                      </span>
                    </div>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          fileInputRef.current?.click()
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                      >
                        <RefreshCw size={14} /> Thay đổi
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(null)
                          setUploadError('')
                        }}
                        className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
                      >
                        <Trash2 size={14} /> Xóa tệp
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      Kéo thả tệp báo cáo vào đây hoặc <span className="text-cyan-400 underline">chọn từ máy tính</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Hỗ trợ định dạng .PDF, .DOCX, .XLSX (Tối đa 20 MB)
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <p className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1.5">
                  <AlertCircle size={14} /> {uploadError}
                </p>
              )}
            </div>

            {/* Optional Note */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Ghi chú / Tóm tắt báo cáo (không bắt buộc)
              </label>
              <textarea
                rows={3}
                value={uploadNote}
                onChange={(e) => setUploadNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc tóm tắt ngắn về báo cáo nộp..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Progress indicator */}
          {isSubmitting && uploadProgress > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Đang tải tệp báo cáo lên hệ thống...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-6 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
            >
              <Upload size={18} /> {isSubmitting ? 'Đang tải lên...' : 'Tải lên và lưu dự thảo'}
            </button>
          </div>
        </form>
      )}

      {/* METHOD 1: STRUCTURED FORM WORKFLOW */}
      {creationMode === 'FORM' && (
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="grid grid-cols-4 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
            {[1, 2, 3, 4].map((s) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  step === s
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : step > s
                    ? 'bg-slate-800 text-cyan-400'
                    : 'text-slate-500 hover:bg-slate-800/50'
                }`}
              >
                {s === 1 && '1. THÔNG TIN CHUNG'}
                {s === 2 && `2. HOẠT ĐỘNG (${activities.length})`}
                {s === 3 && '3. ĐÁNH GIÁ'}
                {s === 4 && '4. XEM TRƯỚC'}
              </button>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <FileText size={20} className="text-cyan-400" /> BƯỚC 1: THÔNG TIN CHUNG
              </h2>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Câu lạc bộ <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={clubId}
                    onChange={(e) => setClubId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  >
                    {managedClubs.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name} ({club.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Kỳ báo cáo <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  >
                    {deadlines.map((d) => (
                      <option key={d.period} value={d.period}>
                        {d.label || d.period}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Loại báo cáo
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  >
                    {REPORT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">
                    Hạn nộp (từ hệ thống)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentDueDate}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-sm text-amber-300 font-semibold cursor-not-allowed"
                  />
                </div>
              </div>

              {isFutureEvent && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
                  <strong>Báo cáo sự kiện sắp tới:</strong> Nộp báo cáo này sẽ tự động tạo thông báo đề xuất ngân sách gửi đến thủ quỹ CLB. Chủ nhiệm CLB sẽ gửi gói hồ sơ kết hợp sau khi thủ quỹ hoàn tất phần ngân sách.
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Tóm tắt điều hành</label>
                <textarea
                  rows={3}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  placeholder="Tóm tắt tổng quan về tình hình hoạt động của CLB trong kỳ..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-cyan-400 text-slate-950 font-bold rounded-lg hover:bg-cyan-300 transition-all text-xs"
                >
                  Tiếp theo: BƯỚC 2 (Hoạt động) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">BƯỚC 2: DANH SÁCH HOẠT ĐỘNG ({activities.length})</h2>
                <button
                  type="button"
                  onClick={() => setActivities([...activities, {
                    id: generateUniqueId(),
                    dbId: null,
                    activityName: '',
                    activityType: 'Chuyên môn',
                    activityDate: new Date().toISOString().split('T')[0],
                    location: '',
                    partnerUnit: '',
                    objective: '',
                    description: '',
                    targetParticipantCount: 50,
                    participantCount: 0,
                    outcome: '',
                    budgetSpent: 0,
                    evidenceUrl: '',
                  }])}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-slate-700"
                >
                  + Thêm hoạt động
                </button>
              </div>

              {activities.map((act, idx) => (
                <div key={act.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="text-xs font-bold text-cyan-400">HOẠT ĐỘNG #{idx + 1}</span>
                    {activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActivities(activities.filter((a) => a.id !== act.id))}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Xóa hoạt động
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">Tên hoạt động *</label>
                      <input
                        type="text"
                        value={act.activityName}
                        onChange={(e) => {
                          const next = [...activities]
                          next[idx].activityName = e.target.value
                          setActivities(next)
                        }}
                        placeholder="Nhập tên hoạt động..."
                        className="w-full rounded-md border border-slate-700 bg-slate-900 p-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-300">Ngày tổ chức</label>
                      <input
                        type="date"
                        value={act.activityDate}
                        onChange={(e) => {
                          const next = [...activities]
                          next[idx].activityDate = e.target.value
                          setActivities(next)
                        }}
                        className="w-full rounded-md border border-slate-700 bg-slate-900 p-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 text-xs"
                >
                  &larr; Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-cyan-400 text-slate-950 font-bold rounded-lg hover:bg-cyan-300 transition-all text-xs"
                >
                  Tiếp theo: BƯỚC 3 (Đánh giá) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-100">BƯỚC 3: ĐÁNH GIÁ VÀ KẾ HOẠCH</h2>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Thành tựu nổi bật</label>
                <textarea
                  rows={3}
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Ghi nhận thành tựu, giải thưởng hoặc kết quả xuất sắc..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Khó khăn & tồn tại</label>
                <textarea
                  rows={3}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="Mô tả khó khăn về địa điểm, tài chính, nhân sự..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Kiến nghị hỗ trợ</label>
                <textarea
                  rows={3}
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="Đề xuất hỗ trợ từ nhà trường hoặc Phòng Công tác Sinh viên..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Kế hoạch kỳ tiếp theo</label>
                <textarea
                  rows={3}
                  value={nextPeriodPlan}
                  onChange={(e) => setNextPeriodPlan(e.target.value)}
                  placeholder="Nêu mục tiêu và sự kiện dự kiến trong kỳ tới..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 text-xs"
                >
                  &larr; Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-cyan-400 text-slate-950 font-bold rounded-lg hover:bg-cyan-300 transition-all text-xs"
                >
                  Tiếp theo: BƯỚC 4 (Xem trước & Nộp) &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="rounded-xl border border-cyan-500/30 bg-slate-900/80 p-6 space-y-6">
              <h2 className="text-lg font-bold font-orbitron text-cyan-400">BƯỚC 4: XEM TRƯỚC VÀ NỘP BÁO CÁO</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div>
                  <p className="text-xs text-slate-400">Kỳ báo cáo</p>
                  <p className="font-semibold text-cyan-400">{period}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Loại báo cáo</p>
                  <p className="font-semibold text-slate-200">{reportType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Hạn nộp</p>
                  <p className="font-semibold text-amber-400 font-mono">{currentDueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Số hoạt động</p>
                  <p className="font-semibold text-emerald-400">{totals.totalActivities} hoạt động</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-cyan-400 tracking-wider">Tóm tắt điều hành</h4>
                  <p className="text-slate-300 text-sm mt-1 bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                    {executiveSummary || 'Chưa có tóm tắt.'}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-cyan-400 tracking-wider">Thành tựu nổi bật</h4>
                  <p className="text-slate-300 text-sm mt-1 bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                    {achievements || 'Chưa có thông tin.'}
                  </p>
                </div>
              </div>

              {isFutureEvent && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-sm text-purple-200">
                  Nộp báo cáo này sẽ gửi thông báo yêu cầu kinh phí tới thủ quỹ CLB. Chủ nhiệm CLB sẽ duyệt gói hồ sơ kết hợp sau khi thủ quỹ hoàn thành.
                </div>
              )}

              <div className="flex justify-between pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 text-xs"
                >
                  &larr; Quay lại chỉnh sửa
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => saveReport(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold rounded-lg border border-cyan-500/30 text-xs"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu dự thảo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => saveReport(true)}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg shadow-lg shadow-cyan-500/20 text-xs"
                  >
                    {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo ngay'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
