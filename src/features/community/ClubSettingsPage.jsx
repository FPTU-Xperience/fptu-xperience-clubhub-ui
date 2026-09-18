import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { FormField } from '../../components/ui/FormField';
import { PageHeading } from '../../components/ui/Headings';

export function ClubSettingsPage() {
    const { state, act } = useClubHub();
    const { clubId, club, term, archived } = useWorkspace();

    return (
        <>
            <PageHeading
                eyebrow="CÁ TÍNH RIÊNG CỦA CỘNG ĐỒNG"
                title="Cài đặt CLB"
                description="Nội dung này sẽ hiển thị trên trang giới thiệu công khai của CLB."
            />
            <section className="dx-panel dx-form-panel">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const d = Object.fromEntries(new FormData(e.currentTarget));
                        act('settings', clubId, term, {
                            description: d.description,
                            recruiting: d.recruiting === 'on',
                        });
                    }}
                >
                    <FormField label="Tên CLB" value={club.fullName} readOnly />
                    <FormField
                        label="Giới thiệu ngắn"
                        name="description"
                        defaultValue={state.settings[clubId]?.description ?? club.description}
                        textarea
                        rows={5}
                        required
                        maxLength={1000}
                        disabled={archived}
                    />
                    <label className="dx-checkbox">
                        <input
                            name="recruiting"
                            type="checkbox"
                            defaultChecked={state.settings[clubId]?.recruiting ?? club.recruiting}
                            disabled={archived}
                        />
                        Đang mở tuyển thành viên
                    </label>
                    <div className="dx-banner">
                        <ShieldCheck size={18} />
                        Quyền quản lý, học kỳ và phân bổ thủ quỹ được quản lý theo quy chế CTSV.
                    </div>
                    <button disabled={archived} className="dx-button primary">
                        Lưu thay đổi <Check size={16} />
                    </button>
                </form>
            </section>
        </>
    );
}

export default ClubSettingsPage;
