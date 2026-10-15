import {
    WorkspaceSemesterProvider,
    WorkspaceSemesterSelect,
    useWorkspaceSemesterSelection,
} from './WorkspaceSemesterContext';
import { ChevronRight } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import { useClubWorkspace } from '../workspace-data';
import { useWorkspaceDashboard } from '../workspace-dashboard-data';
import WorkspaceTabView from './tabs/WorkspaceTabView';
import WorkspaceLeftRail, { getWorkspaceSections } from './WorkspaceLeftRail';
import ActivityManagementPage from './tabs/activities/ActivityManagementPage';
import WorkspaceHome from './WorkspaceHome';
import './ClubWorkspacePage.scss';
export default function ClubWorkspacePage({ api, sessionKey, viewer }) {
    const { clubCode: routeClubCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const result = useClubWorkspace(api, sessionKey, routeClubCode);
    const manager = result.workspace?.role === 'MANAGER';
    const semesterSelection = useWorkspaceSemesterSelection(sessionKey, result.clubId, result.workspace?.semesters);
    // Refresh shared summaries when entering activities or the member roster.
    const dashboardRefreshKey = /\/(activities|members)\/?$/.test(location.pathname) ? location.key : null;
    const dashboard = useWorkspaceDashboard(
        api,
        result.status === 'populated' ? result.clubId : null,
        manager,
        sessionKey,
        semesterSelection.semester,
        dashboardRefreshKey,
    );
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
    if (relativePath === 'attendance') return <Navigate to={`${base}/activities`} replace />;
    const activeSection = availableSections.find(([path]) => path === relativePath);
    const activityDetailId = location.pathname.slice(base.length).match(/^\/activities\/([^/]+)\/?$/)?.[1];
    const sectionLabel = activeSection?.[1] || 'Trang không khả dụng';
    return (
        <WorkspaceSemesterProvider value={semesterSelection}>
            <div className={`v2-production-workspace${activeSection && !relativePath ? ' v2-production-workspace--home' : ''}`}>
                <WorkspaceLeftRail
                    workspace={{
                        ...result.workspace,
                        pendingApplications: dashboard.data?.pendingApplications ?? null,
                        ongoingActivityCount: dashboard.data?.ongoingActivityCount ?? null,
                    }}
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
                            <WorkspaceSemesterSelect />
                        </div>
                    </header>
                    <div className="v2-workspace-content">
                        {activityDetailId ? (
                            <ActivityManagementPage
                                key={`${sessionKey}:${result.clubId}:${activityDetailId}`}
                                api={api}
                                sessionKey={sessionKey}
                                activityId={activityDetailId}
                                workspace={result.workspace}
                                manager={manager}
                                base={base}
                            />
                        ) : activeSection && !relativePath ? (
                            <WorkspaceHome
                                workspace={result.workspace}
                                manager={manager}
                                base={base}
                                viewer={viewer}
                                dashboard={dashboard}
                            />
                        ) : (
                            <WorkspaceTabView
                                label={sectionLabel}
                                manager={manager}
                                dashboard={dashboard}
                                workspace={result.workspace}
                            />
                        )}
                    </div>
                </main>
            </div>
        </WorkspaceSemesterProvider>
    );
}
