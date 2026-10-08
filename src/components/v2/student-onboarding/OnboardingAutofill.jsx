import { Mail, Sparkles } from 'lucide-react';
import { CAMPUSES, campusLabel } from '../../../pages/v2/profile-options';

export default function OnboardingAutofill({ email, inferred, draft, onChange }) {
    const recognized = Boolean(inferred.studentCode || inferred.campus);
    return (
        <section className="dx-onboarding-autofill">
            <div className="dx-onboarding-email">
                <Mail size={20} aria-hidden="true" />
                <div>
                    <small>Email đăng nhập</small>
                    <strong>{email || 'Chưa có email'}</strong>
                </div>
            </div>
            <p className="dx-onboarding-autofill-message">
                <Sparkles size={18} aria-hidden="true" />
                <span>
                    {recognized
                        ? 'Đã nhận diện thông tin từ email FPT. Bạn có thể kiểm tra và điều chỉnh trước khi tiếp tục.'
                        : 'Bạn có thể chọn campus và nhập mã sinh viên bên dưới để bổ sung vào hồ sơ.'}
                </span>
            </p>
            <div className="dx-onboarding-fields">
                <label className="dx-field">
                    <span>Mã sinh viên</span>
                    <input
                        name="studentCode"
                        value={draft.studentCode}
                        onChange={(event) => onChange('studentCode', event.target.value.toUpperCase())}
                        maxLength="30"
                        placeholder="Ví dụ: CE161131"
                    />
                </label>
                <label className="dx-field">
                    <span>Campus</span>
                    <select
                        name="campus"
                        value={draft.campus}
                        onChange={(event) => onChange('campus', event.target.value)}
                    >
                        <option value="">Chọn campus</option>
                        {CAMPUSES.map((campus) => (
                            <option key={campus} value={campus}>
                                {campusLabel(campus)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="dx-field">
                    <span>Khóa học</span>
                    <input
                        name="year"
                        value={draft.year}
                        onChange={(event) => onChange('year', event.target.value)}
                        maxLength="30"
                        placeholder="Ví dụ: K16"
                    />
                </label>
            </div>
        </section>
    );
}
