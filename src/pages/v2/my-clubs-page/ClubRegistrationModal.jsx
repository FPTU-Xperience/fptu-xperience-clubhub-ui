import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { DiscoveryTagFields } from '../../../components/v2/DiscoveryTagFields';
import { tagDraft, tagSelectionPayload } from '../../../services/discovery-tags';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { buildClubRegistrationPayload } from './club-registration';
import './ClubRegistrationModal.scss';

const Defaults = createContext({});
function Field({ label, name, multiline = false, required = true, defaultValue, ...props }) {
    const defaults = useContext(Defaults);
    const Control = multiline ? 'textarea' : 'input';
    return (
        <label className="v2-club-registration-field">
            <span>
                {label}
                {required && ' *'}
            </span>
            <Control
                name={name}
                required={required}
                {...(multiline ? { rows: 3 } : {})}
                {...(!('value' in props) ? { defaultValue: defaults[name] ?? defaultValue } : {})}
                {...props}
            />
        </label>
    );
}

function SelectField({ label, name, options, required = true, defaultValue }) {
    const defaults = useContext(Defaults);
    return (
        <label className="v2-club-registration-field">
            <span>
                {label}
                {required && ' *'}
            </span>
            <select name={name} required={required} defaultValue={defaults[name] ?? defaultValue}>
                {options.map(([value, title]) => (
                    <option key={value} value={value}>
                        {title}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function ClubRegistrationModal({ api, user, application, onClose, onCreated }) {
    const formId = useId();
    const initialMembers = application?.foundingMembers?.length
        ? application.foundingMembers
        : [{ fullName: user?.name || user?.fullName || '', email: user?.email || '', organization: '' }];
    const [members, setMembers] = useState(() => initialMembers.map((_, index) => index));
    const [foundingMemberCount, setFoundingMemberCount] = useState(application?.foundingMemberCount || 1);
    const [tagSelection, setTagSelection] = useState(() => tagDraft(application?.tagSelection));
    const nextMember = useRef(initialMembers.length);
    const requestKey = useRef(null);
    const frequency = application?.activityFrequency?.match(/^(\d+) lần mỗi (tuần|tháng|năm)$/);
    const defaults = application
        ? {
              ...application,
              founderFullName: application.requesterName,
              founderEmail: application.contactEmail,
              founderPhone: application.contactPhone,
          }
        : {};
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const locked = useRef(false);
    const active = useRef(true);
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);
    const close = () => {
        if (!locked.current) onClose();
    };
    const submit = async (event) => {
        event.preventDefault();
        if (locked.current) return;
        setError('');
        let payload;
        try {
            payload = buildClubRegistrationPayload(new FormData(event.currentTarget));
            payload.tagSelection = tagSelectionPayload(tagSelection);
        } catch (issue) {
            setError(issue.message);
            return;
        }
        locked.current = true;
        setSubmitting(true);
        try {
            if (!active.current) return;
            if (application) payload.expectedVersion = application.version;
            const fingerprint = JSON.stringify(payload);
            if (requestKey.current?.fingerprint !== fingerprint)
                requestKey.current = { fingerprint, key: crypto.randomUUID() };
            const saved = application
                ? await api.updateClubApplication(application.id, payload, requestKey.current.key)
                : await api.createClubApplication(payload, requestKey.current.key);
            if (
                !Number.isSafeInteger(saved?.id) ||
                saved.requesterUserId !== Number(user?.id) ||
                saved.status !== 'Submitted' ||
                !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(saved.version || '') ||
                (application && (saved.id !== application.id || saved.version === application.version))
            )
                throw new Error('Chưa xác nhận được đơn từ máy chủ. Tải lại danh sách trước khi gửi tiếp.');
            if (active.current) onCreated(saved);
        } catch (issue) {
            if (active.current) setError(issue?.message || 'Không thể gửi đơn. Vui lòng thử lại.');
        } finally {
            locked.current = false;
            if (active.current) setSubmitting(false);
        }
    };
    return (
        <Defaults.Provider value={defaults}>
            <V2Modal
                title={application ? 'Bổ sung đơn thành lập CLB' : 'Đăng ký mở CLB'}
                wide
                onClose={close}
                className="v2-club-registration-modal"
                footer={
                    <>
                        <button
                            type="button"
                            className="v2-button v2-button--secondary"
                            disabled={submitting}
                            onClick={close}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            form={formId}
                            className="v2-button v2-button--primary"
                            disabled={submitting}
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi đơn thành lập'}
                        </button>
                    </>
                }
            >
                <form id={formId} onSubmit={submit}>
                    <p>
                        Chỉ cần thông tin bắt buộc để xét duyệt. Sau khi CLB được duyệt, vào Club Workspace để bổ sung
                        hình ảnh, lịch sinh hoạt và thông tin khác.
                    </p>
                    {error && (
                        <p className="v2-club-registration-error" role="alert">
                            {error}
                        </p>
                    )}
                    <fieldset disabled={submitting}>
                        <legend>1. Thông tin câu lạc bộ đề xuất</legend>
                        <div className="v2-club-registration-grid">
                            <Field label="Tên câu lạc bộ đề xuất" name="name" maxLength={150} />
                            <Field
                                label="Viết tắt"
                                name="code"
                                minLength={2}
                                maxLength={20}
                                pattern="[A-Za-z0-9_\-]{2,20}"
                                title="Dùng làm mã CLB: 2–20 chữ cái, số, dấu gạch ngang hoặc gạch dưới"
                            />
                            <SelectField
                                label="Lĩnh vực hoạt động"
                                name="category"
                                defaultValue="ACADEMIC"
                                options={[
                                    ['SPORTS', 'Thể thao'],
                                    ['ARTS', 'Nghệ thuật'],
                                    ['ACADEMIC', 'Học thuật'],
                                    ['VOLUNTEER', 'Tình nguyện'],
                                    ['TECHNOLOGY', 'Công nghệ'],
                                    ['OTHER', 'Khác'],
                                ]}
                            />
                        </div>
                        <Field label="Mục tiêu" name="purpose" multiline maxLength={1000} />
                        <Field label="Mô tả ngắn về câu lạc bộ" name="description" multiline maxLength={1000} />
                        <DiscoveryTagFields draft={tagSelection} onChange={setTagSelection} />
                    </fieldset>
                    <fieldset disabled={submitting}>
                        <legend>2. Thông tin người sáng lập / chủ nhiệm câu lạc bộ</legend>
                        <div className="v2-club-registration-grid">
                            <Field
                                label="Họ và tên"
                                name="founderFullName"
                                defaultValue={user?.name || user?.fullName || ''}
                                maxLength={200}
                            />
                            <Field
                                label="Vai trò đề xuất"
                                name="founderRole"
                                defaultValue="Chủ nhiệm câu lạc bộ"
                                maxLength={200}
                            />
                            <Field
                                label="Thư điện tử"
                                name="founderEmail"
                                type="email"
                                defaultValue={user?.email || ''}
                                maxLength={255}
                            />
                            <Field
                                label="Số điện thoại"
                                name="founderPhone"
                                type="tel"
                                maxLength={16}
                                pattern="\+?[0-9]{9,15}"
                                title="Từ 9–15 chữ số, có thể bắt đầu bằng dấu +"
                            />
                            <Field label="Lớp / Khoa / Phòng ban" name="founderOrganization" maxLength={300} />
                        </div>
                    </fieldset>
                    <fieldset disabled={submitting}>
                        <legend>3. Thành viên sáng lập</legend>
                        <Field
                            label="Số thành viên sáng lập"
                            name="foundingMemberCount"
                            type="number"
                            min={members.length}
                            max={200}
                            step={1}
                            value={foundingMemberCount}
                            onChange={(event) => setFoundingMemberCount(event.target.value)}
                        />
                        {members.map((id, index) => (
                            <div key={id} className="v2-club-registration-member">
                                <div className="v2-club-registration-member-heading">
                                    <strong>Thành viên #{index + 1}</strong>
                                    {members.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setMembers((current) => current.filter((key) => key !== id))}
                                        >
                                            Xóa
                                        </button>
                                    )}
                                </div>
                                <div className="v2-club-registration-grid">
                                    <Field
                                        label="Họ và tên"
                                        name="memberName"
                                        maxLength={200}
                                        defaultValue={initialMembers[id]?.fullName || ''}
                                    />
                                    <Field
                                        label="Lớp / Khoa"
                                        name="memberOrganization"
                                        maxLength={300}
                                        defaultValue={initialMembers[id]?.organization || ''}
                                    />
                                    <Field
                                        label="Thư điện tử"
                                        name="memberEmail"
                                        type="email"
                                        maxLength={255}
                                        defaultValue={initialMembers[id]?.email || ''}
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            className="v2-button v2-button--secondary"
                            disabled={members.length >= 200}
                            onClick={() => {
                                const id = nextMember.current++;
                                setFoundingMemberCount((current) => Math.max(Number(current) || 0, members.length + 1));
                                setMembers((current) => [...current, id]);
                            }}
                        >
                            Thêm thành viên
                        </button>
                        <label className="v2-club-registration-check">
                            <input type="checkbox" name="foundingMembersCommitted" required />
                            Các thành viên sáng lập đã đồng ý và cam kết tham gia
                        </label>
                    </fieldset>
                    <fieldset disabled={submitting}>
                        <legend>4. Kế hoạch hoạt động</legend>
                        <Field
                            label="Các hoạt động chính dự kiến"
                            name="mainActivities"
                            multiline
                            rows={4}
                            maxLength={2000}
                        />
                        <div className="v2-club-registration-grid">
                            <div className="v2-club-registration-field">
                                <span>Tần suất hoạt động *</span>
                                <div className="v2-club-registration-frequency">
                                    <input
                                        name="activityFrequencyCount"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[1-9][0-9]*"
                                        defaultValue={frequency?.[1] || ''}
                                        maxLength={3}
                                        required
                                        aria-label="Số lần hoạt động"
                                        placeholder="Số lần"
                                        onChange={(event) => {
                                            event.target.value = event.target.value
                                                .replace(/\D/g, '')
                                                .replace(/^0+/, '')
                                                .slice(0, 3);
                                        }}
                                    />
                                    <select
                                        name="activityFrequencyUnit"
                                        aria-label="Đơn vị tần suất"
                                        defaultValue={
                                            { tuần: 'WEEK', tháng: 'MONTH', năm: 'YEAR' }[frequency?.[2]] || 'MONTH'
                                        }
                                    >
                                        <option value="WEEK">tuần</option>
                                        <option value="MONTH">tháng</option>
                                        <option value="YEAR">năm</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </fieldset>
                    <fieldset disabled={submitting}>
                        <legend>5. Nguồn lực cần thiết</legend>
                        <div className="v2-club-registration-grid">
                            <SelectField
                                label="Phòng họp / địa điểm"
                                name="venueSupport"
                                defaultValue="SELF_MANAGED"
                                options={[
                                    ['SUPPORT_NEEDED', 'Cần hỗ trợ'],
                                    ['SELF_MANAGED', 'Tự quản lý'],
                                ]}
                            />
                            <SelectField
                                label="Kinh phí"
                                name="fundingSupport"
                                defaultValue="SELF_FUNDED"
                                options={[
                                    ['SUPPORT_NEEDED', 'Cần hỗ trợ'],
                                    ['SELF_FUNDED', 'Tự tài trợ'],
                                    ['COMBINED', 'Kết hợp'],
                                ]}
                            />
                        </div>
                    </fieldset>
                    <fieldset disabled={submitting}>
                        <legend>6. Cam kết</legend>
                        {[
                            ['committedToRules', 'Đảm bảo mọi hoạt động tuân thủ quy định hiện hành.'],
                            ['committedToResponsibility', 'Chịu trách nhiệm trước ban quản trị.'],
                            ['committedToReporting', 'Nộp báo cáo hoạt động định kỳ.'],
                        ].map(([name, label]) => (
                            <label key={name} className="v2-club-registration-check">
                                <input type="checkbox" name={name} required />
                                {label}
                            </label>
                        ))}
                    </fieldset>
                </form>
            </V2Modal>
        </Defaults.Provider>
    );
}
