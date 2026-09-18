import { useMemo, useState } from 'react';
import ClubCard from '../../../components/v2/club-card/ClubCard';
import DirectoryFilters from '../../../components/v2/directory-filter/DirectoryFilters';
import DirectoryPagination from '../../../components/v2/directory-pagination/DirectoryPagination';
import { BottomCallout, DiscoverHero, EmptyState, SectionHeading } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { createCuratedClubSet, filterClubDirectory, paginateClubDirectory, useClubDirectory } from '../discover-data';
import './DiscoveryPage.scss';

const PAGE_SIZE = 6;
const MAX_PAGES = 4;
const MAX_SUGGESTED_CLUBS = PAGE_SIZE * MAX_PAGES;

export default function DiscoverPage({ api, sessionKey }) {
    const result = useClubDirectory(api, sessionKey);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('ALL');
    const [page, setPage] = useState(1);
    const entries = result.data || [];
    const suggestedEntries = useMemo(() => createCuratedClubSet(entries, MAX_SUGGESTED_CLUBS), [entries]);
    const categories = useMemo(
        () => [...new Set(suggestedEntries.map((club) => club.category).filter(Boolean))],
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
            <DiscoverHero />
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
