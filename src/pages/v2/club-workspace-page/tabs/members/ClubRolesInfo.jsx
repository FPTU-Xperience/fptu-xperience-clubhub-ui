import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import { CLUB_MEMBER_ROLES, CLUB_ROLE_PERMISSION_COLUMNS, clubRoleHasResponsibility } from './club-member-roles';
import './ClubRolesInfo.scss';

export function ClubRolesInfoModal({ onClose }) {
    return (
        <div className="v2-club-role-info">
            <V2Modal title="Vai trò, trách nhiệm và quyền hạn" onClose={onClose} wide>
                <div className="v2-club-role-table-wrap" tabIndex={0} aria-label="Bảng vai trò có thể cuộn ngang">
                    <table className="v2-club-role-table">
                        <thead>
                            <tr>
                                <th scope="col">Vai trò</th>
                                {CLUB_ROLE_PERMISSION_COLUMNS.map((permission) => (
                                    <th scope="col" key={permission.id}>
                                        {permission.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {CLUB_MEMBER_ROLES.map((role) => (
                                <tr key={role.id}>
                                    <th scope="row">
                                        <strong>{role.label}</strong>
                                        <small>{role.group}</small>
                                    </th>
                                    {CLUB_ROLE_PERMISSION_COLUMNS.map((permission) => {
                                        const included = clubRoleHasResponsibility(role.id, permission.id);
                                        return (
                                            <td
                                                key={permission.id}
                                                className="v2-club-role-permission"
                                                aria-label={`${role.label}: ${permission.label} — ${included ? 'Trong phạm vi được phân công' : 'Không thuộc phạm vi'}`}
                                                title={included ? role.permissions : 'Không thuộc phạm vi vai trò'}
                                            >
                                                {included ? (
                                                    <span className="v2-club-role-check">
                                                        <Check size={18} aria-hidden="true" />
                                                    </span>
                                                ) : (
                                                    <span className="v2-club-role-empty" aria-hidden="true">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </V2Modal>
        </div>
    );
}

export default function ClubRolesInfo({ disabled = false }) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                className="v2-club-role-info-button"
                aria-label="Xem trách nhiệm và quyền hạn của các vai trò"
                title="Trách nhiệm và quyền hạn"
                aria-haspopup="dialog"
                disabled={disabled}
                onClick={() => setOpen(true)}
            >
                <Info size={17} aria-hidden="true" />
            </button>
            {open && <ClubRolesInfoModal onClose={() => setOpen(false)} />}
        </>
    );
}
