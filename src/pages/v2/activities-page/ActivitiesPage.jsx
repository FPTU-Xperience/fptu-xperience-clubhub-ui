import DirectoryPagination from '../../../components/v2/directory-pagination/DirectoryPagination';
import { useListQuery } from '../use-list-query';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import { SearchField } from '../../../components/v2/DiscoveryLayout';
import DirectoryFilterSelect from '../../../components/v2/directory-filter/DirectoryFilterSelect';
import ActiveDirectoryFilters from '../../../components/v2/directory-filter/ActiveDirectoryFilters';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import { DiscoveryTagFilter } from '../../../components/v2/DiscoveryTagFields';
import { ACTIVITY_TAG_CATEGORIES, discoveryTagLabel } from '../../../services/discovery-tags';
import { prioritizeRecommendedItems } from '../../../services/student-read-api';
import { filterActivityFeed, useActivityFeed, useRecommendedActivities } from '../activity-data';
import './ActivitiesPage.scss';

const statusFilters = [
    ['ALL', 'Tất cả trạng thái'],
    ['UPCOMING', 'Sắp diễn ra'],
    ['LIVE', 'Đang diễn ra'],
];
const categoryFilters = [['ALL', 'Tất cả thể loại'], ...ACTIVITY_TAG_CATEGORIES];
const defaultFilters = { query: '', category: 'ALL', status: 'ALL', tag: '' };

export default function ActivitiesPage({ api, sessionKey }) {
    const [list, setList] = useListQuery({ ...defaultFilters, page: 1 });
    const { query, status, page } = list;
    const legacyCategory = ACTIVITY_TAG_CATEGORIES.find(([code]) => list.tag === `activity-category:${code}`)?.[0];
    const category = list.category === 'ALL' && legacyCategory ? legacyCategory : list.category;
    const tag = legacyCategory ? '' : list.tag;
    const result = useActivityFeed(api, sessionKey);
    const recommendations = useRecommendedActivities(api, sessionKey);
    const navigate = useNavigate();
    const items = useMemo(
        () => prioritizeRecommendedItems(
            filterActivityFeed(result.data || [], query, status, tag, category),
            recommendations.data.map(({ activity }) => activity.id),
        ),
        [result.data, recommendations.data, query, status, tag, category],
    );
    const totalPages = Math.max(1, Math.ceil(items.length / 12));
    const currentPage = Math.min(page, totalPages);
    const pageItems = items.slice((currentPage - 1) * 12, currentPage * 12);
    const activeFilters = [
        query && { key: 'query', label: `Tìm kiếm: ${query}`, onRemove: () => setList('query', '') },
        category !== 'ALL' && { key: 'category', label: categoryFilters.find(([value]) => value === category)?.[1] ?? category,
            onRemove: () => setList({ category: 'ALL', tag }) },
        status !== 'ALL' && { key: 'status', label: statusFilters.find(([value]) => value === status)?.[1] ?? status,
            onRemove: () => setList('status', 'ALL') },
        tag && { key: 'tag', label: discoveryTagLabel(result.data || [], tag), onRemove: () => setList('tag', '') },
    ].filter(Boolean);
    return (
        <div className="v2-public-content v2-activities-page">
            <header className="v2-page-heading">
                <h1 className="v2-page-heading-title">Tất cả hoạt động sắp tới</h1>
                <p>Những hoạt động đang diễn ra và sắp tới.</p>
            </header>
            <div className="v2-filter-bar v2-directory-toolbar">
                <SearchField value={query} onChange={(value) => setList('query', value)} placeholder="Tìm hoạt động..." />
                <DirectoryFilterSelect label="Thể loại hoạt động" value={category} options={categoryFilters}
                    onChange={(value) => setList({ category: value, tag })} />
                <DirectoryFilterSelect label="Trạng thái hoạt động" value={status} options={statusFilters}
                    onChange={(value) => setList('status', value)} />
                <DiscoveryTagFilter items={result.data || []} value={tag}
                    onChange={(value) => setList({ category, tag: value })} />
            </div>
            <ActiveDirectoryFilters filters={activeFilters} onReset={() => setList(defaultFilters)} />
            {result.status === 'populated' ? (
                <>
                    <p className="v2-event-result-count" role="status">
                        {items.length} hoạt động{activeFilters.length ? ' phù hợp' : ' để khám phá'}
                    </p>
                    {items.length ? (
                        <>
                            <div className="v2-event-grid">
                                {pageItems.map((item) => (
                                    <div key={item.id}>
                                        <ActivityCard
                                            activity={item}
                                            interactionApi={api}
                                            onOpen={(activity) => navigate(`/v2/activities/${activity.id}${window.location.search}`)}
                                        />
                                    </div>
                                ))}
                            </div>
                            <DirectoryPagination currentPage={currentPage} totalPages={totalPages} onPageChange={(value) => setList('page', value)} />
                        </>
                    ) : (
                        <PageState status="empty" title="Không tìm thấy hoạt động" />
                    )}
                </>
            ) : (
                <PageState status={result.status} onRetry={result.retry} />
            )}
        </div>
    );
}
