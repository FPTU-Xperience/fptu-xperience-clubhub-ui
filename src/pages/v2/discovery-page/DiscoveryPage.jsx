import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ActivityCard from '../../../components/v2/activity-card/ActivityCard';
import { filterActivityFeed, useRecommendedActivities } from '../activity-data';
import ClubCard from '../../../components/v2/club-card/ClubCard';
import DirectoryFilters from '../../../components/v2/directory-filter/DirectoryFilters';
import DirectoryPagination from '../../../components/v2/directory-pagination/DirectoryPagination';
import { BottomCallout, DiscoverHero, EmptyState, SectionHeading } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { recommendationFailureDescription } from '../../../services/student-read-api.js';
import {
    createCuratedClubSet,
    filterClubDirectory,
    orderDirectoryCategories,
    paginateClubDirectory,
    useClubDirectory,
} from '../discover-data';
import './DiscoveryPage.scss';

const PAGE_SIZE = 6;
const MAX_PAGES = 3;
const MAX_SUGGESTED_CLUBS = PAGE_SIZE * MAX_PAGES;

export default function DiscoverPage({ api, sessionKey, campus }) {
    const recommendations = useRecommendedActivities(api, sessionKey);
    const navigate = useNavigate();
    const [activityStatus, setActivityStatus] = useState('ALL');
    const recommendedActivities = useMemo(() => filterActivityFeed(recommendations.data.map(({ activity }) => activity), '', activityStatus), [recommendations.data, activityStatus]);
    const result = useClubDirectory(api, sessionKey);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('ALL');
    const [page, setPage] = useState(1);
    const entries = result.data || [];
    const suggestedEntries = useMemo(() => createCuratedClubSet(entries, MAX_SUGGESTED_CLUBS), [entries]);
    const categories = useMemo(
        () => orderDirectoryCategories([...new Set(suggestedEntries.map((club) => club.category).filter(Boolean))]),
        [suggestedEntries],
    );
    const clubs = useMemo(
        () => filterClubDirectory(suggestedEntries, { query, category }),
        [suggestedEntries, query, category],
    );
    const pagination = useMemo(() => paginateClubDirectory(clubs, page, PAGE_SIZE), [clubs, page]);

    const updateQuery = (value) => {
        setQuery(value);
        setPage(1);
    };

    const updateCategory = (value) => {
        setCategory(value);
        setPage(1);
    };

    const changePage = (nextPage) => {
        setPage(nextPage);
        document.getElementById('club-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="v2-public-content">
            <DiscoverHero campus={campus} />
            <section className="v2-recommended-activities">
                <SectionHeading title="Hoạt động dành cho bạn" description="Những trải nghiệm đang phù hợp để bạn khám phá.">
                    <Link className="v2-discovery-button" to="/v2/activities">Xem tất cả hoạt động <ArrowUpRight size={18} /></Link>
                </SectionHeading>
                {recommendations.metadata?.mode === 'BASIC' && <p role="status">
                    Gợi ý cơ bản theo lịch sắp tới. Cá nhân hóa theo Xperience Point hiện chưa khả dụng.
                </p>}
                <div className="v2-tabs v2-activity-filter-tabs" role="group" aria-label="Trạng thái hoạt động">{[['ALL','Tất cả'],['UPCOMING','Sắp diễn ra'],['LIVE','Đang diễn ra']].map(([value,label]) => <button key={value} type="button" aria-pressed={activityStatus === value} className={activityStatus === value ? 'active' : ''} onClick={() => setActivityStatus(value)}>{label}</button>)}</div>
                <PageState status={recommendations.status} onRetry={recommendations.retry}
                    description={recommendationFailureDescription(recommendations.error)}>
                    {recommendedActivities.length ? (
                        <div className="v2-event-grid">
                            {recommendedActivities.map((activity) => <ActivityCard key={activity.id} activity={activity} onOpen={item => navigate(`/v2/activities/${item.id}`)} />)}
                        </div>
                    ) : (
                        <EmptyState title="Chưa có hoạt động phù hợp" text="Thử chọn trạng thái khác để xem thêm hoạt động.">
                            <button className="v2-button" type="button" onClick={() => setActivityStatus('ALL')}>Xem tất cả trạng thái</button>
                        </EmptyState>
                    )}
                </PageState>
            </section>
            <section id="club-directory">
                <SectionHeading
                    title="Câu lạc bộ dành cho bạn"
                    description="Khám phá những cộng đồng được tuyển chọn phù hợp để bắt đầu hành trình."
                >
                    <span className="v2-muted">{suggestedEntries.length} CLB dành cho bạn</span>
                </SectionHeading>
                <PageState status={result.status} onRetry={result.retry}>
                    <DirectoryFilters
                        query={query}
                        category={category}
                        categories={categories}
                        resultCount={clubs.length}
                        resultLabel="câu lạc bộ phù hợp"
                        showRecruiting={false}
                        onQueryChange={updateQuery}
                        onCategoryChange={updateCategory}
                    />
                    {clubs.length ? (
                        <>
                            <div className="v2-club-grid" data-directory-mode="suggested">
                                {pagination.items.map((club) => (
                                    <ClubCard key={club.id} club={club} />
                                ))}
                            </div>
                            <DirectoryPagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                onPageChange={changePage}
                            />
                        </>
                    ) : (
                        <EmptyState
                            title="Chưa tìm thấy CLB phù hợp"
                            text="Thử từ khóa khác hoặc bỏ bộ lọc lĩnh vực."
                        />
                    )}
                </PageState>
            </section>
            <BottomCallout />
        </div>
    );
}
