import { useRef, useState } from 'react';
import V2Modal from '../common/modal/V2Modal';
import { updateActivityResource, detachActivityResource } from '../../../services/activity-resources';

export default function ActivityResourceManagement({ api, activityId, resources, onChanged }) {
    const [selected, setSelected] = useState(null),
        [draft, setDraft] = useState({});
    const [error, setError] = useState(''),
        [busy, setBusy] = useState(false),
        [history, setHistory] = useState(null);
    const lock = useRef(false),
        pending = useRef(null);
    const mutate = async (event) => {
        event.preventDefault();
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError('');
        const fingerprint = JSON.stringify([selected, draft]);
        if (pending.current?.fingerprint !== fingerprint) pending.current = { fingerprint, key: crypto.randomUUID() };
        try {
            if (selected.remove)
                await detachActivityResource(api, activityId, selected, draft.reason.trim(), pending.current.key);
            else await updateActivityResource(api, activityId, selected, draft, pending.current.key);
            setSelected(null);
            setHistory(null);
            onChanged();
        } catch (issue) {
            setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    const audit = async (page = 1) => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            setHistory(await api.request(`/api/activities/${activityId}/resources/history?page=${page}&pageSize=20`));
        } catch (issue) {
            setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <section>
            {resources
                .filter((item) => item.version)
                .map((item) => (
                    <div className="v2-activity-resource-toolbar" key={item.id}>
                        <span>{item.title}</span>
                        <div>
                            <button
                                className="v2-button"
                                disabled={busy}
                                onClick={() => {
                                    setSelected(item);
                                    setDraft(item);
                                    setError('');
                                }}
                            >
                                Sửa thông tin
                            </button>
                            <button
                                className="v2-button"
                                disabled={busy}
                                onClick={() => {
                                    setSelected({ ...item, remove: true });
                                    setDraft({ reason: '' });
                                    setError('');
                                }}
                            >
                                Gỡ liên kết
                            </button>
                        </div>
                    </div>
                ))}
            <button className="v2-button" disabled={busy} onClick={() => audit()}>
                Lịch sử tài nguyên
            </button>
            {error && <p role="alert">{error}</p>}
            {history && (
                <>
                    <ul>
                        {(history.items || []).map((row, index) => (
                            <li key={row.id || index}>
                                {row.action} · {row.createdAtUtc || row.occurredAtUtc} · {row.reason || ''}
                            </li>
                        ))}
                    </ul>
                    <button
                        className="v2-button"
                        disabled={busy || history.page <= 1}
                        onClick={() => audit(history.page - 1)}
                    >
                        Trước
                    </button>
                    <button
                        className="v2-button"
                        disabled={busy || history.page >= Math.ceil(history.total / history.pageSize)}
                        onClick={() => audit(history.page + 1)}
                    >
                        Sau
                    </button>
                </>
            )}
            {selected && (
                <V2Modal
                    title={selected.remove ? 'Gỡ liên kết' : 'Sửa tài nguyên'}
                    onClose={() => {
                        if (!busy) setSelected(null);
                    }}
                >
                    <form className="v2-activity-edit-form" onSubmit={mutate}>
                        {selected.remove ? (
                            <label>
                                Lý do gỡ
                                <textarea
                                    required
                                    maxLength={500}
                                    value={draft.reason}
                                    onChange={(e) => setDraft({ reason: e.target.value })}
                                    disabled={busy}
                                />
                            </label>
                        ) : (
                            <>
                                <label>
                                    Tiêu đề
                                    <input
                                        required
                                        maxLength={160}
                                        value={draft.title}
                                        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                        disabled={busy}
                                    />
                                </label>
                                <label>
                                    Phạm vi
                                    <select
                                        value={draft.visibility}
                                        onChange={(e) => setDraft({ ...draft, visibility: e.target.value })}
                                        disabled={busy}
                                    >
                                        <option value="CLUB">Trong CLB</option>
                                        <option value="PUBLIC">Công khai trong phạm vi hoạt động</option>
                                    </select>
                                </label>
                                <label>
                                    Thứ tự
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        max={9999}
                                        value={draft.position}
                                        onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                                        disabled={busy}
                                    />
                                </label>
                            </>
                        )}
                        {error && <p role="alert">{error}</p>}
                        <button className="v2-button v2-button--primary" disabled={busy}>
                            Lưu thay đổi
                        </button>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
