import { useEffect, useRef, useState } from 'react';

const fields = [
    ['strengths', 'Điểm mạnh'],
    ['weaknesses', 'Điểm cần cải thiện'],
    ['suggestions', 'Đề xuất'],
];

export default function ActivityRecap({ api, activityId }) {
    const path = `/api/activities/${activityId}/recap`;
    const [data, setData] = useState(null);
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const pending = useRef(null);
    const locked = useRef(false);

    useEffect(() => {
        let active = true;
        api.request(`${path}?page=${page}`).then((value) => {
            if (active) setData(value);
        }).catch((issue) => {
            if (active) setError(issue.message);
        });
        return () => { active = false; };
    }, [api, path, page, revision]);

    const save = async (event) => {
        event.preventDefault();
        if (locked.current || !data.canSubmit) return;
        const values = new FormData(event.currentTarget);
        const feedback = Object.fromEntries(fields.map(([name]) => [name, String(values.get(name) || '').trim()]));
        if (!Object.values(feedback).some(Boolean)) {
            setError('Nhập góp ý vào ít nhất một mục.');
            return;
        }
        const body = JSON.stringify({ ...feedback, expectedVersion: data.myFeedback?.version ?? null });
        if (pending.current?.body !== body) pending.current = { body, key: crypto.randomUUID() };
        locked.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const saved = await api.request(`${path}/my-feedback`, {
                method: 'PUT', body, headers: { 'Idempotency-Key': pending.current.key },
            });
            setData((current) => ({ ...current, myFeedback: saved }));
            setNotice('Đã lưu góp ý.');
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
        <section className="v2-activity-profile-panel">
            <h2>Recap hoạt động</h2>
            {error && <p role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            {!data && !error && <p role="status">Đang tải Recap…</p>}
            {data && !data.available && <p>Recap mở khi hoạt động đã hoàn thành.</p>}
            {data?.canSubmit && (
                <form key={data.myFeedback?.version || 'new'} onSubmit={save} className="v2-activity-recap-form">
                    {fields.map(([name, label]) => (
                        <label key={name}>{label}
                            <textarea name={name} rows={3} maxLength={2000} disabled={busy}
                                defaultValue={data.myFeedback?.[name] || ''} />
                        </label>
                    ))}
                    <button type="submit" className="v2-button" disabled={busy}>Lưu góp ý</button>
                </form>
            )}
            {!data?.canSubmit && data?.myFeedback && <Feedback item={data.myFeedback} />}
            {data?.canReview && (
                <>
                    <h3>Góp ý của thành viên</h3>
                    {!data.items.length && <p>Chưa có góp ý.</p>}
                    {data.items.map((item) => <Feedback key={item.version} item={item} />)}
                    {page > 1 && <button type="button" className="v2-button" onClick={() => setPage(page - 1)}>Trang trước</button>}
                    {data.hasMore && <button type="button" className="v2-button" onClick={() => setPage(page + 1)}>Trang sau</button>}
                </>
            )}
        </section>
    );
}

function Feedback({ item }) {
    return <dl>{fields.filter(([name]) => item[name]).map(([name, label]) => (
        <div key={name}><dt>{label}</dt><dd>{item[name]}</dd></div>
    ))}</dl>;
}
