import { Link, useNavigate } from 'react-router-dom';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import { EmptyState } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { useMyActivitySchedule } from '../activity-data';
import PersonalPageHeading from './PersonalPageHeading';
import './PersonalPages.scss';

export function MySchedulePage({ api, sessionKey }) {
    const result = useMyActivitySchedule(api, sessionKey);
    const navigate = useNavigate();
    const activities = result.data || [];

    return (
        <div className="v2-public-content v2-personal-page v2-my-schedule-page">
            <PersonalPageHeading
                title="Lịch trình của tôi"
                description="Các hoạt động và phiên tham gia bạn đã đăng ký, đang diễn ra hoặc sắp tới."
            />
            <PageState status={result.status === 'empty' ? 'populated' : result.status} onRetry={result.retry}>
                {activities.length ? (
                    <div className="v2-activity-list">
                        {activities.map((activity) => (
                            <ActivityCard key={activity.scheduleKey} activity={activity} onOpen={item => navigate(`/v2/activities/${item.id}`)} variant="schedule" />
                        ))}
                    </div>
                ) : (
                    <EmptyState
                        title="Lịch trình đang trống"
                        text="Sau khi đăng ký tham gia hoạt động, lịch sẽ xuất hiện tại đây."
                    >
                        <Link className="v2-button" to="/v2/activities">
                            Xem tất cả hoạt động
                        </Link>
                    </EmptyState>
                )}
            </PageState>
        </div>
    );
}
