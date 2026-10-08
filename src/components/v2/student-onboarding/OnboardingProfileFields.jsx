import { MAJORS } from '../../../pages/v2/onboarding';
import { formatBirthDateInput } from '../../../pages/v2/profile-date';

export default function OnboardingProfileFields({ draft, onChange }) {
    const update = (event) => onChange(event.target.name, event.target.value);
    return <>
        <fieldset className="dx-onboarding-section">
            <legend>Thông tin hồ sơ</legend>
            <p>Thông tin học vụ sẽ hiển thị trên trang cá nhân của bạn.</p>
            <div className="dx-onboarding-fields">
                <label className="dx-field"><span>Chuyên ngành *</span><select name="major" value={draft.major} onChange={update} required><option value="">Chọn chuyên ngành</option>{draft.major && !MAJORS.includes(draft.major) && <option>{draft.major}</option>}{MAJORS.map((major) => <option key={major}>{major}</option>)}</select></label>
            </div>
        </fieldset>
        <fieldset className="dx-onboarding-section">
            <legend>Thông tin cá nhân</legend>
            <p>Chỉ bạn nhìn thấy. Bạn có thể bổ sung các trường này sau trong hồ sơ.</p>
            <div className="dx-onboarding-fields">
                <label className="dx-field"><span>Ngày sinh (DD/MM/YYYY)</span><input value={draft.dateOfBirth} onChange={(event) => onChange('dateOfBirth', formatBirthDateInput(event.target.value))} inputMode="numeric" autoComplete="bday" placeholder="DD/MM/YYYY" maxLength="10" pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}" /></label>
                <label className="dx-field"><span>Số điện thoại</span><input name="phoneNumber" value={draft.phoneNumber} onChange={update} inputMode="tel" autoComplete="tel" maxLength="16" pattern="\+?[0-9]{9,15}" placeholder="Ví dụ: 0901234567" /></label>
                <label className="dx-field"><span>Địa chỉ</span><input name="address" value={draft.address} onChange={update} autoComplete="street-address" maxLength="500" placeholder="Nhập địa chỉ của bạn" /></label>
            </div>
        </fieldset>
    </>;
}
