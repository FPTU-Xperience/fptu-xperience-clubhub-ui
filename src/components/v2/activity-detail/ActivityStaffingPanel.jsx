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
    useEffect(() => {
        let active = true;
        setLoading(true);
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
    }, [api, activityId, retry]);
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
        manager || data.capabilities?.canVerify === true
            ? data.assignments
            : data.assignments.filter(
                  (assignment) =>
                      assignment.userId != null && user?.id != null && String(assignment.userId) === String(user.id),
              );
    const caps = data.capabilities || {};
    const approved = data.applicationStatus === 'APPROVED';
    const recruitment = data.recruitment;
    const canRecruit = manager && !readOnly && approved && caps.canManageRecruitment === true;
    const canAssign = manager && !readOnly && approved && caps.canManageAssignments === true;
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
            {error && !editing && !assigning && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            {mode === 'assignments' ? (
                <>
                    {!manager && !caps.canVerify && <p>Chỉ hiển thị phân công và lượt thực hiện của bạn.</p>}
                    {!assignments.length ? (
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
                                                    <span>
                                                        {completion.occurrenceLabel} · {label(completion.status)}
                                                        {completion.evidence && <p>{completion.evidence}</p>}
                                                    </span>
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
                                    {position.filledCount}/{position.capacity} vị trí đã nhận
                                </p>
                                <p>
                                    {Number.isFinite(position.rawXpPerOccurrence)
                                        ? `${xp(position.rawXpPerOccurrence)} raw Xperience Point/lượt dự kiến`
                                        : 'Tạm hoãn tính điểm; nhận vị trí không phát sinh điểm.'}
                                </p>
                                {position.myAssignmentId ? (
                                    <p className="v2-staffing-notice">Bạn đã nhận vị trí này.</p>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            className="v2-button v2-button--primary"
                                            disabled={
                                                readOnly ||
                                                busy ||
                                                !approved ||
                                                recruitment.status !== 'OPEN' ||
                                                position.canJoin !== true
                                            }
                                            onClick={() =>
                                                mutate(
                                                    `recruitment/positions/${encodeURIComponent(position.id)}/join`,
                                                    { expectedVersion: data.version },
                                                    'Đã nhận vị trí và tạo phân công; chưa có Xperience Point chính thức.',
                                                )
                                            }
                                        >
                                            Tham gia vị trí
                                        </button>
                                        {position.joinBlockReason && <p>{position.joinBlockReason}</p>}
                                    </>
                                )}
                            </article>
                        ))}
                    </div>
                </>
            )}
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
                    title="Nộp minh chứng lượt thực hiện"
                    onClose={() => {
                        if (!busy) setSubmitting(null);
                    }}
                >
                    <form
                        className="v2-staffing-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const fields = Object.fromEntries(new FormData(event.currentTarget));
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
                        <fieldset disabled={busy}>
                            <StaffingField label="Mã lượt thực hiện">
                                <input name="occurrenceKey" required maxLength={80} placeholder="Ví dụ: buoi-1" />
                            </StaffingField>
                            <StaffingField label="Tên lượt thực hiện">
                                <input name="occurrenceLabel" required maxLength={200} />
                            </StaffingField>
                            <StaffingField label="Minh chứng">
                                <textarea name="evidence" required maxLength={4000} />
                            </StaffingField>
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
