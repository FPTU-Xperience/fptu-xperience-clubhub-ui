import { Plus, ShieldCheck, Users, ArrowRightLeft, UserMinus, LockKeyhole } from 'lucide-react';

// Shared presentation for the established board design; callers own data and persistence.
export default function GovernanceGroupCards({ groups, members, permissionLabels, editable, onAction }) {
    const canTransfer = groups.filter((group) => !group.protected).length > 1;
    return (
        <div className="governance-groups">
            {groups.map((group) => (
                <article className={`governance-group${group.protected ? ' is-protected' : ''}`} key={group.id}>
                    <header>
                        <div className="governance-group-icon">
                            {group.protected ? <ShieldCheck size={20} /> : <Users size={20} />}
                        </div>
                        <div>
                            <h3>{group.name}</h3>
                            <small>
                                {group.memberIds.length} thành viên{' '}
                                {group.protected
                                    ? group.memberIds.length
                                        ? '· Vai trò lãnh đạo'
                                        : '· Chờ bổ nhiệm qua CTSV'
                                    : ''}
                            </small>
                        </div>
                        {editable && !group.protected && (
                            <button
                                type="button"
                                className="governance-text-button"
                                aria-label={`Chỉnh sửa group ${group.name}`}
                                onClick={() => onAction({ type: 'saveGroup', groupId: group.id })}
                            >
                                Chỉnh sửa
                            </button>
                        )}
                    </header>
                    <p className="governance-group-description">
                        {String(group.description || '').trim() || 'Chưa có mô tả nhiệm vụ.'}
                    </p>
                    <div className="governance-permission-tags">
                        {group.protected ? (
                            <span>
                                <LockKeyhole size={12} /> Quyền lãnh đạo được bảo vệ
                            </span>
                        ) : (
                            group.permissions.map((id) => <span key={id}>{permissionLabels[id] || id}</span>)
                        )}
                        {!group.protected && !group.permissions.length && <small>Chưa chọn quyền chuyên môn</small>}
                    </div>
                    <div className="governance-group-people">
                        {group.memberIds.map((id) => {
                            const member = members.find((person) => String(person.id) === String(id));
                            if (!member) return null;
                            return (
                                <div className="governance-person-row" key={id}>
                                    <span className="governance-avatar">
                                        {member.name
                                            .trim()
                                            .split(/\s+/)
                                            .slice(-2)
                                            .map((part) => part[0])
                                            .join('')}
                                    </span>
                                    <span>
                                        <strong>{member.name}</strong>
                                        {member.code && <small>{member.code}</small>}
                                    </span>
                                    {editable && !group.protected && (
                                        <div className="governance-person-actions">
                                            <button
                                                type="button"
                                                disabled={!canTransfer}
                                                aria-label={`Luân chuyển ${member.name} từ ${group.name}`}
                                                title={canTransfer ? 'Luân chuyển' : 'Chưa có nhóm nhận'}
                                                onClick={() =>
                                                    onAction({ type: 'transfer', groupId: group.id, memberId: id })
                                                }
                                            >
                                                <ArrowRightLeft size={15} />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Gỡ ${member.name} khỏi ${group.name}`}
                                                title="Gỡ phân công"
                                                onClick={() =>
                                                    onAction({ type: 'remove', groupId: group.id, memberId: id })
                                                }
                                            >
                                                <UserMinus size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {!group.memberIds.length && <p className="governance-muted">Chưa có người trong group.</p>}
                    </div>
                    {editable && group.protected && group.canNominate !== false && (
                        <footer>
                            <button
                                type="button"
                                className="governance-text-button"
                                onClick={() => onAction({ type: 'nominate', role: group.duty, groupId: group.id })}
                            >
                                {group.nominationLabel || 'Đề nghị bổ nhiệm'}
                            </button>
                        </footer>
                    )}
                    {editable && !group.protected && (
                        <footer>
                            <button
                                type="button"
                                className="governance-text-button"
                                onClick={() => onAction({ type: 'assign', groupId: group.id })}
                            >
                                <Plus size={15} /> Thêm người
                            </button>
                            <button
                                type="button"
                                className="governance-text-button governance-danger"
                                onClick={() => onAction({ type: 'deleteGroup', groupId: group.id })}
                            >
                                Giải thể group
                            </button>
                        </footer>
                    )}
                </article>
            ))}
        </div>
    );
}
