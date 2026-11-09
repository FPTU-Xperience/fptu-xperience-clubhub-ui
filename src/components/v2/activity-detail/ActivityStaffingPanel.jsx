import { Children, cloneElement, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import PageState from '../PageState';
import V2Modal from '../common/modal/V2Modal';
import {
    getActivityStaffing,
    mutateActivityStaffing,
    recruitmentPayload,
    staffingError,
    validateStaffingMutationReceipt,
} from '../../../services/activity-staffing';
import './ActivityStaffingPanel.scss';

const label = (status) =>
    ({
        ASSIGNED: 'Đã phân công',
        ACTIVE: 'Đang thực hiện',
        REMOVED: 'Đã gỡ',
        COMPLETED: 'Hoàn thành',
        PENDING: 'Chờ xác nhận',
        VERIFIED: 'Đã xác nhận',
        REJECTED: 'Cần sửa',
        DRAFT: 'Bản nháp',
        OPEN: 'Đang tuyển',
        CLOSED: 'Đã đóng',
    })[status] || status;
const xp = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);

function StaffingField({ label, children }) {
    const id = useId();
    return (
        <div className="v2-staffing-field">
            <label htmlFor={id}>{label}</label>
            {cloneElement(Children.toArray(children).find(isValidElement), { id })}
        </div>
    );
}

function RecruitmentEditor({ data, busy, error, onClose, onSave }) {
    const recruitment = data.recruitment;
    const [draft, setDraft] = useState(() => ({
        title: recruitment?.title || 'Tuyển nhân sự hoạt động',
        description: recruitment?.description || '',
        visibility: recruitment?.visibility || 'PUBLIC',
        eligibility: recruitment?.eligibility || 'SCHOOL_STUDENTS',
        positions: data.actions.map((action) => {
            const old = recruitment?.positions.find((position) => String(position.actionRuleId) === String(action.id));
            return {
                actionRuleId: action.id,
                selected: Boolean(old),
                capacity: old?.capacity || action.expectedPeople || 1,
                assignmentKind: old?.assignmentKind || 'STAFF',
            };
        }),
    }));
    const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
    return (
        <V2Modal
            title={recruitment ? 'Chỉnh sửa tuyển dụng' : 'Tạo nhiệm vụ tuyển dụng'}
            wide
            onClose={() => !busy && onClose()}
        >
            <form
                className="v2-staffing-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    onSave(draft);
                }}
            >
                <fieldset disabled={busy}>
                    <StaffingField label={<> Tên nhiệm vụ </>}>
                        {' '}
                        <input
                            value={draft.title}
                            maxLength={120}
                            required
                            onChange={(event) => change('title', event.target.value)}
                        />{' '}
                    </StaffingField>
                    <StaffingField label={<> Mô tả </>}>
                        {' '}
                        <textarea
                            value={draft.description}
                            maxLength={2000}
                            rows={4}
                            onChange={(event) => change('description', event.target.value)}
                        />{' '}
                    </StaffingField>
                    <div className="v2-staffing-form-grid">
                        <StaffingField label={<> Hiển thị </>}>
                            {' '}
                            <select
                                value={draft.visibility}
                                onChange={(event) =>
                                    setDraft((current) => ({
                                        ...current,
                                        visibility: event.target.value,
                                        eligibility:
                                            event.target.value === 'PRIVATE' ? 'CLUB_MEMBERS' : current.eligibility,
                                    }))
                                }
                            >
                                <option value="PUBLIC">Công khai</option>
                                <option value="PRIVATE">Riêng tư trong CLB</option>
                            </select>{' '}
                        </StaffingField>
                        <StaffingField label={<> Đối tượng tham gia </>}>
                            {' '}
                            <select
                                value={draft.eligibility}
                                onChange={(event) => change('eligibility', event.target.value)}
                            >
                                {draft.visibility === 'PUBLIC' && (
                                    <option value="SCHOOL_STUDENTS">Sinh viên trường</option>
                                )}
                                <option value="CLUB_MEMBERS">Thành viên CLB</option>
                            </select>{' '}
                        </StaffingField>
                    </div>
                    <h3>Vị trí theo action đã duyệt</h3>
                    {draft.positions.map((position, index) => (
                        <div className="v2-staffing-position-editor" key={position.actionRuleId}>
                            <label className="v2-staffing-checkbox">
                                <input
                                    type="checkbox"
                                    checked={position.selected}
                                    onChange={(event) =>
                                        change(
                                            'positions',
                                            draft.positions.map((row, i) =>
                                                i === index ? { ...row, selected: event.target.checked } : row,
                                            ),
                                        )
                                    }
                                />
                                {data.actions[index].name}
                            </label>
                            {position.selected && (
                                <div className="v2-staffing-form-grid">
                                    <StaffingField label={<> Số vị trí · {data.actions[index].name} </>}>
                                        {' '}
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            required
                                            value={position.capacity}
                                            onChange={(event) =>
                                                change(
                                                    'positions',
                                                    draft.positions.map((row, i) =>
                                                        i === index ? { ...row, capacity: event.target.value } : row,
                                                    ),
                                                )
                                            }
                                        />{' '}
                                    </StaffingField>
                                    <StaffingField label={<> Phân công · {data.actions[index].name} </>}>
                                        {' '}
                                        <select
                                            value={position.assignmentKind}
                                            onChange={(event) =>
                                                change(
                                                    'positions',
                                                    draft.positions.map((row, i) =>
                                                        i === index
                                                            ? { ...row, assignmentKind: event.target.value }
                                                            : row,
                                                    ),
                                                )
                                            }
                                        >
                                            <option value="STAFF">Staff hỗ trợ</option>
                                            <option value="HOST">Host hoạt động</option>
                                        </select>{' '}
                                    </StaffingField>
                                </div>
                            )}
                        </div>
                    ))}
                    <p>
                        Nhiệm vụ này dùng chung với tab Nhiệm vụ & đóng góp của CLB. Nhận vị trí chưa đồng nghĩa hoàn
                        thành hoặc nhận Xperience Point.
                    </p>
                    {error && <p role="alert">{error}</p>}
                    <footer>
                        <button type="button" className="v2-button" onClick={onClose}>
                            Hủy
                        </button>
                        <button className="v2-button v2-button--primary">{busy ? 'Đang lưu…' : 'Lưu nhiệm vụ'}</button>
                    </footer>
                </fieldset>
            </form>
        </V2Modal>
    );
}

