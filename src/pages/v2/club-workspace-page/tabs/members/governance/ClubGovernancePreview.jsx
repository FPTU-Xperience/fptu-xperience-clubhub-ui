import { useWorkspaceSemester } from '../../../WorkspaceSemesterContext';
import { useRef, useState } from 'react';
import { Plus, History, FileText } from 'lucide-react';
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
import GovernanceGroupCards from './GovernanceGroupCards';

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
                <GovernanceGroupCards
                    groups={period.groups}
                    members={PREVIEW_MEMBERS}
                    permissionLabels={Object.fromEntries(
                        PREVIEW_PERMISSIONS.map((permission) => [permission.id, permission.label]),
                    )}
                    editable={editable}
                    onAction={open}
                />
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
