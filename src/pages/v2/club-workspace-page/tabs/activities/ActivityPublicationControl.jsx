import { useEffect, useRef, useState } from 'react';
import { canManageActivityPublication, saveActivityPublication } from '../../../activity-publication';
import { publishPublicMediaSaved } from '../../../../../services/public-media-sync';
import './ActivityPublicationControl.scss';

const vietnamDateTime = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
});
const localValue = (value) => Number.isFinite(Date.parse(value))
    ? vietnamDateTime.format(new Date(value)).replace(' ', 'T')
    : '';

function registrationWindow(form, startTime) {
    const values = new FormData(form);
    const publishValue = values.get('publishAt');
    const publishAt = publishValue ? new Date(`${publishValue}:00+07:00`) : null;
    const opens = new Date(`${values.get('opens')}:00+07:00`);
    const closes = new Date(`${values.get('closes')}:00+07:00`);
    const now = Date.now();
    if (publishAt && !(publishAt > now))
        throw new Error('Giờ hẹn công khai phải ở tương lai.');
    if (!((publishAt?.getTime() ?? now) <= opens && opens < closes && closes <= new Date(startTime)))
        throw new Error('Giờ mở phải từ lúc công khai trở đi. Giờ đóng phải sau giờ mở và không muộn hơn giờ bắt đầu hoạt động.');
    return {
        ...(publishAt ? { publishAtUtc: publishAt.toISOString() } : {}),
        registrationOpensAt: opens.toISOString(),
        registrationClosesAt: closes.toISOString(),
    };
}

function RegistrationFields({ activity, disabled }) {
    return (
        <>
            <label>Mở đăng ký <input name="opens" type="datetime-local" defaultValue={localValue(activity.registrationOpensAt)} required disabled={disabled} /></label>
            <label>Đóng đăng ký <input name="closes" type="datetime-local" defaultValue={localValue(activity.registrationClosesAt)} required disabled={disabled} /></label>
        </>
    );
}

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
    const toggle = async (event, target = !confirmed.isPublished) => {
        event.preventDefault();
        if (lock.current || busy || hasUnsavedContent || !canManage) return;
        let window;
        if (target) {
            try { window = registrationWindow(event.currentTarget, confirmed.startTime); }
            catch (issue) { setError(issue.message); return; }
        }
        lock.current = true;
        setPending(true);
        setError('');
        setNotice('');
        const fingerprint = JSON.stringify([confirmed.id, confirmed.publicationVersion, target, window]);
        if (requestKey.current?.fingerprint !== fingerprint)
            requestKey.current = { fingerprint, key: crypto.randomUUID() };
        try {
            const saved = await saveActivityPublication(api, confirmed, target, requestKey.current.key, window);
            if (!alive.current) return;
            setConfirmed({ ...confirmed, ...saved });
            setNotice(window?.publishAtUtc ? 'Đã lưu lịch công khai.' : target ? 'Đã công khai hoạt động.'
                : confirmed.publishAtUtc ? 'Đã hủy lịch công khai.' : 'Đã ẩn hoạt động khỏi các trang công khai.');
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
    if (!confirmed.publicationVersion && !confirmed.sourceApplicationId && ['DRAFT', 'PUBLISHED', 'CLOSED'].includes(confirmed.publicationStatus)) {
        const operation = confirmed.publicationStatus === 'DRAFT' ? 'PUBLISH' : confirmed.publicationStatus === 'PUBLISHED' ? 'CLOSE' : null;
        const allowed = access?.isManager === true && (!Array.isArray(access.permissions) || access.permissions.includes('activity.publish'));
        const publish = operation === 'PUBLISH';
        const disabled = !allowed || pending || busy || hasUnsavedContent;
        const submit = async (event) => {
            event.preventDefault();
            if (lock.current || disabled || !operation) return;
            const payload = { operation, expectedVersion: confirmed.version };
            if (publish) {
                try { Object.assign(payload, registrationWindow(event.currentTarget, confirmed.startTime)); }
                catch (issue) { setError(issue.message); return; }
            }
            lock.current = true; setPending(true); setError('');
            const fingerprint = JSON.stringify([confirmed.id, payload]);
            if (requestKey.current?.fingerprint !== fingerprint) requestKey.current = { fingerprint, key: crypto.randomUUID() };
            try {
                const saved = await api.updateActivity(confirmed.id, payload, requestKey.current.key);
                if (String(saved?.id) !== String(confirmed.id) || saved.publicationStatus !== (operation === 'PUBLISH' ? 'PUBLISHED' : 'CLOSED') || !saved.version || saved.version === confirmed.version)
                    throw new Error('Máy chủ chưa xác nhận chuyển trạng thái. Tải lại hoạt động.');
                if (alive.current) { setConfirmed({ ...confirmed, ...saved }); setNotice(operation === 'PUBLISH' ? 'Đã công khai hoạt động.' : 'Đã đóng đăng ký.'); publishPublicMediaSaved('activity', activity.id); onSaved(); }
            } catch (issue) { if (alive.current) setError(issue.message); }
            finally { lock.current = false; if (alive.current) setPending(false); }
        };
        return (
            <section className="v2-activity-publication">
                <div>
                    <h2>Xuất bản & đăng ký</h2>
                    <p>{publish ? 'Chọn cửa sổ đăng ký theo giờ Việt Nam trước khi công khai.'
                        : operation === 'CLOSE' ? 'Đang công khai. Bạn có thể đóng đăng ký.'
                        : 'Đã đóng đăng ký. Hoạt động vẫn hiển thị cho người có quyền xem.'}</p>
                    {error && <p role="alert">{error}</p>}
                    {notice && <p role="status">{notice}</p>}
                </div>
                {operation && (
                    <form key={confirmed.version} onSubmit={submit}>
                        {publish && <RegistrationFields activity={confirmed} disabled={disabled} />}
                        <button type="submit" className="v2-button" disabled={disabled}>
                            {publish ? 'Công khai bản nháp' : 'Đóng đăng ký'}
                        </button>
                    </form>
                )}
            </section>
        );
    }
    return (
        <section className="v2-activity-publication" aria-labelledby="activity-publication-title">
            <div>
                <h2 id="activity-publication-title">Công khai hoạt động</h2>
                {known && !confirmed.isPublished && canManage && <p>Các mốc dùng giờ Việt Nam.</p>}
                {error && <p role="alert">{error}</p>}
                {notice && <p role="status">{notice}</p>}
            </div>
            {known && !confirmed.isPublished && canManage ? (
                <form key={confirmed.publicationVersion} onSubmit={toggle}>
                    <label>
                        Hẹn giờ công khai (tùy chọn)
                        <input name="publishAt" type="datetime-local" defaultValue={localValue(confirmed.publishAtUtc)} disabled={pending || busy || hasUnsavedContent} />
                    </label>
                    <RegistrationFields activity={confirmed} disabled={pending || busy || hasUnsavedContent} />
                    <button type="submit" className="v2-button" disabled={pending || busy || hasUnsavedContent}>
                        Lưu mốc công khai
                    </button>
                    {confirmed.publishAtUtc && <button type="button" className="v2-button"
                        disabled={pending || busy || hasUnsavedContent} onClick={(event) => toggle(event, false)}>
                        Hủy lịch công khai
                    </button>}
                </form>
            ) : <div className="v2-activity-publication-toggle">
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
            </div>}
        </section>
    );
}
