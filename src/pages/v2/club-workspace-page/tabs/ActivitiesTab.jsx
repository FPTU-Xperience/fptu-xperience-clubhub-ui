import DirectoryPagination from '../../../../components/v2/directory-pagination/DirectoryPagination';
import { useListQuery } from '../../use-list-query';
import { useMemo } from 'react';
import { useWorkspaceSemester } from '../WorkspaceSemesterContext';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActivityCard from '../../../../components/v2/activity-card/ActivityCard';
import { SearchField } from '../../../../components/v2/DiscoveryLayout';
import '../../../../components/v2/directory-filter/DirectoryFilters.scss';
import '../../activities-page/ActivitiesPage.scss';
import { useAuth } from '../../../../context/AuthContext';
import PageState from '../../../../components/v2/PageState';
import { reportTemplateUrl } from '../../report-detail-page/report-templates';
import { applicationPermission } from '../../activity-application/activity-application-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import { sortActivitiesNewestFirst } from '../../activity-data';

export default function ActivitiesTab({ manager = false, readOnly = false, dashboard, workspace }) {
    const [list, setList] = useListQuery({ query: '', status: 'ALL', page: 1 });
    const { query, status, page } = list;
    const setQuery = (value) => setList('query', value);
    const setStatus = (value) => setList('status', value);
    const setPage = (value) => setList('page', value);
    const clubId = workspace?.clubId;
    const { clubAccess } = useAuth();
    const { semester } = useWorkspaceSemester();
    const navigate = useNavigate();
    const activities = dashboard.data?.activities || [];
    const visibleActivities = useMemo(
        () =>
            sortActivitiesNewestFirst(
                activities.filter(
                    (activity) =>
                        (status === 'ALL' ||
                            activity.status === status ||
                            (status === 'UPCOMING' && activity.status === 'SCHEDULED')) &&
                        `${activity.title} ${activity.description || ''} ${activity.location || ''}`
                            .toLocaleLowerCase('vi')
                            .includes(query.trim().toLocaleLowerCase('vi')),
                ),
            ),
        [activities, query, status],
    );
    const result = {
        status:
            dashboard.status === 'ready'
                ? dashboard.data?.activityAvailable
                    ? activities.length
                        ? 'populated'
                        : 'empty'
                    : 'error'
                : dashboard.status,
        data: activities,
        retry: dashboard.retry,
    };

    const canCreate =
        !readOnly &&
        applicationPermission(
            clubAccess.find((item) => String(item.clubId) === String(clubId)),
            'activity.create',
        );

    const totalPages = Math.max(1, Math.ceil(visibleActivities.length / 12));
    const currentPage = Math.min(page, totalPages);
    const pageItems = visibleActivities.slice((currentPage - 1) * 12, currentPage * 12);
    return (
        <>
            <WorkspaceTabLayout
                className="v2-workspace-activities"
                title="Hoạt động của CLB"
                description={
                    semester?.startUtc && semester?.endUtc
                        ? `Hoạt động trong ${semester.label}.`
                        : 'Theo dõi hoạt động toàn CLB.'
                }
                action={
                    canCreate ? (
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            onClick={() =>
                                navigate(
                                    reportTemplateUrl(
                                        'create-activity',
                                        clubId,
                                        semester,
                                        null,
                                        `/v2/my-clubs/${encodeURIComponent(workspace.clubCode)}/reports`,
                                    ),
                                )
                            }
                        >
                            <Plus size={16} /> Tạo hoạt động
                        </button>
                    ) : null
                }
                records={result.data || []}
            >
                {() =>
                    result.status === 'populated' ? (
                        <>
                            <div className="v2-filter-bar v2-event-filter-bar">
                                <div className="v2-tabs" role="group" aria-label="Trạng thái hoạt động">
                                    {[
                                        ['ALL', 'Tất cả'],
                                        ['UPCOMING', 'Sắp diễn ra'],
                                        ['LIVE', 'Đang diễn ra'],
                                        ['COMPLETED', 'Đã hoàn thành'],
                                    ].map(([value, label]) => (
                                        <button
                                            type="button"
                                            key={value}
                                            aria-pressed={status === value}
                                            className={status === value ? 'active' : ''}
                                            onClick={() => setStatus(value)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <SearchField value={query} onChange={setQuery} placeholder="Tìm hoạt động..." />
                            </div>
                            <p className="v2-event-result-count" role="status">
                                {visibleActivities.length} hoạt động{status !== 'ALL' || query ? ' phù hợp' : ''}
                            </p>
                            {visibleActivities.length ? (
                                <div>
                                <div className="v2-event-grid">
                                    {pageItems.map((record) => (
                                        <ActivityCard
                                            key={record.id}
                                            activity={{ ...record, clubName: workspace.name }}
                                            publicationLabel={manager ? record.isPublished === true ? 'Đã công khai' : record.isPublished === false || record.sourceApplicationId ? 'Chưa công khai' : 'Chưa đồng bộ xuất bản' : undefined}
                                            onOpen={(activity) =>
                                                navigate(
                                                    `${window.location.pathname.replace(/\/$/, '')}/${activity.id}${window.location.search}`,
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                                <DirectoryPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                                </div>
                            ) : (
                                <div>
                                    <PageState status="empty" title="Không tìm thấy hoạt động" />
                                    <button
                                        className="v2-button"
                                        type="button"
                                        onClick={() => {
                                            setStatus('ALL');
                                            setQuery('');
                                        }}
                                    >
                                        Xóa bộ lọc
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <PageState
                            status={result.status}
                            onRetry={result.retry}
                            title={result.status === 'empty' ? 'Chưa có hoạt động' : undefined}
                        />
                    )
                }
            </WorkspaceTabLayout>
        </>
    );
}
