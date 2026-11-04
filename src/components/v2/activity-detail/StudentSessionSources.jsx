import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import V2Modal from '../common/modal/V2Modal';
import { AttendanceQrInput } from './AttendanceQr';
import {
    attendanceError,
    checkInPayload,
    sessionDate,
    sessionMutation,
    sessionStatus,
    validateCheckIn,
    validateSessions,
} from '../../../services/activity-sessions';
import './ActivitySessions.scss';

export default function StudentSessionSources({ api, activityId, onChanged }) {
    const { user } = useAuth();
    const [page, setPage] = useState(1),
        [revision, setRevision] = useState(0),
        [result, setState] = useState({});
    const identity = `${user?.id}:${activityId}:${page}`;
    const state = result.identity === identity ? result : {};
    const [selected, setSelected] = useState(null),
        [challenge, setChallenge] = useState(''),
        [location, setLocation] = useState(null);
    const [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    const generation = useRef(0),
        lock = useRef(false),
        keys = useRef(new Map());
    useEffect(() => {
        setNotice('');
        keys.current.clear();
    }, [api, activityId, user?.id]);
    useEffect(() => {
        const ticket = ++generation.current;
        lock.current = false;
        setBusy(false);
        setState({});
        setSelected(null);
        setError('');
        setLocation(null);
        setChallenge('');
        api.request(`/api/v2/activities/${encodeURIComponent(activityId)}/sessions?page=${page}&pageSize=20`)
            .then((value) => {
                if (generation.current === ticket)
                    setState({ identity, data: validateSessions(value, activityId, true) });
            })
            .catch((issue) => {
                if (generation.current === ticket) setState({ identity, error: issue });
            });
        return () => {
            generation.current++;
        };
    }, [api, activityId, user?.id, page, revision]);
    const locate = () => {
        if (lock.current) return;
        if (!navigator.geolocation) {
            setError('Trình duyệt không hỗ trợ vị trí. Có thể gửi minh chứng qua Trải nghiệm của tôi.');
            return;
        }
        lock.current = true;
        setBusy(true);
        setError('');
        const ticket = generation.current;
        navigator.geolocation.getCurrentPosition(
            (value) => {
                if (generation.current !== ticket) return;
                lock.current = false;
                setBusy(false);
                setLocation({
                    latitude: value.coords.latitude,
                    longitude: value.coords.longitude,
                    accuracyMeters: value.coords.accuracy,
                });
            },
            () => {
                if (generation.current !== ticket) return;
                lock.current = false;
                setBusy(false);
                setError('Không lấy được vị trí. Kiểm tra quyền vị trí hoặc gửi minh chứng qua Trải nghiệm của tôi.');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    };
    const submit = async (event) => {
        event.preventDefault();
        if (lock.current) return;
        if (selected?.context !== identity) return;
        let body;
        try {
            body = checkInPayload(selected, challenge, location);
        } catch (issue) {
            setError(issue.message);
            return;
        }
        const ticket = generation.current,
            fingerprint = JSON.stringify(body);
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            validateCheckIn(
                await sessionMutation(api, activityId, 'check-in', body, keys.current.get(fingerprint)),
                activityId,
                selected.id,
            );
            if (generation.current !== ticket) return;
            keys.current.delete(fingerprint);
            setNotice('Đã xác minh điểm danh. Điểm trải nghiệm được xử lý riêng.');
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
    return (
        <section className="v2-activity-profile-panel v2-activity-sessions">
            <h3>Phiên tham gia của tôi</h3>
            {notice && <p role="status">{notice}</p>}
            {state.error ? (
                <p role="alert">
                    {[403, 404].includes(state.error.status)
                        ? 'Nguồn phiên chỉ dành cho người đã đăng ký và còn đủ điều kiện tham gia.'
                        : attendanceError(state.error)}
                </p>
            ) : !state.data ? (
                <p role="status">Đang tải phiên tham gia…</p>
            ) : (
                <>
                    {!state.data.items.length && (
                        <p>
                            Chưa có phiên tham gia. Hoạt động chưa có lịch điểm danh theo phiên được máy chủ xác nhận.
                        </p>
                    )}
                    <div className="v2-session-list">
                        {state.data.items.map((row) => (
                            <article key={row.id}>
                                <h4>
                                    {sessionDate(row.startTimeUtc)} – {sessionDate(row.endTimeUtc)}
                                </h4>
                                <p>
                                    {row.location || 'Chưa có địa điểm'} · {sessionStatus(row.status)}
                                </p>
                                <p>{row.alreadyVerified ? 'Đã xác minh điểm danh' : 'Chưa xác minh điểm danh'}</p>
                                {row.attendanceWindow && (
                                    <p>
                                        {row.attendanceWindow.mode === 'ONSITE'
                                            ? 'Trực tiếp, cần vị trí hiện tại'
                                            : 'Trực tuyến'}{' '}
                                        · Mở {sessionDate(row.attendanceWindow.opensAt)} · Đóng{' '}
                                        {sessionDate(row.attendanceWindow.closesAt)}
                                    </p>
                                )}
                                {row.sourceActions?.canCheckIn === true && row.attendanceWindow && (
                                    <button
                                        className="v2-button v2-button--primary"
                                        disabled={busy}
                                        onClick={() => {
                                            setSelected({ ...row, context: identity });
                                            setError('');
                                            setChallenge('');
                                            setLocation(null);
                                        }}
                                    >
                                        Điểm danh phiên
                                    </button>
                                )}
                                {row.sourceActions?.manualAttendance === 'REQUIRES_SUBMISSION_VALIDATION' && (
                                    <p>
                                        <Link to="/v2/personal-experience">Gửi minh chứng để đề nghị xác nhận</Link>
                                    </p>
                                )}
                            </article>
                        ))}
                    </div>
                    {state.data.totalPages > 1 && (
                        <nav aria-label="Trang phiên tham gia">
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
            <button className="v2-button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>
                Tải lại phiên
            </button>
            {selected?.context === identity && (
                <V2Modal title="Điểm danh phiên tham gia" onClose={() => !busy && setSelected(null)}>
                    <form className="v2-session-form" onSubmit={submit}>
                        <fieldset disabled={busy}>
                            <p>
                                {sessionDate(selected.startTimeUtc)} · {selected.location}
                            </p>
                            <p>Dùng mã xác thực hiện tại do người tổ chức cung cấp. Mã máy chủ hết hạn sau 30 giây.</p>
                            <AttendanceQrInput key={`${identity}:${selected.id}`} activityId={activityId} sessionId={selected.id} onCode={setChallenge} />
                            <label>
                                Mã xác thực phiên
                                <textarea
                                    aria-label="Mã xác thực phiên"
                                    value={challenge}
                                    onChange={(event) => setChallenge(event.target.value)}
                                    maxLength={4096}
                                    required
                                    rows={3}
                                    autoComplete="off"
                                />
                            </label>
                            {selected.attendanceWindow?.requiresLocation && (
                                <>
                                    <button className="v2-button" type="button" onClick={locate}>
                                        Lấy vị trí hiện tại
                                    </button>
                                    <p>
                                        {location
                                            ? `Đã lấy vị trí; độ chính xác ${Math.round(location.accuracyMeters)} m.`
                                            : 'Chưa lấy vị trí. Vị trí chỉ được gửi khi bạn xác nhận điểm danh.'}
                                    </p>
                                </>
                            )}
                            {error && <p role="alert">{error}</p>}
                            <button className="v2-button v2-button--primary">
                                {busy ? 'Đang xử lý…' : 'Xác nhận điểm danh'}
                            </button>
                        </fieldset>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
