import { useState } from 'react';
import V2Modal from '../../../../../../components/v2/common/modal/V2Modal';
import {
    governanceDisplayText,
    PREVIEW_MEMBERS,
    PREVIEW_PERMISSIONS,
    PREVIEW_PRESETS,
} from './governance-preview-data';

export default function GovernanceActionModal({ dialog, period, onClose, onSave }) {
    const group = period.groups.find((g) => g.id === dialog.groupId);
    const [name, setName] = useState(group?.name || '');
    const [description, setDescription] = useState(group?.description || '');
    const [presetId, setPreset] = useState(group?.duty === 'TREASURER' ? 'TREASURER' : 'CUSTOM');
    const [permissions, setPermissions] = useState(group?.permissions || []);
    const [memberIds, setMembers] = useState([]);
    const [destinationId, setDestination] = useState('');
    const [memberId, setMember] = useState('');
    const [role, setRole] = useState(dialog.role || 'VICE_PRESIDENT');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const titles = {
        saveGroup: group ? `Chỉnh sửa ${group.name}` : 'Tạo group mới',
        assign: `Thêm người vào ${group?.name}`,
        transfer: 'Luân chuyển group',
        remove: 'Gỡ phân công',
        deleteGroup: 'Giải thể group',
        report: 'Nộp báo cáo BQL',
        viewReport: 'Báo cáo BQL đã nộp',
        nominate: 'Đề nghị bổ nhiệm lãnh đạo',
    };
    const person = PREVIEW_MEMBERS.find((m) => m.id === dialog.memberId);
    const reportGroups = dialog.report?.groups || period.groups;
    function submit(event) {
        event.preventDefault();
        try {
            if (dialog.type === 'assign' && !memberIds.length) throw new Error('Chọn ít nhất một người.');
            onSave({
                ...dialog,
                name,
                description,
                presetId,
                permissions,
                memberIds,
                destinationId,
                memberId: dialog.memberId || memberId,
                role,
                reason,
                expectedRevision: period.revision,
            });
        } catch (issue) {
            setError(issue.message);
        }
    }
    return (
        <V2Modal title={titles[dialog.type]} onClose={onClose} wide className="governance-modal">
            <form className="governance-form" onSubmit={submit}>
                {dialog.type === 'saveGroup' && (
                    <>
                        <div className="governance-form-pair">
                            <label>
                                Tên group
                                <input
                                    required
                                    maxLength={80}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ví dụ: Thủ quỹ"
                                />
                            </label>
                            <label>
                                Vai trò có sẵn
                                <select
                                    value={presetId}
                                    onChange={(e) => {
                                        const preset = PREVIEW_PRESETS.find((p) => p.id === e.target.value);
                                        setPreset(preset.id);
                                        setPermissions([...preset.permissions]);
                                        if (!name) setName(preset.id === 'CUSTOM' ? '' : preset.label);
                                    }}
                                >
                                    {PREVIEW_PRESETS.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                        <label>
                            Mô tả
                            <textarea
                                rows={2}
                                maxLength={300}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Nhiệm vụ của group trong kỳ"
                            />
                        </label>
                        <fieldset>
                            <legend>Quyền hạn của group</legend>
                            <p className="governance-muted">
                                Chọn những quyền cần cho nhiệm vụ. Chủ nhiệm/Phó chủ nhiệm được bổ nhiệm qua CTSV.
                            </p>
                            <div className="governance-permission-grid">
                                {[...new Set(PREVIEW_PERMISSIONS.map((p) => p.area))].map((area) => (
                                    <div key={area}>
                                        <strong>{area}</strong>
                                        {PREVIEW_PERMISSIONS.filter((p) => p.area === area).map((p) => (
                                            <label className="governance-check" key={p.id}>
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.includes(p.id)}
                                                    onChange={(e) =>
                                                        setPermissions(
                                                            e.target.checked
                                                                ? [...permissions, p.id]
                                                                : permissions.filter((id) => id !== p.id),
                                                        )
                                                    }
                                                />
                                                {p.label}
                                            </label>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </fieldset>
                    </>
                )}
                {dialog.type === 'assign' && (
                    <>
                        <p>Thêm người để kiêm nhiệm trong group này. Các group đang có được giữ nguyên.</p>
                        <label>
                            Tìm thành viên
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tên hoặc mã thành viên"
                            />
                        </label>
                        <div className="governance-picker">
                            {PREVIEW_MEMBERS.filter((m) =>
                                `${m.name} ${m.code}`.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')),
                            ).map((m) => {
                                const existing = group.memberIds.includes(m.id);
                                const groups = period.groups.filter((g) => g.memberIds.includes(m.id));
                                return (
                                    <label className="governance-person-choice" key={m.id}>
                                        <input
                                            type="checkbox"
                                            disabled={existing}
                                            checked={existing || memberIds.includes(m.id)}
                                            onChange={(e) =>
                                                setMembers(
                                                    e.target.checked
                                                        ? [...memberIds, m.id]
                                                        : memberIds.filter((id) => id !== m.id),
                                                )
                                            }
                                        />
                                        <span>
                                            <strong>{m.name}</strong>
                                            <small>
                                                {m.code} · {groups.map((g) => g.name).join(', ') || 'Thành viên thường'}
                                                {existing ? ' · Đã trong group' : ''}
                                            </small>
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="governance-muted">{memberIds.length} người được chọn</p>
                    </>
                )}
                {dialog.type === 'transfer' && (
                    <>
                        <p>
                            <strong>{person?.name}</strong> sẽ rời <strong>{group.name}</strong> và vào group đích. Các
                            group khác giữ nguyên.
                        </p>
                        <label>
                            Group đích
                            <select required value={destinationId} onChange={(e) => setDestination(e.target.value)}>
                                <option value="">Chọn group</option>
                                {period.groups
                                    .filter((g) => !g.protected && g.id !== group.id)
                                    .map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.name}
                                        </option>
                                    ))}
                            </select>
                        </label>
                    </>
                )}
                {dialog.type === 'remove' && (
                    <p>
                        Gỡ <strong>{person?.name}</strong> khỏi <strong>{group.name}</strong>. Lịch sử được giữ; quyền
                        từ các group khác vẫn còn.
                    </p>
                )}
                {dialog.type === 'deleteGroup' && (
                    <p>
                        Giải thể <strong>{group.name}</strong> và kết thúc {group.memberIds.length} phân công. Lịch sử
                        của group và các thành viên được giữ.
                    </p>
                )}
                {dialog.type === 'nominate' && (
                    <>
                        <p>Đề nghị bổ nhiệm cần CTSV duyệt trước khi quyền lãnh đạo có hiệu lực.</p>
                        <div className="governance-form-pair">
                            <label>
                                Vị trí
                                <select value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="VICE_PRESIDENT">Phó chủ nhiệm</option>
                                    <option value="CLUB_OWNER">Chủ nhiệm (chuyển giao)</option>
                                </select>
                            </label>
                            <label>
                                Thành viên
                                <select required value={memberId} onChange={(e) => setMember(e.target.value)}>
                                    <option value="">Chọn thành viên</option>
                                    {PREVIEW_MEMBERS.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </>
                )}
                {['report', 'viewReport'].includes(dialog.type) && (
                    <>
                        <p>
                            {dialog.type === 'report'
                                ? 'Nộp báo cáo lưu cơ cấu tại thời điểm này; không thay đổi quyền, không chờ duyệt toàn bộ BQL.'
                                : `Bản nộp #${dialog.report.number} · Cơ cấu v${dialog.report.sourceRevision}`}
                        </p>
                        <div className="governance-report-preview">
                            {reportGroups.map((g) => (
                                <article key={g.id}>
                                    <strong>{g.name}</strong>
                                    <p>
                                        {g.memberIds
                                            .map((id) => PREVIEW_MEMBERS.find((m) => m.id === id)?.name)
                                            .join(', ') || 'Chưa phân công'}
                                    </p>
                                    <small>
                                        {g.permissions
                                            .map((id) => PREVIEW_PERMISSIONS.find((p) => p.id === id)?.label)
                                            .join(' · ') || 'Chưa cấp quyền chuyên môn'}
                                    </small>
                                </article>
                            ))}
                        </div>
                        {period.nominations.length > 0 && dialog.type === 'report' && (
                            <p className="governance-muted">
                                Có {period.nominations.length} đề nghị lãnh đạo chờ duyệt, chưa thuộc cơ cấu hiệu lực.
                            </p>
                        )}
                    </>
                )}
                {dialog.type !== 'viewReport' && (
                    <label>
                        Lý do / ghi chú
                        <textarea
                            required
                            maxLength={500}
                            rows={2}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ghi lý do để tra cứu lịch sử sau này"
                        />
                    </label>
                )}
                {dialog.type === 'viewReport' && (
                    <p className="governance-muted">{governanceDisplayText(dialog.report.reason)}</p>
                )}
                {error && (
                    <p className="governance-error" role="alert">
                        {error}
                    </p>
                )}
                <footer className="governance-actions">
                    <button type="button" className="v2-button" onClick={onClose}>
                        {dialog.type === 'viewReport' ? 'Đóng' : 'Hủy'}
                    </button>
                    {dialog.type !== 'viewReport' && (
                        <button type="submit" className="v2-button v2-button--primary">
                            {dialog.type === 'report'
                                ? 'Nộp báo cáo'
                                : dialog.type === 'nominate'
                                  ? 'Lưu đề nghị'
                                  : 'Lưu thay đổi'}
                        </button>
                    )}
                </footer>
            </form>
        </V2Modal>
    );
}
