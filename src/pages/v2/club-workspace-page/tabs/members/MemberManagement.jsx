import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import { formatAttendanceStatus } from '../../../../../locales/vi';
import WorkspaceTabLayout from '../WorkspaceTabLayout';
import InviteMemberModal from './InviteMemberModal';
import { projectOwnMemberProfile, useProfile } from '../../../profile-data';
import ClubRolesInfo from './ClubRolesInfo';
import {
    CLUB_MEMBER_ROLES,
    clubMemberRole,
    clubMemberRoleLabel as roleLabel,
    normalizeClubMemberRole,
    supportedClubRoleChange,
} from './club-member-roles';
import './MemberManagement.scss';

const dateLabel = (value) => (value ? new Date(value).toLocaleDateString('vi-VN') : '—');
const statusLabel = { Approved: 'Đã duyệt', Pending: 'Chờ duyệt', Rejected: 'Đã từ chối' };
const rows = (value) => (Array.isArray(value) ? value : value?.items || []);

export default function MemberManagement({ clubId, dashboard }) {
    const { api, user } = useAuth();
    const ownProfile = useProfile(user, String(user?.id || ''), api);
    const [tab, setTab] = useState('members');
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('All');
    const [page, setPage] = useState(1);
    const [version, setVersion] = useState(0);
    const [members, setMembers] = useState(null);
    const [applications, setApplications] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [dialog, setDialog] = useState(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [note, setNote] = useState('');
    const alive = useRef(true);
    const lock = useRef(false);
    const detailVersion = useRef(0);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            detailVersion.current++;
        };
    }, []);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setLoadError('');
        const timer = setTimeout(
            async () => {
                const results = await Promise.allSettled([
                    api.getClubMembers(clubId, {
                        search,
                        role,
                        status: 'Approved',
                        page,
                        pageSize: 10,
                        sortBy: 'name',
                        sortDirection: 'asc',
                    }),
                    api.getClubMemberships(clubId),
                ]);
                if (!active) return;
                setMembers(results[0].status === 'fulfilled' ? results[0].value : null);
                setApplications(results[1].status === 'fulfilled' ? rows(results[1].value) : null);
                setLoadError(
                    results
                        .filter((result) => result.status === 'rejected')
                        .map((result) => result.reason?.message || 'Không thể tải dữ liệu thành viên.')
                        .join(' '),
                );
                setLoading(false);
            },
            search ? 250 : 0,
        );
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [api, clubId, search, role, page, version]);

    const refresh = () => {
        setPage(1);
        setVersion((value) => value + 1);
        dashboard.retry();
    };
    const closeDialog = () => {
        if (lock.current) return;
        detailVersion.current++;
        setDialog(null);
        setError('');
    };
    const openDialog = (kind, member, extra = {}) => {
        if (lock.current) return;
        setError('');
        setNotice('');
        setNote('');
        setDialog({ kind, member, ...extra });
    };
    const openDetail = async (member, historyPage = 1) => {
        if (lock.current) return;
        const request = ++detailVersion.current;
        setError('');
        setDialog({ kind: 'detail', member, loading: true });
        try {
            const detail = await api.getClubMember(clubId, member.id, { historyPage, historyPageSize: 10 });
            if (alive.current && request === detailVersion.current)
                setDialog({
                    kind: 'detail',
                    member: projectOwnMemberProfile(detail.member, user, ownProfile.data),
                    detail,
                });
        } catch (issue) {
            if (alive.current && request === detailVersion.current) {
                setDialog(null);
                setError(issue?.message || 'Không thể tải hồ sơ thành viên.');
            }
        }
    };
    const mutate = async (operation, message) => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await operation();
            if (!alive.current) return;
            setDialog(null);
            setNotice(message);
            refresh();
        } catch (issue) {
            if (alive.current) setError(issue?.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
        } finally {
            lock.current = false;
            if (alive.current) setBusy(false);
        }
    };
    const submit = (event) => {
        event.preventDefault();
        const member = dialog.member;
        if (dialog.kind === 'delete') {
            mutate(() => api.deleteClubMember(clubId, member.id), 'Đã xóa thành viên khỏi CLB.');
        } else if (dialog.kind === 'role') {
            if (!supportedClubRoleChange(member.role, dialog.targetRole)) {
                setError('Vai trò này chưa được backend hỗ trợ phân công.');
                return;
            }
            mutate(
                () =>
                    dialog.targetRole === 'MEMBER'
                        ? api.removeClubTreasurer(member.id)
                        : api.assignClubTreasurer(clubId, member.userId, member.fullName),
                'Đã cập nhật vai trò thành viên.',
            );
        } else if (dialog.kind === 'approve' || dialog.kind === 'reject') {
            mutate(
                () =>
                    dialog.kind === 'approve'
                        ? api.approveClubMembership(member.id, note.trim())
                        : api.rejectClubMembership(member.id, note.trim()),
                dialog.kind === 'approve' ? 'Đã duyệt đơn tham gia.' : 'Đã từ chối đơn tham gia.',
            );
        }
    };
    const pending = applications?.filter((member) => member.status === 'Pending');
    const memberRows = rows(members).map((member) => projectOwnMemberProfile(member, user, ownProfile.data));
    const titles = {
        detail: 'Hồ sơ thành viên',
        delete: 'Xóa thành viên',
        role: 'Đổi vai trò thành viên',
        approve: 'Duyệt đơn tham gia',
        reject: 'Từ chối đơn tham gia',
    };

    return (
        <WorkspaceTabLayout
            title="Thành viên CLB"
            description="Quản lý thành viên và xử lý đơn tham gia ngay trong không gian CLB."
            action={
                <div className="v2-member-header-actions">
                    <ClubRolesInfo disabled={busy} />
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={busy}
                        onClick={() => setInviteOpen(true)}
                    >
                        + Thêm thành viên
                    </button>
                </div>
            }
        >
            {() => (
                <div className="v2-member-management">
                    {inviteOpen && (
                        <InviteMemberModal
                            api={api}
                            clubId={clubId}
                            onClose={() => setInviteOpen(false)}
                            onInvited={(student) => {
                                setInviteOpen(false);
                                setNotice(`Đã gửi lời mời cho ${student.fullName}. Chờ sinh viên chấp nhận.`);
                                refresh();
                            }}
                        />
                    )}
                    <div className="v2-member-switch" aria-label="Quản lý cộng đồng">
                        <button
                            type="button"
                            className="v2-button"
                            aria-pressed={tab === 'members'}
                            onClick={() => setTab('members')}
                        >
                            Quản lý thành viên
                        </button>
                        <button
                            type="button"
                            className="v2-button"
                            aria-pressed={tab === 'applications'}
                            onClick={() => setTab('applications')}
                        >
                            Quản lý đơn{pending ? ` (${pending.length})` : ''}
                        </button>
                    </div>
                    {notice && (
                        <p className="v2-member-notice" role="status">
                            {notice}
                        </p>
                    )}
                    {error && !dialog && (
                        <p className="v2-member-error" role="alert">
                            {error}
                        </p>
                    )}
                    {loadError && (
                        <p className="v2-member-error" role="alert">
                            {loadError}{' '}
                            <button
                                type="button"
                                className="v2-button"
                                disabled={busy}
                                onClick={() => setVersion((value) => value + 1)}
                            >
                                Thử lại
                            </button>
                        </p>
                    )}
                    {tab === 'members' && (
                        <>
                            <div className="v2-member-filters">
                                <input
                                    aria-label="Tìm thành viên"
                                    placeholder="Tìm tên, email hoặc số điện thoại…"
                                    value={search}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                        setPage(1);
                                    }}
                                />
                                <select
                                    aria-label="Lọc vai trò"
                                    value={role}
                                    disabled={busy}
                                    onChange={(event) => {
                                        setRole(event.target.value);
                                        setPage(1);
                                    }}
                                >
                                    <option value="All">Tất cả vai trò</option>
                                    {CLUB_MEMBER_ROLES.filter((item) => item.id !== 'CLUB_OWNER').map((item) => (
                                        <option key={item.id} value={item.id} disabled={!item.supported}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {loading ? (
                                <p role="status">Đang tải thành viên…</p>
                            ) : (
                                members && (
                                    <>
                                        <div className="v2-member-table-wrap">
                                            <table className="v2-member-table">
                                                <thead>
                                                    <tr>
                                                        <th>Thành viên</th>
                                                        <th>Vai trò</th>
                                                        <th>Ngày tham gia</th>
                                                        <th>Tham gia hoạt động</th>
                                                        <th>Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {memberRows.map((member) => (
                                                        <tr key={member.id}>
                                                            <td>
                                                                <strong>{member.fullName}</strong>
                                                                <small>{member.email}</small>
                                                                <small>{member.phoneNumber}</small>
                                                            </td>
                                                            <td>
                                                                {member.role === 'CLUB_OWNER' ? (
                                                                    roleLabel(member.role)
                                                                ) : (
                                                                    <select
                                                                        aria-label={`Vai trò của ${member.fullName}`}
                                                                        value={normalizeClubMemberRole(member.role)}
                                                                        disabled={busy}
                                                                        onChange={(event) =>
                                                                            openDialog('role', member, {
                                                                                targetRole: event.target.value,
                                                                            })
                                                                        }
                                                                    >
                                                                        {!clubMemberRole(member.role) && (
                                                                            <option
                                                                                value={normalizeClubMemberRole(
                                                                                    member.role,
                                                                                )}
                                                                            >
                                                                                {roleLabel(member.role)}
                                                                            </option>
                                                                        )}
                                                                        {CLUB_MEMBER_ROLES.filter(
                                                                            (item) => item.id !== 'CLUB_OWNER',
                                                                        ).map((item) => (
                                                                            <option key={item.id} value={item.id}>
                                                                                {item.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                )}
                                                            </td>
                                                            <td>{dateLabel(member.joinedAtUtc)}</td>
                                                            <td>
                                                                {member.participation?.attendedActivities ?? 0}/
                                                                {member.participation?.eligibleActivities ?? 0}
                                                            </td>
                                                            <td>
                                                                <div className="v2-member-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="v2-button"
                                                                        disabled={busy}
                                                                        onClick={() => openDetail(member)}
                                                                    >
                                                                        Hồ sơ
                                                                    </button>
                                                                    {member.role !== 'CLUB_OWNER' && (
                                                                        <button
                                                                            type="button"
                                                                            className="v2-button"
                                                                            disabled={busy}
                                                                            onClick={() => openDialog('delete', member)}
                                                                        >
                                                                            Xóa
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {!memberRows.length && <p>Không tìm thấy thành viên.</p>}
                                        <div className="v2-member-pagination">
                                            <span>
                                                {members.totalItems ?? memberRows.length} thành viên · Trang {page}/
                                                {Math.max(1, members.totalPages || 1)}
                                            </span>
                                            <button
                                                type="button"
                                                className="v2-button"
                                                disabled={busy || page <= 1}
                                                onClick={() => setPage((value) => value - 1)}
                                            >
                                                Trước
                                            </button>
                                            <button
                                                type="button"
                                                className="v2-button"
                                                disabled={busy || page >= (members.totalPages || 1)}
                                                onClick={() => setPage((value) => value + 1)}
                                            >
                                                Sau
                                            </button>
                                        </div>
                                    </>
                                )
                            )}
                        </>
                    )}
                    {tab === 'applications' &&
                        (loading ? (
                            <p role="status">Đang tải đơn tham gia…</p>
                        ) : (
                            applications && (
                                <section>
                                    <h2>Đơn tham gia chờ duyệt ({pending.length})</h2>
                                    {!pending.length && <p>Không có đơn đang chờ duyệt.</p>}
                                    {pending.map((member) => (
                                        <article className="v2-member-application" key={member.id}>
                                            <div>
                                                <strong>{member.fullName}</strong>
                                                <small>
                                                    {member.email} · {dateLabel(member.requestedAtUtc)}
                                                </small>
                                                <p>{member.reason || member.requestMessage || 'Chưa có lời nhắn.'}</p>
                                            </div>
                                            <div className="v2-member-actions">
                                                <button
                                                    type="button"
                                                    className="v2-button"
                                                    disabled={busy}
                                                    onClick={() => openDetail(member)}
                                                >
                                                    Xem đơn
                                                </button>
                                                <button
                                                    type="button"
                                                    className="v2-button v2-button--primary"
                                                    disabled={
                                                        busy ||
                                                        !member.acceptedClubRules ||
                                                        !member.committedToParticipate
                                                    }
                                                    onClick={() => openDialog('approve', member)}
                                                >
                                                    Duyệt
                                                </button>
                                                <button
                                                    type="button"
                                                    className="v2-button"
                                                    disabled={busy}
                                                    onClick={() => openDialog('reject', member)}
                                                >
                                                    Từ chối
                                                </button>
                                            </div>
                                            {(!member.acceptedClubRules || !member.committedToParticipate) && (
                                                <p>Chờ người đăng ký xác nhận nội quy và cam kết tham gia.</p>
                                            )}
                                        </article>
                                    ))}
                                </section>
                            )
                        ))}
                    {dialog && (
                        <div className="v2-member-dialog">
                            <V2Modal title={titles[dialog.kind]} onClose={closeDialog} wide={dialog.kind === 'detail'}>
                                {dialog.kind === 'detail' ? (
                                    dialog.loading ? (
                                        <p role="status">Đang tải hồ sơ…</p>
                                    ) : (
                                        <>
                                            <h3>{dialog.member.fullName}</h3>
                                            <p>
                                                {dialog.member.profileSource === 'local-self'
                                                    ? 'Hồ sơ cá nhân của bạn dùng cùng dữ liệu tạm với trang profile trên thiết bị này.'
                                                    : 'Thông tin được lưu tại thời điểm đăng ký CLB; chưa đồng bộ với hồ sơ cá nhân hiện tại.'}
                                            </p>
                                            {[
                                                {
                                                    title:
                                                        dialog.member.profileSource === 'local-self'
                                                            ? 'Hồ sơ cá nhân'
                                                            : 'Thông tin tại thời điểm đăng ký',
                                                    fields: [
                                                        ['Email', dialog.member.email],
                                                        ['Điện thoại', dialog.member.phoneNumber],
                                                        ['Địa chỉ', dialog.member.address],
                                                        ['Sở thích', dialog.member.hobbies],
                                                        ['Kỹ năng', dialog.member.skills],
                                                        ...(dialog.member.profileSource === 'local-self'
                                                            ? [['Giới thiệu', dialog.member.profileAbout]]
                                                            : []),
                                                    ],
                                                },
                                                {
                                                    title: 'Thông tin thành viên CLB',
                                                    fields: [
                                                        ['Vai trò', roleLabel(dialog.member.role)],
                                                        [
                                                            'Trạng thái',
                                                            statusLabel[dialog.member.status] || dialog.member.status,
                                                        ],
                                                    ],
                                                },
                                                {
                                                    title: 'Nội dung đơn tham gia',
                                                    fields: [
                                                        [
                                                            'Lý do tham gia',
                                                            dialog.member.reason || dialog.member.requestMessage,
                                                        ],
                                                        ['Kỳ vọng', dialog.member.expectations],
                                                        ['Đóng góp', dialog.member.contributions],
                                                    ],
                                                },
                                            ].map((section) => (
                                                <section key={section.title}>
                                                    <h3>{section.title}</h3>
                                                    <dl className="v2-member-detail">
                                                        {section.fields.map(([label, value]) => (
                                                            <div key={label}>
                                                                <dt>{label}</dt>
                                                                <dd>{value || '—'}</dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </section>
                                            ))}
                                            <h3>Lịch sử hoạt động</h3>
                                            {dialog.detail.activityHistory?.length ? (
                                                <ul className="v2-member-history">
                                                    {dialog.detail.activityHistory.map((activity) => (
                                                        <li key={activity.activityId}>
                                                            <div>
                                                                <strong>{activity.title}</strong>
                                                                <small>{dateLabel(activity.startTimeUtc)}</small>
                                                            </div>
                                                            <span>
                                                                {formatAttendanceStatus(activity.attendanceStatus)}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>Chưa có lịch sử hoạt động.</p>
                                            )}
                                            {dialog.detail.historyTotalPages > 1 && (
                                                <div className="v2-member-actions">
                                                    <button
                                                        type="button"
                                                        className="v2-button"
                                                        disabled={dialog.detail.historyPage <= 1}
                                                        onClick={() =>
                                                            openDetail(dialog.member, dialog.detail.historyPage - 1)
                                                        }
                                                    >
                                                        Trước
                                                    </button>
                                                    <span>
                                                        Trang {dialog.detail.historyPage}/
                                                        {dialog.detail.historyTotalPages}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="v2-button"
                                                        disabled={
                                                            dialog.detail.historyPage >= dialog.detail.historyTotalPages
                                                        }
                                                        onClick={() =>
                                                            openDetail(dialog.member, dialog.detail.historyPage + 1)
                                                        }
                                                    >
                                                        Sau
                                                    </button>
                                                </div>
                                            )}
                                            <footer className="v2-member-actions">
                                                <button type="button" className="v2-button" onClick={closeDialog}>
                                                    Đóng
                                                </button>
                                            </footer>
                                        </>
                                    )
                                ) : (
                                    <form className="v2-member-form" onSubmit={submit} aria-busy={busy}>
                                        <p>{dialog.member.fullName}</p>
                                        {dialog.kind === 'approve' || dialog.kind === 'reject' ? (
                                            <label>
                                                Ghi chú duyệt đơn
                                                <textarea
                                                    value={note}
                                                    maxLength={1000}
                                                    rows={4}
                                                    disabled={busy}
                                                    onChange={(event) => setNote(event.target.value)}
                                                />
                                            </label>
                                        ) : dialog.kind === 'role' ? (
                                            <section className="v2-member-role-proposal">
                                                <h3>{roleLabel(dialog.targetRole)}</h3>
                                                <p>{clubMemberRole(dialog.targetRole)?.responsibilities}</p>
                                                <p>{clubMemberRole(dialog.targetRole)?.permissions}</p>
                                                <p>{clubMemberRole(dialog.targetRole)?.limits}</p>
                                                {!supportedClubRoleChange(dialog.member.role, dialog.targetRole) ? (
                                                    <p role="status">
                                                        Vai trò này chưa thể lưu phân công. Cần bổ sung API và quyền
                                                        tương ứng trước khi áp dụng.
                                                    </p>
                                                ) : (
                                                    <p>
                                                        Xác nhận chuyển từ {roleLabel(dialog.member.role)} sang{' '}
                                                        {roleLabel(dialog.targetRole)}?
                                                    </p>
                                                )}
                                            </section>
                                        ) : (
                                            <p>
                                                {dialog.kind === 'delete'
                                                    ? 'Xóa thành viên khỏi CLB? Lịch sử điểm danh được giữ lại.'
                                                    : dialog.member.role === 'TREASURER'
                                                      ? 'Chuyển thủ quỹ về vai trò thành viên?'
                                                      : 'Chỉ định thành viên làm thủ quỹ? Mỗi CLB có tối đa 2 thủ quỹ.'}
                                            </p>
                                        )}
                                        {error && (
                                            <p className="v2-member-error" role="alert">
                                                {error}
                                            </p>
                                        )}
                                        <footer className="v2-member-actions">
                                            <button
                                                type="button"
                                                className="v2-button"
                                                disabled={busy}
                                                onClick={closeDialog}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                className="v2-button v2-button--primary"
                                                disabled={
                                                    busy ||
                                                    (dialog.kind === 'role' &&
                                                        !supportedClubRoleChange(dialog.member.role, dialog.targetRole))
                                                }
                                            >
                                                {busy ? 'Đang xử lý…' : 'Xác nhận'}
                                            </button>
                                        </footer>
                                    </form>
                                )}
                            </V2Modal>
                        </div>
                    )}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
