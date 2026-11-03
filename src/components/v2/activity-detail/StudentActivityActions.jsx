import { useRef, useState } from 'react';
import './StudentActivityActions.scss';

export default function StudentActivityActions({ api, activity, onChanged, disabled = false, compact = false }) {
    const [confirmed, setConfirmed] = useState(false);
    const registered = activity?.isRegistered === true || confirmed;
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const lock = useRef(false);
    const key = useRef(null);
    const register = async () => {
        if (lock.current || !activity.canRegister || disabled || registered) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        key.current ||= crypto.randomUUID();
        try {
            await api.request(`/api/activities/${encodeURIComponent(activity.id)}/participants`, {
                method: 'POST', headers: { 'Idempotency-Key': key.current }, body: JSON.stringify({}),
            });
            setConfirmed(true);
            onChanged?.();
        } catch (error) { setMessage(typeof error?.message === 'string' ? error.message : 'Không thể đăng ký.'); }
        finally { lock.current = false; setBusy(false); }
    };
    if (!activity?.id) return null;
    return <section className={`v2-student-activity-actions${compact ? ' v2-student-activity-actions--compact' : ''}`} aria-label="Đăng ký hoạt động">
        <button className="v2-button v2-button--primary" type="button" disabled={registered || busy || disabled || !activity.canRegister} onClick={register}>{registered ? 'Đã đăng ký' : busy ? 'Đang đăng ký…' : 'Đăng ký tham gia'}</button>
        {message ? <p role="status">{message}</p> : !registered && !activity.canRegister && !disabled && <p role="status">Hiện chưa thể đăng ký hoạt động này.</p>}
    </section>;
}