export default function ActivityStaffingPanel({
    activityId,
    mode = 'recruitment',
    manager = false,
    readOnly = false,
    onChanged,
}) {
    const { api, user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [submitting, setSubmitting] = useState(null);
    const [reviewing, setReviewing] = useState(null);
    const [retry, setRetry] = useState(0);
    const [notice, setNotice] = useState('');
    const lock = useRef(false);
    const keys = useRef(new Map());
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => { setNotice(''); }, [api, activityId, mode, user?.id]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setData(null);
        setEditing(false);
        setAssigning(false);
        setSubmitting(null);
        setReviewing(null);
        setError('');
        getActivityStaffing(api, activityId)
            .then((value) => {
                if (active) setData(value);
            })
            .catch((issue) => {
                if (active) {
                    setData(null);
                    setError(staffingError(issue));
                }
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [api, activityId, mode, user?.id, retry]);
    const mutate = async (path, body, success, method = 'POST') => {
        if (lock.current || readOnly) return;
        lock.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        const fingerprint = `${path}:${JSON.stringify(body)}`;
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        try {
            const receipt = await mutateActivityStaffing(
                api,
                activityId,
                path,
                body,
                keys.current.get(fingerprint),
                method,
            );
            validateStaffingMutationReceipt(receipt, activityId, data.version);
            if (!alive.current) return;
            keys.current.delete(fingerprint);
            setNotice(success);
            setEditing(false);
            setAssigning(false);
            setSubmitting(null);
            setReviewing(null);
            setRetry((value) => value + 1);
            onChanged?.();
        } catch (issue) {
            if (alive.current) setError(staffingError(issue));
        } finally {
            lock.current = false;
            if (alive.current) setBusy(false);
        }
    };
    if (loading) return <PageState status="loading" />;
    if (!data) return <PageState status="error" description={error} onRetry={() => setRetry((value) => value + 1)} />;
    const assignments =
        manager || data.capabilities?.canManageAssignments === true || data.capabilities?.canVerify === true
            ? data.assignments
            : data.assignments.filter(
                  (assignment) =>
                      assignment.userId != null && user?.id != null && String(assignment.userId) === String(user.id),
              );
    const caps = data.capabilities || {};
    const approved = data.applicationStatus === 'APPROVED';
    const recruitment = data.recruitment;
    const canRecruit = !readOnly && approved && caps.canManageRecruitment === true;
    const canAssign = !readOnly && approved && caps.canManageAssignments === true;
    const canReview = !readOnly && approved && caps.canReviewApplications === true;
    const publicAssignments = (data.publicAssignments || []).filter(
        (row) => !assignments.some((own) => own.id === row.id),
    );
    return (
        <section className="v2-activity-staffing">
            <header>
                <div>
                    <h2>{mode === 'assignments' ? 'Phân công hoạt động' : 'Tuyển dụng nhân sự'}</h2>
                    <p>
                        {mode === 'assignments'
                            ? 'Theo dõi host, staff và phần việc gắn với từng action.'
                            : 'Một nhiệm vụ tuyển dụng dùng chung với Nhiệm vụ & đóng góp của CLB.'}
                    </p>
                </div>
                {mode === 'assignments' && canAssign && (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={busy}
                        onClick={() => setAssigning(true)}
                    >
                        Thêm phân công
                    </button>
                )}
                {mode === 'recruitment' && canRecruit && (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={busy}
                        onClick={() => setEditing(true)}
                    >
                        {recruitment ? 'Chỉnh sửa tuyển dụng' : 'Tạo nhiệm vụ tuyển dụng'}
                    </button>
                )}
            </header>
            {!approved && (
                <p className="v2-staffing-notice">
                    Kế hoạch cần được CTSV duyệt trước khi phân công hoặc mở tuyển nhân sự.
                </p>
            )}
            <p className="v2-staffing-notice">
                {data.scoringStatus === 'DEFERRED_BY_PRODUCT_OWNER'
                    ? 'Tính điểm đang tạm hoãn. Phân công và xác minh hoàn thành không cộng Xperience Point.'
                    : 'Nhận việc chưa được ghi nhận Xperience Point.'}
            </p>
            {error && !editing && !assigning && !reviewing && !submitting && <div><p role="alert">{error}</p><button type="button" className="v2-button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>Tải lại dữ liệu</button></div>}
            {notice && <p role="status">{notice}</p>}
            {mode === 'assignments' ? (
                <>
                    {!manager && !caps.canVerify && <p>Danh sách host/staff của hoạt động. Minh chứng chỉ hiển thị cho chủ sở hữu và người có quyền xác minh.</p>}
                    {publicAssignments.length > 0 && <div className="v2-staffing-assignment-list">
                        {publicAssignments.map((row) => <article key={row.id}>
                            <h3>{row.displayName}</h3><p>{row.assignmentKind === 'HOST' ? 'Host' : 'Staff'} · {row.actionName}</p>
                        </article>)}
                    </div>}
                    {!assignments.length && !publicAssignments.length ? (
                        <PageState status="empty" title="Chưa có phân công" />
                    ) : (
                        <div className="v2-staffing-assignment-list">
                            {assignments.map((assignment) => (
                                <article key={assignment.id}>
                                    <div className="v2-staffing-row">
                                        <div>
                                            <h3>{assignment.displayName}</h3>
                                            <p>
                                                {assignment.assignmentKind === 'HOST' ? 'Host' : 'Staff'} ·{' '}
                                                {assignment.actionName}
                                            </p>
                                            <span>{label(assignment.status)}</span>
                                        </div>
                                        {canAssign && assignment.canRemove === true && (
                                            <button
                                                type="button"
                                                className="v2-button"
                                                disabled={busy}
                                                onClick={() =>
                                                    mutate(
                                                        `assignments/${encodeURIComponent(assignment.id)}/cancel`,
                                                        { expectedVersion: data.version },
                                                        'Đã gỡ phân công.',
                                                    )
                                                }
                                            >
                                                Gỡ phân công
                                            </button>
                                        )}
                                    </div>
                                    <div className="v2-staffing-metrics">
                                        <span>{assignment.verifiedOccurrences ?? 0} lượt đã xác minh</span>
                                        {Number.isFinite(assignment.pendingRawXp) && (
                                            <span>{xp(assignment.pendingRawXp)} raw Xperience Point chờ duyệt</span>
                                        )}
                                    </div>
                                    {!readOnly &&
                                        !busy &&
                                        data.isPublished &&
                                        assignment.canSubmit === true &&
                                        assignment.status !== 'REMOVED' &&
                                        String(assignment.userId) === String(user?.id) && (
                                            <button
                                                className="v2-button"
                                                type="button"
                                                onClick={() => {
                                                    setSubmitting(assignment);
                                                    setError('');
                                                }}
                                            >
                                                Nộp minh chứng lượt thực hiện
                                            </button>
                                        )}
                                    {assignment.completions?.length > 0 && (
                                        <details>
                                            <summary>Lượt thực hiện ({assignment.completions.length})</summary>
                                            {assignment.completions.map((completion) => (
                                                <div className="v2-staffing-row" key={completion.id}>
                                                    <div>
                                                        {completion.occurrenceLabel} · {label(completion.status)}
                                                        {completion.evidence && <p>{completion.evidence}</p>}
                                                        {completion.resources?.filter((resource) => /^https?:\/\//i.test(resource.url)).map((resource) => <p key={resource.id}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a></p>)}
                                                    </div>
                                                    {!readOnly &&
                                                        approved &&
                                                        user?.id != null &&
                                                        String(assignment.userId) !== String(user.id) &&
                                                        caps.canVerify === true &&
                                                        completion.canVerify === true && (
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                className="v2-button"
                                                                onClick={() =>
                                                                    mutate(
                                                                        `action-completions/${encodeURIComponent(completion.id)}/verify`,
                                                                        {
                                                                            expectedVersion: data.version,
                                                                            completionVersion: completion.version,
                                                                        },
                                                                        'Đã xác minh lượt thực hiện; chưa cộng Xperience Point.',
                                                                    )
                                                                }
                                                            >
                                                                Xác minh hoàn thành
                                                            </button>
                                                        )}
                                                </div>
                                            ))}
                                        </details>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </>
            ) : !recruitment ? (
                <PageState status="empty" title="Chưa có nhiệm vụ tuyển dụng" />
            ) : (
                <>
                    <div className="v2-staffing-recruitment-heading">
                        <h3>{recruitment.title}</h3>
                        <span>
                            {label(recruitment.status)} ·{' '}
                            {recruitment.visibility === 'PRIVATE' ? 'Riêng tư trong CLB' : 'Công khai'} ·{' '}
                            {recruitment.eligibility === 'CLUB_MEMBERS' ? 'Thành viên CLB' : 'Sinh viên trường'}
                        </span>
                        <p>{recruitment.description}</p>
                    </div>
                    {canRecruit && (
                        <div className="v2-staffing-toolbar">
                            {recruitment.status !== 'OPEN' && canRecruit && data.isPublished && (
                                <button
                                    className="v2-button"
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                        mutate(
                                            'recruitment/status',
                                            { status: 'OPEN', expectedVersion: data.version },
                                            'Đã mở tuyển nhân sự.',
                                            'PATCH',
                                        )
                                    }
                                >
                                    Mở tuyển dụng
                                </button>
                            )}
                            {recruitment.status === 'OPEN' && (
                                <button
                                    className="v2-button"
                                    type="button"
                                    disabled={busy}
                                    onClick={() =>
                                        mutate(
                                            'recruitment/status',
                                            { status: 'CLOSED', expectedVersion: data.version },
                                            'Đã đóng tuyển nhân sự.',
                                            'PATCH',
                                        )
                                    }
                                >
                                    Đóng tuyển dụng
                                </button>
                            )}
                        </div>
                    )}
                    <div className="v2-staffing-positions">
                        {recruitment.positions.map((position) => (
                            <article key={position.id}>
                                <h3>{position.actionName}</h3>
                                <p>
                                    {position.assignmentKind === 'HOST' ? 'Host' : 'Staff hỗ trợ'} ·{' '}
                                    {position.filledCount}/{position.capacity} vị trí đã duyệt
                                </p>
                                <p>
                                    {Number.isFinite(position.rawXpPerOccurrence)
                                        ? `${xp(position.rawXpPerOccurrence)} raw Xperience Point/lượt dự kiến`
                                        : 'Tạm hoãn tính điểm; nhận vị trí không phát sinh điểm.'}
                                </p>
                                {position.myAssignmentId ? (
                                    <p className="v2-staffing-notice">Bạn đã nhận vị trí này.</p>
                                ) : position.myApplication?.status === 'PENDING' ? (
                                    <p role="status">Đơn của bạn đang chờ duyệt. Chưa có phân công hoặc Xperience Point.</p>
                                ) : (
                                    <>
                                        {position.myApplication?.status === 'REJECTED' && <p>Đơn chưa được duyệt: {position.myApplication.reason}</p>}
                                        <button
                                            type="button"
                                            className="v2-button v2-button--primary"
                                            disabled={
                                                readOnly ||
                                                busy ||
                                                !approved ||
                                                recruitment.applicationWorkflow !== 'APPROVAL_REQUIRED_V1' ||
                                                recruitment.status !== 'OPEN' ||
                                                position.canJoin !== true
                                            }
                                            onClick={() =>
                                                mutate(
                                                    `recruitment/positions/${encodeURIComponent(position.id)}/join`,
                                                    { expectedVersion: data.version },
                                                    'Đã gửi đơn chờ duyệt. Phân công chỉ được tạo sau khi đơn được duyệt; chưa cộng Xperience Point.',
                                                )
                                            }
                                        >
                                            {position.myApplication?.status === 'REJECTED' ? 'Gửi lại đơn' : 'Đăng ký vị trí'}
                                        </button>
                                        {position.joinBlockReason && <p>{position.joinBlockReason}</p>}
                                        {recruitment.applicationWorkflow !== 'APPROVAL_REQUIRED_V1' && <p>Máy chủ chưa hỗ trợ đăng ký chờ duyệt.</p>}
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                    {(data.applications || []).length > 0 && <section>
                        <h3>{canReview ? 'Đơn đăng ký nhân sự' : 'Đơn đăng ký của bạn'}</h3>
                        <div className="v2-staffing-assignment-list">
                            {data.applications.map((application) => <article key={application.id}>
                                <h4>{application.displayName}</h4>
                                <p>{recruitment.positions.find((position) => position.id === application.positionId)?.actionName || 'Vị trí đã lưu'} · {({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' })[application.status]}</p>
                                {application.reason && <p>Lý do: {application.reason}</p>}
                                {canReview && application.canReview === true && <button type="button" className="v2-button" disabled={busy} onClick={() => { setReviewing(application); setError(''); }}>Duyệt đơn</button>}
                            </article>)}
                        </div>
                    </section>}
                </>
            )}
            {reviewing && <V2Modal title="Duyệt đơn đăng ký nhân sự" onClose={() => !busy && setReviewing(null)}>
                <form className="v2-staffing-form" onSubmit={(event) => {
                    event.preventDefault();
                    const fields = Object.fromEntries(new FormData(event.currentTarget));
                    mutate(`recruitment/applications/${encodeURIComponent(reviewing.id)}/review`,
                        { ...fields, expectedVersion: data.version, applicationVersion: reviewing.version },
                        fields.decision === 'APPROVED' ? 'Đã duyệt đơn và tạo phân công. Chưa cộng Xperience Point.' : 'Đã từ chối đơn.');
                }}>
                    <p>{reviewing.displayName} · {recruitment?.positions.find((position) => position.id === reviewing.positionId)?.actionName}</p>
                    <p>Máy chủ kiểm tra lại quyền duyệt, điều kiện ứng viên và số chỗ. Duyệt đơn tạo phân công; hoàn thành và XP cần quy trình riêng.</p>
                    <fieldset disabled={busy}>
                        <StaffingField label="Quyết định"><select name="decision" required><option value="APPROVED">Duyệt</option><option value="REJECTED">Từ chối</option></select></StaffingField>
                        <StaffingField label="Lý do (bắt buộc khi từ chối)"><textarea name="reason" maxLength={2000} rows={3} /></StaffingField>
                        {error && <><p role="alert">{error}</p><button type="button" className="v2-button" onClick={() => setRetry((value) => value + 1)}>Tải lại dữ liệu</button></>}
                        <button className="v2-button v2-button--primary">{busy ? 'Đang lưu…' : 'Xác nhận quyết định'}</button>
                    </fieldset>
                </form>
            </V2Modal>}
            {editing && (
                <RecruitmentEditor
                    data={data}
                    busy={busy}
                    error={error}
                    onClose={() => {
                        setEditing(false);
                        setError('');
                    }}
                    onSave={(draft) => {
                        try {
                            const body = recruitmentPayload(draft, data.actions);
                            mutate(
                                'recruitment',
                                { ...body, expectedVersion: data.version },
                                'Đã lưu nhiệm vụ tuyển dụng.',
                                recruitment ? 'PATCH' : 'POST',
                            );
                        } catch (issue) {
                            setError(issue.message);
                        }
                    }}
                />
            )}
            {assigning && (
                <V2Modal title="Thêm phân công" onClose={() => !busy && setAssigning(false)}>
                    <form
                        className="v2-staffing-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const values = Object.fromEntries(new FormData(event.currentTarget));
                            if (
                                !data.eligibleAssignees?.some((person) => String(person.userId) === values.userId) ||
                                !data.actions.some((action) => String(action.id) === values.actionRuleId)
                            ) {
                                setError('Chọn người và action hợp lệ.');
                                return;
                            }
                            mutate(
                                'assignments',
                                {
                                    ...values,
                                    userId: Number(values.userId),
                                    actionRuleId: Number(values.actionRuleId),
                                    expectedVersion: data.version,
                                },
                                'Đã tạo phân công.',
                            );
                        }}
                    >
                        <fieldset disabled={busy}>
                            <StaffingField label={<> Người được phân công </>}>
                                {' '}
                                <select name="userId" required defaultValue="">
                                    <option value="" disabled>
                                        Chọn người đủ điều kiện
                                    </option>
                                    {data.eligibleAssignees?.map((person) => (
                                        <option key={person.userId} value={person.userId}>
                                            {person.displayName}
                                        </option>
                                    ))}
                                </select>{' '}
                            </StaffingField>
                            {!data.eligibleAssignees?.length && <p>Chưa có người đủ điều kiện.</p>}
                            <StaffingField label={<> Action </>}>
                                {' '}
                                <select name="actionRuleId" required defaultValue="">
                                    <option value="" disabled>
                                        Chọn action đã duyệt
                                    </option>
                                    {data.actions.map((action) => (
                                        <option key={action.id} value={action.id}>
                                            {action.name}
                                        </option>
                                    ))}
                                </select>{' '}
                            </StaffingField>
                            <StaffingField label={<> Loại phân công </>}>
                                {' '}
                                <select name="assignmentKind">
                                    <option value="STAFF">Staff hỗ trợ</option>
                                    <option value="HOST">Host hoạt động</option>
                                </select>{' '}
                            </StaffingField>
                            {error && <p role="alert">{error}</p>}
                            <footer>
                                <button type="button" className="v2-button" onClick={() => setAssigning(false)}>
                                    Hủy
                                </button>
                                <button
                                    className="v2-button v2-button--primary"
                                    disabled={!data.eligibleAssignees?.length}
                                >
                                    Tạo phân công
                                </button>
                            </footer>
                        </fieldset>
                    </form>
                </V2Modal>
            )}
            {submitting && (
                <V2Modal
                    title="Minh chứng thực hiện"
                    onClose={() => {
                        if (!busy) setSubmitting(null);
                    }}
                >
                    <form
                        className="v2-staffing-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const form = new FormData(event.currentTarget);
                            const fields = Object.fromEntries(form);
                            fields.resourceIds = form.getAll('resourceIds');
                            const action = data.actions.find(
                                (row) => String(row.id) === String(submitting.actionRuleId),
                            );
                            if (!['ATTENDANCE', 'WORK_REVIEW'].includes(action?.verificationMethod)) {
                                setError('Nguồn action không hợp lệ.');
                                return;
                            }
                            mutate(
                                `assignments/${encodeURIComponent(submitting.id)}/${action.verificationMethod === 'ATTENDANCE' ? 'attendance-claims' : 'completions'}`,
                                { ...fields, expectedVersion: data.version },
                                'Đã nộp minh chứng để xác minh độc lập; chưa cộng XP.',
                            );
                        }}
                    >
                        <h3>{submitting.actionName}</h3>
                        <p>{submitting.displayName} · {submitting.assignmentKind === 'HOST' ? 'Host' : 'Staff'}</p>
                        <p>Phân công: {label(submitting.status)}. Gửi minh chứng tạo lượt chờ xác minh; chưa hoàn thành hoặc nhận XP.</p>
                        {submitting.completions?.length > 0 && <details><summary>Lượt đã gửi</summary>{submitting.completions.map((row) => <p key={row.id}>{row.occurrenceLabel} · {label(row.status)}</p>)}</details>}
                        <fieldset disabled={busy}>
                            <StaffingField label="Mã lượt thực hiện">
                                <input name="occurrenceKey" required maxLength={80} placeholder="Ví dụ: buoi-1" />
                            </StaffingField>
                            <StaffingField label="Tên lượt thực hiện">
                                <input name="occurrenceLabel" required maxLength={200} />
                            </StaffingField>
                            <StaffingField label="Minh chứng">
                                <textarea name="evidence" required maxLength={4000} rows={5} placeholder="Công việc đã làm, kết quả, đường dẫn tài nguyên để đối chiếu" />
                            </StaffingField>
                            {data.availableEvidenceResources?.length > 0 && <fieldset><legend>Đính kèm tài nguyên hoạt động (tối đa 10)</legend>
                                {data.availableEvidenceResources.map((resource) => <label className="v2-staffing-checkbox" key={resource.id}>
                                    <input type="checkbox" name="resourceIds" value={resource.id} />{resource.title}
                                </label>)}
                            </fieldset>}
                            <p>Chọn tài nguyên đã lưu của hoạt động hoặc ghi đường dẫn đối chiếu trong nội dung minh chứng.</p>
                            <p>
                                ATTENDANCE là khai báo thủ công có minh chứng, cần người có quyền xác minh độc lập;
                                không thay cho QR check-in.
                            </p>
                            {error && <p role="alert">{error}</p>}
                            <button className="v2-button v2-button--primary">Gửi xác minh</button>
                        </fieldset>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
