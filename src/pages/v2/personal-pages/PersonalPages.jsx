import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import ActivityDetail from '../../../components/v2/activity-detail/ActivityDetail';
import { EmptyState } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { useActivityFeed } from '../activity-data';
import PersonalPageHeading from './PersonalPageHeading';
import './PersonalPages.scss';

function accessibleClubIds(clubAccess = []) {
    return new Set(
        clubAccess
            .map((access) => access?.clubId ?? access?.id)
            .filter((clubId) => clubId !== undefined && clubId !== null)
            .map(String),
    );
}

export function MySchedulePage({ api, sessionKey, clubAccess }) {
    const result = useActivityFeed(api, sessionKey);
    const [selected, setSelected] = useState(null);
    const clubIds = useMemo(() => accessibleClubIds(clubAccess), [clubAccess]);
    const activities = useMemo(
        () => (result.data || []).filter((activity) => clubIds.has(activity.clubId)),
        [clubIds, result.data],
    );

    return (
        <div className="v2-public-content v2-personal-page v2-my-schedule-page">
            <PersonalPageHeading
                title="Lịch trình của tôi"
                description="Các hoạt động sắp tới từ những câu lạc bộ bạn đang theo dõi."
            />
            <PageState status={result.status === 'empty' ? 'populated' : result.status} onRetry={result.retry}>
                {activities.length ? (
                    <div className="v2-activity-list">
                        {activities.map((activity) => (
                            <ActivityCard key={activity.id} activity={activity} onOpen={setSelected} />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Lịch trình đang trống"
                        text="Khi CLB của bạn có hoạt động mới, lịch sẽ xuất hiện tại đây."
                    >
                        <Link className="v2-button" to="/v2/activities">
                            Xem tất cả hoạt động
                        </Link>
                    </EmptyState>
                )}
            </PageState>
            <ActivityDetail activity={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
