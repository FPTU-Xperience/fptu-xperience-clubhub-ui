import StudentActivityActions from '../../../components/v2/activity-detail/StudentActivityActions';
import DirectoryPagination from '../../../components/v2/directory-pagination/DirectoryPagination';
import { useListQuery } from '../use-list-query';
import { useMemo } from 'react';
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
    const [list, setList] = useListQuery({ query: '', status: 'ALL', page: 1 });
    const { query, status, page } = list;
    const setQuery = (value) => setList('query', value);
    const setStatus = (value) => setList('status', value);
    const setPage = (value) => setList('page', value);
    const result = useActivityFeed(api, sessionKey);
    const navigate = useNavigate();
    const items = useMemo(() => filterActivityFeed(result.data || [], query, status), [result.data, query, status]);
    const totalPages = Math.max(1, Math.ceil(items.length / 12));
    const currentPage = Math.min(page, totalPages);
    const pageItems = items.slice((currentPage - 1) * 12, currentPage * 12);
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
                        <div>
                                <div className="v2-event-grid">
                            {pageItems.map((item) => (
                                <div key={item.id}>
                                <ActivityCard
                                    activity={item}
                                    onOpen={(activity) => navigate(`/v2/activities/${activity.id}${window.location.search}`)}
                                />
                                {item.canRegister && <StudentActivityActions key={`${sessionKey}:${item.id}`} api={api} activity={item} onChanged={result.retry} registerOnly />}
                                </div>
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
