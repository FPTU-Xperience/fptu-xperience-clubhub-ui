import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import V2Modal from '../common/modal/V2Modal';
import ActivityBooking from './ActivityBooking';
import {
    attendanceError,
    localSessionDate,
    sessionDate,
    sessionMutation,
    sessionPayload,
    sessionStatus,
    validateSessionMutation,
    validateManualAttendance,
    validateSessions,
    validateAttendanceRoster,
} from '../../../services/activity-sessions';
import { formatAttendanceStatus } from '../../../locales/vi';
import { AttendanceQrDisplay } from './AttendanceQr';
import './ActivitySessions.scss';

function SessionForm({ activity, session, busy, error, onSave }) {
    const policy = session?.attendancePolicy;
    const [draft, setDraft] = useState(() => ({
        startAt: localSessionDate(session?.startTime || activity.startTime),
        endAt: localSessionDate(session?.endTime || activity.endTime),
        opensAt: localSessionDate(policy?.opensAt),
        closesAt: localSessionDate(policy?.closesAt),
        location: session?.location || activity.location || '',
        mode: session?.mode || '',
        manualConfirmationEnabled: policy?.manualConfirmationEnabled === true,
        latitude: policy?.geofence?.latitude ?? '',
        longitude: policy?.geofence?.longitude ?? '',
        radiusMeters: policy?.geofence?.radiusMeters ?? '',
    }));
    const change = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
    return (
        <form
            className="v2-session-form"
            onSubmit={(event) => {
                event.preventDefault();
                onSave(draft);
            }}
        >
            <fieldset disabled={busy}>
                <p>
                    Thời gian theo giờ Việt Nam. Cửa sổ điểm danh cần nằm trong phiên và phiên phải nằm trong hoạt động.
                </p>
                <div className="v2-session-grid">
                    {[
                        ['startAt', 'Bắt đầu phiên'],
                        ['endAt', 'Kết thúc phiên'],
                        ['opensAt', 'Mở điểm danh'],
                        ['closesAt', 'Đóng điểm danh'],
                    ].map(([key, name]) => (
                        <label key={key}>
                            {name}
                            <input
                                type="datetime-local"
                                required
                                value={draft[key]}
                                onChange={(event) => change(key, event.target.value)}
                            />
                        </label>
                    ))}
                </div>
                <label>
                    Địa điểm
                    <input
                        required
                        maxLength={200}
                        value={draft.location}
                        onChange={(event) => change('location', event.target.value)}
                    />
                </label>
                <label>
                    Hình thức
                    <select
                        aria-label="Hình thức"
                        value={draft.mode}
                        required
                        onChange={(event) => change('mode', event.target.value)}
                    >
                        <option value="">Chọn hình thức</option>
                        <option value="ONLINE">Trực tuyến</option>
                        <option value="ONSITE">Trực tiếp</option>
                    </select>
                </label>
                {draft.mode === 'ONSITE' && (
                    <div className="v2-session-grid">
                        {[
                            ['latitude', 'Vĩ độ'],
                            ['longitude', 'Kinh độ'],
                            ['radiusMeters', 'Bán kính (m)'],
                        ].map(([key, name]) => (
                            <label key={key}>
                                {name}
                                <input
                                    type="number"
                                    step="any"
                                    required
                                    value={draft[key]}
                                    onChange={(event) => change(key, event.target.value)}
                                />
                            </label>
                        ))}
                    </div>
                )}
                <label>
                    <span>
                        <input
                            type="checkbox"
                            checked={draft.manualConfirmationEnabled}
                            onChange={(event) => change('manualConfirmationEnabled', event.target.checked)}
                        />{' '}
                        Cho phép người có quyền xác minh điểm danh thủ công
                    </span>
                </label>
                <p>Mã xác thực máy chủ có hiệu lực 30 giây. Điểm danh và ghi nhận điểm được xử lý riêng.</p>
                {error && <p role="alert">{error}</p>}
                <button className="v2-button v2-button--primary">{busy ? 'Đang lưu…' : 'Lưu phiên'}</button>
            </fieldset>
        </form>
    );
}

