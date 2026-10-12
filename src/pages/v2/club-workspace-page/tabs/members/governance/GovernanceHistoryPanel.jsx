import { useState } from 'react';
import { governanceDisplayText, PREVIEW_MEMBERS, PREVIEW_PERMISSIONS } from './governance-preview-data';

export const governanceDate = (value) =>
    new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' });
const labels = {
    saveGroup: 'Cập nhật group / quyền',
    assign: 'Thêm phân công',
    transfer: 'Luân chuyển',
    remove: 'Gỡ phân công',
    deleteGroup: 'Giải thể group',
    nominate: 'Đề nghị lãnh đạo · Chờ CTSV',
};
const groupNames = (groups) => groups.map((g) => g.name).join(' + ') || 'Thành viên thường';
export default function GovernanceHistoryPanel({ period }) {
    const [memberId, setMember] = useState('');
    const [type, setType] = useState('');
    const events = [...period.history]
        .reverse()
        .filter((e) => (memberId ? e.memberId === memberId : !e.memberId || e.type === 'nominate'))
        .filter((e) => !type || e.type === type);
    return (
        <section className="governance-history">
            <div className="governance-section-heading">
                <div>
                    <h3>Lịch sử thay đổi trong kỳ</h3>
                    <p>Mỗi lần lưu đều được ghi lại, kể cả chưa nộp báo cáo.</p>
                </div>
                <div className="governance-filters">
                    <label className="governance-sr-only" htmlFor="governance-history-person">
                        Lọc lịch sử theo thành viên
                    </label>
                    <select id="governance-history-person" value={memberId} onChange={(e) => setMember(e.target.value)}>
                        <option value="">Tất cả thay đổi</option>
                        {PREVIEW_MEMBERS.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                    <label className="governance-sr-only" htmlFor="governance-history-type">
                        Lọc loại thay đổi
                    </label>
                    <select id="governance-history-type" value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="">Tất cả thao tác</option>
                        {Object.entries(labels).map(([id, label]) => (
                            <option key={id} value={id}>
                                {label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {!events.length && <div className="governance-empty">Chưa có thay đổi phù hợp.</div>}
            <ol className="governance-timeline">
                {events.map((event) => {
                    const previousPermissions = event.memberId
                        ? event.permissionsBefore
                        : event.groupBefore?.permissions || [];
                    const currentPermissions = event.memberId
                        ? event.permissionsAfter
                        : event.groupAfter?.permissions || [];
                    const added = currentPermissions.filter((p) => !previousPermissions.includes(p));
                    const removed = previousPermissions.filter((p) => !currentPermissions.includes(p));
                    const label = (id) => PREVIEW_PERMISSIONS.find((p) => p.id === id)?.label || id;
                    return (
                        <li key={event.id}>
                            <div className="governance-timeline-dot" />
                            <article>
                                <header>
                                    <strong>{labels[event.type]}</strong>
                                    <time dateTime={event.at}>{governanceDate(event.at)}</time>
                                </header>
                                <p>
                                    {event.memberId ? (
                                        <>
                                            <b>{PREVIEW_MEMBERS.find((m) => m.id === event.memberId)?.name}</b> ·{' '}
                                            {groupNames(event.before)} → {groupNames(event.after)}
                                        </>
                                    ) : (
                                        event.groupName
                                    )}
                                </p>
                                {!!added.length && (
                                    <p className="governance-granted">Quyền thêm: {added.map(label).join(', ')}</p>
                                )}
                                {!!removed.length && (
                                    <p className="governance-revoked">Quyền gỡ: {removed.map(label).join(', ')}</p>
                                )}
                                <small>{governanceDisplayText(event.reason)}</small>
                                <footer>
                                    {governanceDisplayText(event.actor)} · Cơ cấu v{event.revision}
                                </footer>
                            </article>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
