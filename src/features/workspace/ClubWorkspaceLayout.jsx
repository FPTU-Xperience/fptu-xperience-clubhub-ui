import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
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
    LockKeyhole,
} from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { CURRENT_TERM, clubById, membership } from '../../core/model';
import { ClubMark } from '../../components/club/ClubMark';
import { Empty } from '../../components/ui/Empty';
import { Pill } from '../../components/ui/Pill';

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

export function ClubWorkspaceLayout() {
    const { clubId } = useParams();
    const club = clubById(clubId);
    const { state, actorId, scenario, setScenario, basePath = '' } = useClubHub();
    const access = membership(state, actorId, clubId);
    const navigate = useNavigate();
    const location = useLocation();
    const [term, setTerm] = useState(CURRENT_TERM);
    const [compact, setCompact] = useState(false);

    useEffect(() => {
        setTerm(CURRENT_TERM);
        setScenario('normal');
    }, [clubId, actorId, setScenario]);

    const homePath = basePath || '/';
    const myClubsPath = `${basePath}/my-clubs`.replace(/^\/\//, '/');

    if (!club || !access) {
        return (
            <div className="dx-public-content">
                <Empty
                    title={club ? 'Không gian dành cho thành viên CLB' : 'Không tìm thấy CLB'}
                    text="Bạn cần được duyệt tham gia hoặc có phân công quản lý tại CLB này."
                >
                    <Link
                        className="dx-button primary"
                        to={club ? `${basePath}/clubs/${clubId}`.replace(/^\/\//, '/') : homePath}
                    >
                        Tìm hiểu CLB <ArrowRight size={16} />
                    </Link>
                    <Link className="dx-text-link" to={myClubsPath}>
                        Về CLB của tôi
                    </Link>
                </Empty>
            </div>
        );
    }

    const manager = access.role === 'manager';
    const base = `${basePath}/my-clubs/${clubId}`.replace(/^\/\//, '/');
    const page = location.pathname.slice(base.length).split('/').filter(Boolean)[0] || '';
    const nav = items.filter((i) => i[3] === 'both' || (manager && (i[3] !== 'finance' || club.finance)));
    const allowed = nav.some((i) => i[0] === page);
    const context = { club, clubId, manager, term, archived: term !== CURRENT_TERM, base };

    return (
        <WorkspaceContext.Provider value={context}>
            <div className={`dx-workspace ${compact ? 'compact' : ''}`}>
                <aside className="dx-sidebar">
                    <Link className="dx-back" to={myClubsPath}>
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
                            onChange={(e) => navigate(`${basePath}/my-clubs/${e.target.value}`.replace(/^\/\//, '/'))}
                        >
                            {state.memberships
                                .filter(
                                    (m) =>
                                        (m.userId === actorId || String(m.userId) === String(actorId)) &&
                                        m.status === 'approved',
                                )
                                .map((m) => (
                                    <option key={m.clubId} value={m.clubId}>
                                        {clubById(m.clubId).name} {m.role === 'manager' ? '· Chủ nhiệm' : ''}
                                    </option>
                                ))}
                        </select>
                    </label>
                    <nav aria-label="Điều hướng CLB">
                        {nav.map(([sub, label, Icon]) => (
                            <NavLink
                                key={sub}
                                to={sub ? `${base}/${sub}` : base}
                                end={!sub}
                                className={({ isActive }) => (isActive ? 'active' : '')}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                <main className="dx-workspace-main" id="main-content">
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
                                    Hiện lại dữ liệu
                                </button>
                            </Empty>
                        ) : scenario === 'loading' ? (
                            <div className="dx-loading" role="status">
                                <div className="dx-skeleton" />
                                <div className="dx-skeleton" />
                                <p>Đang tải dữ liệu...</p>
                                <button className="dx-button" onClick={() => setScenario('normal')}>
                                    Hoàn tất
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

export default ClubWorkspaceLayout;
