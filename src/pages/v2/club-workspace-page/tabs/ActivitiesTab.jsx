import { useEffect, useMemo, useState } from 'react';
import { useWorkspaceSemester } from '../WorkspaceSemesterContext';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ActivityCard from '../../../../components/v2/activity-card/ActivityCard';
import { SearchField } from '../../../../components/v2/DiscoveryLayout';
import '../../../../components/v2/directory-filter/DirectoryFilters.scss';
import '../../activities-page/ActivitiesPage.scss';
import { useAuth } from '../../../../context/AuthContext';
import PageState from '../../../../components/v2/PageState';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import { sortActivitiesNewestFirst } from '../../activity-data';

export default function ActivitiesTab({ manager = false, dashboard, workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const { semester } = useWorkspaceSemester();
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('ALL');
    useEffect(() => {
        setCreating(false);
    }, [semester?.id]);
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

    const createActivity = async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.createActivity({
                clubId: Number(clubId),
                clubName: workspace.name,
                title: values.title.trim(),
                description: values.description.trim(),
                startTimeUtc: new Date(values.startTime).toISOString(),
                endTimeUtc: new Date(values.endTime).toISOString(),
                location: values.location.trim(),
            });
            setCreating(false);
            result.retry();
        } catch (error) {
            setSubmitError(error?.message || 'Không thể tạo hoạt động. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <WorkspaceTabLayout
                title="Hoạt động của CLB"
                description={
                    semester?.startUtc && semester?.endUtc
                        ? `Hoạt động trong ${semester.label}.`
                        : 'Theo dõi hoạt động toàn CLB.'
                }
                action={
                    manager ? (
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            onClick={() => setCreating(true)}
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
                                <div className="v2-event-grid">
                                    {visibleActivities.map((record) => (
                                        <ActivityCard
                                            key={record.id}
                                            activity={{ ...record, clubName: workspace.name }}
                                            onOpen={(activity) =>
                                                navigate(
                                                    manager
                                                        ? `/v2/my-clubs/${encodeURIComponent(workspace.clubCode)}/activities/${activity.id}`
                                                        : `/v2/activities/${activity.id}`,
                                                )
                                            }
                                        />
                                    ))}
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
            {creating && (
                <V2Modal title="Tạo hoạt động nội bộ" onClose={() => !submitting && setCreating(false)}>
                    <form className="v2-workspace-activity-form" onSubmit={createActivity}>
                        <label>
                            Tên hoạt động
                            <input
                                name="title"
                                required
                                maxLength="120"
                                placeholder="Ví dụ: Workshop thiết kế sản phẩm"
                            />
                        </label>
                        <label>
                            Thời gian bắt đầu
                            <input name="startTime" type="datetime-local" required />
                        </label>
                        <label>
                            Thời gian kết thúc
                            <input name="endTime" type="datetime-local" required />
                        </label>
                        <label>
                            Địa điểm
                            <input name="location" required placeholder="Ví dụ: Innovation Hub" />
                        </label>
                        <label>
                            Mô tả
                            <textarea
                                name="description"
                                rows="4"
                                required
                                maxLength="1000"
                                placeholder="Mục tiêu, nội dung và lưu ý cho người tham gia"
                            />
                        </label>
                        {submitError && (
                            <p className="v2-workspace-form-error" role="alert">
                                {submitError}
                            </p>
                        )}
                        <div>
                            <button
                                className="v2-button"
                                type="button"
                                disabled={submitting}
                                onClick={() => setCreating(false)}
                            >
                                Hủy
                            </button>
                            <button className="v2-button v2-button--primary" disabled={submitting}>
                                {submitting ? 'Đang tạo…' : 'Tạo hoạt động'}
                            </button>
                        </div>
                    </form>
                </V2Modal>
            )}
        </>
    );
}
