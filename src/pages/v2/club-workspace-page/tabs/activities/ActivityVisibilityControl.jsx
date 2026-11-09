import { useEffect, useRef, useState } from 'react';
import { publishPublicMediaSaved } from '../../../../../services/public-media-sync';

export default function ActivityVisibilityControl({ api, activity, disabled, onSaved }) {
    const known = typeof activity.isInternal === 'boolean';
    const [internal, setInternal] = useState(activity.isInternal !== false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const lock = useRef(false);
    useEffect(() => { setInternal(activity.isInternal !== false); }, [activity.id, activity.isInternal]);
    async function save() {
        if (lock.current || disabled || !known || internal === activity.isInternal) return;
        lock.current = true; setBusy(true); setError('');
        try {
            const saved = await api.request(`/api/activities/${encodeURIComponent(activity.id)}/visibility`, {
                method: 'PATCH', headers: { 'Idempotency-Key': crypto.randomUUID() },
                body: JSON.stringify({ isInternal: internal, expectedVersion: activity.version,
                    reason: `Quản lý CLB chuyển phạm vi sang ${internal ? 'nội bộ CLB' : 'công khai cùng campus'}.` }),
            });
            if (String(saved?.id) !== String(activity.id) || saved.isInternal !== internal || !saved.version)
                throw new Error('Máy chủ chưa xác nhận phạm vi hiển thị.');
            publishPublicMediaSaved('activity', activity.id);
            onSaved();
        } catch (issue) { setError(issue.message || 'Không thể lưu phạm vi hiển thị.'); }
        finally { lock.current = false; setBusy(false); }
    }
    return <section className="v2-activity-publication" aria-label="Phạm vi hiển thị hoạt động">
        <div><h2>Phạm vi hiển thị</h2><p>{known ? 'Hoạt động đã xuất bản sẽ hiển thị theo phạm vi này.' : 'Máy chủ chưa trả phạm vi hiển thị.'}</p>
            {error && <p role="alert">{error}</p>}</div>
        <div><label>Đối tượng xem <select value={String(internal)} disabled={busy || disabled || !known}
            onChange={(event) => setInternal(event.target.value === 'true')}>
            <option value="true">Nội bộ CLB</option><option value="false">Công khai cùng campus</option>
        </select></label> <button type="button" className="v2-button" onClick={save}
            disabled={busy || disabled || !known || internal === activity.isInternal}>{busy ? 'Đang lưu…' : 'Lưu phạm vi'}</button></div>
    </section>;
}
