import { Mail } from 'lucide-react';
import { campusLabel } from '../../../pages/v2/profile-options';
import { academicAvailabilityMessage } from '../../../pages/v2/onboarding';

export default function OnboardingAutofill({ email, draft, academic }) {
    return (
        <section className="v2-onboarding-autofill">
            <div className="v2-onboarding-email"><Mail size={20} aria-hidden="true" /><div>
                <small>Email đăng nhập</small><strong>{email || 'Chưa có email'}</strong>
            </div></div>
            <p>Dữ liệu học kỳ và hồ sơ tài khoản được ưu tiên. Thông tin gợi ý từ email chưa được nhà trường xác nhận.</p>
            <p role="status">{academicAvailabilityMessage(academic?.availability)}</p>
            <div className="v2-onboarding-fields">
                <label className="v2-access-field"><span>Mã sinh viên</span><input value={draft.studentCode || 'Chưa có dữ liệu'} readOnly /><small>{draft.sources.studentCode}</small></label>
                <label className="v2-access-field"><span>Campus</span><input value={campusLabel(draft.campus) || draft.campus || 'Chưa có dữ liệu'} readOnly /><small>{draft.sources.campus}</small></label>
                <label className="v2-access-field"><span>Học kỳ hiện hành</span><input value={academic?.semesterId || 'Chưa xác định được học kỳ'} readOnly /></label>
                <label className="v2-access-field"><span>Khóa học</span><input value={draft.year || 'Chưa có dữ liệu'} readOnly /><small>{draft.sources.year}</small></label>
            </div>
        </section>
    );
}
