import { activityWorkspacePath } from '../../../services/activity-club-navigation';
import StudentActivityActions from '../../../components/v2/activity-detail/StudentActivityActions';
import { useMyClubSelection, useMyApprovedMemberships } from '../my-clubs-data';
import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useActivityDetail } from '../activity-data';
import { isActivityPublic } from '../activity-publication';
import { useClubDirectory } from '../discover-data';
import PageState from '../../../components/v2/PageState';
import ActivityProfileLayout, { ActivityOverview } from '../../../components/v2/activity-detail/ActivityProfileLayout';
import ActivityResources from '../../../components/v2/activity-detail/ActivityResources';
import ActivityAttendance from '../../../components/v2/activity-detail/ActivityAttendance';
import { publicActivityResources } from '../../../components/v2/activity-detail/activity-resources-data';
import '../../../components/v2/activity-card/ActivityCard.scss';
import './ActivityDetailPage.scss';
import ClubNavigationLinks from '../../../components/v2/common/ClubNavigationLinks';
import ActivityStaffingPanel from '../../../components/v2/activity-detail/ActivityStaffingPanel';
import StudentSessionSources from '../../../components/v2/activity-detail/StudentSessionSources';

const tabs = [
    ['overview', 'Tổng quan'],
    ['documents', 'Tài liệu'],
    ['media', 'Media'],
    ['assignments', 'Phân công'],
    ['recruitment', 'Tuyển dụng'],
    ['attendance', 'Điểm danh của tôi'],
];
export function PublicActivityProfile({ activity, clubCode, sessionKey, api, onChanged, workspaceRead = false, activeTab, onTabChange, refreshing = false }) {
    const [localTab, setLocalTab] = useState('overview');
    const tab = activeTab ?? localTab;
    const setTab = onTabChange ?? setLocalTab;
    const resources = workspaceRead ? activity.resources : publicActivityResources(activity.resources);
    const membership = useMyClubSelection(api, sessionKey);
    const approvedMemberships = useMyApprovedMemberships(api, sessionKey);
    const workspacePath = activityWorkspacePath(activity.clubId, membership, approvedMemberships);
    const clubLink = <ClubNavigationLinks clubCode={clubCode} workspacePath={workspacePath} />;
    return (
        <ActivityProfileLayout activity={activity} tabs={tabs} tab={tab} onTabChange={setTab} actions={clubLink} registrationActions={<StudentActivityActions api={api} activity={activity} onChanged={onChanged} disabled={refreshing} compact />}>
            {refreshing ? <PageState status="loading" /> : <>
            {tab === 'overview' && <ActivityOverview activity={activity} clubLink={clubLink} />}
            {tab === 'documents' && <ActivityResources resources={resources} kind="DOCUMENT" />}
            {tab === 'media' && <ActivityResources resources={resources} kind="MEDIA" />}
            {['media', 'documents'].includes(tab) && activity.resourceAvailability !== 'AVAILABLE' && (
                <p role="status">Chưa tải được nguồn tài nguyên hoặc bạn chưa có quyền xem.</p>
            )}
            {['assignments', 'recruitment'].includes(tab) && (
                <ActivityStaffingPanel key={`${sessionKey}:${activity.id}:${tab}`} activityId={activity.id} mode={tab} />
            )}
            {tab === 'attendance' && (
                <div className="v2-activity-profile-panel">
                    <ActivityAttendance key={`${sessionKey}:${activity.id}`} activity={activity} manager={false} />
                    <StudentSessionSources
                        key={`sessions:${sessionKey}:${activity.id}`}
                        api={api}
                        activityId={activity.id}
                        onChanged={onChanged}
                    />
                </div>
            )}
            </>}
        </ActivityProfileLayout>
    );
}

export default function ActivityDetailPage({ api, sessionKey }) {
    const { activityId } = useParams();
    const location = useLocation();
    const [selection, setSelection] = useState({ activityId, tab: 'overview' });
    const tab = selection.activityId === activityId ? selection.tab : 'overview';
    const result = useActivityDetail(api, sessionKey, activityId, true, tab);
    const activity = result.data;
    const directory = useClubDirectory(api, sessionKey);
    const clubCode =
        directory.data?.find((club) => String(club.id) === String(activity?.clubId))?.code || activity?.clubCode || '';
    return (
        <div className="v2-public-content v2-activity-detail-page">
            <Link className="v2-text-link" to={`/v2/activities${location.search}`}>
                ← Quay lại hoạt động
            </Link>
            {activity && !isActivityPublic(activity) ? (
                <PageState
                    status="not-found"
                    title="Hoạt động chưa công khai"
                    description="Hoạt động này chưa được xuất bản hoặc đã được ẩn."
                />
            ) : activity ? (
                <PublicActivityProfile
                    key={`${sessionKey}:${activity.id}`}
                    activity={activity}
                    clubCode={clubCode}
                    sessionKey={sessionKey}
                    api={api}
                    activeTab={tab}
                    onTabChange={(next) => setSelection({ activityId, tab: next })}
                    refreshing={result.status === 'loading'}
                    onChanged={result.retry}
                />
            ) : (
                <PageState
                    status={result.status}
                    onRetry={result.retry}
                    title={result.status === 'not-found' ? 'Không tìm thấy hoạt động' : undefined}
                    description={result.status === 'not-found' ? 'Hoạt động không tồn tại hoặc đã bị xóa.' : undefined}
                />
            )}
        </div>
    );
}
