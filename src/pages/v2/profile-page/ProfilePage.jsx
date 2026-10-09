import { useEffect, useRef, useState } from 'react';
import {
    Award,
    BookOpen,
    Camera,
    Eye,
    FolderOpen,
    GraduationCap,
    Image as ImageIcon,
    LockKeyhole,
    MapPin,
    Pencil,
    ShieldCheck,
    Sparkles,
    Info,
    Undo2,
} from 'lucide-react';
import PageState from '../../../components/v2/PageState';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import ProfileImagePicker from './ProfileImagePicker';
import { previewProfile, toSharedProfile, useProfile, useProfileMemberships } from '../profile-data';
import { campusLabel } from '../profile-options';
import EditProfileModal from './EditProfileModal';
import ProfileCoverModal from './ProfileCoverModal';
import ProfileCoverArt from './ProfileCoverArt';
import ProfileClubLogo from './ProfileClubLogo';
import './ProfilePage.scss';

const pillarLabels = ['Học tập', 'Nghiên cứu', 'Quốc tế', 'Thể thao & văn hóa', 'Cộng đồng', 'Khởi nghiệp'];

function Radar({ pillars }) {
    const values = pillars?.current || Array(6).fill(0);
    const previous = pillars?.previous || Array(6).fill(0);
    const point = (index, radius) => [
        160 + Math.sin((index * Math.PI) / 3) * radius,
        137 - Math.cos((index * Math.PI) / 3) * radius,
    ];
    const polygon = (items) => items.map((value, index) => point(index, value).join(',')).join(' ');
    const description = pillarLabels.map((label, index) => `${label}: ${values[index] || 0}/100`).join(', ');
    return (
        <div className="v2-profile-radar">
            <svg viewBox="0 0 320 285" role="img" aria-label={`Radar sáu trụ cột trải nghiệm. ${description}`}>
                {[25, 50, 75, 100].map((radius) => (
                    <polygon key={radius} points={polygon(Array(6).fill(radius))} fill="none" stroke="currentColor" />
                ))}
                {pillarLabels.map((label, index) => {
                    const [x, y] = point(index, 100);
                    const [textX, textY] = point(index, 123);
                    return (
                        <g key={label}>
                            <line x1="160" y1="137" x2={x} y2={y} />
                            <text x={textX} y={textY} textAnchor="middle" dominantBaseline="middle">
                                {label}
                            </text>
                        </g>
                    );
                })}
                <polygon points={polygon(previous)} className="v2-profile-radar-previous" />
                <polygon points={polygon(values)} className="v2-profile-radar-current" />
                {values.map((value, index) => {
                    const [x, y] = point(index, value);
                    return <circle key={pillarLabels[index]} cx={x} cy={y} r="3" className="v2-profile-radar-dot" />;
                })}
            </svg>
            <div className="v2-profile-radar-legend" aria-hidden="true">
                <span>
                    <i />
                    Kỳ này
                </span>
                <span>
                    <i />
                    Kỳ trước
                </span>
            </div>
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
    return imageUrl || profile.avatarUrl ? (
        <img className={`v2-profile-avatar${large ? ' is-large' : ''}`} src={imageUrl || profile.avatarUrl} alt="" />
    ) : (
        <span className={`v2-profile-avatar${large ? ' is-large' : ''}`} aria-hidden="true">
            {profile.initials}
        </span>
    );
}

function ProfileImageModal({ images, profile, onClose, onSave }) {
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const submit = async (event) => {
        event.preventDefault();
        if (saving || !file) return;
        setSaving(true);
        setError('');
        try {
            await onSave({ file });
            onClose();
        } catch (issue) {
            setError(issue.message || 'Không thể lưu ảnh.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <V2Modal
            title="Đổi ảnh đại diện"
            onClose={() => {
                if (!saving) onClose();
            }}
            className="v2-profile-image-modal"
        >
            <form className="v2-profile-form v2-profile-image-form" onSubmit={submit}>
                <ProfileImagePicker
                    file={file}
                    value={images.avatar || profile.avatarUrl}
                    initials={profile.initials}
                    onChange={setFile}
                    disabled={saving}
                />
                <p className="v2-profile-image-note">
                    <Info size={16} />
                    <span>Ảnh chỉ được lưu cho tài khoản của bạn trên thiết bị này.</span>
                </p>
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
                <footer>
                    <button type="button" className="v2-button" disabled={saving} onClick={onClose}>
                        Hủy
                    </button>
                    <button type="submit" className="v2-button v2-button--primary" disabled={saving || !file}>
                        {saving ? 'Đang lưu…' : 'Lưu ảnh'}
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}

export default function ProfilePage({ user, sessionKey, api, profileImages }) {
    const result = useProfile(user, sessionKey, api);
    const { images, error: imageError, saveImage } = profileImages;
    const [shared, setShared] = useState(false);
    const [tab, setTab] = useState('overview');
    const [editing, setEditing] = useState(false);
    const [imageModal, setImageModal] = useState('');
    const [profileDraft, setProfileDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [notice, setNotice] = useState('');
    const saveLock = useRef(false);
    const sessionRef = useRef(sessionKey);
    sessionRef.current = sessionKey;
    useEffect(() => {
        setProfileDraft(null);
        setEditing(false);
        setImageModal('');
        setSaveError('');
        setNotice('');
    }, [sessionKey]);
    const memberships = useProfileMemberships(api, sessionKey);
    const staged = result.data && profileDraft ? previewProfile(result.data, profileDraft) : result.data;
    const data = staged ? (shared ? toSharedProfile(staged) : staged) : null;
    const saveChanges = async () => {
        if (saveLock.current || !profileDraft) return;
        const session = sessionKey;
        saveLock.current = true;
        setSaving(true);
        setSaveError('');
        try {
            await result.save(profileDraft);
            if (sessionRef.current !== session) return;
            setProfileDraft(null);
            setNotice('Đã lưu hồ sơ trên thiết bị này.');
        } catch (issue) {
            if (sessionRef.current === session) setSaveError(issue.message || 'Không thể lưu hồ sơ.');
        } finally {
            saveLock.current = false;
            setSaving(false);
        }
    };
    const participations = memberships.data;
    const coverPreset =
        data?.profile.coverPreset === 'custom' && !images.cover ? 'default' : data?.profile.coverPreset || 'default';
    const customCover = coverPreset === 'custom' && images.cover;
    const saveSelectedImage = async ({ file, preset, shape, shapeTransform, backgroundColor, coverText }) => {
        if (imageModal === 'avatar') {
            await saveImage('avatar', file);
        } else if (imageModal === 'cover') {
            if (file) await saveImage('cover', file);
            await result.save({
                coverPreset: preset,
                coverShape: shape,
                coverShapeTransform: shapeTransform,
                coverBackgroundColor: backgroundColor,
                coverText,
            });
        }
    };

    if (result.status !== 'populated') {
        return (
            <div className="v2-public-content v2-profile-page">
                <PageState
                    status={result.status}
                    onRetry={result.retry}
                    title={result.status === 'empty' ? 'Hồ sơ đang chờ bạn' : undefined}
                >
                    {null}
                </PageState>
            </div>
        );
    }

    return (
        <div className="v2-public-content v2-personal-page v2-profile-page">
            <section className="v2-profile-cover">
                <ProfileCoverArt
                    color={coverPreset === 'custom' ? data.profile.coverBackgroundColor || 'default' : coverPreset}
                    shape={data.profile.coverShape || 'petals'}
                    imageUrl={customCover || ''}
                    shapeTransform={data.profile.coverShapeTransform}
                    coverText={data.profile.coverText}
                />
                {!shared && (
                    <button
                        className="v2-profile-cover-edit"
                        type="button"
                        disabled={saving || !!profileDraft}
                        onClick={() => setImageModal('cover')}
                    >
                        <ImageIcon size={16} /> Đổi ảnh bìa
                    </button>
                )}
            </section>
            <section className="v2-profile-identity">
                <div className="v2-profile-avatar-wrap">
                    <ProfileAvatar profile={data.profile} imageUrl={images.avatar} large />
                    {!shared && (
                        <button
                            type="button"
                            className="v2-profile-avatar-edit"
                            aria-label="Đổi ảnh đại diện"
                            disabled={saving || !!profileDraft}
                            onClick={() => setImageModal('avatar')}
                        >
                            <Camera size={17} />
                        </button>
                    )}
                </div>
                <div className="v2-profile-grow">
                    <div>
                        <h1>{data.profile.displayName}</h1>
                        <ShieldCheck size={21} aria-label="Hồ sơ trải nghiệm" />
                    </div>
                    <p>{data.profile.headline}</p>
                    <small>
                        <MapPin size={15} />
                        <span>
                            {[campusLabel(data.academic.campus), data.academic.major, data.academic.year]
                                .filter(Boolean)
                                .join(' · ') || 'Chưa cập nhật thông tin học vụ'}
                        </span>
                    </small>
                </div>
                <div className="v2-profile-actions">
                    <button className="v2-button" type="button" onClick={() => setShared((value) => !value)}>
                        {shared ? <Undo2 size={16} /> : <Eye size={16} />}
                        {shared ? 'Về hồ sơ cá nhân' : 'Xem dưới view công khai'}
                    </button>
                    {!shared && (
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            disabled={saving}
                            onClick={() => {
                                setEditing(true);
                                setNotice('');
                            }}
                        >
                            <Pencil size={16} />
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </section>
            {imageError && (
                <p className="v2-profile-form-error" role="alert">
                    {imageError}
                </p>
            )}
            {shared && (
                <section className="v2-profile-privacy-banner" role="status">
                    <Eye size={18} />
                    Đang xem trước thông tin chia sẻ. Mã sinh viên, điểm chi tiết và lịch sử riêng tư được ẩn.
                </section>
            )}
            <div className="v2-profile-columns">
                <aside>
                    <section className="v2-profile-panel">
                        <h2>Một chút về mình</h2>
                        <p>{data.profile.about || 'Chưa thêm giới thiệu.'}</p>
                        <div className="v2-profile-info">
                            <GraduationCap size={18} />
                            <div>
                                <strong>{user.name || user.fullName}</strong>
                                <small>Tên tài khoản từ hệ thống</small>
                            </div>
                        </div>
                        <div className="v2-profile-info">
                            <Sparkles size={18} />
                            <div>
                                <strong>Sở thích</strong>
                                <small>{data.profile.interests.join(' · ') || 'Chưa cập nhật'}</small>
                            </div>
                        </div>
                    </section>
                    <section className="v2-profile-panel">
                        <h2>Kỹ năng & thế mạnh</h2>
                        <div className="v2-profile-tags">
                            {data.profile.skills.map((skill) => (
                                <span key={skill}>{skill}</span>
                            ))}
                        </div>
                        <p className="v2-profile-note">Thông tin do sinh viên tự cập nhật.</p>
                    </section>
                    <section className="v2-profile-panel">
                        <h2>Câu lạc bộ đồng hành</h2>
                        {memberships.status === 'loading' && <p>Đang tải câu lạc bộ…</p>}
                        {memberships.status === 'error' && <p role="alert">Không thể tải câu lạc bộ lúc này.</p>}
                        {memberships.status === 'ready' && !participations.length && (
                            <p>Chưa tham gia câu lạc bộ nào.</p>
                        )}
                        {participations.map((club) => (
                            <div className="v2-profile-club" key={club.clubId}>
                                <ProfileClubLogo club={club} />
                                <div>
                                    <strong>{club.clubName}</strong>
                                    <small>{club.role}</small>
                                </div>
                            </div>
                        ))}
                    </section>
                </aside>
                <div className="v2-profile-main">
                    <div className="v2-profile-tabs-row">
                        <div className="v2-profile-tabs" role="tablist" aria-label="Nội dung hồ sơ">
                            <button
                                role="tab"
                                aria-selected={tab === 'overview'}
                                className={tab === 'overview' ? 'is-active' : ''}
                                onClick={() => setTab('overview')}
                            >
                                Tổng quan
                            </button>
                            <button
                                role="tab"
                                aria-selected={tab === 'evidence'}
                                className={tab === 'evidence' ? 'is-active' : ''}
                                onClick={() => setTab('evidence')}
                            >
                                Minh chứng
                            </button>
                        </div>
                    </div>
                    {tab === 'overview' ? (
                        <>
                            <div className="v2-profile-stats">
                                <Stat
                                    icon={Award}
                                    label="Điểm đóng góp ghi nhận"
                                    value="—"
                                    hidden={shared}
                                    note="Chưa có API tổng hợp cá nhân"
                                />
                                <Stat
                                    icon={BookOpen}
                                    label="Hoạt động đã tham dự"
                                    value="—"
                                    note="Chưa có API lịch sử cá nhân"
                                />
                                <Stat
                                    icon={FolderOpen}
                                    label="Câu lạc bộ tham gia"
                                    value={memberships.status === 'ready' ? participations.length : '—'}
                                    note="Danh sách đã duyệt từ hệ thống"
                                />
                            </div>
                            <section className="v2-profile-panel v2-profile-experience">
                                <div>
                                    <h2>Hành trình của bạn không chỉ được đo bằng điểm số.</h2>
                                    <p>Biểu đồ mẫu; số liệu trải nghiệm cá nhân chưa được kết nối.</p>
                                </div>
                                <Radar pillars={data.summary.experiencePillars} />
                            </section>
                        </>
                    ) : (
                        <section className="v2-profile-panel">
                            <div className="v2-profile-section-heading">
                                <div>
                                    <span>MINH CHỨNG</span>
                                    <h2>Lịch sử đóng góp & hoạt động</h2>
                                </div>
                            </div>
                            <p className="v2-profile-empty">
                                {shared
                                    ? 'Lịch sử riêng tư được ẩn trong bản chia sẻ.'
                                    : 'Lịch sử minh chứng cá nhân chưa có API để hiển thị.'}
                            </p>
                        </section>
                    )}
                </div>
            </div>
            {profileDraft && (
                <footer className="v2-profile-save-bar">
                    <p role="status">Đang xem trước thay đổi, chưa lưu.</p>
                    <button
                        type="button"
                        className="v2-button"
                        disabled={saving}
                        onClick={() => {
                            setProfileDraft(null);
                            setSaveError('');
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={saving}
                        onClick={saveChanges}
                    >
                        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </button>
                </footer>
            )}
            {saveError && (
                <p className="v2-profile-form-error" role="alert">
                    {saveError}
                </p>
            )}
            {notice && <p role="status">{notice}</p>}
            {editing && (
                <EditProfileModal
                    snapshot={staged}
                    onClose={() => setEditing(false)}
                    onPreview={(patch) => {
                        setProfileDraft(patch);
                        setEditing(false);
                        setSaveError('');
                    }}
                />
            )}
            {imageModal === 'cover' && (
                <ProfileCoverModal
                    user={user}
                    profile={data.profile}
                    savedImage={images.cover}
                    onClose={() => setImageModal('')}
                    onSave={saveSelectedImage}
                />
            )}
            {imageModal === 'avatar' && (
                <ProfileImageModal
                    kind={imageModal}
                    value={coverPreset}
                    images={images}
                    profile={data.profile}
                    onClose={() => setImageModal('')}
                    onSave={saveSelectedImage}
                />
            )}
        </div>
    );
}
