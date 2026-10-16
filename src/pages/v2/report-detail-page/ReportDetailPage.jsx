import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Check,
    Download,
    FileText,
    History,
    Maximize2,
    Minimize2,
    Paperclip,
    Pencil,
    Send,
    Users,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import PageState from '../../../components/v2/PageState';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { reportStatusLabel } from '../../../components/reports/ReportStatusBadge';
import { formatReportType, formatSystemText } from '../../../locales/vi';
import { reportDate, reportDetailAccess, reportFileSize, safeReportEvidenceUrl } from './report-detail-data';
import './ReportDetailPage.scss';
import { reportTemplateLabel } from './report-templates';
const ReportFilePreview = lazy(() => import('./ReportFilePreview'));

function Narrative({ title, value }) {
    return (
        <section className="v2-report-section">
            <h2>{title}</h2>
            <p className="v2-report-prose">{value || 'Chưa có thông tin.'}</p>
        </section>
    );
}

function EvidenceLink({ value, children = 'Mở minh chứng' }) {
    const href = safeReportEvidenceUrl(value);
    return href ? (
        <a className="v2-text-link" href={href} target="_blank" rel="noopener noreferrer">
            {children} ↗
        </a>
    ) : (
        <span className="v2-report-muted">Liên kết minh chứng không khả dụng</span>
    );
}

function ExportHistory({ api, reportId, onClose, onDownload }) {
    const [page, setPage] = useState(1);
    const [refresh, setRefresh] = useState(0);
    const [result, setResult] = useState({ status: 'loading' });
    const [downloadError, setDownloadError] = useState('');
    useEffect(() => {
        let active = true;
        setResult({ status: 'loading' });
        api.getExports({ page, pageSize: 50 })
            .then((data) => {
                if (active) setResult({ status: 'populated', data });
            })
            .catch((error) => {
                if (active) setResult({ status: 'error', error });
            });
        return () => {
            active = false;
        };
    }, [api, page, refresh]);
    const rows = (result.data?.items || []).filter((item) => String(item.reportId) === String(reportId));
    const labels = { Pending: 'Đang chờ', Processing: 'Đang xử lý', Completed: 'Hoàn tất', Failed: 'Thất bại' };
    return (
        <V2Modal title="Lịch sử xuất báo cáo" onClose={onClose}>
            <button
                className="v2-button"
                type="button"
                disabled={result.status === 'loading'}
                onClick={() => setRefresh((value) => value + 1)}
            >
                Làm mới
            </button>
            {downloadError && (
                <p role="alert" className="v2-report-error">
                    {downloadError}
                </p>
            )}
            {result.status !== 'populated' ? (
                <PageState
                    status={result.status}
                    description={result.error?.message}
                    onRetry={() => setRefresh((value) => value + 1)}
                />
            ) : (
                <>
                    <p className="v2-report-muted">
                        Các yêu cầu của báo cáo này trong trang {page} của lịch sử xuất. Làm mới để kiểm tra yêu cầu
                        đang xử lý.
                    </p>
                    {!rows.length && <p>Trang này chưa có yêu cầu xuất cho báo cáo.</p>}
                    <ul className="v2-report-files">
                        {rows.map((item) => (
                            <li key={item.id}>
                                <div>
                                    <strong>
                                        {item.file?.fileName || item.fileName || item.exportType || 'Tệp xuất báo cáo'}
                                    </strong>
                                    <small>
                                        {labels[item.status] || item.status} · {reportDate(item.createdAtUtc, true)}
                                    </small>
                                </div>
                                {item.errorMessage && (
                                    <p className="v2-report-error">{formatSystemText(item.errorMessage)}</p>
                                )}
                                {item.status === 'Completed' &&
                                    (item.isDownloadAvailable ?? item.file?.isAvailable ?? true) && (
                                        <button
                                            className="v2-button"
                                            type="button"
                                            onClick={async () => {
                                                setDownloadError('');
                                                const downloaded = await onDownload(() =>
                                                    api.downloadExport(item.id, item.file?.fileName || item.fileName),
                                                );
                                                if (!downloaded)
                                                    setDownloadError('Không thể tải tệp xuất. Vui lòng thử lại.');
                                            }}
                                        >
                                            <Download size={16} /> Tải xuống
                                        </button>
                                    )}
                            </li>
                        ))}
                    </ul>
                    <div className="v2-report-actions">
                        <button
                            className="v2-button"
                            type="button"
                            disabled={page === 1}
                            onClick={() => setPage((value) => value - 1)}
                        >
                            Trang trước
                        </button>
                        <button
                            className="v2-button"
                            type="button"
                            disabled={page * 50 >= (result.data?.total ?? 0)}
                            onClick={() => setPage((value) => value + 1)}
                        >
                            Trang sau
                        </button>
                    </div>
                </>
            )}
        </V2Modal>
    );
}

