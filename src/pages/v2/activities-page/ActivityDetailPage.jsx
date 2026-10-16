import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

const tabs = [
    ['overview', 'Tổng quan'],
    ['documents', 'Tài liệu'],
    ['media', 'Media'],
    ['assignments', 'Phân công'],
    ['recruitment', 'Tuyển dụng'],
    ['attendance', 'Điểm danh của tôi'],
];
function PublicActivityProfile({ activity, clubCode, sessionKey }) {
    const [tab, setTab] = useState('overview');
    const resources = publicActivityResources(activity.resources);
    const clubLink = <ClubNavigationLinks clubCode={clubCode} />;
    return (
        <ActivityProfileLayout activity={activity} tabs={tabs} tab={tab} onTabChange={setTab} actions={clubLink}>
            {tab === 'overview' && <ActivityOverview activity={activity} clubLink={clubLink} />}
            {tab === 'documents' && <ActivityResources resources={resources} kind="DOCUMENT" />}
            {tab === 'media' && <ActivityResources resources={resources} kind="MEDIA" />}
            {['assignments', 'recruitment'].includes(tab) && <ActivityStaffingPanel activityId={activity.id} mode={tab} />}
            {tab === 'attendance' && (
                <div className="v2-activity-profile-panel">
                    <ActivityAttendance key={`${sessionKey}:${activity.id}`} activity={activity} manager={false} />
                </div>
            )}
        </ActivityProfileLayout>
    );
}

export default function ActivityDetailPage({ api, sessionKey }) {
    const { activityId } = useParams();
    const result = useActivityDetail(api, sessionKey, activityId);
    const activity = result.data;
    const directory = useClubDirectory(api, sessionKey);
    const clubCode =
        activity?.clubCode || directory.data?.find((club) => String(club.id) === activity?.clubId)?.code || '';
    return (
        <div className="v2-public-content v2-activity-detail-page">
            <Link className="v2-text-link" to="/v2/activities">
                ← Quay lại hoạt động
            </Link>
            {result.status === 'populated' && !isActivityPublic(activity) ? (
                <PageState
                    status="not-found"
                    title="Hoạt động chưa công khai"
                    description="Hoạt động này chưa được xuất bản hoặc đã được ẩn."
                />
            ) : result.status === 'populated' ? (
                <PublicActivityProfile
                    key={`${sessionKey}:${activity.id}`}
                    activity={activity}
                    clubCode={clubCode}
                    sessionKey={sessionKey}
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
