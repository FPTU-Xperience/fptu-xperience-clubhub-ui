import { useWorkspaceSemester } from '../../../WorkspaceSemesterContext';
import { useRef, useState } from 'react';
import { Plus, ShieldCheck, Users, History, FileText, ArrowRightLeft, UserMinus, LockKeyhole } from 'lucide-react';
import GovernanceActionModal from './GovernanceActionModal';
import GovernanceHistoryPanel from './GovernanceHistoryPanel';
import GovernanceReportsPanel from './GovernanceReportsPanel';
import V2Modal from '../../../../../../components/v2/common/modal/V2Modal';
import {
    applyGovernancePreview,
    governanceDisplayText,
    PREVIEW_MEMBERS,
    PREVIEW_PERMISSIONS,
    PREVIEW_SEMESTERS,
    previewStorageKey,
    readGovernancePreview,
} from './governance-preview-data';
import './ClubGovernancePreview.scss';

export default function ClubGovernancePreview({ actorId, actorName = 'Người thực hiện', clubId }) {
    const key = previewStorageKey(actorId, clubId);
    const [state, setState] = useState(() => {
        try {
            return readGovernancePreview(globalThis.localStorage, key);
        } catch {
            return readGovernancePreview(null, key);
        }
    });
    const latest = useRef(state);
    const { semester } = useWorkspaceSemester();
    const semesterId = semester?.code || semester?.id;
    const [panel, setPanel] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const period = state.periods[semesterId];
    const editable = PREVIEW_SEMESTERS.find((s) => s.id === semesterId)?.editable === true;
    const open = (value) => {
        setError('');
        setNotice('');
        setPanel(null);
        setDialog(value);
    };
    function save(command) {
        const next = applyGovernancePreview(latest.current, semesterId, command, {
            id: crypto.randomUUID(),
            actor: actorName,
            at: new Date().toISOString(),
        });
        try {
            localStorage.setItem(key, JSON.stringify(next));
        } catch {
            throw new Error('Không lưu được thay đổi. Kiểm tra dung lượng hoặc chế độ lưu trữ.');
        }
        latest.current = next;
        setState(next);
        setDialog(null);
        if (command.returnPanel) setPanel(command.returnPanel);
        setNotice(
            command.type === 'report'
                ? 'Đã lưu báo cáo BQL.'
                : command.type === 'nominate'
                  ? 'Đã lưu đề nghị bổ nhiệm, chờ CTSV duyệt.'
                  : 'Đã lưu thay đổi và lịch sử phân công.',
        );
    }
    if (!period) return <p className="v2-workspace-data-note">Chưa có cơ cấu BQL cho học kỳ đang chọn.</p>;
    return (
        <section className="club-governance-preview">
            <div className="governance-toolbar">
                <div className="governance-toolbar-actions">
                    <button type="button" className="v2-button" onClick={() => setPanel('history')}>
                        <History size={16} /> Lịch sử
                    </button>
                    <button type="button" className="v2-button" onClick={() => setPanel('reports')}>
                        <FileText size={16} /> Báo cáo theo kỳ
                    </button>
                    {editable && (
                        <button
                            type="button"
                            className="v2-button v2-button--primary"
                            onClick={() => open({ type: 'saveGroup' })}
                        >
                            <Plus size={16} /> Tạo group
                        </button>
                    )}
                </div>
            </div>
            {notice && (
                <p className="governance-notice" role="status">
                    {notice}
                </p>
            )}
            {error && (
                <p role="alert" className="governance-error">
                    {error}
                </p>
            )}
            {!editable && (
                <p className="governance-muted">
                    Kỳ đã lưu trữ. Bạn có thể xem cơ cấu và báo cáo; các thao tác chỉnh sửa đã khóa.
                </p>
            )}
            <>
                {!!period.nominations.length && (
                    <div className="governance-nominations">
                        <strong>Đề nghị đang chờ CTSV · Chưa có quyền lãnh đạo</strong>
                        {period.nominations.map((n) => (
                            <p key={n.id}>
                                {PREVIEW_MEMBERS.find((m) => m.id === n.memberId)?.name} →{' '}
                                {n.role === 'CLUB_OWNER' ? 'Chủ nhiệm' : 'Phó chủ nhiệm'} · {n.reason}
                            </p>
                        ))}
                    </div>
                )}
                <div className="governance-groups">
                    {period.groups.map((group) => (
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
                                        onClick={() => open({ type: 'saveGroup', groupId: group.id })}
                                        aria-label={`Chỉnh sửa group ${group.name}`}
                                    >
                                        Chỉnh sửa
                                    </button>
                                )}
                            </header>
                            <p className="governance-group-description">
                                {governanceDisplayText(group.description) || 'Chưa có mô tả nhiệm vụ.'}
                            </p>
                            <div className="governance-permission-tags">
                                {group.protected ? (
                                    <span>
                                        <LockKeyhole size={12} /> Quyền lãnh đạo được bảo vệ
                                    </span>
                                ) : (
                                    group.permissions.map((id) => (
                                        <span key={id}>
                                            {PREVIEW_PERMISSIONS.find((p) => p.id === id)?.label || id}
                                        </span>
                                    ))
                                )}
                                {!group.permissions.length && <small>Chưa chọn quyền chuyên môn</small>}
                            </div>
                            <div className="governance-group-people">
                                {group.memberIds.map((id) => {
                                    const member = PREVIEW_MEMBERS.find((m) => m.id === id);
                                    return (
                                        <div className="governance-person-row" key={id}>
                                            <span className="governance-avatar">
                                                {member.name
                                                    .split(' ')
                                                    .slice(-2)
                                                    .map((s) => s[0])
                                                    .join('')}
                                            </span>
                                            <span>
                                                <strong>{member.name}</strong>
                                                <small>{member.code}</small>
                                            </span>
                                            {editable && !group.protected && (
                                                <div className="governance-person-actions">
                                                    <button
                                                        type="button"
                                                        aria-label={`Luân chuyển ${member.name} từ ${group.name}`}
                                                        title="Luân chuyển"
                                                        onClick={() =>
                                                            open({
                                                                type: 'transfer',
                                                                groupId: group.id,
                                                                memberId: id,
                                                            })
                                                        }
                                                    >
                                                        <ArrowRightLeft size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Gỡ ${member.name} khỏi ${group.name}`}
                                                        title="Gỡ phân công"
                                                        onClick={() =>
                                                            open({
                                                                type: 'remove',
                                                                groupId: group.id,
                                                                memberId: id,
                                                            })
                                                        }
                                                    >
                                                        <UserMinus size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {!group.memberIds.length && (
                                    <p className="governance-muted">Chưa có người trong group.</p>
                                )}
                            </div>
                            {editable && group.protected && (
                                <footer>
                                    <button
                                        type="button"
                                        className="governance-text-button"
                                        onClick={() => open({ type: 'nominate', role: group.duty })}
                                    >
                                        Đề nghị bổ nhiệm
                                    </button>
                                </footer>
                            )}
                            {editable && !group.protected && (
                                <footer>
                                    <button
                                        type="button"
                                        className="governance-text-button"
                                        onClick={() => open({ type: 'assign', groupId: group.id })}
                                    >
                                        <Plus size={15} /> Thêm người
                                    </button>
                                    <button
                                        type="button"
                                        className="governance-text-button governance-danger"
                                        onClick={() => open({ type: 'deleteGroup', groupId: group.id })}
                                    >
                                        Giải thể group
                                    </button>
                                </footer>
                            )}
                        </article>
                    ))}
                </div>
            </>
            {panel && (
                <V2Modal
                    title={panel === 'history' ? 'Lịch sử phân công' : 'Báo cáo BQL theo kỳ'}
                    onClose={() => setPanel(null)}
                    wide
                    className="governance-sheet"
                >
                    <div className="governance-sheet-period">
                        {PREVIEW_SEMESTERS.find((semester) => semester.id === semesterId).label}
                    </div>
                    {panel === 'history' ? (
                        <GovernanceHistoryPanel key={semesterId} period={period} />
                    ) : (
                        <GovernanceReportsPanel period={period} editable={editable} onAction={open} />
                    )}
                </V2Modal>
            )}
            {dialog && (
                <GovernanceActionModal
                    key={dialog.type + (dialog.groupId || '')}
                    dialog={dialog}
                    period={period}
                    onClose={() => {
                        setDialog(null);
                        if (dialog.returnPanel) setPanel(dialog.returnPanel);
                    }}
                    onSave={save}
                />
            )}
        </section>
    );
}
