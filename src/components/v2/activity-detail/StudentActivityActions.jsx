import { useRef, useState } from 'react';

export default function StudentActivityActions({ api, activity, onChanged }) {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const lock = useRef(false);
    const key = useRef(null);
    const register = async () => {
        if (lock.current || !activity.canRegister) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        key.current ||= crypto.randomUUID();
        try {
            await api.request(`/api/activities/${encodeURIComponent(activity.id)}/participants`, {
                method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({}),
            });
            setMessage('Máy chủ đã xác nhận đăng ký tham gia.');
            onChanged?.();
        } catch (error) { setMessage(typeof error?.message === 'string' ? error.message : 'Không thể đăng ký.'); }
        finally { lock.current = false; setBusy(false); }
    };
    if (!activity.canRegister && !message) return null;
    return <section className="v2-profile-panel" aria-label="Đăng ký hoạt động">
        {activity.canRegister && <button className="v2-button v2-button--primary" type="button" disabled={busy} onClick={register}>{busy ? 'Đang đăng ký…' : 'Đăng ký tham gia'}</button>}
        {message && <p role="status">{message}</p>}
    </section>;
}
