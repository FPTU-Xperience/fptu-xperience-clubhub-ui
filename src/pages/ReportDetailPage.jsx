import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleAlert,
  ClipboardList,
  Download,
  ExternalLink,
  FileDown,
  FilePenLine,
  FileText,
  Landmark,
  Maximize2,
  Minimize2,
  Paperclip,
  Send,
  Sheet,
  Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import Modal from '../components/Modal'
import ReportStatusBadge, { normalizeReportStatus } from '../components/reports/ReportStatusBadge'
import ExportHistoryModal from '../components/reports/ExportHistoryModal'
import MinimalUploadedReportPreview from '../components/reports/MinimalUploadedReportPreview'
import { formatReportType, formatSystemText } from '../locales/vi'

function formatDate(value, includeTime = false) {
  if (!value) return 'Chưa cập nhật'
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return value
  return includeTime ? date.toLocaleString('vi-VN') : date.toLocaleDateString('vi-VN')
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function ReviewDecisionModal({
  isOpen,
  onClose,
  action,
  feedbackNote,
  onFeedbackNoteChange,
  isSubmitting,
  onConfirm,
  isManagerReview,
}) {
  const isApproval = action === 'approve'
  const title = isApproval
    ? isManagerReview ? 'Xét duyệt báo cáo' : 'Phê duyệt báo cáo'
    : 'Yêu cầu chỉnh sửa'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div
          className={`flex gap-3 rounded-xl border p-4 text-sm leading-6 ${
            isApproval
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
          }`}
        >
          <CircleAlert size={18} className="mt-0.5 shrink-0" />
          <p>
            {isApproval
              ? isManagerReview
                ? 'Báo cáo sẽ được chuyển đến quản trị viên để phê duyệt cuối.'
                : 'Bạn có thể thêm nhận xét trước khi phê duyệt báo cáo.'
              : 'Nêu rõ nội dung cần bổ sung để câu lạc bộ có thể cập nhật báo cáo.'}
          </p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Nhận xét {!isApproval && <span className="text-rose-600">*</span>}
          </label>
          <textarea
            rows={5}
            value={feedbackNote}
            onChange={(event) => onFeedbackNoteChange(event.target.value)}
            placeholder={
              isApproval
                ? 'Nhận xét tích cực hoặc lưu ý thêm (không bắt buộc)'
                : 'Nội dung cần chỉnh sửa'
            }
            maxLength={1000}
            className="min-h-36 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-base leading-6 text-slate-900 shadow-inner outline-none placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>Nhận xét sẽ được lưu trong lịch sử phản hồi.</span>
            <span>{feedbackNote.length}/1000</span>
          </div>
        </div>
        <div className="-mx-6 -mb-6 flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className={`min-h-11 rounded-lg px-5 text-sm font-bold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isApproval
                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200'
                : 'bg-rose-600 hover:bg-rose-700 focus:ring-4 focus:ring-rose-200'
            }`}
          >
            {isSubmitting
              ? 'Đang xử lý'
              : isApproval
              ? isManagerReview ? 'Duyệt và chuyển quản trị viên' : 'Xác nhận phê duyệt'
              : 'Gửi yêu cầu chỉnh sửa'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ReportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, clubAccess, hasRole } = useAuth()
  const { success, error } = useToast()

  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewAction, setReviewAction] = useState('approve')
  const [feedbackNote, setFeedbackNote] = useState('')
  const [exportHistoryOpen, setExportHistoryOpen] = useState(false)

  const isClubManager = Boolean(
    report && clubAccess.some((access) => access.clubId === report.clubId && access.isManager)
  )
  const canExport = isClubManager || hasRole('ADMIN') || hasRole('STUDENT_AFFAIRS_ADMIN')
  const status = normalizeReportStatus(report?.status)
  const isReportAuthor = Number(report?.createdByUserId) === Number(user?.id)
  const isUploadedReport = report?.contentSource === 'UPLOADED_FILE' || Boolean(report?.uploadedFile)
  const canEdit = isClubManager && ['DRAFT', 'REJECTED'].includes(status)
  const canSubmit = isReportAuthor
    && (isClubManager || isUploadedReport)
    && ['DRAFT', 'REJECTED'].includes(status)
  const isReviewer = hasRole('ADMIN') || hasRole('STUDENT_AFFAIRS_ADMIN')

  const isFutureEvent = report?.reportType === 'FUTURE_EVENT' || report?.tag === 'FUTURE_EVENT'
  const canManagerReview = isClubManager
    && status === 'SUBMITTED'
    && (isFutureEvent || !isReportAuthor)
  const canFinalReview = isReviewer && status === 'UNDERREVIEW'
  const canReview = canManagerReview || canFinalReview

  // Stable callback for fetching preview — avoids effect reloading on parent re-renders
  const fetchPreview = useCallback(
    (reportId) => api.getUploadedReportFilePreview(reportId),
    []
  )

  const loadReportDetail = async () => {
    setIsLoading(true)
    try {
      const data = await api.getReport(id)
      setReport(data)
    } catch (err) {
      error(err.message || 'Không thể tải thông tin báo cáo.')
      navigate('/reports')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReportDetail()
  }, [id])

  const handleDownloadUploadedFile = async () => {
    if (!report?.id) return
    try {
      await api.downloadUploadedReportFile(report.id, report.uploadedFile?.originalFileName)
      success('Đang tải tệp báo cáo xuống...')
    } catch (err) {
      error(err.message || 'Không thể tải tệp báo cáo.')
    }
  }

  const handleManualSubmit = async () => {
    setIsSubmitting(true)
    try {
      await api.submitReport(report.id)
      success('Đã nộp báo cáo. Báo cáo đang chờ xét duyệt.')
      await loadReportDetail()
    } catch (err) {
      error(err.message || 'Không thể nộp báo cáo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReviewSubmit = async () => {
    if (reviewAction === 'reject' && !feedbackNote.trim()) {
      error('Vui lòng nhập lý do cần chỉnh sửa.')
      return
    }
    setIsSubmitting(true)
    try {
      if (reviewAction === 'approve') {
        if (canManagerReview) {
          await api.reviewReport(report.id, feedbackNote.trim())
          success('Đã duyệt và chuyển báo cáo đến quản trị viên.')
        } else {
          await api.approveReport(report.id, feedbackNote.trim())
          success('Đã phê duyệt báo cáo hoạt động.')
        }
      } else {
        await api.rejectReport(report.id, feedbackNote.trim())
        success('Đã gửi yêu cầu chỉnh sửa cho câu lạc bộ.')
      }
      setReviewModalOpen(false)
      setFeedbackNote('')
      await loadReportDetail()
    } catch (err) {
      error(err.message || 'Không thể xử lý báo cáo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExport = async (type) => {
    setIsExporting(true)
    try {
      await api.createExport({
        reportId: report.id,
        exportType: type,
      })
      success(`Đã tạo yêu cầu xuất báo cáo ${type}. Bạn có thể tải tệp trong lịch sử.`)
      setExportHistoryOpen(true)
    } catch (err) {
      if (err.status === 403 || String(err.message).includes('403') || String(err.message).includes('Forbidden')) {
        error('Bạn không có quyền xuất báo cáo này.')
      } else {
        error(err.message || `Không thể xuất báo cáo ${type}.`)
      }
    } finally {
      setIsExporting(false)
    }
  }

  const stats = useMemo(
    () => [
      {
        label: 'Số hoạt động',
        value: report?.totalActivities || report?.details?.length || 0,
        icon: ClipboardList,
      },
      {
        label: 'Tổng tham gia',
        value: `${report?.totalParticipants || 0} người`,
        icon: Users,
      },
      {
        label: 'Tổng kinh phí',
        value: `${(report?.totalBudgetSpent || 0).toLocaleString('vi-VN')} VNĐ`,
        icon: Landmark,
      },
    ],
    [report]
  )

  if (isLoading || !report) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="cyber-spinner" />
      </div>
    )
  }

  // =========================================================================
  // UPLOADED_FILE REPORT BRANCH: MINIMAL UPLOADED REPORT PREVIEW
  // =========================================================================
  if (isUploadedReport) {
    return (
      <>
        <MinimalUploadedReportPreview
          reportId={report.id}
          originalFileName={report.uploadedFile?.originalFileName}
          onBack={() => navigate('/reports')}
          onDownloadOriginal={handleDownloadUploadedFile}
          fetchPreview={fetchPreview}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmit={handleManualSubmit}
          canReview={canReview}
          reviewStage={canManagerReview ? 'manager' : 'final'}
          onRequestReview={(action) => {
            setReviewAction(action)
            setReviewModalOpen(true)
          }}
        />
        <ReviewDecisionModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          action={reviewAction}
          feedbackNote={feedbackNote}
          onFeedbackNoteChange={setFeedbackNote}
          isSubmitting={isSubmitting}
          onConfirm={handleReviewSubmit}
          isManagerReview={canManagerReview}
        />
      </>
    )
  }

  // =========================================================================
  // STRUCTURED_FORM REPORT BRANCH: CONTINUOUS STRUCTURED REPORT PREVIEW
  // =========================================================================
  return (
    <div className="mx-auto space-y-6 pb-12">
      {/* ACTION TOOLBAR */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/90 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <ArrowLeft size={15} /> Quay lại
          </button>

          <span className="h-5 w-[1px] bg-slate-800 hidden sm:inline-block" />

          {canEdit && (
            <button
              type="button"
              onClick={() => navigate(`/reports/${report.id}/edit`)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/20"
            >
              <FilePenLine size={15} /> Chỉnh sửa
            </button>
          )}

          {canSubmit && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleManualSubmit}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-cyan-400 px-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
            >
              <Send size={15} /> {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo'}
            </button>
          )}

          {canReview && (
            <>
              <button
                type="button"
                onClick={() => {
                  setReviewAction('reject')
                  setReviewModalOpen(true)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
              >
                Yêu cầu sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewAction('approve')
                  setReviewModalOpen(true)
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-400 px-3 text-xs font-bold text-slate-950 transition hover:bg-emerald-300"
              >
                <Check size={15} /> Phê duyệt
              </button>
            </>
          )}
        </div>

        {/* Export & Screen Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('PDF')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <FileText size={14} /> PDF
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('XLSX')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
              >
                <Sheet size={14} /> Excel
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => handleExport('DOCX')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50"
              >
                <FileText size={14} /> Word
              </button>
              <button
                type="button"
                onClick={() => setExportHistoryOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                <FileDown size={14} /> Lịch sử
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300 transition hover:bg-slate-700"
            title={isFullscreen ? 'Thu nhỏ bản xem trước' : 'Xem toàn màn hình'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* SUMMARY STATISTICS ROW */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-900/60 px-5 py-3 text-xs">
        <div className="flex flex-wrap items-center gap-6">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={16} className="text-cyan-400" />
              <span className="text-slate-400">{label}:</span>
              <span className="font-semibold text-slate-100">{value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ReportStatusBadge status={status} />
          <span className="rounded-md px-2.5 py-1 text-xs font-semibold border border-purple-500/20 bg-purple-500/10 text-purple-300">
            Khai báo trực tiếp
          </span>
        </div>
      </div>

      {/* CENTERED DOCUMENT PREVIEW CONTAINER */}
      <main
        className={`mx-auto transition-all duration-300 ${
          isFullscreen ? 'w-full max-w-full' : 'max-w-[920px]'
        }`}
      >
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-12 shadow-2xl space-y-8 text-slate-200">
          {/* DOCUMENT HEADER */}
          <div className="border-b border-slate-800 pb-6 text-center space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — ĐỘC LẬP - TỰ DO - HẠNH PHÚC
            </p>
            <h1 className="font-orbitron text-2xl font-bold tracking-wide text-slate-50 sm:text-3xl uppercase pt-2">
              BÁO CÁO HOẠT ĐỘNG {report.period}
            </h1>
            <h2 className="text-lg font-semibold text-cyan-300">{report.clubName}</h2>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 font-mono">
              <span>Mã báo cáo: <strong className="text-slate-200">#{report.id}</strong></span>
              <span>•</span>
              <span>Loại: <strong className="text-slate-200">{formatReportType(report.reportType)}</strong></span>
              <span>•</span>
              <span>Phân loại: <strong className="text-slate-200">{formatReportType(report.tag)}</strong></span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs sm:grid-cols-4">
              <div>
                <span className="block text-slate-500">Trạng thái</span>
                <span className="mt-1 block font-medium"><ReportStatusBadge status={status} /></span>
              </div>
              <div>
                <span className="block text-slate-500">Hạn nộp</span>
                <span className="mt-1 block font-semibold text-amber-300">{formatDate(report.dueDate)}</span>
              </div>
              <div>
                <span className="block text-slate-500">Ngày nộp</span>
                <span className="mt-1 block font-medium text-slate-300">{formatDate(report.submittedAtUtc, true)}</span>
              </div>
              <div>
                <span className="block text-slate-500">Ngày xét duyệt</span>
                <span className="mt-1 block font-medium text-slate-300">{formatDate(report.reviewedAtUtc, true)}</span>
              </div>
            </div>
          </div>

          {/* SECTION I: EXECUTIVE SUMMARY */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              I. Tóm tắt điều hành
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm py-2">
              {report.executiveSummary || 'Không có tóm tắt điều hành.'}
            </div>
          </section>

          {/* SECTION II: ACHIEVEMENTS */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              II. Thành tựu nổi bật
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm py-2">
              {report.achievements || 'Chưa ghi nhận thành tựu nổi bật.'}
            </div>
          </section>

          {/* SECTION III: ACTIVITIES */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              III. Danh sách hoạt động thực hiện ({report.details?.length || 0})
            </h2>

            {!report.details || report.details.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">Chưa có thông tin hoạt động thực hiện.</p>
            ) : (
              <div className="space-y-6 pt-1">
                {report.details.map((act, index) => (
                  <div key={act.id || index} className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <h3 className="font-semibold text-slate-100 text-base">
                        3.{index + 1}. {act.activityName || 'Hoạt động chưa đặt tên'}
                      </h3>
                      {act.budgetSpent > 0 && (
                        <span className="font-mono text-xs font-semibold text-amber-300">
                          Chi phí: {act.budgetSpent.toLocaleString('vi-VN')} VNĐ
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 text-slate-400">
                      <div>
                        <span className="block text-slate-500">Loại hoạt động</span>
                        <span className="font-medium text-slate-200">{act.activityType || 'Chuyên môn'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Ngày tổ chức</span>
                        <span className="font-medium text-slate-200">{formatDate(act.activityDate)}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Địa điểm</span>
                        <span className="font-medium text-slate-200">{act.location || 'Chưa cập nhật'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Đơn vị phối hợp</span>
                        <span className="font-medium text-slate-200">{act.partnerUnit || 'Không có'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 text-slate-400">
                      <div>
                        <span className="block text-slate-500">Mục tiêu</span>
                        <span className="font-medium text-slate-200">{act.objective || 'Không áp dụng'}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Mục tiêu tham gia</span>
                        <span className="font-medium text-slate-200">{act.targetParticipantCount || 0} người</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Tham gia thực tế</span>
                        <span className="font-medium text-emerald-300 font-semibold">{act.participantCount || 0} người</span>
                      </div>
                    </div>

                    {act.description && (
                      <div className="pt-2">
                        <span className="block text-xs font-semibold text-slate-400">Nội dung chi tiết:</span>
                        <p className="mt-1 whitespace-pre-wrap text-slate-300 leading-relaxed">{act.description}</p>
                      </div>
                    )}

                    {act.outcome && (
                      <div className="pt-1">
                        <span className="block text-xs font-semibold text-slate-400">Kết quả đạt được:</span>
                        <p className="mt-1 whitespace-pre-wrap text-slate-300 leading-relaxed">{act.outcome}</p>
                      </div>
                    )}

                    {act.evidenceUrl && (
                      <div className="pt-2">
                        <a
                          href={act.evidenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:underline"
                        >
                          <Paperclip size={14} /> Liên kết minh chứng: {act.evidenceUrl} <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION IV: CHALLENGES */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              IV. Khó khăn và tồn tại
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm py-2">
              {report.challenges || 'Không có khó khăn hay tồn tại được ghi nhận.'}
            </div>
          </section>

          {/* SECTION V: RECOMMENDATIONS */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              V. Kiến nghị hỗ trợ
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm py-2">
              {report.recommendations || 'Không có kiến nghị hỗ trợ.'}
            </div>
          </section>

          {/* SECTION VI: NEXT PERIOD PLAN */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              VI. Kế hoạch kỳ tiếp theo
            </h2>
            <div className="whitespace-pre-wrap leading-relaxed text-slate-300 text-sm py-2">
              {report.nextPeriodPlan || 'Chưa cập nhật kế hoạch cho kỳ tiếp theo.'}
            </div>
          </section>

          {/* SECTION VII: EVIDENCE & ATTACHMENTS */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              VII. Minh chứng đính kèm
            </h2>
            {(!report.attachments || report.attachments.length === 0) &&
            !report.details?.some((d) => d.evidenceUrl) ? (
              <p className="text-sm text-slate-500 py-2">Báo cáo chưa có minh chứng đính kèm.</p>
            ) : (
              <div className="space-y-2 text-xs">
                {report.details
                  ?.filter((d) => d.evidenceUrl)
                  .map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <span className="truncate text-slate-300">Minh chứng: {d.activityName}</span>
                      <a href={d.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-cyan-300 hover:underline">
                        Mở liên kết <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}

                {report.attachments?.map((att) => (
                  <div key={att.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <span className="truncate text-slate-300">{att.fileName} ({formatBytes(att.sizeBytes)})</span>
                    <a href={att.storagePath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-cyan-300 hover:underline">
                      Tải tệp <Download size={12} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SECTION VIII: REVIEW COMMENTS & FEEDBACK */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2">
              VIII. Ý kiến phản hồi và lịch sử xét duyệt
            </h2>
            {!report.feedback || report.feedback.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">Báo cáo chưa có ý kiến phản hồi từ người duyệt.</p>
            ) : (
              <div className="space-y-3 pt-1">
                {report.feedback.map((fb) => (
                  <div key={fb.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-200">
                        {fb.reviewerName || `Reviewer #${fb.reviewerUserId}`}
                      </span>
                      <span className="rounded bg-cyan-500/10 px-2 py-0.5 font-semibold text-cyan-300 border border-cyan-500/20">
                        {fb.decision}
                      </span>
                    </div>
                    <p className="text-slate-400">{formatDate(fb.createdAtUtc, true)}</p>
                    {fb.message && (
                      <p className="whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-slate-200 leading-relaxed border border-slate-800">
                        {formatSystemText(fb.message)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <ReviewDecisionModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        action={reviewAction}
        feedbackNote={feedbackNote}
        onFeedbackNoteChange={setFeedbackNote}
        isSubmitting={isSubmitting}
        onConfirm={handleReviewSubmit}
        isManagerReview={canManagerReview}
      />

      {/* EXPORT HISTORY MODAL */}
      <ExportHistoryModal isOpen={exportHistoryOpen} onClose={() => setExportHistoryOpen(false)} reportId={report.id} />
    </div>
  )
}
