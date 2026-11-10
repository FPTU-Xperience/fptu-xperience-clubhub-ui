import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../../../services/api';

const date = (value) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const utc = (value) => new Date(`${value}:00+07:00`).toISOString();
const local = (value) => value ? new Date(Date.parse(value) + 7 * 3600000).toISOString().slice(0, 16) : '';

export default function ActivityHandoverInbox({ clubId, clubCode, onSaved }) {
    const path = `/api/activities/handover/club/${clubId}`;
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef(null);
    const lock = useRef(false);
    useEffect(() => {
        let active = true;
        api.request(path).then((data) => { if (active) setRows(data); })
            .catch((issue) => { if (active) setError(issue.message); });
        return () => { active = false; };
    }, [path]);

    const submit = async (route, body, update) => {
        if (lock.current) return;
        const data = JSON.stringify(body);
        const fingerprint = route + data;
        if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() };
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const saved = await api.request(route, { method: 'POST', body: data, headers: { 'Idempotency-Key': pending.current.key } });
            setRows((current) => current.flatMap((row) => row.id === saved.id ? update(saved) : [row]));
            onSaved?.();
        } catch (issue) {
            setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    const decide = (row, decision) => submit(`${path}/${row.id}/decision`,
        { expectedVersion: row.handover.version, decision }, (saved) => decision === 'ACCEPTED' ? [saved] : []);
    if (!rows.length && !error) return null;

    return (
        <section className="v2-activity-profile-panel">
            <h2>Đề nghị bàn giao hoạt động</h2>
            {error && <p role="alert">{error}</p>}
            {rows.map((row) => (
                <article key={row.id}>
                    <h3>{row.title}</h3>
                    <p>{date(row.startTimeUtc)} – {date(row.endTimeUtc)} · {row.location}</p>
                    {row.handover.status === 'PENDING' ? (
                        <>
                            <button type="button" className="v2-button" disabled={busy} onClick={() => decide(row, 'ACCEPTED')}>Chấp nhận</button>
                            <button type="button" className="v2-button" disabled={busy} onClick={() => decide(row, 'REJECTED')}>Từ chối</button>
                        </>
                    ) : (
                        <>
                            <Link to={`/v2/my-clubs/${encodeURIComponent(clubCode)}/activities/${row.id}`}>Mở hoạt động</Link>
                            <form key={row.version} onSubmit={(event) => {
                                event.preventDefault();
                                const form = new FormData(event.currentTarget);
                                submit(`/api/activities/campus/${row.id}/publish`, {
                                    expectedVersion: row.version, registrationOpensAt: utc(form.get('opens')),
                                    registrationClosesAt: utc(form.get('closes')),
                                    publishAtUtc: form.get('publishAt') ? utc(form.get('publishAt')) : null,
                                }, (saved) => saved.publicationStatus === 'DRAFT' ? [saved] : []);
                            }}>
                                <label>Hẹn công khai (giờ Việt Nam, tùy chọn) <input name="publishAt" type="datetime-local" defaultValue={local(row.publishAtUtc)} /></label>
                                <label>Mở đăng ký (giờ Việt Nam) <input name="opens" type="datetime-local" required defaultValue={local(row.registrationOpensAt)} /></label>
                                <label>Đóng đăng ký (giờ Việt Nam) <input name="closes" type="datetime-local" required defaultValue={local(row.registrationClosesAt)} /></label>
                                <button type="submit" className="v2-button" disabled={busy}>Lưu mốc công khai</button>
                            </form>
                            {row.publishAtUtc && <button type="button" className="v2-button" disabled={busy} onClick={() =>
                                submit(`/api/activities/campus/${row.id}/cancel-publication`,
                                    { expectedVersion: row.version }, (saved) => [saved])}>Hủy lịch công khai</button>}
                        </>
                    )}
                </article>
            ))}
        </section>
    );
}
