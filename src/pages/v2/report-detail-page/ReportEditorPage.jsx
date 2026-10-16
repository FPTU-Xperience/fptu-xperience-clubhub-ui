import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText, Plus, Save, Send, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import PageState from '../../../components/v2/PageState';
import { formatReportType } from '../../../locales/vi';
import { REPORT_TEMPLATES, reportActivityDetail, reportTemplateContext, reportTemplateTag } from './report-templates';
import ReportTemplateModal from './ReportTemplateModal';
import { reportDate, reportFileSize } from './report-detail-data';
import './ReportEditorPage.scss';

const blankDetail = () => ({
    id: crypto.randomUUID(),
    dbId: null,
    activityName: '',
    activityDate: '',
    activityType: 'Chuyên môn',
    location: '',
    partnerUnit: '',
    objective: '',
    description: '',
    targetParticipantCount: 0,
    participantCount: 0,
    outcome: '',
    budgetSpent: 0,
    evidenceUrl: '',
});
const stages = ['Thông tin chung', 'Hoạt động', 'Đánh giá', 'Xem trước & nộp'];
const initialDraft = (context, workspace, semester) => ({
    clubId: workspace?.clubId || context?.clubId || '',
    period:
        context?.period || semester?.reportPeriod || semester?.invitationCode || semester?.code || semester?.id || '',
    reportType: context?.template.reportType || '',
    tag: reportTemplateTag(context),
    executiveSummary: '',
    achievements: '',
    challenges: '',
    recommendations: '',
    nextPeriodPlan: '',
    details: ['term-start', 'term-end'].includes(context?.template.id) ? [] : [blankDetail()],
});

export function reportEditorPayload(draft) {
    return {
        clubId: Number(draft.clubId),
        period: draft.period.trim(),
        reportType: draft.reportType,
        tag: draft.tag,
        executiveSummary: draft.executiveSummary.trim(),
        achievements: draft.achievements.trim(),
        challenges: draft.challenges.trim(),
        recommendations: draft.recommendations.trim(),
        nextPeriodPlan: draft.nextPeriodPlan.trim(),
        details: draft.details
            .filter((item) => item.activityName.trim())
            .map((item, index) => ({
                id: item.dbId || null,
                activityName: item.activityName.trim(),
                activityDate: item.activityDate,
                activityType: item.activityType,
                location: item.location.trim(),
                partnerUnit: item.partnerUnit.trim(),
                objective: item.objective.trim(),
                description: item.description.trim(),
                targetParticipantCount: Number(item.targetParticipantCount),
                participantCount: Number(item.participantCount),
                outcome: item.outcome.trim(),
                budgetSpent: Number(item.budgetSpent),
                evidenceUrl: item.evidenceUrl.trim(),
                sortOrder: index,
            })),
    };
}

function Field({
    label,
    name,
    value,
    onChange,
    type = 'text',
    multiline = false,
    required = false,
    disabled = false,
    ...props
}) {
    const id = `report-editor-${name}`;
    return (
        <div className="v2-report-editor-field">
            <label htmlFor={id}>
                {label}
                {required ? ' *' : ''}
            </label>
            {multiline ? (
                <textarea
                    id={id}
                    rows={4}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                    required={required}
                    {...props}
                />
            ) : (
                <input
                    id={id}
                    type={type}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    disabled={disabled}
                    required={required}
                    {...props}
                />
            )}
        </div>
    );
}

