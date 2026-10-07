import { Link } from 'react-router-dom';
import WorkspaceTabLayout from './WorkspaceTabLayout';

const initials = (name = '') => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
const roleLabel = (role = '') => String(role).toUpperCase().includes('TREASURER') ? 'Thủ quỹ' : 'Thành viên';

export default function MembersTab({ manager = false, dashboard, workspace }) {
    const clubId = workspace?.clubId;
    const summary = dashboard.data;
    const count = summary?.memberCount;
    const members = manager ? summary?.approvedMembers : summary?.publicLeaders;
    const visibleMemberCount = members?.length ?? 0;
    return (
        <WorkspaceTabLayout
            title="Thành viên CLB"
            description={count == null
                ? 'Danh sách thành viên của CLB.'
                : manager
                    ? `${count} thành viên đã được duyệt trong CLB.`
                    : `CLB hiện có ${count} thành viên đã được duyệt. Danh sách thành viên không công khai.`}
            action={manager ? <Link className="v2-button v2-button--primary" to={`/clubs/${encodeURIComponent(clubId)}/members`}>Quản lý thành viên</Link> : null}
            records={members || []}
        >
            {(records) => (
                <>
                    {dashboard.status === 'loading' && <p className="v2-workspace-data-note" role="status">Đang tải thành viên…</p>}
                    {dashboard.status !== 'loading' && count == null && <p className="v2-workspace-data-note" role="alert">Không tải được số thành viên. <button type="button" onClick={dashboard.retry}>Thử lại</button></p>}
                    {dashboard.status !== 'loading' && count != null && (
                        <section className="v2-preview-members">
                            <header>
                                <span>{manager ? `THÀNH VIÊN ĐÃ DUYỆT (${count})` : `BAN ĐIỀU HÀNH CÔNG KHAI (${visibleMemberCount})`}</span>
                                <span>VAI TRÒ</span>
                                <span>TRẠNG THÁI</span>
                            </header>
                            {records.map((record) => (
                                <article key={manager ? record.id : `${record.name}-${record.role}`}>
                                    <i>{initials(record.name)}</i>
                                    <div>
                                        <strong>{record.name}</strong>
                                        <small>{manager && record.joinedAt
                                            ? `Đã duyệt ${new Date(record.joinedAt).toLocaleDateString('vi-VN')}`
                                            : 'Được CLB công bố'}</small>
                                    </div>
                                    <span>{manager ? roleLabel(record.role) : record.role}</span>
                                    <em>{manager ? 'Đã duyệt' : 'Được công bố'}</em>
                                </article>
                            ))}
                            {records.length === 0 && <p className="v2-workspace-data-note">{manager ? 'Chưa có thành viên được duyệt.' : 'CLB chưa công bố ban điều hành.'}</p>}
                        </section>
                    )}
                    {manager && summary?.pendingMemberships?.length > 0 && (
                        <section className="v2-workspace-pending-members">
                            <h2>Đơn tham gia chờ duyệt ({summary.pendingMemberships.length})</h2>
                            <p>{summary.pendingMemberships.map((member) => member.name).join(', ')}</p>
                            <Link to={`/clubs/${encodeURIComponent(clubId)}/members`}>Xem và xử lý đơn</Link>
                        </section>
                    )}
                    {manager && summary?.isRecruiting != null && (
                        <p className="v2-workspace-data-note">Trạng thái tuyển thành viên: {summary.isRecruiting ? 'Đang mở' : 'Đang đóng'}.</p>
                    )}
                </>
            )}
        </WorkspaceTabLayout>
    );
}
