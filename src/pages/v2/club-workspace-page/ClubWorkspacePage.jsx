import {
    ArrowRight,
    ArrowUpRight,
    Award,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    FileText,
    Users,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import { useClubWorkspace } from '../workspace-data';
import WorkspaceTabView from './tabs/WorkspaceTabView';
import WorkspaceLeftRail, { getWorkspaceSections } from './WorkspaceLeftRail';
import './ClubWorkspacePage.scss';
const dateLabel = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? ''
        : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
function Stat({ label, value, note, Icon, tone = '' }) {
    return (
        <section className="v2-workspace-stat">
            <div>
                <span>{label}</span>
                <strong className={tone}>{value}</strong>
                <small>{note}</small>
            </div>
            <Icon size={23} aria-hidden="true" />
        </section>
    );
}
function Review({ icon: Icon, title, copy }) {
    return (
        <div className="v2-workspace-review-row">
            <span>
                <Icon size={20} />
            </span>
            <div>
                <strong>{title}</strong>
                <small>{copy}</small>
            </div>
            <ArrowUpRight size={18} />
        </div>
    );
}

function WorkspaceHome({ workspace, manager, base, viewer }) {
    const pending =
        workspace.pendingApplications === null ? 'Đang cập nhật' : (workspace.pendingApplications ?? 'Đang cập nhật');
    return (
        <>
            <section className="v2-workspace-intro">
                <div>
                    <span className="v2-eyebrow">KHÔNG GIAN CLB</span>
                    <h1>
                        Chào {viewer?.name?.split(' ').slice(-1)[0] || 'bạn'},{' '}
                        {manager ? 'cùng dẫn dắt nhé.' : 'hôm nay có gì mới?'}
                    </h1>
                    <p>
                        {manager
                            ? 'Một góc nhìn rõ ràng về cộng đồng bạn đang xây dựng.'
                            : 'Một nơi để theo dõi hành trình cùng cộng đồng.'}
                    </p>
                </div>
                <Link className="v2-button v2-button--primary" to={`${base}/activities`}>
                    <CalendarDays size={17} /> {manager ? 'Quản lý hoạt động' : 'Xem hoạt động'}
                </Link>
            </section>
            <div className="v2-workspace-stats">
                <Stat label="Thành viên CLB" value="Đang cập nhật" note="Danh sách thành viên hiện tại" Icon={Users} />
                <Stat
                    label="Hoạt động trong kỳ"
                    value="Đang cập nhật"
                    note="Lịch hoạt động của CLB"
                    Icon={CalendarDays}
                    tone="is-purple"
                />
                <Stat
                    label="Đơn chờ duyệt"
                    value={manager ? pending : '—'}
                    note={manager ? 'Đơn hiện tại của CLB' : 'Chỉ dành cho chủ nhiệm'}
                    Icon={Award}
                    tone="is-green"
                />
                <Stat
                    label="Đóng góp cần xác nhận"
                    value="Đang cập nhật"
                    note="Mỗi đóng góp đều đáng ghi nhận"
                    Icon={Award}
                />
            </div>
            <div className="v2-workspace-dashboard">
                <section className="v2-workspace-feature">
                    <div>
                        <span className="v2-eyebrow">{manager ? 'CÙNG NHAU TẠO GIÁ TRỊ' : 'HÀNH TRÌNH CỦA BẠN'}</span>
                        <h2>
                            {manager
                                ? 'Một cộng đồng tốt bắt đầu từ những kết nối nhỏ.'
                                : 'Bạn không chỉ tham gia. Bạn đang để lại dấu ấn.'}
                        </h2>
                        <p>
                            {manager
                                ? 'Chào đón thành viên mới, tạo cơ hội thử sức và ghi nhận những đóng góp thực sự.'
                                : 'Mỗi buổi gặp gỡ và mỗi lần giúp đỡ đều là một phần của câu chuyện.'}
                        </p>
                        <Link to={`${base}/${manager ? 'members' : 'points'}`}>
                            {manager ? 'Gặp các thành viên' : 'Xem hành trình đóng góp'} <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="v2-workspace-feature-art" aria-hidden="true">
                        <strong>{workspace.name.slice(0, 3).toUpperCase()}</strong>
                        <span>
                            GROW
                            <br />
                            TOGETHER.
                        </span>
                    </div>
                </section>
                <section className="v2-workspace-review">
                    <h2>Cần bạn xem qua</h2>
                    <Review
                        icon={Users}
                        title={manager ? 'Đơn tham gia mới' : 'Hoạt động của CLB'}
                        copy={
                            manager
                                ? workspace.pendingApplications === null
                                    ? 'Đơn tham gia đang cập nhật'
                                    : `${workspace.pendingApplications} đơn đang chờ xem xét`
                                : 'Thông tin mới sẽ xuất hiện tại đây'
                        }
                    />
                    <Review icon={Award} title="Xác nhận đóng góp" copy="Đang cập nhật" />
                    <Review icon={FileText} title="Báo cáo học kỳ" copy="Đang cập nhật" />
                </section>
                <section className="v2-workspace-schedule">
                    <div>
                        <h2>Lịch hẹn của CLB</h2>
                        <p>
                            {workspace.upcomingActivity
                                ? `${dateLabel(workspace.upcomingActivity.startTime)}${workspace.upcomingActivity.location ? ` · ${workspace.upcomingActivity.location}` : ''}`
                                : 'Dành thời gian cho những điều bạn quan tâm.'}
                        </p>
                    </div>
                    <Link to={`${base}/activities`}>
                        Xem tất cả <ArrowRight size={16} />
                    </Link>
                    <article>
                        <CalendarDays size={18} />
                        <div>
                            <strong>{workspace.upcomingActivity?.title || 'Lịch hoạt động đang cập nhật'}</strong>
                            <span>
                                {workspace.upcomingActivity?.location || 'Thông tin chi tiết sẽ xuất hiện tại đây.'}
                            </span>
                        </div>
                    </article>
                </section>
            </div>
        </>
    );
}

export default function ClubWorkspacePage({ api, sessionKey, viewer }) {
    const { clubId: routeClubId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const result = useClubWorkspace(api, sessionKey, routeClubId);
    const base = `/v2/my-clubs/${encodeURIComponent(result.clubId || routeClubId || '')}`;
    if (result.status !== 'populated')
        return (
            <div className="v2-public-content v2-workspace-state">
                <PageState
                    status={result.status}
                    onRetry={result.retry}
                    title={result.status === 'empty' ? 'Bạn chưa có không gian CLB' : undefined}
                    description={
                        result.status === 'empty'
                            ? 'Khi được duyệt vào một CLB, không gian của bạn sẽ xuất hiện tại đây.'
                            : undefined
                    }
                >
                    {null}
                </PageState>
                {result.status === 'not-found' && (
                    <Link className="v2-button" to="/v2/my-clubs">
                        Về CLB của tôi
                    </Link>
                )}
            </div>
        );
    const manager = result.workspace.role === 'MANAGER';
    const availableSections = getWorkspaceSections(manager);
    const relativePath = location.pathname.slice(base.length).split('/').filter(Boolean)[0] || '';
    const activeSection = availableSections.find(([path]) => path === relativePath);
    const sectionLabel = activeSection?.[1] || 'Trang không khả dụng';
    return (
        <div className="v2-production-workspace">
            <WorkspaceLeftRail
                workspace={result.workspace}
                selections={result.data}
                base={base}
                manager={manager}
                onClubChange={(clubId) => navigate(`/v2/my-clubs/${encodeURIComponent(clubId)}`)}
            />
            <main className="v2-workspace-main">
                <header className="v2-workspace-bar">
                    <div>
                        CLB của tôi <ChevronRight size={14} /> {result.workspace.name} <ChevronRight size={14} />{' '}
                        <strong>{sectionLabel}</strong>
                    </div>
                    <div>
                        <span className={`v2-workspace-role ${manager ? 'is-manager' : ''}`}>
                            {manager ? 'Chủ nhiệm' : 'Thành viên'}
                        </span>
                        <span className="v2-workspace-term">
                            <CalendarDays size={16} /> Học kỳ hiện tại <ChevronDown size={16} />
                        </span>
                    </div>
                </header>
                <div className="v2-workspace-content">
                    {activeSection && !relativePath ? (
                        <WorkspaceHome workspace={result.workspace} manager={manager} base={base} viewer={viewer} />
                    ) : (
                        <WorkspaceTabView label={sectionLabel} manager={manager} />
                    )}
                </div>
            </main>
        </div>
    );
}
