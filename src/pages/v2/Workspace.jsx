import { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Home,
    CalendarDays,
    ScanLine,
    Users,
    Award,
    Gift,
    FileText,
    Wallet,
    Settings,
    Flag,
    ChevronRight,
    Clock,
    CheckCircle2,
    Plus,
    Sparkles,
    LockKeyhole,
} from 'lucide-react';
import { useDemo } from './DemoContext';
import { CLUBS, CURRENT_TERM, clubById, displayPerson, membership, ownPoints } from './model';
import { Avatar, ClubMark, Empty, EventCard, PageHeading, Pill, SectionHeading, Stat } from './ui';

const WorkspaceContext = createContext(null);
export const useWorkspace = () => useContext(WorkspaceContext);
const items = [
    ['', 'Trang chủ', Home, 'both'],
    ['activities', 'Hoạt động', CalendarDays, 'both'],
    ['attendance', 'Điểm danh', ScanLine, 'both'],
    ['quests', 'Nhiệm vụ & đóng góp', Flag, 'both'],
    ['members', 'Thành viên', Users, 'both'],
    ['points', 'Điểm & thành tích', Award, 'both'],
    ['gifts', 'Kho quà', Gift, 'both'],
    ['reports', 'Báo cáo', FileText, 'manager'],
    ['finance', 'Tài chính', Wallet, 'finance'],
    ['settings', 'Cài đặt CLB', Settings, 'manager'],
];

