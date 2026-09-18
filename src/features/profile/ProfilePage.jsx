import React, { useState } from 'react';
import {
    BookOpen,
    Check,
    Eye,
    GraduationCap,
    MapPin,
    Pencil,
    ShieldCheck,
    Sparkles,
    FolderOpen,
    LockKeyhole,
    Award,
} from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { CURRENT_TERM, clubById, displayPerson } from '../../core/model';
import { Avatar } from '../../components/ui/Avatar';
import { ClubMark } from '../../components/club/ClubMark';
import { Empty } from '../../components/ui/Empty';
import { FormField } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { Pill } from '../../components/ui/Pill';
import { SectionHeading } from '../../components/ui/Headings';
import { Stat } from '../../components/ui/Stat';

function Radar({ hasData }) {
    const labels = ['Học tập', 'Nghiên cứu', 'Quốc tế', 'Thể thao & văn hóa', 'Cộng đồng', 'Khởi nghiệp'];
    const point = (i, r) => [160 + Math.sin((i * Math.PI) / 3) * r, 137 - Math.cos((i * Math.PI) / 3) * r];
    const polygon = (values) => values.map((v, i) => point(i, v).join(',')).join(' ');
    const values = hasData ? [74, 38, 32, 65, 86, 50] : [0, 0, 0, 0, 0, 0];
    return (
        <div className="dx-radar">
            <svg
                viewBox="0 0 320 285"
                role="img"
                aria-label={hasData ? 'Radar sáu trụ cột minh họa' : 'Radar trống, chưa có dữ liệu trải nghiệm'}
            >
                {[25, 50, 75, 100].map((r) => (
                    <polygon key={r} points={polygon(Array(6).fill(r))} fill="none" stroke="#e5e7e1" />
                ))}
                {labels.map((l, i) => {
                    const [x, y] = point(i, 100);
                    return <line key={l} x1="160" y1="137" x2={x} y2={y} stroke="#e5e7e1" />;
                })}
                {hasData && (
                    <polygon
                        points={polygon([52, 29, 20, 44, 65, 35])}
                        fill="none"
                        stroke="#aab1a8"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                    />
                )}
                <polygon points={polygon(values)} fill="#ec6b3322" stroke="#d45b2e" strokeWidth="2" />
                {values.map((v, i) => {
                    const [x, y] = point(i, v);
                    return <circle key={i} cx={x} cy={y} r={hasData ? 3 : 0} fill="#d45b2e" />;
                })}
                {labels.map((l, i) => {
                    const [x, y] = point(i, 123);
                    return (
                        <text
                            key={l}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#657064"
                            fontSize="9"
                        >
                            {l}
                        </text>
                    );
                })}
            </svg>
            <div className="dx-radar-legend">
                <span>
                    <i />
                    Kỳ này (minh họa)
                </span>
                <span>
                    <i />
                    Kỳ trước (minh họa)
                </span>
            </div>
        </div>
    );
}

