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
import ReportDetailPage from '../report-detail-page/ReportDetailPage';
import ReportEditorPage from '../report-detail-page/ReportEditorPage';
import { canViewClubDeclarations } from './tabs/student-declarations/club-declarations-data';
import './ClubWorkspacePage.scss';
export default function ClubWorkspacePage({ api, sessionKey, viewer }) {
    const { clubCode: routeClubCode } = useParams();
    const result = useClubWorkspace(api, sessionKey, routeClubCode);
    return <ClubWorkspaceView api={api} sessionKey={sessionKey} viewer={viewer} result={result} />;
}

export function ClubWorkspaceView({ api, sessionKey, viewer, result, observation = false }) {
    const { clubCode: routeClubCode } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const manager = !observation && result.workspace?.role === 'MANAGER';
    const semesterSelection = useWorkspaceSemesterSelection(
        sessionKey,
        result.clubId,
        result.workspace?.semesters,
        api,
    );
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
    const encodedCode = encodeURIComponent(result.workspace?.clubCode || routeClubCode || '');
    const base = observation ? `/v2/ctsv/clubs/${encodedCode}/workspace` : `/v2/my-clubs/${encodedCode}`;
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
                    <Link className="v2-button" to={observation ? '/v2/clubs' : '/v2/my-clubs'}>
                        {observation ? 'Về danh sách CLB' : 'Về CLB của tôi'}
                    </Link>
                )}
            </div>
        );
    const canViewDeclarations = canViewClubDeclarations(manager, result.workspace, observation);
    const availableSections = getWorkspaceSections(manager, observation, canViewDeclarations);
    const relativePath = location.pathname.slice(base.length).split('/').filter(Boolean)[0] || '';
    if (observation && relativePath === 'club-page') return <Navigate to={base} replace />;
    if (relativePath === 'attendance') return <Navigate to={`${base}/activities`} replace />;
    const activeSection = availableSections.find(([path]) => path === relativePath);
    const activityDetailId =
        !observation && location.pathname.slice(base.length).match(/^\/activities\/([^/]+)\/?$/)?.[1];
    const reportDetailId = location.pathname.slice(base.length).match(/^\/reports\/([^/]+)\/?$/)?.[1];
    const reportCreate = location.pathname.slice(base.length).replace(/\/$/, '') === '/reports/create';
    const reportEditId = location.pathname.slice(base.length).match(/^\/reports\/([^/]+)\/edit\/?$/)?.[1];
    const sectionLabel = activeSection?.[1] || 'Trang không khả dụng';
    return (
        <WorkspaceSemesterProvider value={semesterSelection}>
            <div
                className={`v2-production-workspace${activeSection && !relativePath ? ' v2-production-workspace--home' : ''}${reportDetailId || reportEditId ? ' v2-production-workspace--report' : ''}${activityDetailId ? ' v2-production-workspace--activity-detail' : ''}`}
            >
                <WorkspaceLeftRail
                    workspace={{
                        ...result.workspace,
                        pendingApplications: dashboard.data?.pendingApplications ?? null,
                        ongoingActivityCount: dashboard.data?.ongoingActivityCount ?? null,
                    }}
                    selections={result.data}
                    base={base}
                    manager={manager}
                    observation={observation}
                    canViewDeclarations={canViewDeclarations}
                    onClubChange={(clubCode) => navigate(`/v2/my-clubs/${encodeURIComponent(clubCode)}`)}
                />
                <main className="v2-workspace-main">
                    <header className="v2-workspace-bar">
                        <div>
                            <span>{observation ? 'Câu lạc bộ' : 'CLB của tôi'}</span>
                            <ChevronRight size={14} />
                            <span className="v2-workspace-breadcrumb-club" title={result.workspace.name}>
                                {result.workspace.name}
                            </span>
                            <ChevronRight size={14} /> <strong title={sectionLabel}>{sectionLabel}</strong>
                        </div>
                        <div>
                            <span className={`v2-workspace-role ${manager ? 'is-manager' : ''}`}>
                                {observation ? 'CTSV · Chỉ xem' : manager ? 'Chủ nhiệm' : 'Thành viên'}
                            </span>
                            <WorkspaceSemesterSelect />
                        </div>
                    </header>
                    <div className="v2-workspace-content">
                        {relativePath === 'student-declarations' && !canViewDeclarations ? (
                            <PageState
                                status="forbidden"
                                description="Chỉ BQL được cấp quyền trong CLB mới có thể mở trải nghiệm của sinh viên."
                            />
                        ) : reportCreate || reportEditId ? (
                            <ReportEditorPage
                                key={`${sessionKey}:${result.clubId}:${reportEditId || 'create'}:${location.search}`}
                                api={api}
                                sessionKey={sessionKey}
                                workspace={result.workspace}
                                base={base}
                                semester={semesterSelection.semester}
                                reportId={reportEditId}
                                readOnly={observation}
                            />
                        ) : reportDetailId ? (
                            <ReportDetailPage
                                key={`${sessionKey}:${result.clubId}:${reportDetailId}`}
                                api={api}
                                sessionKey={sessionKey}
                                reportId={reportDetailId}
                                workspace={result.workspace}
                                base={base}
                                readOnly={observation}
                            />
                        ) : activityDetailId ? (
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
                                observation={observation}
                            />
                        ) : (
                            <WorkspaceTabView
                                label={sectionLabel}
                                manager={manager}
                                readOnly={observation}
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
