import { useMemo, useState } from 'react';
import {
    Award,
    BookOpen,
    Check,
    Eye,
    FolderOpen,
    GraduationCap,
    LockKeyhole,
    MapPin,
    Pencil,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import PageState from '../../../components/v2/PageState';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { toSharedProfile, useProfile } from '../profile-data';
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

function ProfileAvatar({ profile, large = false }) {
    return profile.avatarUrl ? <img className={`v2-profile-avatar${large ? ' is-large' : ''}`} src={profile.avatarUrl} alt="" /> : <span className={`v2-profile-avatar${large ? ' is-large' : ''}`} aria-hidden="true">{profile.initials}</span>;
}

function EditProfileModal({ profile, onClose, onSave }) {
    const [draft, setDraft] = useState({
        displayName: profile.displayName,
        headline: profile.headline,
        about: profile.about,
        skills: profile.skills.join(', '),
        interests: profile.interests.join(', '),
    });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const update = (event) => setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
    const submit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        try {
            await onSave({ ...draft, skills: draft.skills.split(','), interests: draft.interests.split(',') });
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
                {error && <p className="v2-profile-form-error" role="alert">{error}</p>}
                <footer><button className="v2-button" type="button" onClick={onClose} disabled={saving}>Hủy</button><button className="v2-button v2-button--primary" disabled={saving}>{saving ? 'Đang lưu...' : <><Check size={16} /> Lưu thay đổi</>}</button></footer>
            </form>
        </V2Modal>
    );
}

export default function ProfilePage({ user, sessionKey }) {
    const result = useProfile(user, sessionKey);
    const [shared, setShared] = useState(false);
    const [tab, setTab] = useState('overview');
    const [term, setTerm] = useState('');
    const [editing, setEditing] = useState(false);
    const data = result.data ? (shared ? toSharedProfile(result.data) : result.data) : null;
    const evidence = useMemo(
        () => (data?.evidence || []).filter((item) => !term || item.term === term),
        [data?.evidence, term],
    );

    if (result.status !== 'populated') {
        return <div className="v2-public-content v2-profile-page"><PageState status={result.status} onRetry={result.retry} title={result.status === 'empty' ? 'Hồ sơ đang chờ bạn' : undefined}>{null}</PageState></div>;
    }

    return (
        <div className="v2-public-content v2-personal-page v2-profile-page">
            <section className="v2-profile-cover">
                <div><span>THE EXPERIENCE IS YOURS.</span><strong>Make your time<br /><em>mean something.</em></strong></div>
                <div className="v2-profile-cover-art" aria-hidden="true"><span /><span /><span /><b>FPTU<br />XPERIENCE</b></div>
            </section>
            <section className="v2-profile-identity">
                <ProfileAvatar profile={data.profile} large />
                <div className="v2-profile-grow"><div><h1>{data.profile.displayName}</h1><ShieldCheck size={21} aria-label="Hồ sơ trải nghiệm" /></div><p>{data.profile.headline}</p><small><MapPin size={15} /> {data.academic.campus} <i>·</i> {data.academic.major}{data.academic.year && ` · ${data.academic.year}`}</small></div>
                <div className="v2-profile-actions"><button className="v2-button" type="button" onClick={() => setShared((value) => !value)}>{shared ? <LockKeyhole size={16} /> : <Eye size={16} />}{shared ? 'Về hồ sơ cá nhân' : 'Xem bản chia sẻ'}</button>{!shared && <button className="v2-button v2-button--primary" type="button" onClick={() => setEditing(true)}><Pencil size={16} />Chỉnh sửa</button>}</div>
            </section>
            {shared && <section className="v2-profile-privacy-banner" role="status"><Eye size={18} />Đang xem trước thông tin chia sẻ. Mã sinh viên, điểm chi tiết và lịch sử riêng tư được ẩn.</section>}
            <div className="v2-profile-columns">
                <aside>
                    <section className="v2-profile-panel"><h2>Một chút về mình</h2><p>{data.profile.about || 'Chưa thêm giới thiệu.'}</p><div className="v2-profile-info"><GraduationCap size={18} /><div><strong>{data.academic.major}</strong><small>Đại học FPT · Hồ Chí Minh</small></div></div>{!shared && <div className="v2-profile-info"><LockKeyhole size={18} /><div><strong>{data.academic.studentCode}</strong><small>Mã sinh viên · Chỉ mình bạn</small></div></div>}<div className="v2-profile-info"><Sparkles size={18} /><div><strong>Sở thích</strong><small>{data.profile.interests.join(' · ') || 'Chưa cập nhật'}</small></div></div></section>
                    <section className="v2-profile-panel"><h2>Kỹ năng & thế mạnh</h2><div className="v2-profile-tags">{data.profile.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><p className="v2-profile-note">Thông tin do sinh viên tự cập nhật.</p></section>
                    <section className="v2-profile-panel"><h2>Câu lạc bộ đồng hành</h2>{data.participations.map((club) => <div className="v2-profile-club" key={club.clubId}><span>{club.clubName.slice(0, 2).toUpperCase()}</span><div><strong>{club.clubName}</strong><small>{club.role}</small></div></div>)}</section>
                </aside>
                <div className="v2-profile-main">
                    <div className="v2-profile-tabs-row"><div className="v2-profile-tabs" role="tablist" aria-label="Nội dung hồ sơ"><button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}>Tổng quan</button><button role="tab" aria-selected={tab === 'evidence'} className={tab === 'evidence' ? 'is-active' : ''} onClick={() => setTab('evidence')}>Minh chứng</button></div><label className="v2-profile-term">Học kỳ<select aria-label="Lọc theo học kỳ" value={term} onChange={(event) => setTerm(event.target.value)}><option value="">Tất cả học kỳ</option>{data.terms.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
                    {tab === 'overview' ? <><div className="v2-profile-stats"><Stat icon={Award} label="Điểm đóng góp ghi nhận" value={data.summary.recognizedContributionTotal} hidden={shared} note={shared ? 'Chỉ hiển thị trong hồ sơ cá nhân' : 'Tổng tích lũy qua các kỳ'} /><Stat icon={BookOpen} label="Hoạt động đã tham dự" value={data.summary.activityCount} note={term ? `Trong ${term}` : 'Tất cả học kỳ'} /><Stat icon={FolderOpen} label="Câu lạc bộ tham gia" value={data.summary.clubCount} note="Cộng đồng đã gắn bó" /></div><section className="v2-profile-panel v2-profile-experience"><div><span>SÁU TRỤ CỘT TRẢI NGHIỆM</span><h2>Hành trình của bạn không chỉ được đo bằng điểm số.</h2><p>Đây là hình minh họa cho những kỹ năng bạn đang nuôi dưỡng qua từng trải nghiệm.</p></div><Radar pillars={data.summary.experiencePillars} /></section></> : <section className="v2-profile-panel"><div className="v2-profile-section-heading"><div><span>MINH CHỨNG</span><h2>Lịch sử đóng góp & hoạt động</h2><p>Từng dấu ấn được ghi nhận bởi ban chủ nhiệm CLB.</p></div></div>{shared ? <p className="v2-profile-empty">Lịch sử riêng tư được ẩn trong bản chia sẻ.</p> : evidence.length ? <div className="v2-profile-evidence-list">{evidence.map((item) => <article key={item.id}><Award size={20} /><div><strong>{item.title}</strong><small>{item.clubName} · {item.date} · Người xác nhận: {item.verifier}</small></div><span>+{item.points} điểm</span></article>)}</div> : <p className="v2-profile-empty">Chưa có minh chứng trong học kỳ này.</p>}</section>}
                </div>
            </div>
            {editing && <EditProfileModal profile={result.data.profile} onClose={() => setEditing(false)} onSave={result.save} />}
        </div>
    );
}
