import { useEffect, useId, useRef, useState } from 'react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import ImagePicker from '../../../components/media/ImagePicker';
import { buildClubRegistrationPayload } from './club-registration';
import './ClubRegistrationModal.scss';

function Field({ label, name, multiline = false, required = true, ...props }) {
    const Control = multiline ? 'textarea' : 'input';
    return (
        <label className="v2-club-registration-field">
            <span>{label}{required && ' *'}</span>
            <Control name={name} required={required} {...(multiline ? { rows: 3 } : {})} {...props} />
        </label>
    );
}

function SelectField({ label, name, options, required = true, defaultValue }) {
    return (
        <label className="v2-club-registration-field">
            <span>{label}{required && ' *'}</span>
            <select name={name} required={required} defaultValue={defaultValue}>
                {options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
            </select>
        </label>
    );
}

export default function ClubRegistrationModal({ api, user, onClose, onCreated }) {
    const formId = useId();
    const [members, setMembers] = useState([0]);
    const [foundingMemberCount, setFoundingMemberCount] = useState(1);
    const [logoFile, setLogoFile] = useState(null);
    const [logoUrl, setLogoUrl] = useState('');
    const nextMember = useRef(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const locked = useRef(false);
    const active = useRef(true);
    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);
    const close = () => { if (!locked.current) onClose(); };
    const submit = async (event) => {
        event.preventDefault();
        if (locked.current) return;
        setError('');
        let payload;
        try {
            payload = buildClubRegistrationPayload(new FormData(event.currentTarget));
        } catch (issue) {
            setError(issue.message);
            return;
        }
        locked.current = true;
        setSubmitting(true);
        try {
            if (logoFile) payload.logoUrl = await api.uploadPublicImage(logoFile, 'club-application-logo');
            if (!active.current) return;
            await api.createClubApplication(payload);
            if (active.current) onCreated();
        } catch (issue) {
            if (active.current) setError(issue?.message || 'Không thể gửi đơn. Vui lòng thử lại.');
        } finally {
            locked.current = false;
            if (active.current) setSubmitting(false);
        }
    };
    return (
        <V2Modal title="Đăng ký mở CLB" wide onClose={close} className="v2-club-registration-modal" footer={<>
            <button type="button" className="v2-button v2-button--secondary" disabled={submitting} onClick={close}>Hủy</button>
            <button type="submit" form={formId} className="v2-button v2-button--primary" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi đơn thành lập'}
            </button>
        </>}>
            <form id={formId} onSubmit={submit}>
                <p>Điền thông tin và kế hoạch hoạt động để gửi đơn mở câu lạc bộ đến bộ phận xét duyệt.</p>
                {error && <p className="v2-club-registration-error" role="alert">{error}</p>}
                <fieldset disabled={submitting}>
                    <legend>1. Thông tin câu lạc bộ đề xuất</legend>
                    <div className="v2-club-registration-grid">
                        <Field label="Tên câu lạc bộ đề xuất" name="name" maxLength={150} />
                        <SelectField label="Lĩnh vực hoạt động" name="category" defaultValue="ACADEMIC" options={[
                            ['SPORTS', 'Thể thao'], ['ARTS', 'Nghệ thuật'], ['ACADEMIC', 'Học thuật'],
                            ['VOLUNTEER', 'Tình nguyện'], ['TECHNOLOGY', 'Công nghệ'], ['OTHER', 'Khác'],
                        ]} />
                        <Field label="Tên viết tắt (không bắt buộc)" name="code" required={false} minLength={2} maxLength={20}
                            pattern="[A-Za-z0-9_\-]{2,20}" title="Từ 2–20 chữ cái, số, dấu gạch ngang hoặc gạch dưới"
                            placeholder="Để trống để hệ thống tự tạo" />
                        <ImagePicker label="Logo/biểu tượng (không bắt buộc)" value={logoUrl} file={logoFile}
                            onChange={setLogoFile} disabled={submitting} />
                        <Field label="Hoặc dùng URL logo hiện có" name="logoUrl" type="url" required={false} maxLength={1000}
                            value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} />
                    </div>
                    <Field label="Mục tiêu" name="purpose" multiline maxLength={1000} />
                    <Field label="Mô tả ngắn về câu lạc bộ" name="description" multiline maxLength={1000} />
                </fieldset>
                <fieldset disabled={submitting}>
                    <legend>2. Thông tin người sáng lập / chủ nhiệm câu lạc bộ</legend>
                    <div className="v2-club-registration-grid">
                        <Field label="Họ và tên" name="founderFullName" defaultValue={user?.name || ''} maxLength={200} />
                        <Field label="Vai trò đề xuất" name="founderRole" defaultValue="Chủ nhiệm câu lạc bộ" maxLength={200} />
                        <Field label="Thư điện tử" name="founderEmail" type="email" defaultValue={user?.email || ''} maxLength={255} />
                        <Field label="Số điện thoại" name="founderPhone" type="tel" maxLength={16}
                            pattern="\+?[0-9]{9,15}" title="Từ 9–15 chữ số, có thể bắt đầu bằng dấu +" />
                        <Field label="Lớp / Khoa / Phòng ban" name="founderOrganization" maxLength={300} />
                    </div>
                </fieldset>
                <fieldset disabled={submitting}>
                    <legend>3. Thành viên sáng lập</legend>
                    <Field label="Số thành viên sáng lập" name="foundingMemberCount" type="number"
                        min={members.length} max={200} step={1} value={foundingMemberCount}
                        onChange={(event) => setFoundingMemberCount(event.target.value)} />
                    {members.map((id, index) => <div key={id} className="v2-club-registration-member">
                        <div className="v2-club-registration-member-heading">
                            <strong>Thành viên #{index + 1}</strong>
                            {members.length > 1 && <button type="button" onClick={() => setMembers((current) => current.filter((key) => key !== id))}>Xóa</button>}
                        </div>
                        <div className="v2-club-registration-grid">
                            <Field label="Họ và tên" name="memberName" maxLength={200} defaultValue={id === 0 ? user?.name || '' : ''} />
                            <Field label="Lớp / Khoa" name="memberOrganization" maxLength={300} />
                            <Field label="Thư điện tử" name="memberEmail" type="email" maxLength={255} defaultValue={id === 0 ? user?.email || '' : ''} />
                        </div>
                    </div>)}
                    <button type="button" className="v2-button v2-button--secondary" disabled={members.length >= 200} onClick={() => {
                        const id = nextMember.current++;
                        setFoundingMemberCount((current) => Math.max(Number(current) || 0, members.length + 1));
                        setMembers((current) => [...current, id]);
                    }}>Thêm thành viên</button>
                    <label className="v2-club-registration-check"><input type="checkbox" name="foundingMembersCommitted" required />
                        Các thành viên sáng lập đã đồng ý và cam kết tham gia
                    </label>
                </fieldset>
                <fieldset disabled={submitting}>
                    <legend>4. Kế hoạch hoạt động</legend>
                    <Field label="Các hoạt động chính dự kiến" name="mainActivities" multiline rows={4} maxLength={2000} />
                    <div className="v2-club-registration-grid">
                        <div className="v2-club-registration-field">
                            <span>Tần suất hoạt động *</span>
                            <div className="v2-club-registration-frequency">
                                <input name="activityFrequencyCount" type="text" inputMode="numeric" pattern="[1-9][0-9]*"
                                    maxLength={3} required aria-label="Số lần hoạt động" placeholder="Số lần"
                                    onChange={(event) => { event.target.value = event.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 3); }} />
                                <select name="activityFrequencyUnit" aria-label="Đơn vị tần suất" defaultValue="MONTH">
                                    <option value="WEEK">tuần</option><option value="MONTH">tháng</option><option value="YEAR">năm</option>
                                </select>
                            </div>
                        </div>
                        <Field label="Địa điểm đề xuất" name="expectedLocation" required={false} maxLength={500} />
                        <Field label="Lịch dự kiến" name="expectedSchedule" required={false} maxLength={500} placeholder="Khung giờ/ngày" />
                        <Field label="Sự kiện lớn dự kiến" name="majorEvents" multiline required={false} maxLength={1000} />
                    </div>
                </fieldset>
                <fieldset disabled={submitting}>
                    <legend>5. Nguồn lực cần thiết</legend>
                    <div className="v2-club-registration-grid">
                        <SelectField label="Phòng họp / địa điểm" name="venueSupport" required={false} defaultValue="SELF_MANAGED" options={[
                            ['SUPPORT_NEEDED', 'Cần hỗ trợ'], ['SELF_MANAGED', 'Tự quản lý'],
                        ]} />
                        <SelectField label="Kinh phí" name="fundingSupport" required={false} defaultValue="SELF_FUNDED" options={[
                            ['SUPPORT_NEEDED', 'Cần hỗ trợ'], ['SELF_FUNDED', 'Tự tài trợ'], ['COMBINED', 'Kết hợp'],
                        ]} />
                        <Field label="Thiết bị cần thiết" name="equipmentNeeds" multiline required={false} maxLength={1000} />
                        <label className="v2-club-registration-check"><input type="checkbox" name="advisorNeeded" />Cần cố vấn hoặc người hướng dẫn</label>
                    </div>
                </fieldset>
                <fieldset disabled={submitting}>
                    <legend>6. Cam kết</legend>
                    {[
                        ['committedToRules', 'Đảm bảo mọi hoạt động tuân thủ quy định hiện hành.'],
                        ['committedToResponsibility', 'Chịu trách nhiệm trước ban quản trị.'],
                        ['committedToReporting', 'Nộp báo cáo hoạt động định kỳ.'],
                    ].map(([name, label]) => <label key={name} className="v2-club-registration-check"><input type="checkbox" name={name} required />{label}</label>)}
                </fieldset>
            </form>
        </V2Modal>
    );
}
