import { useEffect, useRef, useState } from 'react';
import './ActivityPublicationControl.scss';

const labels = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Đã từ chối', EXPIRED: 'Quá hạn' };
const date = (value) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export default function ActivityRescheduleControl({ api, activity }) {
    const path = `/api/activities/${activity.id}/reschedule-requests`;
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const pending = useRef(null);
    const locked = useRef(false);

    useEffect(() => {
        let current = true;
        api.request(path).then((value) => {
            if (current) setData(value);
        }).catch((issue) => {
            if (current) setError(issue.message);
        });
        return () => { current = false; };
    }, [api, path, activity.version, revision]);

    const submit = async (event) => {
        event.preventDefault();
        if (locked.current) return;
        const values = new FormData(event.currentTarget);
        const start = new Date(`${values.get('start')}:00+07:00`);
        const end = new Date(`${values.get('end')}:00+07:00`);
        const reason = String(values.get('reason') || '').trim();
        if (!(end > start) || !reason) {
            setError('Nhập lý do và chọn giờ kết thúc sau giờ bắt đầu.');
            return;
        }
        const body = JSON.stringify({
            expectedActivityVersion: activity.version, startTimeUtc: start.toISOString(),
            endTimeUtc: end.toISOString(), reason,
        });
        if (pending.current?.body !== body) pending.current = { body, key: crypto.randomUUID() };
        locked.current = true;
        setBusy(true);
        setError('');
        try {
            const saved = await api.request(path, {
                method: 'POST', body, headers: { 'Idempotency-Key': pending.current.key },
            });
            setData((previous) => ({ ...previous, items: [saved, ...(previous?.items || [])] }));
            setRevision((value) => value + 1);
        } catch (issue) {
            setError(issue.message);
            if (issue.status === 409) setRevision((value) => value + 1);
        } finally {
            locked.current = false;
            setBusy(false);
        }
    };

    return (
        <section className="v2-activity-publication">
            <div>
                <h2>Yêu cầu dời lịch</h2>
                <p>Lịch đã duyệt vẫn áp dụng trong lúc chờ. Hạn duyệt là 48 giờ trước giờ bắt đầu hiện tại.</p>
                {error && <p role="alert">{error}</p>}
                {data?.items?.map((item) => (
                    <p key={item.id}>
                        <strong>{labels[item.status] || item.status}</strong> · {date(item.startTimeUtc)} – {date(item.endTimeUtc)}
                        <br />{item.reason}
                        {item.reviewNote && <><br />{item.reviewNote}</>}
                    </p>
                ))}
            </div>
            {data?.canRequest && !data.items.some((item) => item.status === 'PENDING') && (
                <form onSubmit={submit}>
                    <label>Bắt đầu mới (giờ Việt Nam)<input name="start" type="datetime-local" required disabled={busy} /></label>
                    <label>Kết thúc mới (giờ Việt Nam)<input name="end" type="datetime-local" required disabled={busy} /></label>
                    <label>Lý do<textarea name="reason" required maxLength={2000} disabled={busy} /></label>
                    <button type="submit" className="v2-button" disabled={busy}>Gửi CTSV</button>
                </form>
            )}
        </section>
    );
}
