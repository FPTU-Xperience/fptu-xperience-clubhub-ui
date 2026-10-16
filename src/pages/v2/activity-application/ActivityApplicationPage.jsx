import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import PageState from '../../../components/v2/PageState';
import {
    ACTION_ROLES,
    ACTIVITY_SCALES,
    actionEstimate,
    applicationEstimate,
    applicationPayload,
    applicationPermission,
    formatXp,
    newAction,
    newApplication,
    applicationValidationIssue,
} from './activity-application-data';
import '../report-detail-page/ReportEditorPage.scss';
import './ActivityApplicationPage.scss';

const steps = ['Thông tin hoạt động', 'Action & dự toán XP', 'Tuyển nhân sự', 'Kiểm tra & gửi duyệt'];
function Field({ label, value, onChange, options, multiline, ...props }) {
    const id = useId();
    return (
        <div className="v2-report-editor-field">
            <label htmlFor={id}>{label}</label>
            {options ? (
                <select id={id} {...props} value={value} onChange={(event) => onChange(event.target.value)}>
                    {options.map(([id, name, multiplier]) => (
                        <option key={id} value={id}>
                            {name}
                            {multiplier ? ` · ×${multiplier}` : ''}
                        </option>
                    ))}
                </select>
            ) : multiline ? (
                <textarea
                    id={id}
                    {...props}
                    rows={4}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                />
            ) : (
                <input id={id} {...props} value={value} onChange={(event) => onChange(event.target.value)} />
            )}
        </div>
    );
}
const localDate = (value) =>
    new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    })
        .format(new Date(value))
        .replace(' ', 'T');
const validReceipt = (value) =>
    value &&
    Number.isSafeInteger(value.id) &&
    value.id > 0 &&
    Number.isSafeInteger(value.version) &&
    value.version > 0 &&
    Number.isFinite(value.expectedRawXp) &&
    value.expectedRawXp >= 0;