export default function ReportEditorPage({ api, workspace, base, semester, sessionKey, reportId: editId, readOnly = false }) {
    const { reportId: routeId } = useParams();
    const location = useLocation();
    const editing = Boolean(editId || routeId);
    const reportId = editId || routeId;
    const { clubAccess } = useAuth();
    const context = useMemo(
        () => (editing ? null : reportTemplateContext(location.search)),
        [editing, location.search],
    );
    const invalidContext = !editing && new URLSearchParams(location.search).has('template') && !context;
    const [draft, setDraft] = useState(() => initialDraft(context, workspace, semester));
    const [stage, setStage] = useState(0);
    const [mode, setMode] = useState('FORM');
    const [file, setFile] = useState(null);
    const [note, setNote] = useState('');
    const [choosing, setChoosing] = useState(false);
    const [loading, setLoading] = useState(editing || Boolean(context?.activityId));
    const [sourceError, setSourceError] = useState('');
    const [retry, setRetry] = useState(0);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const alive = useRef(true);
    const [savedId, setSavedId] = useState(null);
    const [saved, setSaved] = useState(false);
    const [deadlines, setDeadlines] = useState([]);
    const [original, setOriginal] = useState(null);
    const managerClubs = clubAccess.filter((item) => item.isManager);
    const manager = managerClubs.some((item) => String(item.clubId) === String(draft.clubId));
    const reportBase = base ? `${base}/reports` : '/v2/reports';
    const backTo = editing ? `${reportBase}/${reportId}` : base ? `${base}/reports` : '/v2/my-clubs';
    const template = REPORT_TEMPLATES.find((item) => item.reportType === draft.reportType);
    const title = editing ? 'Chỉnh sửa báo cáo' : template?.label || 'Tạo báo cáo';
    const future = draft.reportType === 'FUTURE_EVENT';
    const term = ['CLUB_TERM_START', 'CLUB_TERM_END'].includes(draft.reportType);
    const selectedClub = managerClubs.find((item) => String(item.clubId) === String(draft.clubId));
    const selectedWorkspace = workspace || { clubId: draft.clubId, name: selectedClub?.clubName || 'CLB đã chọn' };
    const due = deadlines.find((item) => item.period === draft.period)?.dueDate;

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        let active = true;
        api.getReportingDeadlines()
            .then((value) => {
                if (active) setDeadlines(Array.isArray(value) ? value : []);
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [api]);
    useEffect(() => {
        let active = true;
        if (!editing && !context?.activityId) return undefined;
        setLoading(true);
        setSourceError('');
        Promise.resolve()
            .then(async () => {
                if (editing) {
                    const report = await api.getReport(reportId);
                    if (!active) return;
                    if (workspace?.clubId != null && String(report.clubId) !== String(workspace.clubId))
                        throw new Error('Báo cáo không thuộc CLB này.');
                    const status = String(report.status).toUpperCase().replace(/\s/g, '');
                    if (!['DRAFT', 'REJECTED'].includes(status))
                        throw new Error('Chỉ có thể sửa báo cáo nháp hoặc báo cáo cần chỉnh sửa.');
                    setOriginal(report);
                    setDraft({
                        ...initialDraft(null, null, null),
                        ...Object.fromEntries(
                            [
                                'clubId',
                                'period',
                                'reportType',
                                'tag',
                                'executiveSummary',
                                'achievements',
                                'challenges',
                                'recommendations',
                                'nextPeriodPlan',
                            ].map((key) => [key, report[key] ?? '']),
                        ),
                        details: (report.details || []).map((item) => ({
                            ...blankDetail(),
                            ...Object.fromEntries(Object.entries(item).filter(([, value]) => value != null)),
                            id: `saved-${item.id}`,
                            dbId: item.id,
                        })),
                    });
                } else {
                    const activity = await api.getActivity(context.activityId);
                    if (!active) return;
                    if (
                        String(activity.clubId) !== String(context.clubId) ||
                        (workspace && String(workspace.clubId) !== String(context.clubId))
                    )
                        throw new Error('Hoạt động không thuộc CLB đã chọn.');
                    setDraft((value) => ({ ...value, details: [reportActivityDetail(activity)] }));
                }
            })
            .catch((issue) => {
                if (active) setSourceError(issue.message || 'Không thể tải dữ liệu báo cáo.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [api, editing, reportId, context, workspace?.clubId, retry]);

    const change = (key, value) => {
        setDraft((current) => ({ ...current, [key]: value }));
        setSaved(false);
    };
    const changeDetail = (id, key, value) => {
        setDraft((current) => ({
            ...current,
            details: current.details.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
        }));
        setSaved(false);
    };
    const validate = () => {
        if (!manager || readOnly) return 'Bạn không có quyền tạo hoặc chỉnh sửa báo cáo của CLB này.';
        if (!draft.reportType) return 'Vui lòng chọn mẫu báo cáo.';
        if (!draft.period.trim()) return 'Vui lòng nhập kỳ báo cáo.';
        if (mode === 'UPLOAD') {
            if (!file) return 'Vui lòng chọn tệp báo cáo.';
            if (!/\.(pdf|docx|xlsx)$/i.test(file.name) || file.size <= 0 || file.size > 20 * 1024 * 1024)
                return 'Chọn tệp PDF, DOCX hoặc XLSX có dung lượng từ 1 byte đến 20 MB.';
        } else {
            const details = reportEditorPayload(draft).details;
            if (!term && !original?.uploadedFile && !details.length)
                return 'Vui lòng nhập ít nhất một hoạt động có tên.';
            for (const item of details) {
                if (!item.activityDate) return 'Vui lòng nhập ngày tổ chức cho hoạt động.';
                if (future && (!item.location || !item.description))
                    return 'Báo cáo Tạo hoạt động cần địa điểm và nội dung hoạt động.';
                if (
                    [item.participantCount, item.targetParticipantCount, item.budgetSpent].some(
                        (value) => !Number.isFinite(value) || value < 0,
                    )
                )
                    return 'Số người và kinh phí phải là số không âm.';
                if (![item.participantCount, item.targetParticipantCount].every(Number.isSafeInteger))
                    return 'Số người tham gia phải là số nguyên.';
            }
        }
        return '';
    };
    const save = async (submit) => {
        if (lock.current) return;
        const validation = validate();
        if (validation) {
            setError(validation);
            return;
        }
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            let id = reportId || savedId;
            if (id) {
                if (editing || !saved) await api.updateReport(id, reportEditorPayload(draft));
            } else if (mode === 'UPLOAD') {
                const body = new FormData();
                body.append('clubId', draft.clubId);
                body.append('period', draft.period.trim());
                body.append('reportType', draft.reportType);
                body.append('tag', draft.tag);
                body.append('file', file);
                if (note.trim()) body.append('note', note.trim());
                const created = await api.uploadReportFile(body);
                id = created?.id;
            } else {
                const created = await api.createReport(reportEditorPayload(draft));
                id = created?.id;
            }
            if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0)
                throw new Error('Hệ thống chưa trả về mã báo cáo hợp lệ.');
            if (!alive.current) return;
            setSavedId(id);
            setSaved(true);
            if (submit) await api.submitReport(id);
            if (alive.current) setDestination(`${reportBase}/${encodeURIComponent(id)}`);
        } catch (issue) {
            if (alive.current) setError(issue.message || 'Không thể lưu báo cáo.');
        } finally {
            lock.current = false;
            if (alive.current) setBusy(false);
        }
    };
    const [destination, setDestination] = useState('');

    if (destination) return <Navigate to={destination} replace />;
    if (invalidContext || (workspace && context && String(workspace.clubId) !== String(context.clubId)))
        return (
            <div className="v2-report-editor">
                <Link className="v2-text-link" to={backTo}>
                    ← Quay lại báo cáo
                </Link>
                <PageState
                    status="error"
                    title="Thông tin mẫu báo cáo không hợp lệ"
                    description="Vui lòng chọn lại mẫu từ danh sách báo cáo của CLB."
                />
            </div>
        );
    if (loading) return <PageState status="loading" title="Đang chuẩn bị báo cáo…" />;
    if (sourceError)
        return (
            <div className="v2-report-editor">
                <Link className="v2-text-link" to={backTo}>
                    ← Quay lại báo cáo
                </Link>
                <PageState status="error" description={sourceError} onRetry={() => setRetry((value) => value + 1)} />
            </div>
        );
    if (readOnly || (draft.clubId && !manager) || !managerClubs.length) return <PageState status="forbidden" />;

    const totals = reportEditorPayload(draft).details.reduce(
        (sum, item) => ({
            activities: sum.activities + 1,
            participants: sum.participants + item.participantCount,
            budget: sum.budget + item.budgetSpent,
        }),
        { activities: 0, participants: 0, budget: 0 },
    );
    return (
        <div className="v2-report-editor">
            <Link className="v2-text-link v2-report-editor-back" to={backTo}>
                <ArrowLeft size={16} /> Quay lại báo cáo
            </Link>
            <header className="v2-report-editor-heading">
                <div>
                    <span className="v2-report-editor-eyebrow">
                        {editing ? 'CHỈNH SỬA HỒ SƠ' : 'TẠO HỒ SƠ BÁO CÁO'}
                    </span>
                    <h1>{title}</h1>
                    <p>
                        {selectedWorkspace.name}
                        {draft.period ? ` · ${draft.period}` : ''}
                    </p>
                </div>
                {!editing && draft.clubId && (
                    <button
                        className="v2-button"
                        type="button"
                        disabled={busy || Boolean(savedId)}
                        onClick={() => setChoosing(true)}
                    >
                        Đổi mẫu báo cáo
                    </button>
                )}
            </header>
            {!workspace && !editing && !context && (
                <section className="v2-report-editor-card">
                    <label className="v2-report-editor-field">
                        <span>Câu lạc bộ *</span>
                        <select value={draft.clubId} onChange={(event) => change('clubId', event.target.value)}>
                            <option value="">Chọn CLB</option>
                            {managerClubs.map((item) => (
                                <option key={item.clubId} value={item.clubId}>
                                    {item.clubName || `CLB #${item.clubId}`}
                                </option>
                            ))}
                        </select>
                    </label>
                </section>
            )}
            {!draft.reportType ? (
                <section className="v2-report-editor-card v2-report-editor-empty">
                    <FileText size={30} />
                    <h2>Chọn mẫu để bắt đầu</h2>
                    <p>Bốn mẫu báo cáo dành cho hoạt động và học kỳ của CLB.</p>
                    <button
                        className="v2-button v2-button--primary"
                        type="button"
                        disabled={!draft.clubId}
                        onClick={() => setChoosing(true)}
                    >
                        Chọn mẫu báo cáo
                    </button>
                </section>
            ) : (
                <>
                    {!editing && (
                        <div className="v2-report-editor-modes" aria-label="Phương thức tạo báo cáo">
                            <button
                                type="button"
                                aria-pressed={mode === 'FORM'}
                                disabled={busy || Boolean(savedId)}
                                onClick={() => setMode('FORM')}
                            >
                                <FileText size={18} /> Nhập trên hệ thống
                            </button>
                            <button
                                type="button"
                                aria-pressed={mode === 'UPLOAD'}
                                disabled={busy || Boolean(savedId)}
                                onClick={() => setMode('UPLOAD')}
                            >
                                <Upload size={18} /> Tải tệp báo cáo
                            </button>
                        </div>
                    )}
                    {mode === 'FORM' && (
                        <nav className="v2-report-editor-steps" aria-label="Các bước tạo báo cáo">
                            {stages.map((label, index) => (
                                <button
                                    key={label}
                                    type="button"
                                    aria-current={stage === index ? 'step' : undefined}
                                    onClick={() => setStage(index)}
                                    disabled={busy}
                                >
                                    <span>{index + 1}</span>
                                    {label}
                                </button>
                            ))}
                        </nav>
                    )}
                    {error && (
                        <p className="v2-report-editor-error" role="alert">
                            {error}
                        </p>
                    )}
                    {savedId && (
                        <p className="v2-report-editor-notice" role="status">
                            {saved ? 'Bản nháp đã được lưu.' : 'Đã có bản nháp của báo cáo này.'}{' '}
                            <Link to={`${reportBase}/${savedId}`}>Mở báo cáo #{savedId}</Link>
                        </p>
                    )}
                    {(stage === 0 || mode === 'UPLOAD') && (
                        <section className="v2-report-editor-card">
                            <h2>Thông tin chung</h2>
                            <div className="v2-report-editor-grid">
                                <Field
                                    name="club"
                                    label="Câu lạc bộ"
                                    value={selectedWorkspace.name}
                                    disabled
                                    onChange={() => {}}
                                />
                                <Field
                                    name="template"
                                    label="Mẫu báo cáo"
                                    value={template?.label || formatReportType(draft.reportType)}
                                    disabled
                                    onChange={() => {}}
                                />
                                <Field
                                    name="period"
                                    label="Kỳ báo cáo"
                                    required
                                    value={draft.period}
                                    disabled={Boolean(context?.period)}
                                    onChange={(value) => change('period', value)}
                                    placeholder="Nhập mã kỳ báo cáo"
                                />
                                <Field
                                    name="deadline"
                                    label="Hạn nộp"
                                    value={due ? reportDate(due) : 'Theo quy định của hệ thống'}
                                    disabled
                                    onChange={() => {}}
                                />
                            </div>
                            {context?.activityId && (
                                <p className="v2-report-editor-hint">
                                    Hoạt động đã chọn: {draft.details[0]?.activityName || `#${context.activityId}`}
                                </p>
                            )}
                            {original?.uploadedFile && (
                                <p className="v2-report-editor-hint">
                                    Tệp báo cáo hiện tại: {original.uploadedFile.originalFileName}. Nội dung tệp được
                                    giữ khi chỉnh sửa thông tin.
                                </p>
                            )}
                        </section>
                    )}
                    {mode === 'UPLOAD' ? (
                        <section className="v2-report-editor-card">
                            <h2>Tệp báo cáo</h2>
                            <label className="v2-report-editor-upload">
                                <Upload size={26} />
                                <strong>Chọn tệp báo cáo</strong>
                                <span>PDF, DOCX hoặc XLSX · Tối đa 20 MB</span>
                                <input
                                    type="file"
                                    accept=".pdf,.docx,.xlsx"
                                    aria-label="Chọn tệp báo cáo"
                                    disabled={busy || Boolean(savedId)}
                                    onChange={(event) => {
                                        setFile(event.target.files?.[0] || null);
                                        setError('');
                                    }}
                                />
                            </label>
                            {file && (
                                <p>
                                    {file.name} · {reportFileSize(file.size)}
                                </p>
                            )}
                            <Field name="upload-note" label="Ghi chú" multiline value={note} onChange={setNote} />
                        </section>
                    ) : (
                        <>
                            {stage === 1 && (
                                <section className="v2-report-editor-card">
                                    <div className="v2-report-editor-card-heading">
                                        <h2>{term ? 'Hoạt động trong kỳ (không bắt buộc)' : 'Thông tin hoạt động'}</h2>
                                        {!context?.activityId && (
                                            <button
                                                className="v2-button"
                                                type="button"
                                                onClick={() => change('details', [...draft.details, blankDetail()])}
                                            >
                                                <Plus size={16} /> Thêm hoạt động
                                            </button>
                                        )}
                                    </div>
                                    {!draft.details.length && (
                                        <p className="v2-report-editor-hint">
                                            Bạn có thể bổ sung hoạt động dự kiến hoặc đã thực hiện của CLB.
                                        </p>
                                    )}
                                    {draft.details.map((item, index) => (
                                        <section className="v2-report-editor-activity" key={item.id}>
                                            <div className="v2-report-editor-card-heading">
                                                <h3>Hoạt động {index + 1}</h3>
                                                {!context?.activityId && (
                                                    <button
                                                        className="v2-button"
                                                        type="button"
                                                        onClick={() =>
                                                            change(
                                                                'details',
                                                                draft.details.filter((row) => row.id !== item.id),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 size={15} /> Xóa
                                                    </button>
                                                )}
                                            </div>
                                            <div className="v2-report-editor-grid">
                                                {[
                                                    ['activityName', 'Tên hoạt động', 'text'],
                                                    ['activityDate', 'Ngày tổ chức', 'date'],
                                                    ['activityType', 'Loại hoạt động', 'text'],
                                                    ['location', 'Địa điểm', 'text'],
                                                    ['partnerUnit', 'Đơn vị phối hợp', 'text'],
                                                    ['objective', 'Mục tiêu', 'text'],
                                                    ['targetParticipantCount', 'Số người dự kiến', 'number'],
                                                    ['participantCount', 'Số người thực tế', 'number'],
                                                    ['budgetSpent', 'Kinh phí (VNĐ)', 'number'],
                                                    ['evidenceUrl', 'Liên kết minh chứng', 'url'],
                                                ].map(([key, label, type]) => (
                                                    <Field
                                                        key={key}
                                                        name={`${item.id}-${key}`}
                                                        label={label}
                                                        type={type}
                                                        value={item[key]}
                                                        required={
                                                            ['activityName', 'activityDate'].includes(key) ||
                                                            (future && key === 'location')
                                                        }
                                                        onChange={(value) => changeDetail(item.id, key, value)}
                                                        {...(type === 'number'
                                                            ? { min: 0, step: key === 'budgetSpent' ? '.01' : '1' }
                                                            : {})}
                                                    />
                                                ))}
                                            </div>
                                            <Field
                                                name={`${item.id}-description`}
                                                label="Nội dung hoạt động"
                                                multiline
                                                required={future}
                                                value={item.description}
                                                onChange={(value) => changeDetail(item.id, 'description', value)}
                                            />
                                            <Field
                                                name={`${item.id}-outcome`}
                                                label="Kết quả đạt được"
                                                multiline
                                                value={item.outcome}
                                                onChange={(value) => changeDetail(item.id, 'outcome', value)}
                                            />
                                        </section>
                                    ))}
                                </section>
                            )}
                            {stage === 2 && (
                                <section className="v2-report-editor-card">
                                    <h2>Đánh giá và kế hoạch</h2>
                                    {[
                                        [
                                            'executiveSummary',
                                            draft.reportType === 'CLUB_TERM_START'
                                                ? 'Mục tiêu và kế hoạch đầu kỳ'
                                                : 'Tóm tắt điều hành',
                                        ],
                                        ['achievements', 'Thành tựu nổi bật'],
                                        ['challenges', 'Khó khăn và tồn tại'],
                                        ['recommendations', 'Kiến nghị hỗ trợ'],
                                        ['nextPeriodPlan', 'Kế hoạch kỳ tiếp theo'],
                                    ].map(([key, label]) => (
                                        <Field
                                            key={key}
                                            name={key}
                                            label={label}
                                            multiline
                                            value={draft[key]}
                                            onChange={(value) => change(key, value)}
                                        />
                                    ))}
                                </section>
                            )}
                            {stage === 3 && (
                                <section className="v2-report-editor-card">
                                    <h2>Xem trước & nộp</h2>
                                    <dl className="v2-report-editor-summary">
                                        <div>
                                            <dt>Mẫu báo cáo</dt>
                                            <dd>{template?.label || formatReportType(draft.reportType)}</dd>
                                        </div>
                                        <div>
                                            <dt>Kỳ báo cáo</dt>
                                            <dd>{draft.period || 'Chưa nhập'}</dd>
                                        </div>
                                        <div>
                                            <dt>Số hoạt động</dt>
                                            <dd>{totals.activities}</dd>
                                        </div>
                                        <div>
                                            <dt>Tổng lượt tham gia</dt>
                                            <dd>{totals.participants}</dd>
                                        </div>
                                        <div>
                                            <dt>Tổng kinh phí</dt>
                                            <dd>{totals.budget.toLocaleString('vi-VN')} VNĐ</dd>
                                        </div>
                                    </dl>
                                    {draft.details
                                        .filter((item) => item.activityName.trim())
                                        .map((item) => (
                                            <div className="v2-report-editor-preview" key={item.id}>
                                                <h3>{item.activityName}</h3>
                                                <p>
                                                    {reportDate(item.activityDate)} ·{' '}
                                                    {item.location || 'Chưa nhập địa điểm'}
                                                </p>
                                                <p>{item.description || 'Chưa nhập nội dung.'}</p>
                                                {item.outcome && <p>{item.outcome}</p>}
                                            </div>
                                        ))}
                                    {[
                                        ['executiveSummary', 'Tóm tắt'],
                                        ['achievements', 'Thành tựu'],
                                        ['challenges', 'Khó khăn'],
                                        ['recommendations', 'Kiến nghị'],
                                        ['nextPeriodPlan', 'Kế hoạch kỳ tiếp theo'],
                                    ].map(([key, label]) => (
                                        <div className="v2-report-editor-preview" key={key}>
                                            <h3>{label}</h3>
                                            <p>{draft[key] || 'Chưa có thông tin.'}</p>
                                        </div>
                                    ))}
                                </section>
                            )}
                        </>
                    )}
                    <footer className="v2-report-editor-footer">
                        <div>
                            {mode === 'FORM' && stage > 0 && (
                                <button
                                    className="v2-button"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setStage((value) => value - 1)}
                                >
                                    <ArrowLeft size={16} /> Quay lại
                                </button>
                            )}
                        </div>
                        <div>
                            {mode === 'FORM' && stage < 3 ? (
                                <button
                                    className="v2-button v2-button--primary"
                                    type="button"
                                    onClick={() => setStage((value) => value + 1)}
                                >
                                    Tiếp tục <ArrowRight size={16} />
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="v2-button"
                                        type="button"
                                        disabled={busy}
                                        onClick={() => save(false)}
                                    >
                                        <Save size={16} /> {busy ? 'Đang lưu…' : 'Lưu bản nháp'}
                                    </button>
                                    <button
                                        className="v2-button v2-button--primary"
                                        type="button"
                                        disabled={busy}
                                        onClick={() => save(true)}
                                    >
                                        <Send size={16} /> Lưu và nộp
                                    </button>
                                </>
                            )}
                        </div>
                    </footer>
                </>
            )}
            {choosing && (
                <ReportTemplateModal
                    api={api}
                    workspace={selectedWorkspace}
                    semester={semester}
                    basePath={reportBase}
                    onClose={() => setChoosing(false)}
                />
            )}
        </div>
    );
}