export function ProfilePage() {
    const { state, actorId, act } = useClubHub();
    const actor = displayPerson(state, actorId);
    const [editing, setEditing] = useState(false);
    const [shared, setShared] = useState(false);
    const [tab, setTab] = useState('overview');
    const [term, setTerm] = useState(CURRENT_TERM);

    const memberships = state.memberships.filter(
        (m) => (m.userId === actorId || String(m.userId) === String(actorId)) && m.status === 'approved',
    );
    const ledger = state.ledger
        .filter((l) => (l.userId === actorId || String(l.userId) === String(actorId)) && (!term || l.term === term))
        .slice()
        .reverse();
    const all = state.ledger.filter((l) => l.userId === actorId || String(l.userId) === String(actorId));
    const eventCount = state.activities.filter(
        (e) => e.checkedIn.includes(actorId) && (!term || e.term === term),
    ).length;
    const hasData = all.length > 0;

    return (
        <div className="dx-public-content dx-profile">
            <div className="dx-profile-cover">
                <div>
                    <span>THE EXPERIENCE IS YOURS.</span>
                    <strong>
                        Make your time
                        <br />
                        <em>mean something.</em>
                    </strong>
                </div>
                <div className="dx-profile-cover-art" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <b>
                        FPTU
                        <br />
                        XPERIENCE
                    </b>
                </div>
            </div>
            <div className="dx-profile-identity">
                <Avatar person={actor} large />
                <div className="dx-grow">
                    <div className="dx-inline">
                        <h1>{actor.name}</h1>
                        {hasData && <ShieldCheck size={21} className="dx-green" />}
                    </div>
                    <p>{actor.headline}</p>
                    <div className="dx-meta">
                        <MapPin size={15} />
                        FPTU Hồ Chí Minh <span>·</span> {actor.major}
                        {actor.year && ` · ${actor.year}`}
                    </div>
                </div>
                <div className="dx-actions">
                    <button className="dx-button" onClick={() => setShared(!shared)}>
                        {shared ? <LockKeyhole size={16} /> : <Eye size={16} />}{' '}
                        {shared ? 'Về hồ sơ cá nhân' : 'Xem bản chia sẻ'}
                    </button>
                    {!shared && (
                        <button className="dx-button primary" onClick={() => setEditing(true)}>
                            <Pencil size={16} />
                            Chỉnh sửa
                        </button>
                    )}
                </div>
            </div>
            {shared && (
                <div className="dx-banner">
                    <Eye size={18} />
                    Đang xem trước thông tin chia sẻ. Mã sinh viên, điểm chi tiết và lịch sử riêng tư được ẩn.
                </div>
            )}
            <div className="dx-profile-columns">
                <aside>
                    <section className="dx-panel">
                        <h3>Một chút về mình</h3>
                        <p>{actor.about || 'Chưa thêm giới thiệu.'}</p>
                        <div className="dx-profile-info">
                            <GraduationCap size={18} />
                            <div>
                                <strong>{actor.major}</strong>
                                <small>Đại học FPT · Hồ Chí Minh</small>
                            </div>
                        </div>
                        {!shared && actor.code && (
                            <div className="dx-profile-info">
                                <LockKeyhole size={18} />
                                <div>
                                    <strong>{actor.code}</strong>
                                    <small>Mã sinh viên · Chỉ mình bạn</small>
                                </div>
                            </div>
                        )}
                        <div className="dx-profile-info">
                            <Sparkles size={18} />
                            <div>
                                <strong>Sở thích</strong>
                                <small>{actor.interest || 'Chưa cập nhật'}</small>
                            </div>
                        </div>
                    </section>
                    <section className="dx-panel">
                        <h3>Kỹ năng & thế mạnh</h3>
                        <div className="dx-inline dx-tags">
                            {actor.skills.map((s) => (
                                <Pill key={s}>{s}</Pill>
                            ))}
                        </div>
                        <p className="dx-small-note">Thông tin do sinh viên tự cập nhật.</p>
                    </section>
                    <section className="dx-panel">
                        <h3>Câu lạc bộ đồng hành</h3>
                        {memberships.length ? (
                            memberships.map((m) => {
                                const c = clubById(m.clubId);
                                return (
                                    <div className="dx-profile-club" key={c.id}>
                                        <ClubMark club={c} />
                                        <div>
                                            <strong>{c.name}</strong>
                                            <small>{m.role === 'manager' ? 'Chủ nhiệm CLB' : 'Thành viên'}</small>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p>Chưa tham gia câu lạc bộ nào.</p>
                        )}
                    </section>
                </aside>

                <div>
                    <div className="dx-tabs-row">
                        <div className="dx-tabs">
                            {[
                                ['overview', 'Tổng quan'],
                                ['ledger', 'Minh chứng'],
                            ].map(([k, l]) => (
                                <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <select aria-label="Lọc theo học kỳ" value={term} onChange={(e) => setTerm(e.target.value)}>
                            <option value="">Tất cả học kỳ</option>
                            <option value="FA26">Fall 2026</option>
                            <option value="SU26">Summer 2026</option>
                        </select>
                    </div>

                    {tab === 'overview' && (
                        <>
                            <div className="dx-stats three">
                                <Stat
                                    label="Điểm đóng góp ghi nhận"
                                    value={all.reduce((s, l) => s + l.amount, 0)}
                                    note="Tổng tích lũy qua các kỳ"
                                    icon={Award}
                                />
                                <Stat
                                    label="Hoạt động đã tham dự"
                                    value={eventCount}
                                    note={term ? `Trong ${term}` : 'Tất cả học kỳ'}
                                    icon={BookOpen}
                                />
                                <Stat
                                    label="Câu lạc bộ tham gia"
                                    value={memberships.length}
                                    note="Cộng đồng đã gắn bó"
                                    icon={FolderOpen}
                                />
                            </div>

                            <section className="dx-panel">
                                <SectionHeading
                                    title="Sáu trụ cột trải nghiệm (minh họa)"
                                    description="Mô hình phát triển năng lực toàn diện FPTU Xperience."
                                />
                                <Radar hasData={hasData} />
                            </section>
                        </>
                    )}

                    {tab === 'ledger' && (
                        <section className="dx-panel">
                            <SectionHeading
                                title="Lịch sử đóng góp & hoạt động"
                                description="Từng dấu ấn được ghi nhận bởi ban chủ nhiệm CLB."
                            />
                            {ledger.length ? (
                                ledger.map((l) => (
                                    <div className="dx-list-row" key={l.id}>
                                        <Award size={20} />
                                        <div className="dx-grow">
                                            <strong>{l.reason}</strong>
                                            <small>
                                                {clubById(l.clubId).name} · {l.date} · Người xác nhận: {l.verifier}
                                            </small>
                                        </div>
                                        <Pill tone="green">+{l.amount} điểm</Pill>
                                    </div>
                                ))
                            ) : (
                                <Empty title="Chưa có minh chứng trong kỳ" />
                            )}
                        </section>
                    )}
                </div>
            </div>

            {editing && (
                <Modal title="Chỉnh sửa thông tin cá nhân" onClose={() => setEditing(false)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            act('updateProfile', null, null, {
                                ...d,
                                skills: d.skills
                                    ? d.skills
                                          .split(',')
                                          .map((s) => s.trim())
                                          .filter(Boolean)
                                    : actor.skills,
                            });
                            setEditing(false);
                        }}
                    >
                        <FormField label="Họ và tên" name="name" defaultValue={actor.name} required />
                        <FormField
                            label="Câu nói tâm đắc / tiêu đề"
                            name="headline"
                            defaultValue={actor.headline}
                            maxLength={120}
                        />
                        <FormField
                            label="Giới thiệu bản thân"
                            name="about"
                            defaultValue={actor.about}
                            textarea
                            rows={4}
                        />
                        <FormField
                            label="Kỹ năng (cách nhau bởi dấu phẩy)"
                            name="skills"
                            defaultValue={actor.skills.join(', ')}
                        />
                        <FormField label="Sở thích" name="interest" defaultValue={actor.interest} />
                        <div className="dx-form-footer">
                            <button type="button" className="dx-button" onClick={() => setEditing(false)}>
                                Hủy
                            </button>
                            <button className="dx-button primary">
                                Lưu thay đổi <Check size={16} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default ProfilePage;
