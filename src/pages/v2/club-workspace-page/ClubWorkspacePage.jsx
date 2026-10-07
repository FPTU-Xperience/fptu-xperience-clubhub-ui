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
import { useWorkspaceDashboard } from '../workspace-dashboard-data';
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

function WorkspaceHome({ workspace, manager, base, viewer, dashboard }) {
    const summary = dashboard.data;
    const metric = (value) => value ?? (dashboard.status === 'loading' ? '…' : '—');
    const loadingNote = 'Đang tải dữ liệu…';
    const activityNote = dashboard.status === 'loading' ? loadingNote : summary?.activityAvailable
        ? summary.upcomingActivity?.title || 'Chưa có hoạt động sắp tới'
        : 'Không tải được lịch hoạt động';
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
                <Stat label="Thành viên CLB" value={metric(summary?.memberCount)} note="Thành viên đã được duyệt" Icon={Users} />
                <Stat
                    label="Hoạt động của CLB"
                    value={metric(summary?.activityCount)}
                    note="Không gồm hoạt động đã hủy"
                    Icon={CalendarDays}
                    tone="is-purple"
                />
                <Stat
                    label={manager ? 'Đơn chờ duyệt' : 'Hoạt động sắp tới'}
                    value={metric(manager ? summary?.pendingApplications : summary?.upcomingCount)}
                    note={manager ? 'Đơn tham gia đang chờ' : 'Lịch sắp diễn ra của CLB'}
                    Icon={Award}
                    tone="is-green"
                />
                <Stat
                    label="Báo cáo đã duyệt"
                    value={metric(summary?.approvedReportCount)}
                    note="Báo cáo CLB bạn có thể xem"
                    Icon={FileText}
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
                    <h2>Điểm qua CLB</h2>
                    <Review
                        icon={Users}
                        title={manager ? 'Đơn tham gia mới' : 'Hoạt động của CLB'}
                        copy={
                            manager
                                ? dashboard.status === 'loading' ? loadingNote : summary?.pendingApplications == null
                                    ? 'Không tải được đơn tham gia'
                                    : `${summary.pendingApplications} đơn đang chờ xem xét`
                                : activityNote
                        }
                    />
                    <Review
                        icon={FileText}
                        title="Báo cáo đã duyệt"
                        copy={dashboard.status === 'loading' ? loadingNote : summary?.approvedReportCount == null
                            ? 'Không tải được báo cáo'
                            : `${summary.approvedReportCount} báo cáo có thể xem`}
                    />
                </section>
                <section className="v2-workspace-schedule">
                    <div>
                        <h2>Lịch hẹn của CLB</h2>
                        <p>
                            {summary?.upcomingActivity
                                ? `${dateLabel(summary.upcomingActivity.startTime)}${summary.upcomingActivity.location ? ` · ${summary.upcomingActivity.location}` : ''}`
                                : 'Lịch hoạt động sắp tới của CLB'}
                        </p>
                    </div>
                    <Link to={`${base}/activities`}>
                        Xem tất cả <ArrowRight size={16} />
                    </Link>
                    <article>
                        <CalendarDays size={18} />
                        <div>
                            <strong>{activityNote}</strong>
                            <span>
                                {summary?.upcomingActivity?.location ||
                                    (summary?.activityAvailable ? 'Xem tất cả hoạt động của CLB.' : 'Vui lòng thử lại sau.')}
                            </span>
                        </div>
                    </article>
                </section>
            </div>
        </>
    );
}

export default function ClubWorkspacePage({ api, sessionKey, viewer }) {
    const { clubCode: routeClubCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const result = useClubWorkspace(api, sessionKey, routeClubCode);
    const manager = result.workspace?.role === 'MANAGER';
    const dashboard = useWorkspaceDashboard(api, result.status === 'populated' ? result.clubId : null, manager, sessionKey);
    const base = `/v2/my-clubs/${encodeURIComponent(result.workspace?.clubCode || routeClubCode || '')}`;
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
    const availableSections = getWorkspaceSections(manager);
    const relativePath = location.pathname.slice(base.length).split('/').filter(Boolean)[0] || '';
    const activeSection = availableSections.find(([path]) => path === relativePath);
    const sectionLabel = activeSection?.[1] || 'Trang không khả dụng';
    return (
        <div className="v2-production-workspace">
            <WorkspaceLeftRail
                workspace={{ ...result.workspace, pendingApplications: dashboard.data?.pendingApplications ?? null }}
                selections={result.data}
                base={base}
                manager={manager}
                onClubChange={(clubCode) => navigate(`/v2/my-clubs/${encodeURIComponent(clubCode)}`)}
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
                        <WorkspaceHome workspace={result.workspace} manager={manager} base={base} viewer={viewer} dashboard={dashboard} />
                    ) : (
                        <WorkspaceTabView label={sectionLabel} manager={manager} dashboard={dashboard} workspace={result.workspace} />
                    )}
                </div>
            </main>
        </div>
    );
}
