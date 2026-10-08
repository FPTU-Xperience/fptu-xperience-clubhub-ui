import { useState } from 'react';
import {
    Award,
    BookOpen,
    Camera,
    Check,
    Eye,
    FolderOpen,
    GraduationCap,
    Image as ImageIcon,
    LockKeyhole,
    MapPin,
    Pencil,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import PageState from '../../../components/v2/PageState';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import ImagePicker from '../../../components/media/ImagePicker';
import { toSharedProfile, useProfile, useProfileMemberships } from '../profile-data';
import { useProfileImages } from './profile-images';
import './ProfilePage.scss';

const pillarLabels = ['Học tập', 'Nghiên cứu', 'Quốc tế', 'Thể thao & văn hóa', 'Cộng đồng', 'Khởi nghiệp'];

function Radar({ pillars }) {
    const values = pillars?.current || Array(6).fill(0);
    const previous = pillars?.previous || Array(6).fill(0);
    const point = (index, radius) => [160 + Math.sin((index * Math.PI) / 3) * radius, 137 - Math.cos((index * Math.PI) / 3) * radius];
    const polygon = (items) => items.map((value, index) => point(index, value).join(',')).join(' ');
    const description = pillarLabels.map((label, index) => `${label}: ${values[index] || 0}/100`).join(', ');
    return (
        <div className="v2-profile-radar">
            <svg viewBox="0 0 320 285" role="img" aria-label={`Radar sáu trụ cột trải nghiệm. ${description}`}>
                {[25, 50, 75, 100].map((radius) => <polygon key={radius} points={polygon(Array(6).fill(radius))} fill="none" stroke="currentColor" />)}
                {pillarLabels.map((label, index) => {
                    const [x, y] = point(index, 100);
                    const [textX, textY] = point(index, 123);
                    return <g key={label}><line x1="160" y1="137" x2={x} y2={y} /><text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle">{label}</text></g>;
                })}
                <polygon points={polygon(previous)} className="v2-profile-radar-previous" />
                <polygon points={polygon(values)} className="v2-profile-radar-current" />
                {values.map((value, index) => {
                    const [x, y] = point(index, value);
                    return <circle key={pillarLabels[index]} cx={x} cy={y} r="3" className="v2-profile-radar-dot" />;
                })}
            </svg>
            <div className="v2-profile-radar-legend" aria-hidden="true"><span><i />Kỳ này</span><span><i />Kỳ trước</span></div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, note, hidden }) {
    return (
        <section className="v2-profile-stat">
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
            <strong>{hidden ? '—' : value}</strong>
            <small>{note}</small>
        </section>
    );
}

function ProfileAvatar({ profile, imageUrl, large = false }) {
    return imageUrl || profile.avatarUrl ? <img className={`v2-profile-avatar${large ? ' is-large' : ''}`} src={imageUrl || profile.avatarUrl} alt="" /> : <span className={`v2-profile-avatar${large ? ' is-large' : ''}`} aria-hidden="true">{profile.initials}</span>;
}

function ProfileImageModal({ kind, value, hasCustomCover, onClose, onSave }) {
    const [file, setFile] = useState(null);
    const [preset, setPreset] = useState(value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const cover = kind === 'cover';
    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSave({ file, preset: cover ? (file ? 'custom' : preset) : undefined });
            onClose();
        } catch (requestError) {
            setError(requestError?.message || 'Không thể lưu ảnh lúc này.');
        } finally {
            setSaving(false);
        }
    };
    return <V2Modal title={cover ? 'Đổi ảnh bìa' : 'Đổi ảnh đại diện'} onClose={onClose} wide={cover}>
        <form className="v2-profile-form" onSubmit={submit}>
            {cover && <fieldset className="v2-profile-cover-choices"><legend>Chọn ảnh bìa có sẵn</legend><div>
                {[
                    ['default', 'Cam trải nghiệm'],
                    ['sunset', 'Hoàng hôn'],
                    ['horizon', 'Bầu trời'],
                ].map(([id, label]) => <button key={id} type="button" className={`v2-profile-cover-choice is-${id}${preset === id && !file ? ' is-selected' : ''}`} aria-pressed={preset === id && !file} onClick={() => { setFile(null); setPreset(id); }}><span className="v2-profile-cover-choice-art" /><strong>{label}</strong></button>)}
                {hasCustomCover && <button type="button" className={`v2-profile-cover-choice is-custom${preset === 'custom' && !file ? ' is-selected' : ''}`} aria-pressed={preset === 'custom' && !file} onClick={() => { setFile(null); setPreset('custom'); }}><span className="v2-profile-cover-choice-art" /><strong>Ảnh đã tải</strong></button>}
            </div></fieldset>}
            <ImagePicker label={cover ? 'Hoặc tải ảnh bìa' : 'Tải ảnh đại diện'} file={file} onChange={setFile} disabled={saving} hint="JPG, PNG hoặc WebP · tối đa 5 MB · chỉ lưu trên thiết bị này" />
            <p className="v2-profile-image-note">Ảnh được lưu trên thiết bị này cho tài khoản của bạn. Backend hiện chưa có API lưu ảnh profile.</p>
            {error && <p className="v2-profile-form-error" role="alert">{error}</p>}
            <footer><button className="v2-button" type="button" onClick={onClose} disabled={saving}>Hủy</button><button className="v2-button v2-button--primary" disabled={saving || (!cover && !file) || (cover && !file && preset === value)}>{saving ? 'Đang lưu...' : 'Lưu ảnh'}</button></footer>
        </form>
    </V2Modal>;
}