export function ReportDetailContent({
    report,
    access = {},
    backTo,
    busy,
    error,
    notice,
    fullscreen,
    onFullscreen,
    onAction,
    onReview,
    onHistory,
    onUpload,
    onRemove,
    api,
    editTo,
}) {
    const uploaded = report.contentSource === 'UPLOADED_FILE' || Boolean(report.uploadedFile);
    const details = report.details || [];
    return (
        <article className={`v2-report-detail${fullscreen ? ' is-expanded' : ''}`}>
            <Link className="v2-text-link v2-report-back" to={backTo}>
                <ArrowLeft size={16} /> Quay lại báo cáo
            </Link>
            <header className="v2-report-heading">
                <div>
                    <span className="v2-report-eyebrow">HỒ SƠ BÁO CÁO · #{report.id}</span>
                    <h1>{report.title || reportTemplateLabel(report) || formatReportType(report.reportType)}</h1>
                    <p>
                        {report.clubName || 'Câu lạc bộ'} · {report.period || 'Chưa cập nhật kỳ báo cáo'}
                    </p>
                </div>
                <span className={`v2-report-status is-${String(report.status).replace(/\s/g, '').toLowerCase()}`}>
                    {reportStatusLabel(report.status)}
                </span>
            </header>
            <div className="v2-report-toolbar" aria-label="Thao tác báo cáo">
                <div className="v2-report-actions">
                    {access.edit && (
                        <Link className="v2-button" to={editTo || `/v2/reports/${report.id}/edit`}>
                            <Pencil size={16} /> Chỉnh sửa
                        </Link>
                    )}
                    {access.submit && (
                        <button
                            className="v2-button v2-button--primary"
                            disabled={busy}
                            type="button"
                            onClick={() => onAction('submit')}
                        >
                            <Send size={16} /> Nộp báo cáo
                        </button>
                    )}
                    {(access.managerReview || access.finalReview) && (
                        <>
                            <button
                                className="v2-button"
                                disabled={busy}
                                type="button"
                                onClick={() => onReview('reject')}
                            >
                                Yêu cầu chỉnh sửa
                            </button>
                            <button
                                className="v2-button v2-button--primary"
                                disabled={busy}
                                type="button"
                                onClick={() => onReview('approve')}
                            >
                                <Check size={16} /> {access.managerReview ? 'Duyệt và chuyển tiếp' : 'Phê duyệt'}
                            </button>
                        </>
                    )}
                </div>
                <div className="v2-report-actions">
                    {uploaded && (
                        <button
                            className="v2-button"
                            disabled={busy}
                            type="button"
                            onClick={() => onAction('original')}
                        >
                            <Download size={16} /> Tải tệp gốc
                        </button>
                    )}
                    {access.export && (
                        <>
                            <button className="v2-button" disabled={busy} type="button" onClick={() => onAction('PDF')}>
                                Xuất PDF
                            </button>
                            <button
                                className="v2-button"
                                disabled={busy}
                                type="button"
                                onClick={() => onAction('XLSX')}
                            >
                                Xuất Excel
                            </button>
                            <button className="v2-button" type="button" onClick={onHistory}>
                                <History size={16} /> Lịch sử xuất
                            </button>
                        </>
                    )}
                    <button className="v2-button" type="button" onClick={onFullscreen}>
                        {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        {fullscreen ? 'Thu gọn' : 'Mở rộng'}
                    </button>
                </div>
            </div>
            <div aria-live="polite">
                {busy && (
                    <p className="v2-report-notice" role="status">
                        Đang xử lý…
                    </p>
                )}
                {notice && (
                    <p className="v2-report-notice" role="status">
                        {notice}
                    </p>
                )}
                {error && (
                    <p className="v2-report-error" role="alert">
                        {error}
                    </p>
                )}
            </div>
            <div className="v2-report-layout">
                <div className="v2-report-document">
                    {uploaded ? (
                        <section className="v2-report-section">
                            <h2>
                                <FileText size={19} /> Tệp báo cáo
                            </h2>
                            <p className="v2-report-muted">
                                {report.uploadedFile?.originalFileName || 'Báo cáo tải lên'}. Nếu trình duyệt không hiển
                                thị bản xem trước, hãy tải tệp gốc.
                            </p>
                            <Suspense fallback={<p role="status">Đang mở bản xem trước…</p>}>
                                <ReportFilePreview key={report.id} api={api} reportId={report.id} />
                            </Suspense>
                        </section>
                    ) : (
                        <>
                            <Narrative title="Tóm tắt điều hành" value={report.executiveSummary} />
                            <Narrative title="Thành tựu nổi bật" value={report.achievements} />
                            <section className="v2-report-section">
                                <h2>
                                    Hoạt động thực hiện <span className="v2-report-count">{details.length}</span>
                                </h2>
                                {!details.length && <p className="v2-report-muted">Chưa có hoạt động được ghi nhận.</p>}
                                {details.map((item, index) => (
                                    <section className="v2-report-activity" key={item.id || index}>
                                        <h3>
                                            {index + 1}. {item.activityName || 'Hoạt động chưa đặt tên'}
                                        </h3>
                                        <dl className="v2-report-facts">
                                            {[
                                                ['Loại hoạt động', item.activityType],
                                                ['Ngày tổ chức', reportDate(item.activityDate)],
                                                ['Địa điểm', item.location],
                                                ['Đơn vị phối hợp', item.partnerUnit],
                                                ['Mục tiêu', item.objective],
                                                [
                                                    'Mục tiêu tham gia',
                                                    item.targetParticipantCount == null
                                                        ? null
                                                        : `${item.targetParticipantCount} người`,
                                                ],
                                                [
                                                    'Tham gia thực tế',
                                                    item.participantCount == null
                                                        ? null
                                                        : `${item.participantCount} người`,
                                                ],
                                                [
                                                    'Chi phí',
                                                    item.budgetSpent == null
                                                        ? null
                                                        : `${Number(item.budgetSpent).toLocaleString('vi-VN')} VNĐ`,
                                                ],
                                            ].map(([label, value]) => (
                                                <div key={label}>
                                                    <dt>{label}</dt>
                                                    <dd>{value ?? 'Chưa cập nhật'}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {item.description && (
                                            <>
                                                <h4>Nội dung</h4>
                                                <p className="v2-report-prose">{item.description}</p>
                                            </>
                                        )}
                                        {item.outcome && (
                                            <>
                                                <h4>Kết quả đạt được</h4>
                                                <p className="v2-report-prose">{item.outcome}</p>
                                            </>
                                        )}
                                        {item.evidenceUrl && <EvidenceLink value={item.evidenceUrl} />}
                                    </section>
                                ))}
                            </section>
                            <Narrative title="Khó khăn và tồn tại" value={report.challenges} />
                            <Narrative title="Kiến nghị hỗ trợ" value={report.recommendations} />
                            <Narrative title="Kế hoạch kỳ tiếp theo" value={report.nextPeriodPlan} />
                        </>
                    )}
                    <section className="v2-report-section">
                        <div className="v2-report-section-heading">
                            <h2>
                                <Paperclip size={19} /> Minh chứng đính kèm
                            </h2>
                            {access.attachments && (
                                <label className="v2-button">
                                    Thêm tệp
                                    <input
                                        type="file"
                                        className="v2-report-file-input"
                                        aria-label="Thêm tệp minh chứng"
                                        disabled={busy}
                                        onChange={onUpload}
                                    />
                                </label>
                            )}
                        </div>
                        <ul className="v2-report-files">
                            {details
                                .filter((item) => item.evidenceUrl)
                                .map((item, index) => (
                                    <li key={`evidence-${item.id || index}`}>
                                        <strong>{item.activityName || 'Minh chứng hoạt động'}</strong>
                                        <EvidenceLink value={item.evidenceUrl} />
                                    </li>
                                ))}
                            {(report.attachments || []).map((item) => (
                                <li key={item.id}>
                                    <div>
                                        <strong>{item.fileName}</strong>
                                        <small>{reportFileSize(item.sizeBytes)}</small>
                                    </div>
                                    <div className="v2-report-actions">
                                        <button
                                            className="v2-button"
                                            type="button"
                                            disabled={busy}
                                            onClick={() => onAction('attachment', item)}
                                        >
                                            <Download size={16} /> Tải xuống
                                        </button>
                                        {access.attachments && (
                                            <button
                                                className="v2-button v2-report-danger"
                                                type="button"
                                                disabled={busy}
                                                onClick={() => onRemove(item)}
                                            >
                                                Gỡ tệp
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {!report.attachments?.length && !details.some((item) => item.evidenceUrl) && (
                            <p className="v2-report-muted">Chưa có minh chứng đính kèm.</p>
                        )}
                    </section>
                    <section className="v2-report-section">
                        <h2>Lịch sử xét duyệt</h2>
                        {!report.feedback?.length && (
                            <p className="v2-report-muted">Chưa có phản hồi từ người duyệt.</p>
                        )}
                        <ol className="v2-report-feedback">
                            {(report.feedback || []).map((item, index) => (
                                <li key={item.id || index}>
                                    <div>
                                        <strong>{item.reviewerName || `Người duyệt #${item.reviewerUserId}`}</strong>
                                        <span>
                                            {{
                                                APPROVE: 'Phê duyệt',
                                                APPROVED: 'Đã phê duyệt',
                                                REJECT: 'Yêu cầu chỉnh sửa',
                                                REJECTED: 'Yêu cầu chỉnh sửa',
                                                REVIEW: 'Duyệt và chuyển tiếp',
                                                REVIEWED: 'Đã duyệt và chuyển tiếp',
                                            }[String(item.decision).toUpperCase()] || formatSystemText(item.decision)}
                                        </span>
                                    </div>
                                    <time>{reportDate(item.createdAtUtc, true)}</time>
                                    {item.message && (
                                        <p className="v2-report-prose">{formatSystemText(item.message)}</p>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </section>
                </div>
                <aside className="v2-report-sidebar">
                    <section className="v2-report-section">
                        <h2>Thông tin báo cáo</h2>
                        <dl className="v2-report-facts is-sidebar">
                            {[
                                ['Loại báo cáo', reportTemplateLabel(report) || formatReportType(report.reportType)],
                                ['Kỳ báo cáo', report.period],
                                ['Hạn nộp', reportDate(report.dueDate)],
                                ['Ngày tạo', reportDate(report.createdAtUtc, true)],
                                ['Đã nộp lúc', reportDate(report.submittedAtUtc, true)],
                                ['Xét duyệt lúc', reportDate(report.reviewedAtUtc, true)],
                            ].map(([label, value]) => (
                                <div key={label}>
                                    <dt>{label}</dt>
                                    <dd>{value || 'Chưa cập nhật'}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                    {!uploaded && (
                        <section className="v2-report-section">
                            <h2>Tổng quan</h2>
                            <dl className="v2-report-totals">
                                <div>
                                    <dt>Số hoạt động</dt>
                                    <dd>{report.totalActivities ?? details.length}</dd>
                                </div>
                                <div>
                                    <dt>
                                        <Users size={15} /> Tổng lượt tham gia
                                    </dt>
                                    <dd>{report.totalParticipants ?? '—'}</dd>
                                </div>
                                <div>
                                    <dt>Tổng kinh phí</dt>
                                    <dd>
                                        {report.totalBudgetSpent == null
                                            ? '—'
                                            : `${Number(report.totalBudgetSpent).toLocaleString('vi-VN')} VNĐ`}
                                    </dd>
                                </div>
                            </dl>
                        </section>
                    )}
                </aside>
            </div>
        </article>
    );
}

export default function ReportDetailPage({ api, reportId: scopedId, workspace, base, readOnly = false, sessionKey }) {
    const { reportId: routeId } = useParams();
    const reportId = scopedId || routeId;
    const { user, clubAccess, hasPermission } = useAuth();
    const canView = hasPermission('VIEW_REPORTS');
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState({ status: 'loading' });
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [review, setReview] = useState(null);
    const [note, setNote] = useState('');
    const [remove, setRemove] = useState(null);
    const [history, setHistory] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const scope = `${sessionKey}:${workspace?.clubId || ''}:${reportId}`;
    const currentScope = useRef(scope);
    currentScope.current = scope;
    useEffect(() => {
        let active = true;
        setResult({ status: 'loading', scope });
        if (!canView) {
            setResult({ status: 'forbidden', scope });
            return () => {
                active = false;
            };
        }
        api.getReport(reportId)
            .then((report) => {
                if (workspace?.clubId != null && String(report.clubId) !== String(workspace.clubId)) {
                    throw Object.assign(new Error('Báo cáo không thuộc CLB này.'), { status: 403 });
                }
                if (active) setResult({ status: 'populated', report, scope });
            })
            .catch((issue) => {
                if (active)
                    setResult({
                        status: { 403: 'forbidden', 404: 'not-found', 401: 'unauthorized' }[issue.status] || 'error',
                        error: issue,
                        scope,
                    });
            });
        return () => {
            active = false;
        };
    }, [api, reportId, workspace?.clubId, scope, revision, canView]);
    useEffect(
        () => () => {
            currentScope.current = null;
        },
        [],
    );
    const report = result.scope === scope ? result.report : null;
    const access = reportDetailAccess(report, user, clubAccess, readOnly);
    const ownClub = clubAccess.find((item) => String(item.clubId) === String(report?.clubId));
    const backTo = base
        ? `${base}/reports`
        : ownClub?.clubCode
          ? `/v2/my-clubs/${encodeURIComponent(ownClub.clubCode)}/reports`
          : '/v2/my-clubs';
    const run = useCallback(
        async (operation, message = '') => {
            if (busyRef.current) return false;
            busyRef.current = true;
            setBusy(true);
            setError('');
            setNotice('');
            const operationScope = scope;
            try {
                await operation();
                if (currentScope.current !== operationScope) return false;
                setNotice(message);
                return true;
            } catch (issue) {
                if (currentScope.current === operationScope) setError(issue.message || 'Không thể xử lý báo cáo.');
                return false;
            } finally {
                busyRef.current = false;
                if (currentScope.current === operationScope) setBusy(false);
            }
        },
        [scope],
    );
    const action = async (type, attachment) => {
        if (!report) return;
        if (type === 'submit' && access.submit) {
            if (await run(() => api.submitReport(report.id), 'Đã nộp báo cáo.')) setRevision((value) => value + 1);
        } else if (type === 'original')
            await run(() => api.downloadUploadedReportFile(report.id, report.uploadedFile?.originalFileName));
        else if (type === 'attachment')
            await run(() => api.downloadReportAttachment(report.id, attachment.id, attachment.fileName));
        else if (
            ['PDF', 'XLSX'].includes(type) &&
            access.export &&
            (await run(
                () => api.createExport({ reportId: report.id, exportType: type }),
                'Đã tạo yêu cầu xuất báo cáo.',
            ))
        )
            setHistory(true);
    };
    const confirmReview = async () => {
        if (!access.managerReview && !access.finalReview) return;
        if (review === 'reject' && !note.trim()) {
            setError('Vui lòng nhập nội dung cần chỉnh sửa.');
            return;
        }
        const method = review === 'reject' ? 'rejectReport' : access.managerReview ? 'reviewReport' : 'approveReport';
        if (await run(() => api[method](report.id, note.trim()), 'Đã cập nhật kết quả xét duyệt.')) {
            setReview(null);
            setNote('');
            setRevision((value) => value + 1);
        }
    };
    if (!report)
        return (
            <div className="v2-report-detail">
                <Link className="v2-text-link" to={backTo}>
                    ← Quay lại báo cáo
                </Link>
                <PageState
                    status={result.scope !== scope ? 'loading' : result.status}
                    title={result.status === 'not-found' ? 'Không tìm thấy báo cáo' : undefined}
                    description={result.error?.message}
                    onRetry={() => setRevision((value) => value + 1)}
                />
            </div>
        );
    return (
        <>
            <ReportDetailContent
                report={report}
                editTo={base ? `${base}/reports/${report.id}/edit` : `/v2/reports/${report.id}/edit`}
                access={access}
                backTo={backTo}
                busy={busy}
                error={error}
                notice={notice}
                api={api}
                fullscreen={fullscreen}
                onFullscreen={() => setFullscreen((value) => !value)}
                onAction={action}
                onReview={(decision) => {
                    setNote('');
                    setError('');
                    setReview(decision);
                }}
                onHistory={() => setHistory(true)}
                onRemove={setRemove}
                onUpload={async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (
                        file &&
                        access.attachments &&
                        (await run(() => api.uploadReportAttachment(report.id, file), 'Đã thêm tệp minh chứng.'))
                    )
                        setRevision((value) => value + 1);
                }}
            />
            {review && (
                <V2Modal
                    title={
                        review === 'reject'
                            ? 'Yêu cầu chỉnh sửa báo cáo'
                            : access.managerReview
                              ? 'Duyệt và chuyển tiếp báo cáo'
                              : 'Phê duyệt báo cáo'
                    }
                    onClose={() => {
                        if (!busy) setReview(null);
                    }}
                >
                    <p>
                        {review === 'reject'
                            ? 'Nêu rõ nội dung CLB cần bổ sung.'
                            : access.managerReview
                              ? 'Báo cáo sẽ được chuyển tới cấp phê duyệt cuối.'
                              : 'Nhận xét được lưu trong lịch sử xét duyệt.'}
                    </p>
                    <label className="v2-report-field">
                        Nhận xét {review === 'reject' ? '(bắt buộc)' : '(không bắt buộc)'}
                        <textarea
                            autoFocus
                            rows={5}
                            maxLength={1000}
                            value={note}
                            onChange={(event) => setNote(event.target.value)}
                        />
                    </label>
                    <small>{note.length}/1000 ký tự</small>
                    {error && (
                        <p role="alert" className="v2-report-error">
                            {error}
                        </p>
                    )}
                    <div className="v2-report-dialog-actions">
                        <button className="v2-button" type="button" disabled={busy} onClick={() => setReview(null)}>
                            Hủy
                        </button>
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            disabled={busy || (review === 'reject' && !note.trim())}
                            onClick={confirmReview}
                        >
                            {busy ? 'Đang xử lý…' : 'Xác nhận'}
                        </button>
                    </div>
                </V2Modal>
            )}
            {remove && (
                <V2Modal
                    title="Gỡ tệp minh chứng"
                    onClose={() => {
                        if (!busy) setRemove(null);
                    }}
                >
                    <p>
                        Gỡ tệp <strong>{remove.fileName}</strong> khỏi báo cáo?
                    </p>
                    {error && <p role="alert">{error}</p>}
                    <div className="v2-report-dialog-actions">
                        <button className="v2-button" disabled={busy} type="button" onClick={() => setRemove(null)}>
                            Hủy
                        </button>
                        <button
                            className="v2-button v2-report-danger"
                            disabled={busy}
                            type="button"
                            onClick={async () => {
                                if (
                                    access.attachments &&
                                    (await run(
                                        () => api.deleteReportAttachment(report.id, remove.id),
                                        'Đã gỡ tệp minh chứng.',
                                    ))
                                ) {
                                    setRemove(null);
                                    setRevision((value) => value + 1);
                                }
                            }}
                        >
                            Gỡ tệp
                        </button>
                    </div>
                </V2Modal>
            )}
            {history && access.export && (
                <ExportHistory
                    api={api}
                    reportId={report.id}
                    onClose={() => setHistory(false)}
                    onDownload={(operation) => run(operation)}
                />
            )}
        </>
    );
}
