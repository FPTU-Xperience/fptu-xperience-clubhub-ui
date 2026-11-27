import { useEffect, useRef, useState } from 'react';

const png = (value) => `data:image/png;base64,${value}`;

export function useCertificateDisplay(api, sessionKey) {
    const path = '/api/activities/certificates/me/display';
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const pending = useRef(null);
    const generation = useRef(0);
    useEffect(() => {
        let active = true;
        generation.current += 1; pending.current = null; lock.current = false;
        setError(''); setBusy(false);
        setData(null);
        api.request(path).then((value) => { if (active) setData(value); })
            .catch((issue) => { if (active) setError(issue.message); });
        return () => { active = false; };
    }, [api, sessionKey]);
    const save = async (changes) => {
        if (!data || lock.current) return;
        const currentGeneration = generation.current;
        const { badgeId, frameId, badgeX, badgeY, badgeSize } = data;
        const body = JSON.stringify({ badgeId, frameId, badgeX, badgeY, badgeSize, expectedVersion: data.version, ...changes });
        if (pending.current?.body !== body) pending.current = { body, key: crypto.randomUUID() };
        const key = pending.current.key;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const saved = await api.request(path, { method: 'PUT', body, headers: { 'Idempotency-Key': key } });
            if (currentGeneration !== generation.current) return;
            setData(saved); pending.current = null;
        } catch (issue) {
            if (currentGeneration !== generation.current) return;
            setError(issue.message);
            if (issue.status === 409) {
                pending.current = null;
                try { const fresh = await api.request(path); if (currentGeneration === generation.current) setData(fresh); } catch { /* Keep the write error visible. */ }
            }
        } finally {
            if (currentGeneration === generation.current) { lock.current = false; setBusy(false); }
        }
    };
    return { data, error, busy, save };
}

export default function ActivityCertificates({ api, clubId, display }) {
    const path = clubId ? `/api/activities/certificates/club/${clubId}` : '/api/activities/certificates/me';
    const [page, setPage] = useState(1);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true;
        api.request(`${path}?page=${page}`).then((value) => { if (active) setData(value); })
            .catch((issue) => { if (active) setError(issue.message); });
        return () => { active = false; };
    }, [api, path, page]);
    const groups = new Map();
    for (const item of data?.items || []) {
        if (!groups.has(item.activityId)) groups.set(item.activityId, []);
        groups.get(item.activityId).push(item);
    }
    if (!groups.size && !error) return null;
    return (
        <section className="v2-activity-profile-panel">
            <h2>Chứng chỉ hoạt động</h2>
            {error && <p role="alert">{error}</p>}
            {display?.error && <p role="alert">{display.error}</p>}
            {[...groups].map(([id, items]) => <CertificateStack key={id} items={items} display={display} />)}
            {display?.data?.badgeId && (
                <form key={display.data.version} onSubmit={(event) => {
                    event.preventDefault();
                    const values = new FormData(event.currentTarget);
                    display.save(Object.fromEntries(['badgeX', 'badgeY', 'badgeSize'].map((key) => [key, Number(values.get(key))])));
                }}>
                    <label>Vị trí ngang <input name="badgeX" type="range" min={0} max={100} defaultValue={display.data.badgeX} /></label>
                    <label>Vị trí dọc <input name="badgeY" type="range" min={0} max={100} defaultValue={display.data.badgeY} /></label>
                    <label>Kích thước <input name="badgeSize" type="range" min={5} max={40} defaultValue={display.data.badgeSize} /></label>
                    <button type="submit" className="v2-button" disabled={display.busy}>Lưu vị trí badge</button>
                    <button type="button" className="v2-button" disabled={display.busy} onClick={() => display.save({ badgeId: null })}>Gỡ badge</button>
                </form>
            )}
            {display?.data?.frameId && <button type="button" className="v2-button" disabled={display.busy}
                onClick={() => display.save({ frameId: null })}>Gỡ khung avatar</button>}
            {page > 1 && <button type="button" className="v2-button" onClick={() => setPage(page - 1)}>Trang trước</button>}
            {data?.hasMore && <button type="button" className="v2-button" onClick={() => setPage(page + 1)}>Trang sau</button>}
        </section>
    );
}

function CertificateStack({ items, display }) {
    const [index, setIndex] = useState(0);
    const item = items[index % items.length];
    return (
        <article className="v2-activity-profile-panel">
            <p>{item.activityTitle}</p>
            <h3>{item.title}</h3>
            <img src={png(item.badgePng)} alt="Badge chứng chỉ" width={72} height={72} style={{ objectFit: 'contain' }} />
            <p>{item.recipientName} · {item.issuerName}</p>
            <small>Mã chứng chỉ {item.id}</small>
            {item.framePng && <img src={png(item.framePng)} alt="Khung avatar đã mở khóa" width={72} height={72} style={{ objectFit: 'contain' }} />}
            {display?.data && (
                <>
                    <button type="button" className="v2-button" disabled={display.busy || display.data.badgeId === item.id}
                        onClick={() => display.save({ badgeId: item.id })}>Đặt badge lên ảnh bìa</button>
                    {item.framePng && <button type="button" className="v2-button" disabled={display.busy || display.data.frameId === item.id}
                        onClick={() => display.save({ frameId: item.id })}>Dùng khung avatar</button>}
                </>
            )}
            {items.length > 1 && <button type="button" className="v2-button"
                onClick={() => setIndex((value) => (value + 1) % items.length)}>Chứng chỉ tiếp theo ({index % items.length + 1}/{items.length})</button>}
        </article>
    );
}