export function Workspace() {
    const { clubId } = useParams();
    const { actorId, state, scenario, setScenario } = useDemo();
    const club = clubById(clubId);
    const access = membership(state, actorId, clubId);
    const navigate = useNavigate();
    const location = useLocation();
    const [term, setTerm] = useState(CURRENT_TERM);
    const [compact, setCompact] = useState(false);
    useEffect(() => {
        setTerm(CURRENT_TERM);
        setScenario('normal');
    }, [clubId, actorId, setScenario]);
    if (!club || !access)
        return (
            <div className="dx-public-content">
                <Empty
                    title={club ? 'Không gian dành cho thành viên CLB' : 'Không tìm thấy CLB'}
                    text="Bạn cần được duyệt tham gia hoặc có phân công quản lý tại CLB này."
                >
                    <Link className="dx-button primary" to={club ? `/v2/demo/clubs/${clubId}` : '/v2/demo'}>
                        Tìm hiểu CLB <ArrowRight size={16} />
                    </Link>
                    <Link className="dx-text-link" to="/v2/demo/my-clubs">
                        Về CLB của tôi
                    </Link>
                </Empty>
            </div>
        );
    const manager = access.role === 'manager';
    const base = `/v2/demo/my-clubs/${clubId}`;
    const page = location.pathname.slice(base.length).split('/').filter(Boolean)[0] || '';
    const nav = items.filter((i) => i[3] === 'both' || (manager && (i[3] !== 'finance' || club.finance)));
    const allowed = nav.some((i) => i[0] === page);
    const context = { club, clubId, manager, term, archived: term !== CURRENT_TERM, base };
    return (
        <WorkspaceContext.Provider value={context}>
            <div className={`dx-workspace ${compact ? 'compact' : ''}`}>
                <aside className="dx-sidebar">
                    <Link className="dx-back" to="/v2/demo/my-clubs">
                        <ArrowLeft size={15} />
                        CLB của tôi
                    </Link>
                    <div className="dx-sidebar-club">
                        <ClubMark club={club} />
                        <div>
                            <strong>{club.name}</strong>
                            <span>{manager ? 'Không gian quản lý' : 'Không gian thành viên'}</span>
                        </div>
                    </div>
                    <label className="dx-club-switch">
                        <span>CHUYỂN CÂU LẠC BỘ</span>
                        <select
                            aria-label="Chuyển câu lạc bộ"
                            value={clubId}
                            onChange={(e) => navigate(`/v2/demo/my-clubs/${e.target.value}`)}
                        >
                            {state.memberships
                                .filter((m) => m.userId === actorId && m.status === 'approved')
                                .map((m) => (
                                    <option key={m.clubId} value={m.clubId}>
                                        {clubById(m.clubId).name} · {m.role === 'manager' ? 'Chủ nhiệm' : 'Thành viên'}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <div className="dx-sidebar-label">{manager ? 'VẬN HÀNH CÂU LẠC BỘ' : 'CỘNG ĐỒNG CỦA BẠN'}</div>
                    <nav aria-label="Menu CLB">
                        {nav.map(([path, label, Icon]) => (
                            <NavLink end={path === ''} key={path} to={path ? `${base}/${path}` : base}>
                                <Icon size={18} />
                                <span>
                                    {!manager && path === 'members'
                                        ? 'Cộng đồng'
                                        : !manager && path === 'gifts'
                                          ? 'Đổi quà'
                                          : !manager && path === 'points'
                                            ? 'Điểm của tôi'
                                            : label}
                                </span>
                                {path === 'members' &&
                                    manager &&
                                    state.applications.filter((a) => a.clubId === clubId && a.status === 'pending')
                                        .length > 0 && (
                                        <small>
                                            {
                                                state.applications.filter(
                                                    (a) => a.clubId === clubId && a.status === 'pending',
                                                ).length
                                            }
                                        </small>
                                    )}
                            </NavLink>
                        ))}
                    </nav>
                    <div className="dx-sidebar-bottom">
                        <span>
                            <LockKeyhole size={15} />
                            Chỉ dữ liệu của {club.name}
                        </span>
                        <Link to={`/v2/demo/clubs/${clubId}`}>
                            Xem trang giới thiệu <ArrowUpRight size={15} />
                        </Link>
                        <button onClick={() => setCompact(!compact)}>
                            {compact ? 'Khoảng cách rộng' : 'Khoảng cách gọn'}
                        </button>
                    </div>
                </aside>
                <main className="dx-workspace-main" id="demo-main">
                    <div className="dx-workspace-bar">
                        <div className="dx-breadcrumb">
                            CLB của tôi <ChevronRight size={14} />
                            {club.name} <ChevronRight size={14} />
                            <strong>{nav.find((i) => i[0] === page)?.[1] || 'Trang không khả dụng'}</strong>
                        </div>
                        <div className="dx-inline">
                            <Pill tone={manager ? 'orange' : 'green'}>{manager ? 'Chủ nhiệm' : 'Thành viên'}</Pill>
                            <label className="dx-term">
                                <CalendarDays size={16} />
                                <select aria-label="Học kỳ" value={term} onChange={(e) => setTerm(e.target.value)}>
                                    <option value="FA26">Fall 2026</option>
                                    <option value="SU26">Summer 2026 · Lưu trữ</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    {term !== CURRENT_TERM && (
                        <div className="dx-banner">
                            <LockKeyhole size={17} />
                            Bạn đang xem học kỳ đã lưu trữ. Các thao tác thay đổi được tắt.
                        </div>
                    )}
                    <div className="dx-workspace-content" key={`${clubId}-${actorId}-${term}-${page}`}>
                        {!allowed ? (
                            <Empty
                                title="Trang này không dành cho vai trò hiện tại"
                                text="Menu và quyền thao tác được xác định theo chính CLB bạn đang mở."
                            >
                                <Link className="dx-button" to={base}>
                                    Về trang chủ CLB
                                </Link>
                            </Empty>
                        ) : scenario === 'error' ? (
                            <Empty
                                title="Không tải được nội dung (mô phỏng)"
                                text="Dữ liệu của bạn vẫn được giữ nguyên."
                            >
                                <button className="dx-button primary" onClick={() => setScenario('normal')}>
                                    Thử lại
                                </button>
                            </Empty>
                        ) : scenario === 'empty' ? (
                            <Empty
                                title="Một khởi đầu mới"
                                text="Đây là trạng thái chưa có dữ liệu để bạn kiểm tra bố cục."
                            >
                                <button className="dx-button" onClick={() => setScenario('normal')}>
                                    Hiện lại dữ liệu demo
                                </button>
                            </Empty>
                        ) : scenario === 'loading' ? (
                            <div className="dx-loading" role="status">
                                <div className="dx-skeleton" />
                                <div className="dx-skeleton" />
                                <p>Đang mô phỏng trạng thái tải...</p>
                                <button className="dx-button" onClick={() => setScenario('normal')}>
                                    Hoàn tất tải
                                </button>
                            </div>
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </main>
            </div>
        </WorkspaceContext.Provider>
    );
}

export function ClubHome() {
    const { state, actorId } = useDemo();
    const { club, clubId, manager, term, base, archived } = useWorkspace();
    const actor = displayPerson(state, actorId);
    const events = state.activities.filter((a) => a.clubId === clubId && a.term === term);
    const members = state.memberships.filter((m) => m.clubId === clubId && m.status === 'approved');
    const pending = state.applications.filter((a) => a.clubId === clubId && a.status === 'pending');
    const submissions = state.submissions.filter(
        (s) => s.clubId === clubId && s.term === term && s.status === 'pending',
    );
    const points = ownPoints(state, actorId, clubId, term);
    const attended = events.filter((e) => e.checkedIn.includes(actorId)).length;
    const latest = state.ledger
        .filter((l) => l.clubId === clubId && l.term === term && (manager || l.userId === actorId))
        .slice(-4)
        .reverse();
    return (
        <>
            <PageHeading
                eyebrow={`${term === 'FA26' ? 'FALL 2026' : 'SUMMER 2026'} / ${club.name.toUpperCase()}`}
                title={`Chào ${actor.name.split(' ').slice(-1)[0]}, ${manager ? 'cùng dẫn dắt nhé.' : 'hôm nay có gì mới?'}`}
                description={
                    manager
                        ? 'Một góc nhìn rõ ràng về cộng đồng bạn đang xây dựng.'
                        : 'Một bước nhỏ hôm nay, thêm một trải nghiệm đáng nhớ.'
                }
                actions={
                    <Link className="dx-button primary" to={`${base}/${manager ? 'activities' : 'quests'}`}>
                        {manager ? <Plus size={17} /> : <Sparkles size={17} />}{' '}
                        {manager ? 'Quản lý hoạt động' : 'Khám phá nhiệm vụ'}
                    </Link>
                }
            />
            <div className="dx-stats">
                {manager ? (
                    <>
                        <Stat
                            label="Thành viên CLB"
                            value={members.length}
                            note="Danh sách thành viên hiện tại"
                            icon={Users}
                        />
                        <Stat
                            label="Hoạt động trong kỳ"
                            value={events.length}
                            note={`${events.filter((e) => e.status === 'upcoming').length} hoạt động sắp diễn ra`}
                            icon={CalendarDays}
                        />
                        <Stat
                            label="Đơn chờ duyệt"
                            value={pending.length}
                            note="Đơn hiện tại · không lọc theo kỳ"
                            icon={Clock}
                        />
                        <Stat
                            label="Đóng góp cần xác nhận"
                            value={submissions.length}
                            note="Mỗi đóng góp đều đáng ghi nhận"
                            icon={Award}
                        />
                    </>
                ) : (
                    <>
                        <Stat
                            label="Điểm đóng góp của tôi"
                            value={points}
                            note="Chỉ trong CLB và học kỳ đang xem"
                            icon={Award}
                        />
                        <Stat
                            label="Hoạt động đã tham dự"
                            value={attended}
                            note={`Trong ${events.length} hoạt động của kỳ`}
                            icon={CheckCircle2}
                        />
                        <Stat
                            label="Lịch đã đăng ký"
                            value={
                                events.filter((e) => e.registered.includes(actorId) && e.status !== 'completed').length
                            }
                            note="Những cuộc hẹn sắp tới"
                            icon={CalendarDays}
                        />
                        <Stat
                            label="Đóng góp đã xác nhận"
                            value={
                                state.submissions.filter(
                                    (s) =>
                                        s.userId === actorId &&
                                        s.clubId === clubId &&
                                        s.term === term &&
                                        s.status === 'approved',
                                ).length
                            }
                            note="Xây hồ sơ qua từng đóng góp"
                            icon={Flag}
                        />
                    </>
                )}
            </div>
            <div className="dx-home-columns">
                <div>
                    <section className="dx-panel dx-home-feature">
                        <div>
                            <Pill tone="orange">{manager ? 'CÙNG NHAU TẠO GIÁ TRỊ' : 'HÀNH TRÌNH CỦA BẠN'}</Pill>
                            <h2>
                                {manager
                                    ? 'Một cộng đồng tốt bắt đầu\ntừ những kết nối nhỏ.'
                                    : 'Bạn không chỉ tham gia.\nBạn đang để lại dấu ấn.'}
                            </h2>
                            <p>
                                {manager
                                    ? 'Chào đón thành viên mới, tạo cơ hội thử sức và ghi nhận những đóng góp thực sự.'
                                    : 'Mỗi buổi gặp gỡ, mỗi sản phẩm và mỗi lần giúp đỡ đều là một phần của câu chuyện.'}
                            </p>
                            <Link className="dx-text-link" to={`${base}/${manager ? 'members' : 'points'}`}>
                                {manager ? 'Gặp các thành viên' : 'Xem hành trình đóng góp'} <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="dx-feature-symbol" aria-hidden="true">
                            {club.mark}
                            <span>
                                GROW
                                <br />
                                TOGETHER.
                            </span>
                        </div>
                    </section>
                    <SectionHeading
                        title="Lịch hẹn của CLB"
                        description={
                            archived
                                ? 'Nhìn lại những hoạt động trong học kỳ.'
                                : 'Dành thời gian cho những điều bạn quan tâm.'
                        }
                    >
                        <Link className="dx-text-link" to={`${base}/activities`}>
                            Xem tất cả <ArrowRight size={15} />
                        </Link>
                    </SectionHeading>
                    {events.length ? (
                        events
                            .slice(0, 3)
                            .map((e) => (
                                <EventCard
                                    key={e.id}
                                    event={e}
                                    club={club}
                                    base={`${base}/activities`}
                                    registered={e.registered.includes(actorId)}
                                />
                            ))
                    ) : (
                        <Empty title="Chưa có hoạt động trong kỳ này" />
                    )}
                </div>
                <aside>
                    <section className="dx-panel">
                        <SectionHeading title={manager ? 'Cần bạn xem qua' : 'Dành riêng cho bạn'} />
                        {manager ? (
                            <>
                                <Link className="dx-task-row" to={`${base}/members`}>
                                    <span className="dx-task-icon">
                                        <Users size={18} />
                                    </span>
                                    <div>
                                        <strong>Đơn tham gia mới</strong>
                                        <small>{pending.length} bạn đang chờ lời chào</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                                <Link className="dx-task-row" to={`${base}/quests`}>
                                    <span className="dx-task-icon">
                                        <Award size={18} />
                                    </span>
                                    <div>
                                        <strong>Xác nhận đóng góp</strong>
                                        <small>{submissions.length} minh chứng cần xem</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                                <Link className="dx-task-row" to={`${base}/reports`}>
                                    <span className="dx-task-icon">
                                        <FileText size={18} />
                                    </span>
                                    <div>
                                        <strong>Báo cáo học kỳ</strong>
                                        <small>
                                            {
                                                state.reports.filter(
                                                    (r) =>
                                                        r.clubId === clubId && r.term === term && r.status === 'draft',
                                                ).length
                                            }{' '}
                                            bản nháp đang soạn
                                        </small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link className="dx-task-row" to={`${base}/attendance`}>
                                    <span className="dx-task-icon">
                                        <ScanLine size={18} />
                                    </span>
                                    <div>
                                        <strong>Check-in hoạt động</strong>
                                        <small>Ghi nhận sự có mặt của bạn</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                                <Link className="dx-task-row" to={`${base}/gifts`}>
                                    <span className="dx-task-icon">
                                        <Gift size={18} />
                                    </span>
                                    <div>
                                        <strong>Một món quà nhỏ</strong>
                                        <small>Khám phá những phần quà từ CLB</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                            </>
                        )}
                    </section>
                    <section className="dx-panel">
                        <SectionHeading title="Đóng góp gần đây" />
                        {latest.map((l) => (
                            <div className="dx-feed-item" key={l.id}>
                                <span className="dx-feed-dot" />
                                <div>
                                    <strong>{manager ? displayPerson(state, l.userId).name : l.reason}</strong>
                                    <p>{manager ? l.reason : l.verifier}</p>
                                    <small>
                                        +{l.amount} điểm · {l.date}
                                    </small>
                                </div>
                            </div>
                        ))}
                        {!latest.length && <p className="dx-muted">Chưa có đóng góp được ghi nhận trong kỳ.</p>}
                    </section>
                </aside>
            </div>
        </>
    );
}
