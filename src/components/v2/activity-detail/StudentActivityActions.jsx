import { useRef, useState } from 'react';

export default function StudentActivityActions({ api, activity, onChanged }) {
    const [challenge, setChallenge] = useState('');
    const [location, setLocation] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const lock = useRef(false);
    const keys = useRef(new Map());
    const run = async (kind) => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        const body =
            kind === 'register'
                ? {}
                : { sessionId: activity.nextSessionId, challenge: challenge.trim(), ...(location ? { location } : {}) };
        const fingerprint = `${kind}:${JSON.stringify(body)}`;
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        try {
            await api.request(
                `/api/activities/${encodeURIComponent(activity.id)}/${kind === 'register' ? 'participants' : 'check-in'}`,
                {
                    method: 'POST',
                    headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                    body: JSON.stringify(body),
                },
            );
            setMessage(
                kind === 'register'
                    ? 'Đã đăng ký hoạt động.'
                    : 'Máy chủ đã xác nhận điểm danh. Trạng thái ghi nhận điểm nằm trong lịch sử trải nghiệm.',
            );
            onChanged();
        } catch (error) {
            setMessage(error.message || 'Không thể thực hiện.');
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    const locate = () => {
        if (!navigator.geolocation) {
            setMessage('Thiết bị không hỗ trợ vị trí.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    accuracyMeters: coords.accuracy,
                });
                setMessage('Đã lấy vị trí.');
            },
            () => setMessage('Không lấy được vị trí. Kiểm tra quyền vị trí của trình duyệt.'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
    };
    return (
        <section className="v2-profile-panel v2-experience-operations" aria-label="Đăng ký và điểm danh">
            {activity.canRegister && (
                <button className="v2-button" type="button" disabled={busy} onClick={() => run('register')}>
                    Đăng ký tham gia
                </button>
            )}
            {activity.nextAction === 'CHECK_IN' && activity.nextSessionId && (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        run('check-in');
                    }}
                >
                    <label>
                        Mã điểm danh từ ban tổ chức
                        <input required value={challenge} onChange={(event) => setChallenge(event.target.value)} />
                    </label>
                    <button className="v2-button" type="button" disabled={busy} onClick={locate}>
                        Lấy vị trí điểm danh
                    </button>
                    <button className="v2-button" disabled={busy || !challenge.trim()}>
                        Xác nhận điểm danh
                    </button>
                </form>
            )}
            {message && <p role="status">{message}</p>}
        </section>
    );
}
