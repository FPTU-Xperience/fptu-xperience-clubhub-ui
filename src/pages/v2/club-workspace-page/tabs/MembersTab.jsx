import { useAuth } from '../../../../context/AuthContext';
import { clubCapability } from '../../../../services/club-capabilities';
import ClubGovernance from './members/governance/ClubGovernance';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import MemberManagement from './members/MemberManagement';
import ClubRolesInfo from './members/ClubRolesInfo';

const initials = (name = '') =>
    name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
const roleLabel = (role = '') => (String(role).toUpperCase().includes('TREASURER') ? 'Thủ quỹ' : 'Thành viên');

export default function MembersTab({ manager = false, dashboard, workspace, readOnly = false }) {
    const clubId = workspace?.clubId;
    const { user, clubAccess } = useAuth();
    const access = clubAccess?.find((item) => String(item.clubId) === String(clubId));
    const recruit = !readOnly && clubCapability(access, 'club.members.recruit');
    const summary = dashboard.data;
    const count = summary?.memberCount;
    const members = manager ? summary?.approvedMembers : summary?.publicLeaders;
    const visibleMemberCount = members?.length ?? 0;
    if (manager || readOnly || recruit)
        return (
            <MemberManagement
                key={`${user?.id}:${clubId}:${manager}:${recruit}`}
                clubId={clubId}
                dashboard={dashboard}
                readOnly={readOnly}
                recruitmentOnly={!manager && recruit}
            />
        );
    return (
        <WorkspaceTabLayout
            title="Thành viên CLB"
            description={
                count == null
                    ? 'Danh sách thành viên của CLB.'
                    : manager
                      ? `${count} thành viên đã được duyệt trong CLB.`
                      : `CLB hiện có ${count} thành viên đã được duyệt. Danh sách thành viên không công khai.`
            }
            action={<ClubRolesInfo />}
            records={members || []}
        >
            {(records) => (
                <div className="v2-member-management">
                    <ClubGovernance key={`${user?.id}:${clubId}`} clubId={clubId} readOnly />
                    {dashboard.status === 'loading' && (
                        <p className="v2-workspace-data-note" role="status">
                            Đang tải thành viên…
                        </p>
                    )}
                    {dashboard.status !== 'loading' && count == null && (
                        <p className="v2-workspace-data-note" role="alert">
                            Không tải được số thành viên.{' '}
                            <button type="button" onClick={dashboard.retry}>
                                Thử lại
                            </button>
                        </p>
                    )}
                    {dashboard.status !== 'loading' && count != null && (
                        <section className="v2-preview-members">
                            <header>
                                <span>
                                    {manager
                                        ? `THÀNH VIÊN ĐÃ DUYỆT (${count})`
                                        : `BAN ĐIỀU HÀNH CÔNG KHAI (${visibleMemberCount})`}
                                </span>
                                <span>VAI TRÒ</span>
                                <span>TRẠNG THÁI</span>
                            </header>
                            {records.map((record) => (
                                <article key={manager ? record.id : `${record.name}-${record.role}`}>
                                    <i>{initials(record.name)}</i>
                                    <div>
                                        <strong>{record.name}</strong>
                                        <small>
                                            {manager && record.joinedAt
                                                ? `Đã duyệt ${new Date(record.joinedAt).toLocaleDateString('vi-VN')}`
                                                : 'Được CLB công bố'}
                                        </small>
                                    </div>
                                    <span>{manager ? roleLabel(record.role) : record.role}</span>
                                    <em>{manager ? 'Đã duyệt' : 'Được công bố'}</em>
                                </article>
                            ))}
                            {records.length === 0 && (
                                <p className="v2-workspace-data-note">
                                    {manager ? 'Chưa có thành viên được duyệt.' : 'CLB chưa công bố ban điều hành.'}
                                </p>
                            )}
                        </section>
                    )}
                    {manager && summary?.isRecruiting != null && (
                        <p className="v2-workspace-data-note">
                            Trạng thái tuyển thành viên: {summary.isRecruiting ? 'Đang mở' : 'Đang đóng'}.
                        </p>
                    )}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
