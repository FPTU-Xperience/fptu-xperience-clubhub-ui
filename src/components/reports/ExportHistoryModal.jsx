import { useEffect, useRef, useState } from 'react'
import { Download, FileDown, RefreshCw } from 'lucide-react'
import Modal from '../Modal'
import api from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { formatErrorMessage } from '../../locales/vi'

const EXPORT_STATUS_LABELS = {
  Pending: 'Đang chờ',
  Processing: 'Đang xử lý',
  Completed: 'Hoàn tất',
  Failed: 'Thất bại',
}

const EXPORT_SCOPE_LABELS = {
  Report: 'Báo cáo',
  All: 'Tất cả báo cáo',
}

export default function ExportHistoryModal({ isOpen, onClose, reportId }) {
  const { error, success } = useToast()
  const [exports, setExports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const pollTimerRef = useRef(null)

  const stopPolling = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  const loadExports = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const data = await api.getExports({ page: 1, pageSize: 50 })
      const items = (data.items || []).filter((item) => !reportId || item.reportId === reportId)
      setExports(items)

      const hasPending = items.some((i) => i.status === 'Pending' || i.status === 'Processing')
      if (hasPending && isOpen) {
        if (!pollTimerRef.current) {
          pollTimerRef.current = setInterval(() => {
            loadExports(true)
          }, 2000)
        }
      } else {
        stopPolling()
      }
    } catch (err) {
      if (!silent) error(err.message || 'Không thể tải lịch sử xuất báo cáo.')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      stopPolling()
      loadExports(false)
    } else {
      stopPolling()
    }

    return () => {
      stopPolling()
    }
  }, [isOpen, reportId])

  const handleDownload = async (id, fileName) => {
    try {
      await api.downloadExport(id, fileName)
      success('Đang tải tệp báo cáo xuống...')
    } catch (err) {
      error(err.message || 'Tệp xuất không còn tồn tại hoặc không khả dụng.')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lịch sử xuất báo cáo">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => loadExports(false)}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>

        {isLoading && exports.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center"><div className="cyber-spinner" /></div>
        ) : exports.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-12 text-center text-slate-500">
            <FileDown size={32} className="mb-3 text-slate-600" />
            <p>Chưa có yêu cầu xuất báo cáo nào.</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex flex-col space-y-3">
              {exports.map((item) => {
                const canDownload = item.status === 'Completed' && (item.isDownloadAvailable ?? item.file?.isAvailable ?? true)

                return (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:bg-slate-800/50">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="font-semibold text-slate-200 truncate">
                        Lần xuất #{item.id} - {item.exportType}
                      </span>
                      <span className="mt-1 text-xs text-slate-400">
                        Phạm vi: {EXPORT_SCOPE_LABELS[item.scope] || 'Báo cáo'} | Thời gian: {new Date(item.createdAtUtc).toLocaleString('vi-VN')}
                      </span>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          item.status === 'Completed' ? 'bg-emerald-400/10 text-emerald-400' :
                          item.status === 'Failed' ? 'bg-rose-400/10 text-rose-400' :
                          'bg-amber-400/10 text-amber-400 animate-pulse'
                        }`}>
                          {EXPORT_STATUS_LABELS[item.status] || 'Không xác định'}
                        </span>
                        {item.errorMessage && (
                          <span className="text-xs text-rose-400 truncate max-w-[200px]" title={item.errorMessage}>
                            {formatErrorMessage(item.errorMessage, 'Không thể tạo tệp xuất báo cáo.')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {canDownload ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(item.id, item.file?.fileName)}
                          className="inline-flex h-9 items-center justify-center rounded-lg bg-cyan-500/10 px-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/20"
                        >
                          <Download size={16} className="mr-2" />
                          Tải xuống
                        </button>
                      ) : item.status === 'Completed' ? (
                        <span className="text-xs text-slate-500 italic">Tệp không khả dụng</span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