function EditProfileModal({ profile, personal, onClose, onSave }) {
    const [draft, setDraft] = useState({
        displayName: profile.displayName,
        headline: profile.headline,
        about: profile.about,
        skills: profile.skills.join(', '),
        interests: profile.interests.join(', '),
        dateOfBirth: personal.dateOfBirth,
        phoneNumber: personal.phoneNumber,
        address: personal.address,
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const update = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSave({
                ...draft,
                skills: draft.skills.split(','),
                interests: draft.interests.split(','),
                personal: {
                    dateOfBirth: draft.dateOfBirth,
                    phoneNumber: draft.phoneNumber,
                    address: draft.address,
                },
            });
            onClose();
        } catch (requestError) {
            setError(requestError?.message || 'Không thể lưu hồ sơ lúc này. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <V2Modal title="Chỉnh sửa hồ sơ cá nhân" onClose={onClose} wide>
            <form className="v2-profile-form" onSubmit={submit}>
                <label> Tên hiển thị <input name="displayName" value={draft.displayName} onChange={update} required maxLength="120" /> </label>
                <label> Câu nói tâm đắc / tiêu đề <input name="headline" value={draft.headline} onChange={update} maxLength="160" /> </label>
                <label> Giới thiệu bản thân <textarea name="about" value={draft.about} onChange={update} rows="4" maxLength="2000" /> </label>
                <label> Kỹ năng (cách nhau bởi dấu phẩy) <input name="skills" value={draft.skills} onChange={update} /> </label>
                <label> Sở thích (cách nhau bởi dấu phẩy) <input name="interests" value={draft.interests} onChange={update} /> </label>
                <fieldset className="v2-profile-form-private">
                    <legend>Thông tin dùng khi đăng ký CLB</legend>
                    <p>Chỉ bạn nhìn thấy. Dữ liệu tạm lưu trên thiết bị; hồ sơ gia nhập CLB hiện chưa tự lấy thông tin này.</p>
                    <label>Ngày sinh <input name="dateOfBirth" value={draft.dateOfBirth} onChange={update} type="date" /></label>
                    <label>Số điện thoại <input name="phoneNumber" value={draft.phoneNumber} onChange={update} inputMode="tel" placeholder="Ví dụ: 0901234567" maxLength="16" /></label>
                    <label>Địa chỉ <input name="address" value={draft.address} onChange={update} maxLength="500" /></label>
                </fieldset>
                {error && <p className="v2-profile-form-error" role="alert">{error}</p>}
                <footer><button className="v2-button" type="button" onClick={onClose} disabled={saving}>Hủy</button><button className="v2-button v2-button--primary" disabled={saving}>{saving ? 'Đang lưu...' : <><Check size={16} /> Lưu thay đổi</>}</button></footer>
            </form>
        </V2Modal>
    );
}

export default function ProfilePage({ user, sessionKey, api }) {
    const result = useProfile(user, sessionKey);
    const { images, error: imageError, saveImage } = useProfileImages(user, sessionKey);
    const [shared, setShared] = useState(false);
    const [tab, setTab] = useState('overview');
    const [editing, setEditing] = useState(false);
    const [imageModal, setImageModal] = useState('');
    const memberships = useProfileMemberships(api, sessionKey);
    const data = result.data ? (shared ? toSharedProfile(result.data) : result.data) : null;
    const participations = memberships.data;
    const coverPreset = data?.profile.coverPreset === 'custom' && !images.cover ? 'default' : data?.profile.coverPreset || 'default';
    const customCover = coverPreset === 'custom' && images.cover;
    const saveSelectedImage = async ({ file, preset }) => {
        if (imageModal === 'avatar') {
            await saveImage('avatar', file);
        } else if (imageModal === 'cover') {
            if (file) await saveImage('cover', file);
            await result.save({ coverPreset: preset });
        }
    };

    if (result.status !== 'populated') {
        return <div className="v2-public-content v2-profile-page"><PageState status={result.status} onRetry={result.retry} title={result.status === 'empty' ? 'Hồ sơ đang chờ bạn' : undefined}>{null}</PageState></div>;
    }

    return (
        <div className="v2-public-content v2-personal-page v2-profile-page">
            <section className={`v2-profile-cover is-${coverPreset}`} style={customCover ? { backgroundImage: `url("${customCover}")` } : undefined}>
                {!customCover && <><div><span>THE EXPERIENCE IS YOURS.</span><strong>Make your time<br /><em>mean something.</em></strong></div>
                <div className="v2-profile-cover-art" aria-hidden="true"><span /><span /><span /><b>FPTU<br />XPERIENCE</b></div></>}
                {!shared && <button className="v2-profile-cover-edit" type="button" onClick={() => setImageModal('cover')}><ImageIcon size={16} /> Đổi ảnh bìa</button>}
            </section>
            <section className="v2-profile-identity">
                <div className="v2-profile-avatar-wrap"><ProfileAvatar profile={data.profile} imageUrl={images.avatar} large />{!shared && <button type="button" className="v2-profile-avatar-edit" aria-label="Đổi ảnh đại diện" onClick={() => setImageModal('avatar')}><Camera size={17} /></button>}</div>
                <div className="v2-profile-grow"><div><h1>{data.profile.displayName}</h1><ShieldCheck size={21} aria-label="Hồ sơ trải nghiệm" /></div><p>{data.profile.headline}</p><small><MapPin size={15} /> Thông tin học vụ chưa được kết nối</small></div>
                <div className="v2-profile-actions"><button className="v2-button" type="button" onClick={() => setShared((value) => !value)}>{shared ? <LockKeyhole size={16} /> : <Eye size={16} />}{shared ? 'Về hồ sơ cá nhân' : 'Xem bản chia sẻ'}</button>{!shared && <button className="v2-button v2-button--primary" type="button" onClick={() => setEditing(true)}><Pencil size={16} />Chỉnh sửa</button>}</div>
            </section>
            {imageError && <p className="v2-profile-form-error" role="alert">{imageError}</p>}
            {shared && <section className="v2-profile-privacy-banner" role="status"><Eye size={18} />Đang xem trước thông tin chia sẻ. Mã sinh viên, điểm chi tiết và lịch sử riêng tư được ẩn.</section>}
            <div className="v2-profile-columns">
                <aside>
                    <section className="v2-profile-panel"><h2>Một chút về mình</h2><p>{data.profile.about || 'Chưa thêm giới thiệu.'}</p><div className="v2-profile-info"><GraduationCap size={18} /><div><strong>{user.name || user.fullName}</strong><small>Tên tài khoản từ hệ thống</small></div></div><div className="v2-profile-info"><Sparkles size={18} /><div><strong>Sở thích</strong><small>{data.profile.interests.join(' · ') || 'Chưa cập nhật'}</small></div></div></section>
                    <section className="v2-profile-panel"><h2>Kỹ năng & thế mạnh</h2><div className="v2-profile-tags">{data.profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><p className="v2-profile-note">Thông tin do sinh viên tự cập nhật.</p></section>
                    <section className="v2-profile-panel"><h2>Câu lạc bộ đồng hành</h2>{memberships.status === 'loading' && <p>Đang tải câu lạc bộ…</p>}{memberships.status === 'error' && <p role="alert">Không thể tải câu lạc bộ lúc này.</p>}{memberships.status === 'ready' && !participations.length && <p>Chưa tham gia câu lạc bộ nào.</p>}{participations.map((club) => <div className="v2-profile-club" key={club.clubId}><span>{club.clubName.slice(0, 2).toUpperCase()}</span><div><strong>{club.clubName}</strong><small>{club.role}</small></div></div>)}</section>
                </aside>
                <div className="v2-profile-main">
                    <div className="v2-profile-tabs-row"><div className="v2-profile-tabs" role="tablist" aria-label="Nội dung hồ sơ"><button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}>Tổng quan</button><button role="tab" aria-selected={tab === 'evidence'} className={tab === 'evidence' ? 'is-active' : ''} onClick={() => setTab('evidence')}>Minh chứng</button></div></div>
                    {tab === 'overview' ? <><div className="v2-profile-stats"><Stat icon={Award} label="Điểm đóng góp ghi nhận" value="—" hidden={shared} note="Chưa có API tổng hợp cá nhân" /><Stat icon={BookOpen} label="Hoạt động đã tham dự" value="—" note="Chưa có API lịch sử cá nhân" /><Stat icon={FolderOpen} label="Câu lạc bộ tham gia" value={memberships.status === 'ready' ? participations.length : '—'} note="Danh sách đã duyệt từ hệ thống" /></div><section className="v2-profile-panel v2-profile-experience"><div><span>SÁU TRỤ CỘT TRẢI NGHIỆM · MINH HỌA</span><h2>Hành trình của bạn không chỉ được đo bằng điểm số.</h2><p>Biểu đồ mẫu; số liệu trải nghiệm cá nhân chưa được kết nối.</p></div><Radar pillars={data.summary.experiencePillars} /></section></> : <section className="v2-profile-panel"><div className="v2-profile-section-heading"><div><span>MINH CHỨNG</span><h2>Lịch sử đóng góp & hoạt động</h2></div></div><p className="v2-profile-empty">{shared ? 'Lịch sử riêng tư được ẩn trong bản chia sẻ.' : 'Lịch sử minh chứng cá nhân chưa có API để hiển thị.'}</p></section>}
                </div>
            </div>
            {editing && <EditProfileModal profile={result.data.profile} personal={result.data.personal} onClose={() => setEditing(false)} onSave={result.save} />}
            {imageModal && <ProfileImageModal kind={imageModal} value={coverPreset} hasCustomCover={Boolean(images.cover)} onClose={() => setImageModal('')} onSave={saveSelectedImage} />}
        </div>
    );
}
