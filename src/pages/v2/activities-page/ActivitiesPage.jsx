import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import { SearchField } from '../../../components/v2/DiscoveryLayout';
import '../../../components/v2/directory-filter/DirectoryFilters.scss';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import { filterActivityFeed, useActivityFeed } from '../activity-data';
import './ActivitiesPage.scss';
const filters = [
    ['ALL', 'Tất cả'],
    ['UPCOMING', 'Sắp diễn ra'],
    ['LIVE', 'Đang diễn ra'],
];
export default function ActivitiesPage({ api, sessionKey }) {
    const result = useActivityFeed(api, sessionKey);
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('ALL');
    const navigate = useNavigate();
    const items = useMemo(() => filterActivityFeed(result.data || [], query, status), [result.data, query, status]);
    return (
        <div className="v2-public-content v2-activities-page">
            <header>
                <h1>Tất cả hoạt động sắp tới</h1>
                <p>Những hoạt động đang diễn ra và sắp tới.</p>
            </header>
            <div className="v2-filter-bar v2-event-filter-bar">
                <div className="v2-tabs" role="group" aria-label="Trạng thái hoạt động">
                    {filters.map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
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
            {result.status === 'populated' ? (
                <>
                    <p className="v2-event-result-count" role="status">
                        {items.length} hoạt động{query || status !== 'ALL' ? ' phù hợp' : ' để khám phá'}
                    </p>
                    {items.length ? (
                        <div className="v2-event-grid">
                            {items.map((item) => (
                                <ActivityCard
                                    key={item.id}
                                    activity={item}
                                    onOpen={(activity) => navigate(`/v2/activities/${activity.id}`)}
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
                                    setQuery('');
                                    setStatus('ALL');
                                }}
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <PageState status={result.status} onRetry={result.retry} />
            )}
        </div>
    );
}
