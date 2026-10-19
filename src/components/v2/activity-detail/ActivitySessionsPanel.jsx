import { useEffect, useRef, useState } from 'react';
import ClubContributionSubmission from '../experience/ClubContributionSubmission';

const blank = {
    startAt: '',
    endAt: '',
    opensAt: '',
    closesAt: '',
    location: '',
    mode: 'ONLINE',
    latitude: '',
    longitude: '',
    radiusMeters: 100,
    manualConfirmationEnabled: false,
};
const localTime = (value) =>
    value
        ? new Intl.DateTimeFormat('sv-SE', {
              timeZone: 'Asia/Ho_Chi_Minh',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hourCycle: 'h23',
          })
              .format(new Date(value))
              .replace(' ', 'T')
        : '';
const utc = (value) => new Date(`${value}:00+07:00`).toISOString();

export default function ActivitySessionsPanel({ api, activity, readOnly, student = false, onChanged }) {
    const [result, setResult] = useState(null);
    const [attempt, retry] = useState(0);
    const [draft, setDraft] = useState(blank);
    const [editing, setEditing] = useState(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [challenge, setChallenge] = useState(null);
    const keys = useRef(new Map()),
        lock = useRef(false);
    const identity = `${activity.id}:${activity.version}:${attempt}`;
    const activeIdentity = useRef(identity);
    activeIdentity.current = identity;
    useEffect(() => {
        let active = true;
        setResult(null);
        setChallenge(null);
        api.request(`/api/activities/${activity.id}/sessions`).then(
            (data) => {
                if (active) setResult({ data });
            },
            (issue) => {
                if (active) setResult({ error: issue });
            },
        );
        return () => {
            active = false;
        };
    }, [api, identity]);
    const run = async (suffix, body, method = 'POST') => {
        if (lock.current || readOnly) return;
        lock.current = true;
        setBusy(true);
        setError('');
        const current = identity;
        const fingerprint = `${identity}:${suffix}:${JSON.stringify(body)}`;
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        try {
            await api.request(`/api/activities/${activity.id}/sessions${suffix}`, {
                method,
                headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                body: JSON.stringify(body),
            });
            if (activeIdentity.current !== current) return;
            setDraft(blank);
            setEditing(null);
            setReason('');
            retry((value) => value + 1);
            onChanged();
        } catch (issue) {
            if (activeIdentity.current === current) setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    const save = (event) => {
        event.preventDefault();
        try {
            const body = {
                expectedVersion: editing?.version || activity.version,
                startAt: utc(draft.startAt),
                endAt: utc(draft.endAt),
                location: draft.location,
                attendancePolicy: {
                    mode: draft.mode,
                    opensAt: utc(draft.opensAt),
                    closesAt: utc(draft.closesAt),
                    qrRotationSeconds: 30,
                    manualConfirmationEnabled: draft.manualConfirmationEnabled,
                    geofence:
                        draft.mode === 'ONLINE'
                            ? null
                            : {
                                  latitude: Number(draft.latitude),
                                  longitude: Number(draft.longitude),
                                  radiusMeters: Number(draft.radiusMeters),
                              },
                },
            };
            if (
                !(body.startAt < body.endAt) ||
                body.attendancePolicy.opensAt < body.startAt ||
                body.attendancePolicy.closesAt > body.endAt ||
                body.attendancePolicy.opensAt >= body.attendancePolicy.closesAt
            )
                throw new Error('Khoảng điểm danh phải nằm trong thời gian buổi hoạt động.');
            run(editing ? `/${editing.id}` : '', body, editing ? 'PATCH' : 'POST');
        } catch (issue) {
            setError(issue.message);
        }
    };
    return (
        <section className="v2-profile-panel v2-experience-operations" aria-label="Buổi hoạt động">
            <h2>Buổi hoạt động & mã điểm danh</h2>
            {!result && <p role="status">Đang tải…</p>}
            {result?.error && <p role="alert">{result.error.message}</p>}
            <button type="button" className="v2-button" disabled={busy} onClick={() => retry((value) => value + 1)}>
                Tải lại
            </button>
            {result?.data?.items?.map((session) => (
                <article key={session.id}>
                    <h3>
                        Buổi #{session.id} · {session.status}
                    </h3>
                    <p>
                        {localTime(session.startTime)} — {localTime(session.endTime)} · {session.location}
                    </p>
                    {!readOnly && (
                        <div>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={busy}
                                onClick={() => {
                                    setEditing(session);
                                    setDraft({
                                        startAt: localTime(session.startTime),
                                        endAt: localTime(session.endTime),
                                        location: session.location,
                                        mode: session.mode,
                                        opensAt: localTime(session.attendancePolicy.opensAt),
                                        closesAt: localTime(session.attendancePolicy.closesAt),
                                        manualConfirmationEnabled: session.attendancePolicy.manualConfirmationEnabled,
                                        latitude: session.attendancePolicy.geofence?.latitude ?? '',
                                        longitude: session.attendancePolicy.geofence?.longitude ?? '',
                                        radiusMeters: session.attendancePolicy.geofence?.radiusMeters ?? 100,
                                    });
                                }}
                            >
                                Sửa buổi
                            </button>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={busy || session.status !== 'SCHEDULED'}
                                onClick={async () => {
                                    try {
                                        const value = await api.request(
                                            `/api/activities/${activity.id}/sessions/${session.id}/attendance-challenge`,
                                        );
                                        if (activeIdentity.current === identity) setChallenge(value);
                                    } catch (issue) {
                                        if (activeIdentity.current === identity) setError(issue.message);
                                    }
                                }}
                            >
                                Lấy mã điểm danh
                            </button>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={busy || !reason.trim() || session.status !== 'SCHEDULED'}
                                onClick={() =>
                                    run(`/${session.id}/close`, { expectedVersion: session.version, reason })
                                }
                            >
                                Đóng buổi
                            </button>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={busy || !reason.trim() || session.status === 'CANCELLED'}
                                onClick={() =>
                                    run(`/${session.id}/cancel`, { expectedVersion: session.version, reason })
                                }
                            >
                                Hủy buổi
                            </button>
                        </div>
                    )}
                    {student && session.scoringSnapshot?.attributes && session.status !== 'CANCELLED' && (
                        <ClubContributionSubmission
                            key={`${session.id}:${session.version}`}
                            api={api}
                            session={session}
                        />
                    )}
                </article>
            ))}
            {challenge && (
                <div>
                    <p>
                        Mã buổi #{challenge.sessionId}; hết hạn {localTime(challenge.expiresAt)}. Mã xoay mỗi 30 giây,
                        lấy mã mới khi hết hạn.
                    </p>
                    <textarea readOnly aria-label="Mã điểm danh" value={challenge.challenge} />
                </div>
            )}
            {!readOnly && (
                <>
                    <label>
                        Lý do đóng/hủy buổi
                        <input maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />
                    </label>
                    <form onSubmit={save}>
                        <fieldset disabled={busy}>
                            <legend>{editing ? `Sửa buổi #${editing.id}` : 'Tạo buổi hoạt động'}</legend>
                            {Object.entries({
                                startAt: 'Bắt đầu',
                                endAt: 'Kết thúc',
                                opensAt: 'Mở điểm danh',
                                closesAt: 'Đóng điểm danh',
                            }).map(([key, label]) => (
                                <label key={key}>
                                    {label} (giờ Việt Nam)
                                    <input
                                        type="datetime-local"
                                        required
                                        value={draft[key]}
                                        onChange={(event) =>
                                            setDraft((current) => ({ ...current, [key]: event.target.value }))
                                        }
                                    />
                                </label>
                            ))}
                            <label>
                                Địa điểm
                                <input
                                    required
                                    maxLength={200}
                                    value={draft.location}
                                    onChange={(event) =>
                                        setDraft((current) => ({ ...current, location: event.target.value }))
                                    }
                                />
                            </label>
                            <label>
                                Hình thức
                                <select
                                    value={draft.mode}
                                    onChange={(event) =>
                                        setDraft((current) => ({ ...current, mode: event.target.value }))
                                    }
                                >
                                    <option value="ONLINE">Online</option>
                                    <option value="ONSITE">Tại địa điểm</option>
                                </select>
                            </label>
                            {draft.mode === 'ONSITE' &&
                                Object.entries({
                                    latitude: 'Vĩ độ',
                                    longitude: 'Kinh độ',
                                    radiusMeters: 'Bán kính (m)',
                                }).map(([key, label]) => (
                                    <label key={key}>
                                        {label}
                                        <input
                                            type="number"
                                            step="any"
                                            required
                                            value={draft[key]}
                                            onChange={(event) =>
                                                setDraft((current) => ({ ...current, [key]: event.target.value }))
                                            }
                                        />
                                    </label>
                                ))}
                            <label>
                                <input
                                    type="checkbox"
                                    checked={draft.manualConfirmationEnabled}
                                    onChange={(event) =>
                                        setDraft((current) => ({
                                            ...current,
                                            manualConfirmationEnabled: event.target.checked,
                                        }))
                                    }
                                />
                                Cho phép yêu cầu xác nhận thủ công
                            </label>
                            <button className="v2-button">Lưu buổi</button>
                            {editing && (
                                <button
                                    type="button"
                                    className="v2-button"
                                    onClick={() => {
                                        setEditing(null);
                                        setDraft(blank);
                                    }}
                                >
                                    Hủy chỉnh sửa
                                </button>
                            )}
                        </fieldset>
                    </form>
                </>
            )}
            {error && <p role="alert">{error}</p>}
        </section>
    );
}
