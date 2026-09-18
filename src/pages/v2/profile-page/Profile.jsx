import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowUpRight,
    Award,
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
    ArrowRight,
} from 'lucide-react';
import { useDemo } from '../DemoContext';
import { CLUBS, CURRENT_TERM, clubById, displayPerson, ownPoints } from '../model';
import { Avatar, ClubMark, Empty, FormField, Modal, Pill, SectionHeading, Stat } from '../ui';

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
                aria-label={
                    hasData
                        ? 'Radar sáu trụ cột minh họa, không tính từ điểm đóng góp'
                        : 'Radar trống, chưa có dữ liệu trải nghiệm'
                }
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

export default function Profile() {
    const { state, actorId, act } = useDemo();
    const actor = displayPerson(state, actorId);
    const [editing, setEditing] = useState(false),
        [shared, setShared] = useState(false),
        [tab, setTab] = useState('overview'),
        [term, setTerm] = useState(CURRENT_TERM);
    const memberships = state.memberships.filter((m) => m.userId === actorId && m.status === 'approved');
    const ledger = state.ledger
        .filter((l) => l.userId === actorId && (!term || l.term === term))
        .slice()
        .reverse();
    const all = state.ledger.filter((l) => l.userId === actorId);
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
                    Đang xem trước thông tin chia sẻ. Mã sinh viên, điểm chi tiết và lịch sử riêng tư được ẩn. Chưa xuất
                    bản hồ sơ lên mạng.
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
                        <p className="dx-small-note">Thông tin do sinh viên tự giới thiệu.</p>
                    </section>
                    <section className="dx-panel">
                        <h3>Cộng đồng của tôi</h3>
                        {memberships.length ? (
                            memberships.map((m) => (
                                <div className="dx-person" key={m.clubId}>
                                    <ClubMark club={clubById(m.clubId)} />
                                    <div>
                                        <Link className="dx-text-link" to={`/v2/demo/clubs/${m.clubId}`}>
                                            {clubById(m.clubId).name}
                                        </Link>
                                        <small>{m.role === 'manager' ? 'Chủ nhiệm' : 'Thành viên'}</small>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="dx-muted">Hành trình CLB đang chờ bắt đầu.</p>
                        )}
                    </section>
                    <div className="dx-small-note">
                        <ShieldCheck size={15} />
                        Hồ sơ và nhân vật minh họa. Các mục tự khai không phải chứng nhận của nhà trường.
                    </div>
                </aside>
                <div>
                    <div className="dx-profile-tabs">
                        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
                            Tổng quan
                        </button>
                        <button className={tab === 'journey' ? 'active' : ''} onClick={() => setTab('journey')}>
                            Hành trình trải nghiệm
                        </button>
                        <button className={tab === 'portfolio' ? 'active' : ''} onClick={() => setTab('portfolio')}>
                            Dự án & thành tích
                        </button>
                    </div>
                    {tab === 'overview' && (
                        <>
                            {!shared && (
                                <>
                                    <div className="dx-stats three">
                                        <Stat
                                            label="Cộng đồng đã tham gia"
                                            value={memberships.length}
                                            note="Những nơi bạn thuộc về"
                                        />
                                        <Stat
                                            label="Điểm đóng góp tích lũy"
                                            value={ownPoints(state, actorId)}
                                            note="Có nhãn CLB ở từng bản ghi"
                                        />
                                        <Stat
                                            label="Lượt ghi nhận đóng góp"
                                            value={all.length}
                                            note="Tích lũy qua các học kỳ"
                                        />
                                    </div>
                                    <section className="dx-panel">
                                        <SectionHeading
                                            title="Bức tranh trải nghiệm của bạn"
                                            description="Một góc nhìn về sự đa dạng trong hành trình."
                                        />
                                        <div className="dx-radar-layout">
                                            <Radar hasData={hasData} />
                                            <div>
                                                <Pill tone="orange">THÀNH PHẦN UI THAM KHẢO</Pill>
                                                <h3>
                                                    {hasData
                                                        ? 'Lớn lên theo cách của riêng mình.'
                                                        : 'Chương đầu tiên chưa được viết.'}
                                                </h3>
                                                <p>
                                                    Radar 6 trục và phần +1 trải nghiệm thực tế đang là minh họa bố cục.
                                                    Chưa áp dụng công thức từ tài liệu vào điểm đóng góp.
                                                </p>
                                                <div className="dx-real-experience">
                                                    <Sparkles size={18} />
                                                    <div>
                                                        <strong>+1 Trải nghiệm thực tế</strong>
                                                        <small>OJT / dự án doanh nghiệp · Chưa xác thực</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </>
                            )}
                            <section className="dx-panel">
                                <SectionHeading title="Điều mình đang theo đuổi" />
                                <h3>{actor.project || 'Tìm cộng đồng đầu tiên'}</h3>
                                <p>
                                    {actor.project
                                        ? 'Một dự án nhỏ để áp dụng những điều đã học và cùng bạn bè tạo ra giá trị. Mình đang tiếp tục hoàn thiện sản phẩm qua phản hồi của cộng đồng.'
                                        : 'Mình đang khám phá các câu lạc bộ phù hợp với sở thích và lịch học.'}
                                </p>
                                <Pill>Tự giới thiệu · Chưa xác nhận</Pill>
                            </section>
                            <section className="dx-panel">
                                <SectionHeading title="Dấu mốc cộng đồng" />
                                {memberships.map((m) => (
                                    <div className="dx-timeline" key={m.clubId}>
                                        <span className="dx-timeline-dot" />
                                        <div>
                                            <small>FALL 2026 · THÀNH VIÊN HIỆN TẠI</small>
                                            <h3>
                                                {m.role === 'manager' ? 'Dẫn dắt cộng đồng' : 'Bắt đầu một hành trình'}{' '}
                                                tại {clubById(m.clubId).name}
                                            </h3>
                                            <p>
                                                {m.role === 'manager'
                                                    ? 'Điều phối hoạt động, hỗ trợ thành viên và cùng tạo ra những trải nghiệm ý nghĩa.'
                                                    : 'Tham gia sinh hoạt, gặp gỡ những người bạn mới và đóng góp theo thế mạnh của mình.'}
                                            </p>
                                            <Pill tone="green">Vai trò xác nhận trong mock</Pill>
                                        </div>
                                    </div>
                                ))}
                                {!memberships.length && (
                                    <Empty
                                        title="Thêm một cộng đồng vào hành trình"
                                        text="Tìm một CLB để bắt đầu câu chuyện của bạn."
                                    >
                                        <Link className="dx-button" to="/v2/demo">
                                            Khám phá CLB <ArrowRight size={16} />
                                        </Link>
                                    </Empty>
                                )}
                            </section>
                        </>
                    )}
                    {tab === 'journey' &&
                        (shared ? (
                            <Empty
                                title="Lịch sử đóng góp đang để riêng tư"
                                text="Bản chia sẻ chỉ hiển thị giới thiệu, kỹ năng và vai trò cộng đồng."
                            />
                        ) : (
                            <section className="dx-panel">
                                <SectionHeading title="Hành trình đóng góp">
                                    <select
                                        aria-label="Học kỳ hồ sơ"
                                        value={term}
                                        onChange={(e) => setTerm(e.target.value)}
                                    >
                                        <option value="FA26">Fall 2026</option>
                                        <option value="SU26">Summer 2026</option>
                                        <option value="">Tích lũy toàn khóa</option>
                                    </select>
                                </SectionHeading>
                                <p className="dx-muted">
                                    {eventCount} hoạt động đã tham dự · {ledger.length} lượt ghi nhận · nhiều CLB, từng
                                    nguồn rõ ràng.
                                </p>
                                {ledger.length ? (
                                    ledger.map((l) => (
                                        <div className="dx-timeline" key={l.id}>
                                            <span className="dx-timeline-dot" />
                                            <div>
                                                <div className="dx-inline">
                                                    <small>{l.date}</small>
                                                    <Pill>{clubById(l.clubId).name}</Pill>
                                                </div>
                                                <h3>{l.reason}</h3>
                                                <p>{l.source}</p>
                                                <div className="dx-inline">
                                                    <Pill tone="green">Đã xác nhận (demo)</Pill>
                                                    <span className="dx-muted">
                                                        {l.verifier} · +{l.amount} điểm
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <Empty title="Chưa có đóng góp trong học kỳ này" />
                                )}
                            </section>
                        ))}
                    {tab === 'portfolio' && (
                        <>
                            <section className="dx-panel">
                                <SectionHeading title="Dự án & sản phẩm cá nhân" />
                                {actor.project ? (
                                    <div className="dx-portfolio-project">
                                        <div className="dx-project-art">
                                            <FolderOpen size={56} />
                                            <span>
                                                BUILT WITH
                                                <br />
                                                CURIOSITY.
                                            </span>
                                        </div>
                                        <div>
                                            <Pill>Dự án cá nhân · Tự khai</Pill>
                                            <h2>{actor.project}</h2>
                                            <p>
                                                Vai trò: ý tưởng, thiết kế và phát triển nội dung. Bản giới thiệu sản
                                                phẩm đang được hoàn thiện.
                                            </p>
                                            <div className="dx-inline">
                                                {actor.skills.slice(0, 3).map((s) => (
                                                    <Pill key={s}>{s}</Pill>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <Empty
                                        title="Dự án đầu tiên sẽ xuất hiện tại đây"
                                        text="Bạn có thể tích lũy sản phẩm qua các nhiệm vụ và hoạt động CLB."
                                    />
                                )}
                            </section>
                            <section className="dx-panel">
                                <SectionHeading title="Chứng chỉ & ghi nhận" />
                                <Empty
                                    title="Chưa thêm chứng chỉ"
                                    text="Không tự tạo chứng nhận khi chưa có minh chứng. Các đóng góp được xác nhận nằm trong hành trình trải nghiệm."
                                />
                            </section>
                        </>
                    )}
                </div>
            </div>
            {editing && (
                <Modal title="Chỉnh sửa hồ sơ cá nhân" onClose={() => setEditing(false)} wide>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (act('profile', null, CURRENT_TERM, Object.fromEntries(new FormData(e.currentTarget))))
                                setEditing(false);
                        }}
                    >
                        <FormField
                            label="Tiêu đề cá nhân"
                            name="headline"
                            defaultValue={actor.headline}
                            required
                            maxLength={160}
                        />
                        <FormField
                            label="Giới thiệu bản thân"
                            name="about"
                            defaultValue={actor.about}
                            textarea
                            rows={5}
                            maxLength={2000}
                        />
                        <FormField
                            label="Kỹ năng (phân cách bằng dấu phẩy)"
                            name="skills"
                            defaultValue={actor.skills.join(', ')}
                            maxLength={300}
                        />
                        <p className="dx-small-note">
                            Dữ liệu chỉ lưu trong phiên demo. Tên, mã sinh viên và vai trò không chỉnh sửa tại đây.
                        </p>
                        <div className="dx-form-footer">
                            <button type="button" className="dx-button" onClick={() => setEditing(false)}>
                                Hủy
                            </button>
                            <button className="dx-button primary">
                                Lưu hồ sơ <Check size={16} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
