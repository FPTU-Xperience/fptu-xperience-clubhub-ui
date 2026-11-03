import { useListQuery } from '../use-list-query';
import { useMemo } from 'react';
import ClubCard from '../../../components/v2/club-card/ClubCard';
import DirectoryFilters from '../../../components/v2/directory-filter/DirectoryFilters';
import DirectoryPagination from '../../../components/v2/directory-pagination/DirectoryPagination';
import { EmptyState, SectionHeading } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import {
    filterClubDirectory,
    orderDirectoryCategories,
    paginateClubDirectory,
    useClubDirectory,
} from '../discover-data';
import './AllClubsPage.scss';

const PAGE_SIZE = 12;

export default function AllClubsPage({ api, sessionKey }) {
    const [list, setList] = useListQuery({ query: '', category: 'ALL', onlyRecruiting: false, page: 1 });
    const { query, category, onlyRecruiting, page } = list;
    const setQuery = (value) => setList('query', value);
    const setCategory = (value) => setList('category', value);
    const setOnlyRecruiting = (value) => setList('onlyRecruiting', value);
    const setPage = (value) => setList('page', value);
    const result = useClubDirectory(api, sessionKey);
    const entries = result.data || [];
    const categories = useMemo(
        () => orderDirectoryCategories([...new Set(entries.map((club) => club.category).filter(Boolean))]),
        [entries],
    );
    const recruitmentAvailable = entries.length > 0 && entries.every((club) => club.hasRecruitmentStatus);
    const clubs = useMemo(
        () => filterClubDirectory(entries, { query, category, recruitingOnly: onlyRecruiting }),
        [entries, query, category, onlyRecruiting],
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

    const updateRecruiting = (value) => {
        setOnlyRecruiting(value);
        setPage(1);
    };

    const changePage = (nextPage) => {
        setPage(nextPage);
        document.getElementById('all-clubs-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="v2-public-content">
            <section id="all-clubs-directory">
                <div className="v2-page-heading">
                    <div>
                        <h1 className="v2-page-heading-title">Tất cả câu lạc bộ</h1>
                        <p>Tìm một cộng đồng phù hợp với sở thích và nhịp sống của bạn.</p>
                    </div>
                </div>
                <PageState status={result.status} onRetry={result.retry}>
                    <DirectoryFilters
                        query={query}
                        category={category}
                        onlyRecruiting={onlyRecruiting}
                        categories={categories}
                        resultCount={clubs.length}
                        resultLabel="câu lạc bộ phù hợp"
                        recruitmentAvailable={recruitmentAvailable}
                        onQueryChange={updateQuery}
                        onCategoryChange={updateCategory}
                        onRecruitingChange={updateRecruiting}
                    />
                    {clubs.length ? (
                        <>
                            <div className="v2-club-grid" data-directory-mode="all">
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
                        <EmptyState title="Chưa tìm thấy CLB phù hợp" text="Thử từ khóa khác hoặc bỏ các bộ lọc." />
                    )}
                </PageState>
            </section>
        </div>
    );
}