export default function ActivityApplicationPage({ api, workspace, base, semester, context, readOnly }) {
    const { clubAccess } = useAuth();
    const location = useLocation();
    const requestedId = new URLSearchParams(location.search).get('applicationId');
    const [draft, setDraft] = useState(() =>
        newApplication(
            workspace?.clubId || context?.clubId || '',
            context?.period ||
                semester?.reportPeriod ||
                semester?.invitationCode ||
                semester?.code ||
                semester?.id ||
                '',
        ),
    );
    const [stage, setStage] = useState(0);
    const [error, setError] = useState('');
    const [validationIssue, setValidationIssue] = useState(null);
    const formRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(Boolean(requestedId));
    const [receipt, setReceipt] = useState(null);
    const [retry, setRetry] = useState(0);
    const [loadError, setLoadError] = useState('');
    const lock = useRef(false);
    const createKey = useRef(crypto.randomUUID());
    const submitKey = useRef(crypto.randomUUID());
    const savedPayload = useRef('');
    const pendingPayload = useRef('');
    const mounted = useRef(true);
    const access = clubAccess.find((item) => String(item.clubId) === String(draft.clubId));
    const canUpdate = applicationPermission(access, 'activity.edit');
    const canEdit = requestedId ? canUpdate : applicationPermission(access, 'activity.create');
    const canSubmit = applicationPermission(access, 'activity.application.submit');
    const backTo = base ? `${base}/activities` : '/v2/my-clubs';
    const total = applicationEstimate(draft);
    const submitted = receipt?.status === 'SUBMITTED';
    const resumeQuery = new URLSearchParams(location.search);
    if (receipt) resumeQuery.set('applicationId', receipt.id);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);
    useEffect(() => {
        if (!requestedId) return;
        let active = true;
        setLoading(true);
        setLoadError('');
        Promise.resolve()
            .then(async () => {
                if (!/^[1-9]\d*$/.test(requestedId)) throw new Error('Mã hồ sơ không hợp lệ.');
                const value = await api.getActivityApplication(requestedId);
                if (
                    !validReceipt(value) ||
                    !value.actions?.length ||
                    String(value.clubId) !== String(workspace?.clubId || context?.clubId)
                )
                    throw new Error('Hồ sơ không hợp lệ hoặc không thuộc CLB này.');
                if (!['DRAFT', 'REVISION_REQUESTED', 'SUBMITTED'].includes(value.status))
                    throw new Error('Hồ sơ đã được xử lý; không thể chỉnh sửa tại đây.');
                const restored = {
                    ...newApplication(value.clubId, value.period),
                    ...value,
                    startTime: localDate(value.startTimeUtc),
                    endTime: localDate(value.endTimeUtc),
                    actions: value.actions.map((action) => newAction(action)),
                    recruitment: value.recruitment
                        ? {
                              ...value.recruitment,
                              enabled: true,
                              actionIds: value.recruitment.positions.map((position) => position.actionClientId),
                          }
                        : { enabled: false, visibility: 'PUBLIC', eligibility: 'SCHOOL_STUDENTS', actionIds: [] },
                };
                if (active) {
                    setDraft(restored);
                    setReceipt(value);
                    savedPayload.current = JSON.stringify(applicationPayload(restored));
                }
            })
            .catch((issue) => {
                if (active) setLoadError(issue.message || 'Không thể tải hồ sơ.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [api, requestedId, workspace?.clubId, context?.clubId, retry]);
    useEffect(() => {
        if (!validationIssue) return;
        const panel = formRef.current?.querySelector(`[data-step="${validationIssue.stage}"]`);
        const field = validationIssue.field
            ? panel?.querySelector(`[name="${validationIssue.field}"]`)
            : panel?.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
        field?.setAttribute('aria-invalid', 'true');
        field?.setAttribute('aria-describedby', 'activity-application-error');
        field?.focus();
        field?.scrollIntoView({ block: 'center' });
        return () => {
            field?.removeAttribute('aria-invalid');
            field?.removeAttribute('aria-describedby');
        };
    }, [validationIssue]);
    const navigateStep = (next) => {
        if (next > stage) {
            const issue = applicationValidationIssue(draft, next - 1);
            if (issue) {
                setError(issue.message);
                setValidationIssue(issue);
                setStage(issue.stage);
                return;
            }
        }
        setError('');
        setValidationIssue(null);
        setStage(next);
    };
    const change = (key, value) => {
        setDraft((current) => ({ ...current, [key]: value }));
        setError('');
        setValidationIssue(null);
    };
    const changeAction = (id, key, value) =>
        setDraft((current) => ({
            ...current,
            actions: current.actions.map((action) => (action.clientId === id ? { ...action, [key]: value } : action)),
        }));
    const changeRecruitment = (key, value) => change('recruitment', { ...draft.recruitment, [key]: value });
    const save = async (submit) => {
        if (lock.current || readOnly || !canEdit || (submit && !canSubmit)) return;
        const validation = applicationValidationIssue(draft);
        if (validation) {
            setError(validation.message);
            setValidationIssue(validation);
            setStage(validation.stage);
            return;
        }
        lock.current = true;
        setBusy(true);
        setError('');
        let persistedId = receipt?.id;
        try {
            const payload = applicationPayload(draft);
            const serialized = JSON.stringify(payload);
            if (receipt && savedPayload.current !== serialized && !canUpdate)
                throw new Error('Bạn không có quyền chỉnh sửa hồ sơ hoạt động đã lưu.');
            if (receipt && pendingPayload.current && pendingPayload.current !== serialized)
                createKey.current = crypto.randomUUID();
            pendingPayload.current = serialized;
            let value = receipt;
            if (!receipt || savedPayload.current !== serialized) {
                value = receipt
                    ? await api.updateActivityApplication(
                          receipt.id,
                          { ...payload, expectedVersion: receipt.version },
                          createKey.current,
                      )
                    : await api.createActivityApplication(payload, createKey.current);
                if (!validReceipt(value) || !['DRAFT', 'REVISION_REQUESTED'].includes(value.status))
                    throw new Error(
                        'Server chưa trả về hồ sơ action và dự toán XP hợp lệ. Vui lòng kiểm tra hỗ trợ backend.',
                    );
                if (!mounted.current) return;
                setReceipt(value);
                persistedId = value.id;
                savedPayload.current = serialized;
                createKey.current = crypto.randomUUID();
                submitKey.current = crypto.randomUUID();
            }
            if (submit) {
                const submittedId = value.id;
                value = await api.submitActivityApplication(
                    value.id,
                    { expectedVersion: value.version },
                    submitKey.current,
                );
                if (!validReceipt(value) || value.id !== submittedId || value.status !== 'SUBMITTED')
                    throw new Error('Server chưa xác nhận hồ sơ đã gửi CTSV.');
                if (mounted.current) setReceipt(value);
            }
        } catch (issue) {
            if (mounted.current)
                setError(
                    [404, 405, 501].includes(issue.status)
                        ? persistedId
                            ? `Hồ sơ #${persistedId} đã lưu, nhưng máy chủ chưa hỗ trợ bước gửi duyệt XP. Hồ sơ chưa được gửi CTSV.`
                            : 'Máy chủ chưa hỗ trợ hồ sơ hoạt động có action và duyệt XP. Dữ liệu đang ở biểu mẫu; chưa được lưu hoặc gửi CTSV. Bạn có thể xuất hồ sơ để giữ lại.'
                        : issue.message || 'Không thể lưu hồ sơ. Vui lòng thử lại.',
                );
        } finally {
            lock.current = false;
            if (mounted.current) setBusy(false);
        }
    };
    const exportDraft = () => {
        const content = JSON.stringify({ schemaVersion: 1, state: 'LOCAL_DRAFT', draft, estimate: total }, null, 2);
        const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'ho-so-hoat-dong.json';
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    if (readOnly || !canEdit || (workspace && context && String(workspace.clubId) !== String(context.clubId)))
        return <PageState status="forbidden" />;
    if (loading) return <PageState status="loading" />;
    if (loadError) return <PageState status="error" description={loadError} onRetry={() => setRetry((n) => n + 1)} />;
    return (
        <div className="v2-report-editor v2-activity-application">
            <Link className="v2-text-link v2-report-editor-back" to={backTo}>
                <ArrowLeft size={16} /> Về hoạt động CLB
            </Link>
            <header className="v2-report-editor-heading">
                <div>
                    <span className="v2-report-editor-eyebrow">HỒ SƠ ĐỀ XUẤT HOẠT ĐỘNG</span>
                    <h1>Tạo hoạt động</h1>
                    <p>{workspace?.name || access?.clubName} · Duyệt kế hoạch và ngân sách XP trước khi triển khai</p>
                </div>
                <span className="v2-application-badge">{submitted ? 'Chờ CTSV duyệt lần 1' : 'Bản nháp kế hoạch'}</span>
            </header>
            <div className="v2-application-approval-path" aria-label="Hai bước duyệt">
                <span>
                    <strong>1. CTSV duyệt kế hoạch</strong>Action, nhân sự và hạn mức XP
                </span>
                <ArrowRight size={18} />
                <span>
                    <strong>Triển khai hoạt động</strong>Ghi nhận lượt tham gia và phần việc
                </span>
                <ArrowRight size={18} />
                <span>
                    <strong>2. CTSV duyệt tổng kết</strong>Sau đó mới ghi nhận XP chính thức
                </span>
            </div>
            {submitted ? (
                <section className="v2-report-editor-card" role="status">
                    <CheckCircle2 size={32} />
                    <h2>Đã gửi hồ sơ #{receipt.id}</h2>
                    <p>
                        XP đề xuất theo server: <strong>{formatXp(receipt.expectedRawXp)} raw XP</strong>. Hoạt động và
                        tuyển nhân sự chỉ được triển khai sau khi CTSV duyệt kế hoạch.
                    </p>
                    <p>
                        Khi hoạt động kết thúc, báo cáo được sinh từ dữ liệu thực hiện; CTSV duyệt lần hai trước khi cấp
                        điểm.
                    </p>
                    <Link to={backTo} className="v2-button">
                        Về hoạt động CLB
                    </Link>
                </section>
            ) : (
                <form
                    ref={formRef}
                    noValidate
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (stage < 3) navigateStep(stage + 1);
                        else save(true);
                    }}
                >
                    <nav className="v2-report-editor-steps" aria-label="Các bước tạo hoạt động">
                        {steps.map((label, index) => (
                            <button
                                type="button"
                                disabled={busy}
                                key={label}
                                aria-current={stage === index ? 'step' : undefined}
                                onClick={() => navigateStep(index)}
                            >
                                <span>{index + 1}</span>
                                {label}
                            </button>
                        ))}
                    </nav>
                    {error && (
                        <p id="activity-application-error" className="v2-report-editor-error" role="alert">
                            {error}
                        </p>
                    )}
                    {receipt && (
                        <p className="v2-report-editor-notice" role="status">
                            Hồ sơ #{receipt.id} · phiên bản {receipt.version} đã lưu. Dự toán server:{' '}
                            {formatXp(receipt.expectedRawXp)} raw XP.{' '}
                            <Link to={`${location.pathname}?${resumeQuery}`}>Mở lại bản đã lưu</Link>
                        </p>
                    )}
                    <fieldset disabled={busy || Boolean(receipt && !canUpdate)} className="v2-application-fields">
                        <section hidden={stage !== 0} data-step="0" className="v2-report-editor-card">
                            <h2>Thông tin hoạt động</h2>
                            <Field
                                label="Tên hoạt động *"
                                name="title"
                                value={draft.title}
                                maxLength={120}
                                onChange={(v) => change('title', v)}
                                placeholder="Ví dụ: Workshop thiết kế sản phẩm"
                            />
                            <div className="v2-report-editor-grid">
                                <Field
                                    label="Kỳ hoạt động *"
                                    name="period"
                                    value={draft.period}
                                    onChange={(v) => change('period', v)}
                                />
                                <Field
                                    label="Quy mô hoạt động"
                                    name="scale"
                                    value={draft.scale}
                                    options={ACTIVITY_SCALES}
                                    onChange={(v) => change('scale', v)}
                                />
                                <Field
                                    label="Thời gian bắt đầu *"
                                    type="datetime-local"
                                    name="startTime"
                                    value={draft.startTime}
                                    onChange={(v) => change('startTime', v)}
                                />
                                <Field
                                    label="Thời gian kết thúc *"
                                    type="datetime-local"
                                    name="endTime"
                                    value={draft.endTime}
                                    onChange={(v) => change('endTime', v)}
                                />
                            </div>
                            <p className="v2-report-editor-hint">Thời gian theo giờ Việt Nam (UTC+7).</p>
                            <Field
                                label="Địa điểm *"
                                name="location"
                                value={draft.location}
                                maxLength={250}
                                onChange={(v) => change('location', v)}
                            />
                            <Field
                                label="Mục tiêu"
                                name="objective"
                                value={draft.objective}
                                maxLength={2000}
                                multiline
                                onChange={(v) => change('objective', v)}
                            />
                            <Field
                                label="Nội dung hoạt động *"
                                name="description"
                                value={draft.description}
                                maxLength={5000}
                                multiline
                                onChange={(v) => change('description', v)}
                            />
                        </section>
                        <section hidden={stage !== 1} data-step="1" className="v2-report-editor-card">
                            <div className="v2-report-editor-card-heading">
                                <h2>Action & dự toán XP</h2>
                                <button
                                    type="button"
                                    className="v2-button"
                                    onClick={() => change('actions', [...draft.actions, newAction()])}
                                >
                                    <Plus size={16} /> Thêm action
                                </button>
                            </div>
                            <p>
                                Mỗi lượt = Điểm nền × min(Hệ số vai trò × Hệ số quy mô, 8). Dự toán = XP mỗi lượt × Số
                                người × Số lượt/người.
                            </p>
                            <p className="v2-report-editor-hint">
                                Các dòng ban đầu là gợi ý; hãy thay bằng kế hoạch thực tế. Dự toán giả định hoàn thành
                                100%, không thưởng kết quả.
                            </p>
                            {draft.actions.map((action, index) => {
                                const estimate = actionEstimate(action, draft.scale);
                                return (
                                    <article className="v2-application-action" key={action.clientId}>
                                        <div className="v2-report-editor-card-heading">
                                            <h3>
                                                Action {index + 1} · {action.name || 'Chưa đặt tên'}
                                            </h3>
                                            <button
                                                type="button"
                                                className="v2-button"
                                                disabled={draft.actions.length === 1}
                                                aria-label={`Xóa action ${index + 1}`}
                                                onClick={() => {
                                                    change(
                                                        'actions',
                                                        draft.actions.filter(
                                                            (item) => item.clientId !== action.clientId,
                                                        ),
                                                    );
                                                    changeRecruitment(
                                                        'actionIds',
                                                        draft.recruitment.actionIds.filter(
                                                            (id) => id !== action.clientId,
                                                        ),
                                                    );
                                                }}
                                            >
                                                <Trash2 size={15} /> Xóa
                                            </button>
                                        </div>
                                        <div className="v2-report-editor-grid">
                                            <Field
                                                label={`Tên action ${index + 1}`}
                                                value={action.name}
                                                maxLength={120}
                                                onChange={(v) => changeAction(action.clientId, 'name', v)}
                                            />
                                            <Field
                                                label={`Điểm nền action ${index + 1}`}
                                                type="number"
                                                min="0.0001"
                                                step="0.0001"
                                                value={action.basePoints}
                                                onChange={(v) => changeAction(action.clientId, 'basePoints', v)}
                                            />
                                            <Field
                                                label={`Vai trò action ${index + 1}`}
                                                value={action.contributionRole}
                                                options={ACTION_ROLES}
                                                onChange={(v) => changeAction(action.clientId, 'contributionRole', v)}
                                            />
                                            <Field
                                                label={`Quy mô action ${index + 1}`}
                                                value={action.scaleSource === 'ACTIVITY' ? 'ACTIVITY' : action.scale}
                                                options={[['ACTIVITY', 'Kế thừa quy mô hoạt động'], ...ACTIVITY_SCALES]}
                                                onChange={(v) => {
                                                    changeAction(
                                                        action.clientId,
                                                        'scaleSource',
                                                        v === 'ACTIVITY' ? 'ACTIVITY' : 'OVERRIDE',
                                                    );
                                                    if (v !== 'ACTIVITY') changeAction(action.clientId, 'scale', v);
                                                }}
                                            />
                                            {[
                                                ['expectedPeople', 'Số người dự kiến'],
                                                ['expectedOccurrencesPerPerson', 'Số lượt/người dự kiến'],
                                                ['maxAwardsPerPerson', 'Tối đa lượt được cấp/người'],
                                                ['maxAwardCount', 'Tối đa lượt cấp toàn action'],
                                            ].map(([key, label]) => (
                                                <Field
                                                    key={key}
                                                    label={`${label} · action ${index + 1}`}
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={action[key]}
                                                    onChange={(v) => changeAction(action.clientId, key, v)}
                                                />
                                            ))}
                                            <Field
                                                label={`Cách xác minh action ${index + 1}`}
                                                value={action.verificationMethod}
                                                options={[
                                                    ['ATTENDANCE', 'Điểm danh / check-in'],
                                                    ['WORK_REVIEW', 'Nghiệm thu phần việc'],
                                                ]}
                                                onChange={(v) => changeAction(action.clientId, 'verificationMethod', v)}
                                            />
                                        </div>
                                        <p className="v2-application-action-total">
                                            {formatXp(estimate.perOccurrence)} XP/lượt × {action.expectedPeople || 0}{' '}
                                            người × {action.expectedOccurrencesPerPerson || 0} lượt ={' '}
                                            <strong>{formatXp(estimate.rawXp)} raw XP</strong>
                                        </p>
                                        <small>
                                            Chỉ đề nghị cấp khi hoàn thành và có xác minh; chờ CTSV duyệt báo cáo kết
                                            thúc.
                                        </small>
                                    </article>
                                );
                            })}
                            <label className="v2-application-check">
                                <input
                                    type="checkbox"
                                    checked={draft.independentActionsConfirmed}
                                    onChange={(event) => change('independentActionsConfirmed', event.target.checked)}
                                />
                                <span>
                                    Các action là phần việc độc lập, được phép cộng dồn. Hosting / hỗ trợ không tính lại
                                    phần tham dự đã bao gồm trong điểm nền.
                                </span>
                            </label>
                        </section>
                        <section hidden={stage !== 2} data-step="2" className="v2-report-editor-card">
                            <h2>Tuyển nhân sự cho hoạt động</h2>
                            <label className="v2-application-check">
                                <input
                                    type="checkbox"
                                    checked={draft.recruitment.enabled}
                                    onChange={(event) => changeRecruitment('enabled', event.target.checked)}
                                />
                                <span>Chuẩn bị nhiệm vụ tuyển nhân sự</span>
                            </label>
                            <p>
                                Một nhiệm vụ dùng chung tại “Nhiệm vụ & đóng góp” và tab “Tuyển dụng” của hoạt động. Chỉ
                                mở sau khi kế hoạch được duyệt.
                            </p>
                            {draft.recruitment.enabled && (
                                <>
                                    <div className="v2-report-editor-grid">
                                        <Field
                                            label="Hiển thị nhiệm vụ"
                                            value={draft.recruitment.visibility}
                                            options={[
                                                ['PUBLIC', 'Công khai'],
                                                ['PRIVATE', 'Riêng tư trong CLB'],
                                            ]}
                                            onChange={(v) =>
                                                change('recruitment', {
                                                    ...draft.recruitment,
                                                    visibility: v,
                                                    eligibility:
                                                        v === 'PRIVATE'
                                                            ? 'CLUB_MEMBERS'
                                                            : draft.recruitment.eligibility,
                                                })
                                            }
                                        />
                                        <Field
                                            label="Đối tượng được tham gia"
                                            value={draft.recruitment.eligibility}
                                            options={
                                                draft.recruitment.visibility === 'PRIVATE'
                                                    ? [['CLUB_MEMBERS', 'Thành viên CLB']]
                                                    : [
                                                          ['SCHOOL_STUDENTS', 'Sinh viên trường'],
                                                          ['CLUB_MEMBERS', 'Thành viên CLB'],
                                                      ]
                                            }
                                            onChange={(v) => changeRecruitment('eligibility', v)}
                                        />
                                    </div>
                                    <h3>Vị trí liên kết action</h3>
                                    {draft.actions.map((action) => (
                                        <label className="v2-application-check" key={action.clientId}>
                                            <input
                                                type="checkbox"
                                                checked={draft.recruitment.actionIds.includes(action.clientId)}
                                                onChange={(event) =>
                                                    changeRecruitment(
                                                        'actionIds',
                                                        event.target.checked
                                                            ? [...draft.recruitment.actionIds, action.clientId]
                                                            : draft.recruitment.actionIds.filter(
                                                                  (id) => id !== action.clientId,
                                                              ),
                                                    )
                                                }
                                            />
                                            <span>
                                                {action.name || 'Action chưa có tên'} · {action.expectedPeople} vị trí
                                            </span>
                                        </label>
                                    ))}
                                </>
                            )}
                            <p className="v2-report-editor-hint">
                                Tham gia vị trí tạo phân công staff, chưa được tính là hoàn thành và chưa nhận XP. Vai
                                trò hoạt động không cấp quyền quản trị CLB.
                            </p>
                        </section>
                        <section hidden={stage !== 3} data-step="3" className="v2-report-editor-card">
                            <h2>Kiểm tra hồ sơ trước khi gửi</h2>
                            <dl className="v2-report-editor-summary">
                                <div>
                                    <dt>Hoạt động</dt>
                                    <dd>{draft.title || 'Chưa nhập'}</dd>
                                </div>
                                <div>
                                    <dt>Kỳ / quy mô</dt>
                                    <dd>
                                        {draft.period || 'Chưa nhập'} ·{' '}
                                        {ACTIVITY_SCALES.find(([id]) => id === draft.scale)?.[1]}
                                    </dd>
                                </div>
                                <div>
                                    <dt>Tuyển nhân sự</dt>
                                    <dd>
                                        {draft.recruitment.enabled
                                            ? `${draft.recruitment.actionIds.length} vị trí theo action`
                                            : 'Không tạo nhiệm vụ'}
                                    </dd>
                                </div>
                            </dl>
                            <div className="v2-application-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>XP/lượt</th>
                                            <th>Người</th>
                                            <th>Lượt/người</th>
                                            <th>Dự kiến XP</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {draft.actions.map((action) => {
                                            const xp = actionEstimate(action, draft.scale);
                                            return (
                                                <tr key={action.clientId}>
                                                    <td>{action.name || 'Chưa nhập'}</td>
                                                    <td>{formatXp(xp.perOccurrence)}</td>
                                                    <td>{action.expectedPeople}</td>
                                                    <td>{action.expectedOccurrencesPerPerson}</td>
                                                    <td>{formatXp(xp.rawXp)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <p>
                                CTSV duyệt kế hoạch và hạn mức XP trước khi hoạt động chạy. Báo cáo kết thúc sẽ lấy dữ
                                liệu thực hiện để tính XP thực tế; người lập chỉ chỉnh phần thông tin.
                            </p>
                            <p className="v2-report-editor-hint">
                                Dự toán dưới đây là preview trên biểu mẫu. Server tính lại và trả về tổng khi lưu; XP
                                chính thức chỉ phát sinh sau lần duyệt tổng kết.
                            </p>
                            {!draft.independentActionsConfirmed && (
                                <button className="v2-button" type="button" onClick={() => setStage(1)}>
                                    Kiểm tra và xác nhận quy tắc cộng dồn
                                </button>
                            )}
                        </section>
                    </fieldset>
                    <aside className="v2-application-total" aria-live="polite">
                        <div>
                            <span>XP đề xuất · dự toán trên biểu mẫu</span>
                            <strong>
                                {Number.isFinite(total.rawXp) ? formatXp(total.rawXp) : '—'} <small>raw XP</small>
                            </strong>
                        </div>
                        <p>{draft.actions.length} action · XP được duyệt và XP chính thức sẽ có sau quyết định CTSV.</p>
                    </aside>
                    <footer className="v2-report-editor-footer">
                        <div>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={busy || stage === 0}
                                onClick={() => navigateStep(stage - 1)}
                            >
                                <ArrowLeft size={16} /> Quay lại
                            </button>
                            {stage < 3 && (
                                <button type="submit" className="v2-button v2-button--primary" disabled={busy}>
                                    Tiếp tục <ArrowRight size={16} />
                                </button>
                            )}
                        </div>
                        <div>
                            <button type="button" className="v2-button" onClick={exportDraft}>
                                Xuất hồ sơ nháp
                            </button>
                            <button type="button" className="v2-button" disabled={busy} onClick={() => save(false)}>
                                <Save size={16} /> Lưu hồ sơ
                            </button>
                            {stage === 3 && (
                                <button
                                    type="submit"
                                    className="v2-button v2-button--primary"
                                    disabled={busy || !canSubmit}
                                >
                                    <Send size={16} /> {busy ? 'Đang xử lý…' : 'Gửi CTSV duyệt kế hoạch'}
                                </button>
                            )}
                        </div>
                    </footer>
                </form>
            )}
        </div>
    );
}
