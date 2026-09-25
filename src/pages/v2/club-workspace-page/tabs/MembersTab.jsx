import { useState } from 'react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

const roleOptions = [
    'Chủ nhiệm',
    'Phó chủ nhiệm',
    'Trưởng ban kỹ thuật',
    'Trưởng ban nội dung',
    'Thủ quỹ',
    'Thành viên',
];

export default function MembersTab({ manager = false }) {
    const [roles, setRoles] = useState(() =>
        Object.fromEntries(workspacePreviewRecords['Thành viên'].map((member) => [member.title, member.status])),
    );

    return (
        <WorkspaceTabLayout
            title="Thành viên CLB"
            description="Kết nối với những người đang cùng xây dựng cộng đồng."
            action="Xem đơn tham gia"
            records={workspacePreviewRecords['Thành viên']}
        >
            {(records) => (
                <>
                    <section className="v2-preview-members">
                        <header>
                            <span>THÀNH VIÊN</span>
                            <span>VAI TRÒ</span>
                            <span>TRẠNG THÁI</span>
                        </header>
                        {records.map((record) => (
                            <article key={record.title}>
                                <i>{record.tag}</i>
                                <div>
                                    <strong>{record.title}</strong>
                                    <small>{record.meta}</small>
                                </div>
                                {manager ? (
                                    <label className="v2-member-role-select">
                                        <span className="sr-only">Vai trò của {record.title}</span>
                                        <select
                                            value={roles[record.title] || 'Thành viên'}
                                            onChange={(event) =>
                                                setRoles((current) => ({
                                                    ...current,
                                                    [record.title]: event.target.value,
                                                }))
                                            }
                                        >
                                            {roleOptions.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                ) : (
                                    <span>{roles[record.title] || record.status}</span>
                                )}
                                <em>Đang hoạt động</em>
                            </article>
                        ))}
                    </section>
                    {manager && (
                        <section className="v2-preview-member-settings" aria-labelledby="member-settings-title">
                            <h2 id="member-settings-title">Tuyển thành viên</h2>
                            <div className="v2-preview-settings">
                                {workspacePreviewRecords['Cài đặt thành viên'].map((record) => (
                                    <article key={record.title}>
                                        <div>
                                            <h3>{record.title}</h3>
                                            <p>{record.meta}</p>
                                        </div>
                                        <label className="v2-preview-toggle">
                                            <input type="checkbox" defaultChecked aria-label="Đang tuyển thành viên" />{' '}
                                            <span />
                                        </label>
                                    </article>
                                ))}
                            </div>
                            <p className="v2-preview-role-note">
                                Vai trò được đổi trực tiếp tại từng thành viên. Dữ liệu minh họa chỉ áp dụng trong phiên
                                xem trước.
                            </p>
                        </section>
                    )}
                </>
            )}
        </WorkspaceTabLayout>
    );
}
