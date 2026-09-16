import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowRight,
    ArrowUpRight,
    Sparkles,
    CalendarDays,
    MapPin,
    Users,
    Check,
    SlidersHorizontal,
    Heart,
    Compass,
} from 'lucide-react';
import { CLUBS, CURRENT_TERM, clubById, membership, displayPerson } from './model';
import { useDemo } from './DemoContext';
import {
    Avatar,
    ClubArt,
    ClubCard,
    ClubMark,
    Empty,
    EventCard,
    FormField,
    Modal,
    PageHeading,
    Pill,
    SearchField,
    SectionHeading,
    BackLink,
    dateLabel,
} from './ui';

export function Discover() {
    const { state } = useDemo();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('Tất cả');
    const [onlyRecruiting, setOnlyRecruiting] = useState(false);
    const clubs = useMemo(
        () =>
            CLUBS.filter(
                (c) =>
                    (category === 'Tất cả' || c.category === category) &&
                    (!onlyRecruiting || (state.settings[c.id]?.recruiting ?? c.recruiting)) &&
                    `${c.name} ${c.fullName} ${c.tags.join(' ')}`
                        .toLocaleLowerCase('vi')
                        .includes(query.toLocaleLowerCase('vi')),
            ),
        [query, category, onlyRecruiting, state.settings],
    );
    return (
        <div className="dx-public-content">
            <section className="dx-discover-hero">
                <div className="dx-hero-copy">
                    <div className="dx-eyebrow">
                        <span className="dx-live-dot" /> MỘT CAMPUS. NHIỀU CÁCH TỎA SÁNG.
                    </div>
                    <h1>
                        Tìm cộng đồng.
                        <br />
                        <span>Viết câu chuyện của bạn.</span>
                    </h1>
                    <p>
                        Những người bạn mới, những điều chưa từng thử.
                        <br />
                        Hành trình đại học đáng nhớ bắt đầu từ một câu lạc bộ.
                    </p>
                    <a href="#club-directory" className="dx-button primary">
                        Khám phá các CLB <ArrowRight size={18} />
                    </a>
                    <div className="dx-hero-note">
                        <div className="dx-avatar-stack">
                            <span>KL</span>
                            <span>NM</span>
                            <span>HA</span>
                        </div>
                        <div>
                            <strong>Mỗi cá tính, một nơi thuộc về.</strong>
                            <small>Cộng đồng sinh viên FPTU Hồ Chí Minh</small>
                        </div>
                    </div>
                </div>
                <div className="dx-hero-collage" aria-hidden="true">
                    <div className="dx-collage-note">
                        YOUR NEXT
                        <br />
                        <em>chapter.</em>
                        <Sparkles size={38} />
                    </div>
                    <div className="dx-collage-ticket">
                        <span>THE CAMPUS PASS</span>
                        <strong>
                            Explore.
                            <br />
                            Connect.
                            <br />
                            Belong.
                        </strong>
                        <div className="dx-ticket-line" />
                        <small>FPTU XPERIENCE &nbsp; / &nbsp; FALL 2026</small>
                    </div>
                    <div className="dx-floating-tag">
                        <Heart size={17} /> Những điều hay đang chờ bạn
                    </div>
                    <div className="dx-circle-label">
                        BE PART
                        <br />
                        OF SOMETHING
                    </div>
                </div>
            </section>
            <div className="dx-discovery-strip">
                <span>
                    <Compass size={18} />
                    Khám phá theo sở thích
                </span>
                <span>
                    <CalendarDays size={18} />
                    Tìm lịch sinh hoạt phù hợp
                </span>
                <span>
                    <Users size={18} />
                    Kết nối với cộng đồng của bạn
                </span>
            </div>
            <section id="club-directory">
                <SectionHeading
                    title="Bạn muốn thử điều gì?"
                    description="Chọn một sở thích, tìm một cộng đồng. Hoặc bắt đầu với điều hoàn toàn mới."
                >
                    <span className="dx-muted">{CLUBS.length} CLB trong bản trải nghiệm</span>
                </SectionHeading>
                <div className="dx-filter-bar">
                    <div className="dx-tabs" role="group" aria-label="Lĩnh vực CLB">
                        {['Tất cả', 'Công nghệ', 'Nghệ thuật', 'Cộng đồng', 'Thể thao', 'Kinh doanh'].map((c) => (
                            <button
                                key={c}
                                className={category === c ? 'active' : ''}
                                onClick={() => setCategory(c)}
                                aria-pressed={category === c}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <SearchField value={query} onChange={setQuery} placeholder="Tìm câu lạc bộ..." />
                </div>
                <div className="dx-directory-label">
                    <span>{clubs.length} cộng đồng dành cho bạn</span>
                    <label className="dx-checkbox">
                        <input
                            type="checkbox"
                            checked={onlyRecruiting}
                            onChange={(e) => setOnlyRecruiting(e.target.checked)}
                        />
                        <SlidersHorizontal size={15} /> Đang tuyển thành viên
                    </label>
                </div>
                <div className="dx-club-grid">
                    {clubs.map((c) => (
                        <ClubCard key={c.id} club={c} />
                    ))}
                </div>
                {!clubs.length && (
                    <Empty title="Chưa tìm thấy CLB phù hợp" text="Thử từ khóa khác hoặc bỏ bộ lọc lĩnh vực." />
                )}
            </section>
            <section className="dx-bottom-callout">
                <div>
                    <span className="dx-eyebrow">KHÔNG CẦN GIỎI SẴN. CHỈ CẦN SẴN SÀNG.</span>
                    <h2>Bắt đầu từ một lời chào.</h2>
                    <p>Một sở thích nhỏ hôm nay có thể trở thành câu chuyện lớn ngày mai.</p>
                </div>
                <Link className="dx-button" to="/demo/my-clubs">
                    Đến CLB của tôi <ArrowUpRight size={18} />
                </Link>
            </section>
        </div>
    );
}

export function ClubDetail() {
    const { clubId } = useParams();
    const club = clubById(clubId);
    const { state, actorId, act } = useDemo();
    const [joining, setJoining] = useState(false);
    const [reason, setReason] = useState('');
    if (!club)
        return (
            <Empty title="Không tìm thấy CLB" text="CLB này không có trong bản mock.">
                <Link to="/demo" className="dx-button">
                    Về khám phá
                </Link>
            </Empty>
        );
    const access = membership(state, actorId, clubId);
    const pending = state.applications.find(
        (a) => a.userId === actorId && a.clubId === clubId && a.status === 'pending',
    );
    const recruiting = state.settings[clubId]?.recruiting ?? club.recruiting;
    const leaders = state.memberships.filter((m) => m.clubId === clubId && m.role === 'manager');
    const events = state.activities.filter((a) => a.clubId === clubId && a.public && a.term === CURRENT_TERM);
    return (
        <div className="dx-public-content">
            <BackLink to="/demo">Tất cả câu lạc bộ</BackLink>
            <div className="dx-detail-cover">
                <ClubArt club={club} hero />
            </div>
            <div className="dx-club-identity">
                <ClubMark club={club} large />
                <div>
                    <div className="dx-inline">
                        <Pill>{club.category}</Pill>
                        <Pill tone="orange">{recruiting ? 'Đang tuyển thành viên' : 'Chưa mở tuyển'}</Pill>
                    </div>
                    <h1>{club.fullName}</h1>
                    <p>{club.tagline}</p>
                </div>
                <div className="dx-identity-action">
                    {access ? (
                        <Link to={`/demo/my-clubs/${clubId}`} className="dx-button primary">
                            Vào CLB của tôi <ArrowRight size={17} />
                        </Link>
                    ) : pending ? (
                        <span className="dx-button soft">
                            <Check size={17} />
                            Đơn đang chờ duyệt
                        </span>
                    ) : (
                        <button className="dx-button primary" disabled={!recruiting} onClick={() => setJoining(true)}>
                            Tham gia cộng đồng <ArrowUpRight size={17} />
                        </button>
                    )}
                </div>
            </div>
            <div className="dx-detail-columns">
                <div>
                    <section className="dx-panel">
                        <span className="dx-eyebrow">CHÚNG MÌNH LÀ AI?</span>
                        <h2>Một nơi để cùng nhau phát triển.</h2>
                        <p className="dx-body-large">{state.settings[clubId]?.description || club.description}</p>
                        <p>
                            Ở {club.name}, bạn không cần phải có mọi câu trả lời. Chúng mình cùng học hỏi qua các buổi
                            sinh hoạt, dự án nhóm và những hoạt động thực tế. Mỗi thành viên đều có không gian để thử
                            sức và đóng góp theo cách của riêng mình.
                        </p>
                        <div className="dx-inline">
                            {club.tags.map((t) => (
                                <Pill key={t}>{t}</Pill>
                            ))}
                        </div>
                    </section>
                    <SectionHeading title="Sắp diễn ra" description="Một cơ hội tốt để gặp gỡ cộng đồng." />
                    {events.length ? (
                        events.map((e) => (
                            <EventCard
                                key={e.id}
                                event={e}
                                club={club}
                                base={access ? `/demo/my-clubs/${clubId}/activities` : '/demo/events'}
                            />
                        ))
                    ) : (
                        <Empty
                            title="Lịch hoạt động đang được chuẩn bị"
                            text="Theo dõi CLB để đón những cập nhật tiếp theo."
                        />
                    )}
                    <section className="dx-panel">
                        <h2>Bạn sẽ tìm thấy gì ở đây?</h2>
                        <div className="dx-benefits">
                            {[
                                ['01', 'Học từ trải nghiệm', 'Thử sức trong các hoạt động và dự án có đầu ra cụ thể.'],
                                [
                                    '02',
                                    'Những người bạn đồng hành',
                                    'Kết nối với các thành viên cùng sở thích, từ nhiều ngành học.',
                                ],
                                [
                                    '03',
                                    'Ghi nhận từng đóng góp',
                                    'Lưu lại vai trò, sản phẩm và tiến bộ trong hồ sơ cá nhân.',
                                ],
                            ].map(([n, t, d]) => (
                                <div key={n}>
                                    <span>{n}</span>
                                    <h3>{t}</h3>
                                    <p>{d}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
                <aside>
                    <section className="dx-panel">
                        <h3>Hẹn gặp bạn tại CLB</h3>
                        <div className="dx-info-row">
                            <CalendarDays />
                            <div>
                                <small>Lịch sinh hoạt</small>
                                <strong>{club.schedule}</strong>
                            </div>
                        </div>
                        <div className="dx-info-row">
                            <MapPin />
                            <div>
                                <small>Địa điểm</small>
                                <strong>{club.place}</strong>
                            </div>
                        </div>
                        <div className="dx-info-row">
                            <Users />
                            <div>
                                <small>Thành viên trong bản demo</small>
                                <strong>
                                    {
                                        state.memberships.filter((m) => m.clubId === clubId && m.status === 'approved')
                                            .length
                                    }{' '}
                                    thành viên
                                </strong>
                            </div>
                        </div>
                    </section>
                    <section className="dx-panel">
                        <h3>Gặp ban chủ nhiệm</h3>
                        {leaders.length ? (
                            leaders.map((m) => {
                                const p = displayPerson(state, m.userId);
                                return (
                                    <div className="dx-person" key={p.id}>
                                        <Avatar person={p} />
                                        <div>
                                            <strong>{p.name}</strong>
                                            <small>Chủ nhiệm CLB · Hồ sơ demo</small>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p>Thông tin đang cập nhật trong bản demo.</p>
                        )}
                    </section>
                    <div className="dx-small-note">
                        Thông tin, nhân vật và lịch hoạt động trên trang này là dữ liệu minh họa.
                    </div>
                </aside>
            </div>
            {joining && (
                <Modal title={`Tham gia ${club.name}`} onClose={() => setJoining(false)}>
                    <p>Giới thiệu một chút về bạn để ban chủ nhiệm hiểu bạn hơn.</p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (act('apply', clubId, CURRENT_TERM, { reason })) setJoining(false);
                        }}
                    >
                        <FormField
                            label="Vì sao bạn muốn tham gia?"
                            textarea
                            rows={5}
                            required
                            maxLength={1500}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Sở thích, điều bạn muốn học, thời gian có thể tham gia..."
                        />
                        <div className="dx-form-footer">
                            <button type="button" className="dx-button" onClick={() => setJoining(false)}>
                                Để sau
                            </button>
                            <button className="dx-button primary">
                                Gửi đơn tham gia <ArrowRight size={17} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export function MyClubs() {
    const { state, actorId, act } = useDemo();
    const mine = state.memberships
        .filter((m) => m.userId === actorId && m.status === 'approved')
        .sort((a, b) => Number(b.role === 'manager') - Number(a.role === 'manager'));
    const applications = state.applications.filter((a) => a.userId === actorId);
    return (
        <div className="dx-public-content">
            <PageHeading
                eyebrow="KHÔNG GIAN CỦA BẠN"
                title="Câu lạc bộ của tôi"
                description="Mỗi cộng đồng, một phần trong hành trình của bạn."
                actions={
                    <Link className="dx-button" to="/demo">
                        Khám phá thêm <ArrowUpRight size={16} />
                    </Link>
                }
            />
            {mine.length ? (
                <div className="dx-my-clubs">
                    {mine.map((m) => {
                        const c = clubById(m.clubId);
                        const next = state.activities.find((a) => a.clubId === c.id && a.status === 'upcoming');
                        const count = state.applications.filter(
                            (a) => a.clubId === c.id && a.status === 'pending',
                        ).length;
                        return (
                            <article className="dx-my-club" key={c.id}>
                                <div className="dx-my-club-art">
                                    <ClubArt club={c} />
                                </div>
                                <div className="dx-my-club-body">
                                    <div className="dx-between">
                                        <ClubMark club={c} />
                                        <Pill tone={m.role === 'manager' ? 'orange' : 'green'}>
                                            {m.role === 'manager' ? 'Chủ nhiệm' : 'Thành viên'}
                                        </Pill>
                                    </div>
                                    <h2>{c.name}</h2>
                                    <p>
                                        {m.role === 'manager'
                                            ? `${count} đơn tham gia đang chờ bạn xem xét`
                                            : 'Hôm nay bạn muốn đóng góp điều gì?'}
                                    </p>
                                    <div className="dx-up-next">
                                        <CalendarDays size={18} />
                                        <div>
                                            <small>HOẠT ĐỘNG SẮP TỚI</small>
                                            <strong>{next?.title || 'Lịch hoạt động đang cập nhật'}</strong>
                                            {next && (
                                                <span>
                                                    {dateLabel(next.date)} · {next.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/demo/my-clubs/${c.id}`} className="dx-button primary">
                                        Vào không gian CLB <ArrowRight size={17} />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <Empty
                    title="Cộng đồng đầu tiên đang chờ bạn"
                    text="Khám phá một CLB phù hợp, gửi lời giới thiệu và bắt đầu hành trình mới."
                >
                    <Link className="dx-button primary" to="/demo">
                        Tìm CLB của bạn <ArrowRight size={17} />
                    </Link>
                </Empty>
            )}
            <section className="dx-panel">
                <SectionHeading
                    title="Đơn tham gia của tôi"
                    description="Theo dõi phản hồi từ các cộng đồng bạn quan tâm."
                />
                {applications.length ? (
                    applications.map((a) => (
                        <div className="dx-list-row" key={a.id}>
                            <ClubMark club={clubById(a.clubId)} />
                            <div className="dx-grow">
                                <strong>{clubById(a.clubId).name}</strong>
                                <p>{a.reason}</p>
                            </div>
                            <Pill tone={a.status === 'approved' ? 'green' : a.status === 'pending' ? 'orange' : ''}>
                                {
                                    {
                                        pending: 'Chờ duyệt',
                                        approved: 'Đã duyệt',
                                        rejected: 'Chưa được duyệt',
                                        withdrawn: 'Đã rút đơn',
                                    }[a.status]
                                }
                            </Pill>
                            {a.status === 'pending' && (
                                <button
                                    className="dx-button small"
                                    onClick={() => act('withdraw', a.clubId, CURRENT_TERM, { id: a.id })}
                                >
                                    Rút đơn
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="dx-muted">Bạn chưa có đơn tham gia nào.</p>
                )}
            </section>
        </div>
    );
}

export function PublicEvents() {
    const { state, actorId } = useDemo();
    const [query, setQuery] = useState('');
    const events = state.activities.filter(
        (a) => a.public && a.term === CURRENT_TERM && a.title.toLowerCase().includes(query.toLowerCase()),
    );
    return (
        <div className="dx-public-content">
            <PageHeading
                eyebrow="THÊM MỘT TRẢI NGHIỆM MỚI"
                title="Có gì đang diễn ra?"
                description="Những hoạt động công khai từ các cộng đồng tại FPTU."
            />
            <SearchField value={query} onChange={setQuery} placeholder="Tìm hoạt động..." />
            <div className="dx-event-directory">
                {events.map((e) => (
                    <div className="dx-panel" key={e.id}>
                        <ClubArt club={clubById(e.clubId)} />
                        <EventCard
                            event={e}
                            club={clubById(e.clubId)}
                            base={
                                membership(state, actorId, e.clubId)
                                    ? `/demo/my-clubs/${e.clubId}/activities`
                                    : `/demo/clubs/${e.clubId}`
                            }
                        />
                        <p>{e.description}</p>
                        <Link
                            className="dx-text-link"
                            to={
                                membership(state, actorId, e.clubId)
                                    ? `/demo/my-clubs/${e.clubId}/activities`
                                    : `/demo/clubs/${e.clubId}`
                            }
                        >
                            {membership(state, actorId, e.clubId)
                                ? 'Xem và đăng ký trong CLB'
                                : 'Tìm hiểu CLB để tham gia'}{' '}
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                ))}
            </div>
            {!events.length && <Empty title="Không tìm thấy hoạt động" />}
        </div>
    );
}
