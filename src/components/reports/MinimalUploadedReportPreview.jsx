import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Download, RefreshCw, Send } from 'lucide-react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc =
  `${import.meta.env.BASE_URL}pdf.worker.min.mjs`

export default function MinimalUploadedReportPreview({
  reportId,
  originalFileName,
  onBack,
  onDownloadOriginal,
  fetchPreview,
  canSubmit = false,
  isSubmitting = false,
  onSubmit,
  canReview = false,
  reviewStage = 'final',
  onRequestReview,
}) {
  const containerRef = useRef(null)

  // Store raw PDF bytes instead of blob URL
  const [pdfData, setPdfData] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [pageWidth, setPageWidth] = useState(800)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Stable memoized file object — depends only on pdfData, not numPages/pageWidth/loading/error
  const pdfFile = useMemo(() => {
    if (!pdfData) {
      return null
    }
    const safeCopy = new Uint8Array(pdfData)
    return { data: safeCopy }
  }, [pdfData])

  // Log react-pdf version info on mount
  useEffect(() => {
    console.log("[Preview] react-pdf loaded, pdfjs version:", pdfjs.version)
  }, [])

  // 1. Fetch preview bytes using authenticated API client
  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      try {
        setLoading(true)
        setError('')
        setPdfData(null)
        setNumPages(0)

        const bytes = await fetchPreview(reportId)

        if (cancelled) return

        console.log("[Preview] PDF bytes received, length:", bytes?.length)
        setPdfData(bytes)
      } catch (requestError) {
        if (!cancelled) {
          console.error("[Preview] loadPreview error:", requestError)
          setError(
            requestError?.message || 'Không thể tải bản xem trước báo cáo.'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (reportId) {
      loadPreview()
    }

    return () => {
      cancelled = true
    }
  }, [reportId, fetchPreview])

  // 2. Measure available viewer width using ResizeObserver
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateWidth = () => {
      const availableWidth = container.clientWidth
      const nextWidth = Math.min(1200, Math.max(320, availableWidth - 16))
      setPageWidth(nextWidth)
    }

    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  const reloadPreview = () => {
    if (reportId && fetchPreview) {
      // Trigger reload by briefly clearing reportId key (forces effect re-run)
      setPdfData(null)
      setNumPages(0)
      setError('')
      setLoading(true)
      fetchPreview(reportId)
        .then(bytes => {
          console.log("[Preview] Retry: PDF bytes received, length:", bytes?.length)
          setPdfData(bytes)
        })
        .catch(err => {
          console.error("[Preview] Retry error:", err)
          setError(err?.message || 'Không thể tải bản xem trước báo cáo.')
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  return (
    <section className="flex flex-col w-full h-[calc(100vh-64px)] min-h-0 overflow-hidden bg-[#070a10] text-slate-200">
      {/* MINIMAL HEADER BAR */}
      <header className="flex-none h-12 flex items-center justify-between gap-3 px-4 border-b border-slate-800/80 bg-[#0b101a] z-20">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-700/80 bg-slate-800/60 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
        >
          <ArrowLeft size={14} /> Quay lại
        </button>

        {originalFileName && (
          <span className="hidden sm:inline-block text-xs text-slate-400 font-mono truncate max-w-xs">
            {originalFileName}
          </span>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {onDownloadOriginal && (
            <button
              type="button"
              onClick={onDownloadOriginal}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 text-xs font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-700"
            >
              <Download size={14} /> <span className="hidden sm:inline">Tải tệp gốc</span>
            </button>
          )}

          {canSubmit && onSubmit && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmit}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-cyan-400 px-3.5 text-xs font-bold text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.2)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={14} /> {isSubmitting ? 'Đang nộp...' : 'Nộp báo cáo'}
            </button>
          )}

          {canReview && onRequestReview && (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onRequestReview('reject')}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-400/40 bg-rose-400/10 px-3 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Yêu cầu sửa
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => onRequestReview('approve')}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-400 px-3.5 text-xs font-bold text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.2)] transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check size={14} />
                <span className="hidden sm:inline">
                  {reviewStage === 'manager' ? 'Duyệt và chuyển' : 'Phê duyệt'}
                </span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* MAIN DOCUMENT VIEWER */}
      <main
        ref={containerRef}
        className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden p-2 sm:p-4 flex flex-col items-center"
      >
        {loading && (
          <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3 text-slate-400 text-sm">
            <div className="cyber-spinner" />
            <p>Đang tải bản xem trước...</p>
          </div>
        )}

        {!loading && error && (
          <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center space-y-4">
            <p className="text-amber-300 text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={reloadPreview}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-600 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              <RefreshCw size={15} /> Thử lại
            </button>
          </div>
        )}

        {!loading && !error && pdfFile && (
          <Document
            key={reportId}
            file={pdfFile}
            onLoadSuccess={({ numPages: loadedPages }) => {
              console.log("[Preview] PDF loaded successfully, pages:", loadedPages)
              setNumPages(loadedPages)
            }}
            onLoadError={(error) => {
              console.error("[Preview] PDF onLoadError:", error)
              setError('Không thể đọc nội dung PDF.')
            }}
            onSourceError={(error) => {
              console.error("[Preview] PDF onSourceError:", error)
              setError('Không thể tải dữ liệu PDF.')
            }}
            loading={
              <div className="min-h-[200px] flex items-center justify-center text-slate-400 text-xs">
                Đang đọc tài liệu...
              </div>
            }
            error={
              <div className="min-h-[200px] flex flex-col items-center justify-center p-4 text-center space-y-3">
                <p className="text-rose-300 text-xs">Không thể hiển thị tài liệu.</p>
              </div>
            }
            className="flex flex-col items-center gap-3 w-full"
          >
            {numPages > 0 ? (
              Array.from({ length: numPages }, (_, index) => (
                <div key={index + 1} className="shadow-lg rounded-sm overflow-hidden bg-white">
                  <Page
                    pageNumber={index + 1}
                    width={pageWidth}
                    renderTextLayer
                    renderAnnotationLayer={false}
                  />
                </div>
              ))
            ) : (
              <div className="min-h-[200px] flex items-center justify-center text-slate-400 text-xs">
                Đang đọc tài liệu...
              </div>
            )}
          </Document>
        )}
      </main>
    </section>
  )
}
