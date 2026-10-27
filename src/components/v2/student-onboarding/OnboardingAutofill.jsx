import { Mail } from 'lucide-react';
import { campusLabel } from '../../../pages/v2/profile-options';

export default function OnboardingAutofill({ email, draft }) {
    return (
        <section className="v2-onboarding-autofill">
            <div className="v2-onboarding-email"><Mail size={20} aria-hidden="true" /><div>
                <small>Email đăng nhập</small><strong>{email || 'Chưa có email'}</strong>
            </div></div>
            <p>Campus và mã sinh viên do nhà trường quản lý. Liên hệ phòng CTSV nếu thông tin chưa chính xác.</p>
            <div className="v2-onboarding-fields">
                <label className="v2-access-field"><span>Mã sinh viên</span><input value={draft.studentCode || 'Chưa có trong danh sách học kỳ'} readOnly /></label>
                <label className="v2-access-field"><span>Campus</span><input value={campusLabel(draft.campus) || draft.campus || 'Chưa có dữ liệu'} readOnly /></label>
                <label className="v2-access-field"><span>Khóa học</span><input value={draft.year || 'Chưa có dữ liệu'} readOnly /></label>
            </div>
        </section>
    );
}
