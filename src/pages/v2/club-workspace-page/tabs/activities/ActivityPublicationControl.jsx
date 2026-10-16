import { useEffect, useRef, useState } from 'react';
import { canManageActivityPublication, saveActivityPublication } from '../../../activity-publication';
import { publishPublicMediaSaved } from '../../../../../services/public-media-sync';
import './ActivityPublicationControl.scss';

export default function ActivityPublicationControl({ api, activity, access, busy, hasUnsavedContent, onSaved }) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const alive = useRef(true);
    const lock = useRef(false);
    const requestKey = useRef(null);
    const [confirmed, setConfirmed] = useState(activity);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    useEffect(() => {
        setConfirmed(activity);
    }, [activity]);
    const canManage = canManageActivityPublication(confirmed, access);
    const known = typeof confirmed.isPublished === 'boolean';
    const toggle = async () => {
        if (lock.current || busy || hasUnsavedContent || !canManage) return;
        lock.current = true;
        setPending(true);
        setError('');
        setNotice('');
        const target = !confirmed.isPublished;
        const fingerprint = `${confirmed.id}:${confirmed.publicationVersion}:${target}`;
        if (requestKey.current?.fingerprint !== fingerprint)
            requestKey.current = { fingerprint, key: crypto.randomUUID() };
        try {
            const saved = await saveActivityPublication(api, confirmed, target, requestKey.current.key);
            if (!alive.current) return;
            setConfirmed({ ...confirmed, ...saved });
            setNotice(target ? 'Đã công khai hoạt động.' : 'Đã ẩn hoạt động khỏi các trang công khai.');
            publishPublicMediaSaved('activity', activity.id);
            onSaved();
        } catch (issue) {
            if (alive.current)
                setError(
                    [404, 405, 501].includes(issue.status)
                        ? 'Máy chủ chưa hỗ trợ publish/unpublish. Trạng thái hoạt động chưa thay đổi.'
                        : issue.message || 'Không thể đổi trạng thái công khai.',
                );
        } finally {
            lock.current = false;
            if (alive.current) setPending(false);
        }
    };
    return (
        <section className="v2-activity-publication" aria-labelledby="activity-publication-title">
            <div>
                <h2 id="activity-publication-title">Công khai hoạt động</h2>
                <p></p>
                {error && <p role="alert">{error}</p>}
                {notice && <p role="status">{notice}</p>}
            </div>
            <div className="v2-activity-publication-toggle">
                <span>{known ? (confirmed.isPublished ? 'Đã công khai' : 'Chưa công khai') : 'Chưa đồng bộ'}</span>
                <button
                    type="button"
                    role="switch"
                    aria-label="Công khai hoạt động"
                    aria-checked={confirmed.isPublished === true}
                    aria-busy={pending}
                    disabled={pending || busy || hasUnsavedContent || !canManage}
                    onClick={toggle}
                >
                    <span />
                </button>
            </div>
        </section>
    );
}
