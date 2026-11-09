import { useEffect, useRef, useState } from 'react';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import { CLUB_MEMBER_ROLES } from '../members/club-member-roles';
import {
    DECLARATION_PERMISSIONS,
    toggleDeclarationPermission,
    validateDeclarationPermissionPolicy,
} from './club-declaration-permissions';

export default function DeclarationPermissionEditor({ api, clubId, onClose }) {
    const connected =
        typeof api.getClubStudentDeclarationPermissions === 'function' &&
        typeof api.saveClubStudentDeclarationPermissions === 'function';
    const [policy, setPolicy] = useState(null),
        [draft, setDraft] = useState({}),
        [loading, setLoading] = useState(connected),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [message, setMessage] = useState('');
    const lock = useRef(false),
        requestKey = useRef({});
    useEffect(() => {
        let active = true;
        if (connected)
            api.getClubStudentDeclarationPermissions(clubId)
                .then(
                    (data) => {
                        const value = validateDeclarationPermissionPolicy(data, clubId);
                        if (active) {
                            setPolicy(value);
                            setDraft(Object.fromEntries(value.roles.map((role) => [role.role, role.permissions])));
                        }
                    },
                    (issue) => {
                        throw issue;
                    },
                )
                .catch((issue) => {
                    if (active) setError(issue.message);
                })
                .finally(() => {
                    if (active) setLoading(false);
                });
        return () => {
            active = false;
        };
    }, [api, clubId, connected]);
    const save = async () => {
        if (lock.current || !connected || !policy) return;
        lock.current = true;
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const roles = CLUB_MEMBER_ROLES.filter((role) => !['CLUB_OWNER', 'VICE_PRESIDENT'].includes(role.id)).map(
                (role) => ({ role: role.id, permissions: draft[role.id] || [] }),
            );
            const payload = { expectedVersion: policy.version, roles };
            const signature = JSON.stringify(payload);
            if (requestKey.current.signature !== signature)
                requestKey.current = { signature, value: crypto.randomUUID() };
            const stored = validateDeclarationPermissionPolicy(
                await api.saveClubStudentDeclarationPermissions(clubId, payload, requestKey.current.value),
                clubId,
            );
            if (
                stored.version === policy.version ||
                roles.some(
                    (role) =>
                        JSON.stringify(
                            [...(stored.roles.find((row) => row.role === role.role)?.permissions || [])].sort(),
                        ) !== JSON.stringify([...role.permissions].sort()),
                )
            )
                throw new Error('Chưa xác nhận máy chủ đã lưu đúng phân quyền.');
            setPolicy(stored);
            setMessage('Đã lưu phân quyền. Người được cấp quyền cần tải lại workspace để nhận quyền mới.');
        } catch (issue) {
            setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <V2Modal
            title="Phân quyền trải nghiệm tự khai"
            wide
            onClose={() => {
                if (!busy) onClose();
            }}
        >
            <div className="club-declaration-permissions">
                <p>
                    <strong>Chủ tịch và Phó chủ tịch có đầy đủ quyền.</strong> Các vai trò khác cần được tick quyền “Xử
                    lý trải nghiệm tự khai trong CLB”.
                </p>
                <p>
                    Một quyền bao gồm đọc trải nghiệm và minh chứng, duyệt tại CLB và chuyển lên CTSV. Duyệt tại CLB
                    chưa cộng Xperience Point.
                </p>
                {!connected && (
                    <p className="club-student-declaration-notice" role="status">
                        Chưa thể lưu phân quyền. Các lựa chọn bên dưới chưa có hiệu lực.
                    </p>
                )}
                {loading ? (
                    <p role="status">Đang tải cấu hình phân quyền…</p>
                ) : (
                    <div className="club-declaration-permission-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Vai trò</th>
                                    {DECLARATION_PERMISSIONS.map((permission) => (
                                        <th key={permission.id}>{permission.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {CLUB_MEMBER_ROLES.map((role) => {
                                    const leader = ['CLUB_OWNER', 'VICE_PRESIDENT'].includes(role.id);
                                    const label =
                                        role.id === 'CLUB_OWNER'
                                            ? 'Chủ tịch'
                                            : role.id === 'VICE_PRESIDENT'
                                              ? 'Phó chủ tịch'
                                              : role.label;
                                    return (
                                        <tr key={role.id}>
                                            <th>
                                                {label}
                                                {leader && <small>Mặc định đầy đủ quyền</small>}
                                            </th>
                                            {DECLARATION_PERMISSIONS.map((permission) => (
                                                <td key={permission.id}>
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`${label}: ${permission.label}`}
                                                        checked={
                                                            leader || (draft[role.id] || []).includes(permission.id)
                                                        }
                                                        disabled={leader || busy || (connected && !policy)}
                                                        onChange={(e) => {
                                                            setMessage('');
                                                            setDraft((current) => ({
                                                                ...current,
                                                                [role.id]: toggleDeclarationPermission(
                                                                    current[role.id] || [],
                                                                    permission.id,
                                                                    e.target.checked,
                                                                ),
                                                            }));
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {error && <p role="alert">{error}</p>}
                {message && <p role="status">{message}</p>}
                <div className="club-student-declaration-actions">
                    <button type="button" className="v2-button" disabled={busy} onClick={onClose}>
                        Đóng
                    </button>
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={!connected || !policy || busy}
                        onClick={save}
                    >
                        {busy ? 'Đang lưu…' : 'Lưu phân quyền'}
                    </button>
                </div>
            </div>
        </V2Modal>
    );
}
