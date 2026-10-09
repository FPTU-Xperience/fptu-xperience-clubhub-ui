import { useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { previewProfile } from '../profile-data';
import { formatBirthDate, formatBirthDateInput, parseBirthDate } from '../profile-date';
import { CAMPUSES, campusLabel } from '../profile-options';
import './EditProfileModal.scss';

const tabs = [
    { id: 'about', label: 'Giới thiệu', fields: ['displayName', 'headline', 'about', 'skills', 'interests'] },
    { id: 'personal', label: 'Cá nhân', fields: ['dateOfBirth', 'phoneNumber', 'address'] },
    { id: 'academic', label: 'Học vụ', fields: ['campus', 'major', 'year', 'studentCode'] },
];
const fields = [
    { name: 'displayName', label: 'Tên hiển thị', required: true, maxLength: 120 },
    { name: 'headline', label: 'Câu nói tâm đắc / tiêu đề', maxLength: 160 },
    { name: 'about', label: 'Giới thiệu bản thân', multiline: true, maxLength: 2000 },
    { name: 'skills', label: 'Kỹ năng', placeholder: 'Phân cách bằng dấu phẩy' },
    { name: 'interests', label: 'Sở thích', placeholder: 'Phân cách bằng dấu phẩy' },
    { name: 'dateOfBirth', label: 'Ngày sinh', placeholder: 'DD/MM/YYYY', inputMode: 'numeric', maxLength: 10 },
    { name: 'phoneNumber', label: 'Số điện thoại', type: 'tel', maxLength: 16 },
    { name: 'address', label: 'Địa chỉ', maxLength: 500 },
    { name: 'campus', label: 'Campus', options: true },
    { name: 'major', label: 'Ngành học', maxLength: 120 },
    { name: 'year', label: 'Khóa học', maxLength: 30 },
    { name: 'studentCode', label: 'Mã sinh viên', maxLength: 30 },
];

export default function EditProfileModal({ snapshot, onClose, onPreview }) {
    const [draft, setDraft] = useState(() => ({
        ...snapshot.profile,
        ...snapshot.personal,
        ...snapshot.academic,
        skills: snapshot.profile.skills.join(', '),
        interests: snapshot.profile.interests.join(', '),
        dateOfBirth: formatBirthDate(snapshot.personal.dateOfBirth),
    }));
    const [activeTab, setActiveTab] = useState('about');
    const [error, setError] = useState('');
    const controls = useRef({});
    const buttons = useRef({});
    const initial = {
        ...snapshot.profile,
        ...snapshot.personal,
        ...snapshot.academic,
        skills: snapshot.profile.skills.join(', '),
        interests: snapshot.profile.interests.join(', '),
        dateOfBirth: formatBirthDate(snapshot.personal.dateOfBirth),
    };
    const changed = fields.some(({ name }) => String(draft[name] || '').trim() !== String(initial[name] || '').trim());
    const reveal = (name) => {
        setActiveTab(tabs.find((tab) => tab.fields.includes(name)).id);
        requestAnimationFrame(() => {
            controls.current[name]?.focus();
            controls.current[name]?.reportValidity();
        });
    };
    const submit = (event) => {
        event.preventDefault();
        if (!changed) return;
        const invalid = fields.find((field) => !controls.current[field.name]?.checkValidity());
        if (invalid) {
            reveal(invalid.name);
            return;
        }
        let dateOfBirth;
        try {
            dateOfBirth = parseBirthDate(draft.dateOfBirth);
        } catch (issue) {
            setError(issue.message);
            reveal('dateOfBirth');
            return;
        }
        try {
            const patch = {
                displayName: draft.displayName,
                headline: draft.headline,
                about: draft.about,
                skills: draft.skills.split(','),
                interests: draft.interests.split(','),
                personal: { dateOfBirth, phoneNumber: draft.phoneNumber, address: draft.address },
                academic: {
                    campus: draft.campus,
                    major: draft.major,
                    year: draft.year,
                    studentCode: draft.studentCode,
                },
            };
            previewProfile(snapshot, patch);
            onPreview(patch);
        } catch (issue) {
            setError(issue.message || 'Vui lòng kiểm tra thông tin hồ sơ.');
        }
    };
    const navigate = (event, index) => {
        const target = {
            ArrowRight: (index + 1) % tabs.length,
            ArrowLeft: (index + tabs.length - 1) % tabs.length,
            Home: 0,
            End: tabs.length - 1,
        }[event.key];
        if (target === undefined) return;
        event.preventDefault();
        setActiveTab(tabs[target].id);
        buttons.current[tabs[target].id]?.focus();
    };
    return (
        <V2Modal title="Chỉnh sửa hồ sơ cá nhân" onClose={onClose} wide className="v2-profile-edit-modal">
            <form className="v2-profile-edit-form" onSubmit={submit} noValidate>
                <p>Xem trước hồ sơ trên trang cá nhân, sau đó xác nhận lưu thay đổi.</p>
                <div className="v2-profile-edit-tabs" role="tablist" aria-label="Nội dung chỉnh sửa hồ sơ">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            ref={(node) => {
                                buttons.current[tab.id] = node;
                            }}
                            id={`profile-edit-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`profile-edit-panel-${tab.id}`}
                            tabIndex={activeTab === tab.id ? 0 : -1}
                            onClick={() => setActiveTab(tab.id)}
                            onKeyDown={(event) => navigate(event, index)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        id={`profile-edit-panel-${tab.id}`}
                        role="tabpanel"
                        aria-labelledby={`profile-edit-tab-${tab.id}`}
                        hidden={activeTab !== tab.id}
                    >
                        {tab.id === 'personal' && (
                            <p>Thông tin cá nhân dùng khi đăng ký CLB. Chỉ bạn được chỉnh sửa hồ sơ của mình.</p>
                        )}
                        <div className="v2-profile-edit-fields">
                            {fields
                                .filter((field) => tab.fields.includes(field.name))
                                .map(({ name, label, multiline, options, ...constraints }) => {
                                    const props = {
                                        ...constraints,
                                        name,
                                        id: `profile-edit-${name}`,
                                        value: draft[name] || '',
                                        ref: (node) => {
                                            controls.current[name] = node;
                                        },
                                        onChange: (event) => {
                                            const value =
                                                name === 'dateOfBirth'
                                                    ? formatBirthDateInput(event.target.value)
                                                    : event.target.value;
                                            setDraft((current) => ({ ...current, [name]: value }));
                                            setError('');
                                        },
                                    };
                                    return (
                                        <label key={name} htmlFor={props.id} className={multiline ? 'is-wide' : ''}>
                                            <span>{label}</span>
                                            {options ? (
                                                <select {...props}>
                                                    <option value="">Chọn campus</option>
                                                    {draft.campus && !CAMPUSES.includes(draft.campus) && (
                                                        <option value={draft.campus}>{draft.campus}</option>
                                                    )}
                                                    {CAMPUSES.map((campus) => (
                                                        <option key={campus} value={campus}>
                                                            {campusLabel(campus)}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : multiline ? (
                                                <textarea {...props} rows={4} />
                                            ) : (
                                                <input {...props} />
                                            )}
                                        </label>
                                    );
                                })}
                        </div>
                    </div>
                ))}
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
                <footer>
                    <button type="button" className="v2-button" onClick={onClose}>
                        Hủy
                    </button>
                    <button type="submit" className="v2-button v2-button--primary" disabled={!changed}>
                        <Eye size={16} /> Xem trước
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