function SessionRoster({ activity, session, revision }) {
    const { api, user } = useAuth();
    const registeredUsers = activity.isInternal === false;
    const endpoint = registeredUsers
        ? `/api/clubs/${encodeURIComponent(activity.clubId)}/activities/${encodeURIComponent(activity.id)}/sessions/${session.id}/registered-attendance`
        : `/api/clubs/${encodeURIComponent(activity.clubId)}/activities/${encodeURIComponent(activity.id)}/attendance`;
    const [page, setPage] = useState(1),
        [search, setSearch] = useState(''),
        [retry, setRetry] = useState(0),
        [state, setState] = useState({});
    const [editing, setEditing] = useState(null),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    const generation = useRef(0),
        lock = useRef(false),
        keys = useRef(new Map());
    useEffect(() => {
        const ticket = ++generation.current;
        setState({});
        setEditing(null);
        setError('');
        setBusy(false);
        lock.current = false;
        const query = new URLSearchParams({ sessionId: session.id, page, pageSize: 20, search });
        api.request(
            `${endpoint}?${query}`,
        )
            .then((data) => {
                if (generation.current !== ticket) return;
                setState({ data: validateAttendanceRoster(data, activity.id, session.id, registeredUsers) });
            })
            .catch((issue) => {
                if (generation.current === ticket) setState({ error: issue });
            });
        return () => {
            generation.current++;
        };
    }, [api, user?.id, activity.id, activity.clubId, session.id, session.version, page, search, retry, revision, endpoint, registeredUsers]);
    const save = async (event) => {
        event.preventDefault();
        if (lock.current) return;
        const fields = Object.fromEntries(new FormData(event.currentTarget));
        const body = {
            ...(!registeredUsers && { sessionId: session.id }),
            expectedSessionVersion: state.data.sessionVersion,
            reason: fields.reason.trim(),
            items: [
                {
                    ...(registeredUsers ? { userId: editing.userId } : { memberId: editing.memberId }),
                    status: fields.status,
                    note: fields.note.trim() || null,
                    expectedVersion: editing.attendance?.version ?? null,
                },
            ],
        };
        if (
            !body.reason ||
            !(
                (editing.canMarkPresent === true && ['Present', 'Late'].includes(fields.status)) ||
                (editing.canMarkAbsent === true && ['Absent', 'Excused'].includes(fields.status))
            )
        ) {
            setError('Chọn trạng thái đang được máy chủ cho phép và nhập lý do.');
            return;
        }
        const fingerprint = JSON.stringify(body),
            ticket = generation.current;
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const result = await api.request(
                endpoint,
                {
                    method: 'PUT',
                    headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                    body: JSON.stringify(body),
                },
            );
            validateManualAttendance(result, activity.id, session.id, fields.status, editing.attendance?.attendanceId);
            if (generation.current !== ticket) return;
            keys.current.delete(fingerprint);
            setNotice('Đã lưu trạng thái điểm danh. Ghi nhận điểm được xử lý riêng.');
            setBusy(false);
            setRetry((value) => value + 1);
        } catch (issue) {
            if (generation.current === ticket) setError(attendanceError(issue));
        } finally {
            if (generation.current === ticket) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    return (
        <section>
            <h3>{registeredUsers ? 'Điểm danh người đã đăng ký theo phiên' : 'Điểm danh thành viên CLB theo phiên'}</h3>
            <p>
                {registeredUsers ? 'Danh sách này gồm người đang đăng ký sự kiện công khai.' : 'Danh sách này theo danh sách thành viên CLB.'} Xác minh thủ công cần quyền riêng; không được tự xác minh
                hoặc sửa lượt đã xác minh.
            </p>
            <label>
                Tìm thành viên
                <input
                    value={search}
                    disabled={busy}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setPage(1);
                    }}
                />
            </label>
            {notice && <p role="status">{notice}</p>}
            {state.error ? (
                <p role="alert">{attendanceError(state.error)}</p>
            ) : !state.data ? (
                <p role="status">Đang tải điểm danh phiên…</p>
            ) : (
                <>
                    <p>
                        {state.data.verifiedCount} lượt đã xác minh · {state.data.totalItems} thành viên
                    </p>
                    {state.data.capabilities?.canVerify !== true && (
                        <p>Bạn đang xem danh sách; chưa có quyền xác minh điểm danh thủ công.</p>
                    )}
                    <div className="v2-session-list">
                        {state.data.items.map((row) => (
                            <article key={row.userId}>
                                <h4>{row.fullName}</h4>
                                <p>
                                    {row.attendance
                                        ? formatAttendanceStatus(row.attendance.attendanceStatus)
                                        : 'Chưa đánh dấu'}
                                    {row.attendance?.status === 'VERIFIED' ? ' · Đã xác minh' : ''}
                                </p>
                                {row.isRegistered === false && <p>Chưa đăng ký hoạt động.</p>}
                                {state.data.capabilities?.canVerify === true &&
                                    (row.canMarkPresent === true || row.canMarkAbsent === true) && (
                                        <button
                                            className="v2-button"
                                            disabled={busy}
                                            onClick={() => {
                                                setEditing(row);
                                                setError('');
                                            }}
                                        >
                                            Ghi điểm danh · {row.fullName}
                                        </button>
                                    )}
                            </article>
                        ))}
                    </div>
                    {!state.data.items.length && <p>Không có thành viên phù hợp.</p>}
                    {state.data.totalPages > 1 && (
                        <nav aria-label="Trang điểm danh phiên">
                            <button
                                className="v2-button"
                                disabled={page <= 1 || busy}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                Trước
                            </button>
                            <span>
                                Trang {page}/{state.data.totalPages}
                            </span>
                            <button
                                className="v2-button"
                                disabled={page >= state.data.totalPages || busy}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Sau
                            </button>
                        </nav>
                    )}
                </>
            )}
            <button className="v2-button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>
                Tải lại điểm danh phiên
            </button>
            {editing && (
                <V2Modal title="Ghi điểm danh thủ công" onClose={() => !busy && setEditing(null)}>
                    <form className="v2-session-form" onSubmit={save}>
                        <fieldset disabled={busy}>
                            <p>
                                {editing.fullName} · {sessionDate(session.startTime)}
                            </p>
                            <label>
                                Trạng thái
                                <select name="status" required>
                                    {editing.canMarkPresent && (
                                        <>
                                            <option value="Present">Có mặt</option>
                                            <option value="Late">Đi muộn</option>
                                        </>
                                    )}
                                    {editing.canMarkAbsent && (
                                        <>
                                            <option value="Absent">Vắng mặt</option>
                                            <option value="Excused">Có phép</option>
                                        </>
                                    )}
                                </select>
                            </label>
                            <label>
                                Ghi chú
                                <textarea name="note" maxLength={1000} rows={2} />
                            </label>
                            <label>
                                Lý do xác minh
                                <textarea name="reason" maxLength={1000} required rows={3} />
                            </label>
                            {error && (
                                <>
                                    <p role="alert">{error}</p>
                                    <button
                                        type="button"
                                        className="v2-button"
                                        onClick={() => setRetry((value) => value + 1)}
                                    >
                                        Tải lại dữ liệu
                                    </button>
                                </>
                            )}
                            <button className="v2-button v2-button--primary">
                                {busy ? 'Đang lưu…' : 'Lưu điểm danh'}
                            </button>
                        </fieldset>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}

export default function ActivitySessionManagement({ activity, onChanged }) {
    const { api, user } = useAuth();
    const [state, setState] = useState({}),
        [revision, setRevision] = useState(0),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    const [editing, setEditing] = useState(null),
        [booking, setBooking] = useState(null),
        [decision, setDecision] = useState(null),
        [selected, setSelected] = useState(null),
        [challenge, setChallenge] = useState(null);
    const generation = useRef(0),
        lock = useRef(false),
        keys = useRef(new Map()),
        expiry = useRef(null);
    useEffect(() => {
        setNotice('');
        keys.current.clear();
    }, [api, activity.id, user?.id]);
    useEffect(() => {
        const ticket = ++generation.current;
        setState({});
        setEditing(null);
        setBooking(null);
        setDecision(null);
        setChallenge(null);
        setError('');
        setBusy(false);
        lock.current = false;
        clearTimeout(expiry.current);
        api.request(`/api/activities/${encodeURIComponent(activity.id)}/sessions`)
            .then((value) => {
                if (generation.current === ticket) setState({ data: validateSessions(value, activity.id) });
            })
            .catch((issue) => {
                if (generation.current === ticket) setState({ error: issue });
            });
        return () => {
            generation.current++;
            clearTimeout(expiry.current);
        };
    }, [api, activity.id, user?.id, revision]);
    const mutate = async (path, body, previousVersion, creating = false, method = 'POST', expectedId = null) => {
        if (lock.current) return;
        const ticket = generation.current,
            fingerprint = JSON.stringify([path, body]);
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        lock.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const receipt = validateSessionMutation(
                await sessionMutation(api, activity.id, path, body, keys.current.get(fingerprint), method),
                activity.id,
                previousVersion,
                creating,
            );
            if (expectedId != null && receipt.id !== expectedId)
                throw new Error('Máy chủ xác nhận một phiên khác. Tải lại để đối chiếu.');
            if (generation.current !== ticket) return;
            keys.current.delete(fingerprint);
            setNotice('Đã lưu thay đổi phiên điểm danh.');
            setBusy(false);
            setRevision((value) => value + 1);
            onChanged?.();
        } catch (issue) {
            if (generation.current === ticket) setError(attendanceError(issue));
        } finally {
            if (generation.current === ticket) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    const issueChallenge = async (row) => {
        if (lock.current) return;
        const ticket = generation.current;
        lock.current = true;
        setBusy(true);
        setError('');
        setChallenge(null);
        clearTimeout(expiry.current);
        try {
            const value = await api.request(
                `/api/activities/${encodeURIComponent(activity.id)}/sessions/${row.id}/attendance-challenge`,
            );
            const lifetime = Date.parse(value.expiresAt) - Date.parse(value.serverTime);
            if (
                value.sessionId !== row.id ||
                typeof value.challenge !== 'string' ||
                !value.challenge ||
                !Number.isFinite(lifetime) ||
                lifetime <= 0 ||
                lifetime > 30000
            )
                throw new Error('Máy chủ chưa cấp mã phiên hợp lệ.');
            if (generation.current !== ticket) return;
            setChallenge(value);
            expiry.current = setTimeout(() => setChallenge(null), lifetime);
        } catch (issue) {
            if (generation.current === ticket) setError(attendanceError(issue));
        } finally {
            if (generation.current === ticket) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    const data = state.data;
    const chosen = data?.items.find((row) => row.id === selected);
    return (
        <section className="v2-activity-sessions" aria-label="Quản lý phiên điểm danh">
            <h2>Phiên điểm danh</h2>
            <p>
                Tạo phiên trong khung giờ hoạt động, cấp mã xác thực và xem điểm danh theo phiên. Mỗi thao tác cần quyền
                hiện tại do máy chủ xác nhận.
            </p>
            {notice && <p role="status">{notice}</p>}
            {state.error ? (
                <p role="alert">{attendanceError(state.error)}</p>
            ) : !data ? (
                <p role="status">Đang tải phiên điểm danh…</p>
            ) : (
                <>
                    {data.capabilities?.canCreate === true ? (
                        <button className="v2-button v2-button--primary" disabled={busy} onClick={() => setEditing({})}>
                            Tạo phiên điểm danh
                        </button>
                    ) : (
                        <p>
                            {data.creationBlockReason === 'APPROVED_SCORING_SOURCE_REQUIRED'
                                ? 'Chưa thể tạo phiên: hoạt động cần nguồn và chính sách ghi nhận được máy chủ phê duyệt. Luồng action đang tạm hoãn tính điểm chưa hỗ trợ tạo phiên điểm danh.'
                                : data.creationBlockReason === 'ACTIVITY_LOCKED'
                                  ? 'Hoạt động hiện không cho phép tạo thêm phiên.'
                                  : 'Bạn chưa có quyền tạo phiên hoặc máy chủ chưa cung cấp thao tác này.'}
                        </p>
                    )}
                    {!data.items.length && <p>Chưa có phiên điểm danh.</p>}
                    <div className="v2-session-list">
                        {data.items.map((row) => (
                            <article key={row.id}>
                                <h3>
                                    {sessionDate(row.startTime)} – {sessionDate(row.endTime)}
                                </h3>
                                <p>
                                    {row.location} · {row.mode === 'ONSITE' ? 'Trực tiếp' : 'Trực tuyến'} ·{' '}
                                    {sessionStatus(row.status)}
                                </p>
                                <p>
                                    Mở {sessionDate(row.attendancePolicy?.opensAt)} · Đóng{' '}
                                    {sessionDate(row.attendancePolicy?.closesAt)}
                                </p>
                                <div className="v2-session-actions">
                                    {row.mode === 'ONSITE' && (
                                        <button className="v2-button" disabled={busy} onClick={() => setBooking(row)}>
                                            Đặt địa điểm và thiết bị
                                        </button>
                                    )}
                                    <button
                                        className="v2-button"
                                        disabled={busy}
                                        onClick={() => {
                                            setSelected(row.id);
                                            setChallenge(null);
                                            clearTimeout(expiry.current);
                                        }}
                                    >
                                        Xem điểm danh phiên #{row.id}
                                    </button>
                                    {row.capabilities?.canEdit === true && (
                                        <button
                                            className="v2-button"
                                            disabled={busy}
                                            onClick={() => {
                                                setEditing(row);
                                                setError('');
                                            }}
                                        >
                                            Sửa phiên #{row.id}
                                        </button>
                                    )}
                                    {row.capabilities?.canIssueChallenge === true && (
                                        <button
                                            className="v2-button"
                                            disabled={busy}
                                            onClick={() => issueChallenge(row)}
                                        >
                                            Lấy mã xác thực phiên #{row.id}
                                        </button>
                                    )}
                                    {row.capabilities?.canClose === true && (
                                        <button
                                            className="v2-button"
                                            disabled={busy}
                                            onClick={() => {
                                                setDecision({ row, action: 'close' });
                                                setError('');
                                            }}
                                        >
                                            Đóng phiên #{row.id}
                                        </button>
                                    )}
                                    {row.capabilities?.canCancel === true && (
                                        <button
                                            className="v2-button"
                                            disabled={busy}
                                            onClick={() => {
                                                setDecision({ row, action: 'cancel' });
                                                setError('');
                                            }}
                                        >
                                            Hủy phiên #{row.id}
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                    {challenge && (
                        <div>
                            <h3>Mã xác thực phiên #{challenge.sessionId}</h3>
                            <AttendanceQrDisplay activityId={activity.id} challenge={challenge} />
                            <label>
                                Mã do máy chủ cấp
                                <textarea
                                    aria-label="Mã do máy chủ cấp"
                                    readOnly
                                    value={challenge.challenge}
                                    rows={3}
                                />
                            </label>
                            <p>
                                Hết hạn {sessionDate(challenge.expiresAt)}. Cung cấp mã hiện tại cho người tham gia; lấy
                                mã mới sau khi hết hạn.
                            </p>
                        </div>
                    )}
                    {chosen && (
                        <SessionRoster
                            key={`${user?.id}:${chosen.id}`}
                            activity={activity}
                            session={chosen}
                            revision={revision}
                        />
                    )}
                </>
            )}
            {error && !editing && !decision && <p role="alert">{error}</p>}
            {booking && (
                <ActivityBooking key={booking.id} api={api} session={booking} onClose={() => setBooking(null)}
                    onLocationChanged={() => {
                        setBooking(null);
                        setRevision((value) => value + 1);
                        onChanged?.();
                    }}
                />
            )}
            <button className="v2-button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>
                Tải lại phiên điểm danh
            </button>
            {editing && (
                <V2Modal
                    title={editing.id ? 'Sửa phiên điểm danh' : 'Tạo phiên điểm danh'}
                    onClose={() => !busy && setEditing(null)}
                >
                    <SessionForm
                        activity={activity}
                        session={editing.id ? editing : null}
                        busy={busy}
                        error={error}
                        onSave={(draft) => {
                            try {
                                const version = editing.id ? editing.version : data.activityVersion;
                                const body = sessionPayload(draft, version, Boolean(editing.id));
                                mutate(
                                    editing.id ? `sessions/${editing.id}` : 'sessions',
                                    body,
                                    version,
                                    !editing.id,
                                    editing.id ? 'PATCH' : 'POST',
                                    editing.id,
                                );
                            } catch (issue) {
                                setError(issue.message);
                            }
                        }}
                    />
                </V2Modal>
            )}
            {decision && (
                <V2Modal
                    title={decision.action === 'cancel' ? 'Hủy phiên điểm danh' : 'Đóng phiên điểm danh'}
                    onClose={() => !busy && setDecision(null)}
                >
                    <form
                        className="v2-session-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            const fields = Object.fromEntries(new FormData(event.currentTarget));
                            mutate(
                                `sessions/${decision.row.id}/${decision.action}`,
                                { expectedVersion: decision.row.version, reason: fields.reason.trim() },
                                decision.row.version,
                                false,
                                'POST',
                                decision.row.id,
                            );
                        }}
                    >
                        <fieldset disabled={busy}>
                            <p>
                                Phiên #{decision.row.id} · {sessionDate(decision.row.startTime)}
                            </p>
                            <p>
                                {decision.action === 'cancel'
                                    ? 'Hủy phiên sẽ thu hồi lượt điểm danh đã xác minh và chuyển yêu cầu xử lý ghi nhận về máy chủ.'
                                    : 'Đóng phiên sẽ ngừng nhận điểm danh bằng mã xác thực.'}
                            </p>
                            <label>
                                Lý do
                                <textarea name="reason" required maxLength={1000} rows={3} />
                            </label>
                            {error && <p role="alert">{error}</p>}
                            <button className="v2-button v2-button--primary">
                                {busy ? 'Đang xử lý…' : 'Xác nhận'}
                            </button>
                        </fieldset>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
