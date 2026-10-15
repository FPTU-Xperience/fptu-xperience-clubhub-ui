import { ArrowRight, CalendarDays, Check, Home, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import { isOngoingWorkspaceActivity } from '../workspace-dashboard-data';
import './WorkspaceHome.scss';

function ResourceState({ loading, unavailable, onRetry, children }) {
    return (
        <div className="workspace-home__state" role="status">
            <CalendarDays size={24} aria-hidden="true" />
            <strong>
                {loading
                    ? 'Đang tải lịch hoạt động…'
                    : unavailable
                      ? 'Chưa tải được lịch hoạt động'
                      : 'Chưa có lịch hoạt động sắp tới'}
            </strong>
            <p>
                {loading
                    ? 'Lịch của CLB sẽ hiển thị tại đây.'
                    : unavailable
                      ? 'Thử tải lại để cập nhật lịch của CLB.'
                      : children}
            </p>
            {unavailable && !loading && (
                <button type="button" onClick={onRetry}>
                    Thử lại
                </button>
            )}
        </div>
    );
}

export default function WorkspaceHome({ workspace, manager, base, viewer, dashboard }) {
    const navigate = useNavigate();
    const summary = dashboard.data;
    const loading = dashboard.status === 'loading';
    const activities = (summary?.activities || [])
        .filter(isOngoingWorkspaceActivity)
        .sort(
            (a, b) =>
                Number(b.status === 'LIVE') - Number(a.status === 'LIVE') ||
                Date.parse(a.startTime) - Date.parse(b.startTime),
        );
    const pending = summary?.pendingApplications;
    const name = viewer?.name?.trim().split(/\s+/).at(-1) || 'bạn';
    return (
        <div className="workspace-home" aria-busy={loading}>
            <header className="workspace-home__heading">
                <div>
                    <span className="v2-eyebrow">{workspace.name}</span>
                    <h1>Trang chủ</h1>
                    <p>
                        Chào {name}.{' '}
                        {manager
                            ? 'Theo dõi lịch CLB và những việc cần xử lý.'
                            : 'Xem lịch sắp tới và tham gia hoạt động cùng CLB.'}
                    </p>
                </div>
                <Link className="workspace-home__primary" to={`${base}/${manager ? 'club-page' : 'activities'}`}>
                    {manager && <Home size={16} aria-hidden="true" />}
                    {manager ? 'Quản lý trang CLB' : 'Xem hoạt động'} <ArrowRight size={16} aria-hidden="true" />
                </Link>
            </header>

            <div className="workspace-home__layout">
                <section className="workspace-home__agenda" aria-labelledby="workspace-agenda-title">
                    <header className="workspace-home__section-heading">
                        <div>
                            <span className="workspace-home__kicker">LỊCH CLB</span>
                            <h2 id="workspace-agenda-title">Đang diễn ra & sắp tới</h2>
                        </div>
                        {!loading && summary?.activityAvailable && (
                            <span className="workspace-home__count">{activities.length} hoạt động</span>
                        )}
                    </header>
                    {loading || !summary?.activityAvailable || !activities.length ? (
                        <ResourceState
                            loading={loading}
                            unavailable={!summary?.activityAvailable}
                            onRetry={dashboard.retry}
                        >
                            {manager
                                ? 'Vào Hoạt động để lên lịch buổi gặp tiếp theo.'
                                : 'Hãy quay lại khi CLB có lịch mới.'}
                        </ResourceState>
                    ) : (
                        <ol className="workspace-home__events">
                            {activities.slice(0, 5).map((activity) => (
                                <li key={activity.id}>
                                    <ActivityCard
                                        activity={{ ...activity, clubName: workspace.name }}
                                        variant="schedule"
                                        onOpen={(item) =>
                                            navigate(
                                                manager
                                                    ? `${base}/activities/${encodeURIComponent(item.id)}`
                                                    : `/v2/activities/${encodeURIComponent(item.id)}`,
                                            )
                                        }
                                    />
                                </li>
                            ))}
                        </ol>
                    )}
                    <Link className="workspace-home__all" to={`${base}/activities`}>
                        Xem tất cả hoạt động <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </section>

                <aside
                    className="workspace-home__aside"
                    aria-label={manager ? 'Công việc quản lý CLB' : 'Tham gia CLB'}
                >
                    {manager && (
                        <section className="workspace-home__inbox" aria-labelledby="workspace-inbox-title">
                            <span className="workspace-home__kicker">CẦN XỬ LÝ</span>
                            <h2 id="workspace-inbox-title">Đơn tham gia</h2>
                            {loading ? (
                                <p role="status">Đang tải đơn tham gia…</p>
                            ) : pending == null ? (
                                <div role="status">
                                    <p>Chưa tải được đơn tham gia.</p>
                                    <button type="button" onClick={dashboard.retry}>
                                        Thử lại
                                    </button>
                                </div>
                            ) : pending === 0 ? (
                                <div className="workspace-home__clear">
                                    <Check size={20} aria-hidden="true" />
                                    <div>
                                        <strong>Đã xử lý hết</strong>
                                        <p>Không có đơn nào đang chờ duyệt.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="workspace-home__pending">
                                        <strong>{pending}</strong>
                                        <span>đơn đang chờ duyệt</span>
                                    </p>
                                    <ul className="workspace-home__applicants">
                                        {(summary.pendingMemberships || []).slice(0, 3).map((member) => (
                                            <li key={member.id}>
                                                <Users size={15} aria-hidden="true" />
                                                <span>{member.name || 'Thành viên mới'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            <Link className="workspace-home__text-link" to={`${base}/members`}>
                                {pending > 0 ? 'Xem đơn tham gia' : 'Quản lý thành viên'}{' '}
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        </section>
                    )}

                    <section className="workspace-home__shortcuts" aria-labelledby="workspace-shortcuts-title">
                        <h2 id="workspace-shortcuts-title">{manager ? 'Không gian làm việc' : 'Dấu ấn của bạn'}</h2>
                        {(manager
                            ? [
                                  ['reports', 'Báo cáo', 'Theo dõi và cập nhật báo cáo CLB'],
                                  ['finance', 'Tài chính', 'Theo dõi thu chi của CLB'],
                              ]
                            : [
                                  ['quests', 'Nhiệm vụ & đóng góp', 'Tìm việc để tham gia cùng CLB'],
                                  ['points', 'Điểm & thành tích', 'Theo dõi đóng góp của bạn'],
                              ]
                        ).map(([path, title, copy]) => (
                            <Link key={path} to={`${base}/${path}`}>
                                <div>
                                    <strong>{title}</strong>
                                    <span>{copy}</span>
                                </div>
                                <ArrowRight size={16} aria-hidden="true" />
                            </Link>
                        ))}
                        <Link className="workspace-home__members" to={`${base}/members`}>
                            <Users size={16} aria-hidden="true" />
                            <span>
                                {summary?.memberCount != null && !loading
                                    ? `${summary.memberCount} thành viên`
                                    : 'Thành viên CLB'}
                            </span>
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    </section>
                </aside>
            </div>
        </div>
    );
}
