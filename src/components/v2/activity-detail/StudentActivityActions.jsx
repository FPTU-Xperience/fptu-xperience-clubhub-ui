import { useEffect, useRef, useState } from 'react';
import V2Modal from '../common/modal/V2Modal';
import { useAuth } from '../../../context/AuthContext';
import './StudentActivityActions.scss';

export default function StudentActivityActions({ api, activity, onChanged, disabled = false, compact = false }) {
    const userId = useAuth()?.user?.id;
    const [confirmed, setConfirmed] = useState(null);
    const registered = confirmed ?? activity?.isRegistered === true;
    const [confirm, setConfirm] = useState(false);
    const [failed, setFailed] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const lock = useRef(false);
    const key = useRef(null);
    const cancelKey = useRef(null),
        generation = useRef(0);
    useEffect(() => {
        const ticket = ++generation.current;
        setConfirmed(null);
        setConfirm(false);
        setMessage('');
        lock.current = false;
        key.current = null;
        cancelKey.current = null;
        setBusy(false);
        return () => {
            if (generation.current === ticket) generation.current++;
        };
    }, [api, activity?.id, userId]);
    useEffect(() => {
        setConfirmed(null);
    }, [activity?.isRegistered, activity?.registrationVersion, activity?.version]);
    const register = async () => {
        if (lock.current || !activity.canRegister || disabled || registered) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        setFailed(false);
        const ticket = generation.current;
        key.current ||= crypto.randomUUID();
        try {
            await api.request(`/api/activities/${encodeURIComponent(activity.id)}/participants`, {
                method: 'POST',
                headers: { 'Idempotency-Key': key.current },
                body: JSON.stringify({}),
            });
            if (generation.current !== ticket) return;
            key.current = null;
            setConfirmed(true);
            onChanged?.();
        } catch (error) {
            if (generation.current === ticket) {
                setFailed(true);
                setMessage(typeof error?.message === 'string' ? error.message : 'Không thể đăng ký.');
            }
        } finally {
            if (generation.current === ticket) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    const guid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
    const canCancel = activity?.canCancelRegistration === true && guid(activity?.registrationVersion);
    const cancel = async () => {
        if (lock.current || disabled || !registered || !canCancel) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        setFailed(false);
        const ticket = generation.current;
        if (cancelKey.current?.version !== activity.registrationVersion)
            cancelKey.current = { version: activity.registrationVersion, key: crypto.randomUUID() };
        try {
            const receipt = await api.request(
                `/api/activities/${encodeURIComponent(activity.id)}/registration/cancel`,
                {
                    method: 'POST',
                    headers: { 'Idempotency-Key': cancelKey.current.key },
                    body: JSON.stringify({ expectedVersion: activity.registrationVersion }),
                },
            );
            if (
                String(receipt?.activityId) !== String(activity.id) ||
                (userId != null && receipt.userId !== Number(userId)) ||
                receipt.isRegistered !== false ||
                !guid(receipt.registrationVersion) ||
                receipt.registrationVersion === activity.registrationVersion
            )
                throw new Error('Chưa xác nhận được kết quả hủy. Tải lại hoạt động để đối chiếu.');
            if (generation.current !== ticket) return;
            cancelKey.current = null;
            setConfirmed(false);
            setConfirm(false);
            setMessage('Đã hủy đăng ký sự kiện.');
            onChanged?.();
        } catch (error) {
            if (generation.current === ticket) {
                setFailed(true);
                setMessage(
                    error.status === 409
                        ? 'Đăng ký hoặc điều kiện hủy đã thay đổi. Đóng hộp thoại và tải lại hoạt động.'
                        : error.message || 'Không thể hủy đăng ký.',
                );
            }
        } finally {
            if (generation.current === ticket) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    if (!activity?.id) return null;
    return (
        <section
            className={`v2-student-activity-actions${compact ? ' v2-student-activity-actions--compact' : ''}`}
            aria-label="Đăng ký hoạt động"
        >
            <button
                className="v2-button v2-button--primary"
                type="button"
                disabled={busy || disabled || (registered ? !canCancel : !activity.canRegister)}
                onClick={() => (registered ? (setConfirm(true), setMessage(''), setFailed(false)) : register())}
            >
                {registered ? 'Đã đăng ký' : busy ? 'Đang đăng ký…' : 'Đăng ký tham gia'}
            </button>
            {message && !confirm ? (
                <p role={failed ? 'alert' : 'status'}>{message}</p>
            ) : (
                !registered &&
                !activity.canRegister &&
                !disabled && <p role="status">Hiện chưa thể đăng ký hoạt động này.</p>
            )}
            {confirm && (
                <V2Modal title="Xác nhận hủy đăng ký" onClose={() => !busy && setConfirm(false)}>
                    <p>
                        Bạn muốn hủy đăng ký tham gia <strong>{activity.title}</strong>?
                    </p>
                    <p>
                        Chỉ hủy trước giờ bắt đầu và khi chưa có dữ liệu điểm danh. Đăng ký lại phụ thuộc điều kiện và
                        số chỗ còn lại.
                    </p>
                    {message && <p role={failed ? 'alert' : 'status'}>{message}</p>}
                    <button className="v2-button" disabled={busy} onClick={() => setConfirm(false)}>
                        Giữ đăng ký
                    </button>
                    <button className="v2-button v2-button--primary" disabled={busy || disabled} onClick={cancel}>
                        {busy ? 'Đang hủy…' : 'Xác nhận hủy đăng ký'}
                    </button>
                </V2Modal>
            )}
        </section>
    );
}
