import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import ActivityDetail from '../../../components/v2/activity-detail/ActivityDetail';
import ClubCard from '../../../components/v2/club-card/ClubCard';
import { EmptyState } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { useActivityFeed } from '../activity-data';
import { useClubDirectory } from '../discover-data';
import './PersonalPages.scss';

function accessibleClubIds(clubAccess = []) {
    return new Set(
        clubAccess
            .map((access) => access?.clubId ?? access?.id)
            .filter((clubId) => clubId !== undefined && clubId !== null)
            .map(String),
    );
}

export function MyClubsPage({ api, sessionKey, clubAccess }) {
    const result = useClubDirectory(api, sessionKey);
    const clubIds = useMemo(() => accessibleClubIds(clubAccess), [clubAccess]);
    const clubs = useMemo(() => (result.data || []).filter((club) => clubIds.has(club.id)), [clubIds, result.data]);

    return (
        <div className="v2-public-content v2-personal-page">
            <header className="v2-personal-page-heading">
                <span>CỦA TÔI</span>
                <h1>Câu lạc bộ của tôi</h1>
                <p>Những cộng đồng bạn đang tham gia hoặc đồng hành quản lý.</p>
            </header>
            <PageState status={result.status === 'empty' ? 'populated' : result.status} onRetry={result.retry}>
                {clubs.length ? (
                    <div className="v2-club-grid" data-directory-mode="mine">
                        {clubs.map((club) => <ClubCard key={club.id} club={club} />)}
                    </div>
                ) : (
                    <EmptyState title="Bạn chưa tham gia câu lạc bộ nào" text="Khám phá các CLB đang mở để bắt đầu hành trình của bạn.">
                        <Link className="v2-button v2-button--primary" to="/v2/clubs">Khám phá câu lạc bộ</Link>
                    </EmptyState>
                )}
            </PageState>
        </div>
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
            <header className="v2-personal-page-heading">
                <span>CỦA TÔI</span>
                <h1>Lịch trình của tôi</h1>
                <p>Các hoạt động sắp tới từ những câu lạc bộ bạn đang theo dõi.</p>
            </header>
            <PageState status={result.status === 'empty' ? 'populated' : result.status} onRetry={result.retry}>
                {activities.length ? (
                    <div className="v2-activity-list">
                        {activities.map((activity) => <ActivityCard key={activity.id} activity={activity} onOpen={setSelected} />)}
                    </div>
                ) : (
                    <EmptyState title="Lịch trình đang trống" text="Khi CLB của bạn có hoạt động mới, lịch sẽ xuất hiện tại đây.">
                        <Link className="v2-button" to="/v2/activities">Xem tất cả hoạt động</Link>
                    </EmptyState>
                )}
            </PageState>
            <ActivityDetail activity={selected} onClose={() => setSelected(null)} />
        </div>
    );
}
