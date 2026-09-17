import { useMemo, useState } from 'react';
import ClubCard from '../../components/v2/ClubCard';
import DirectoryFilters from '../../components/v2/DirectoryFilters';
import DirectoryPagination from '../../components/v2/DirectoryPagination';
import { EmptyState, SectionHeading } from '../../components/v2/DiscoveryLayout';
import PageState from '../../components/v2/PageState';
import { filterClubDirectory, paginateClubDirectory, useClubDirectory } from './discover-data';

const PAGE_SIZE = 12;

export default function AllClubsPage({ api, sessionKey }) {
    const result = useClubDirectory(api, sessionKey);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('ALL');
    const [onlyRecruiting, setOnlyRecruiting] = useState(false);
    const [page, setPage] = useState(1);
    const entries = result.data || [];
    const categories = useMemo(() => [...new Set(entries.map((club) => club.category).filter(Boolean))], [entries]);
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
        <div className="dx-public-content">
            <section id="all-clubs-directory">
                <div className="dx-page-heading">
                    <div>
                        <div className="dx-eyebrow">DANH MỤC CỘNG ĐỒNG</div>
                        <h1>Tất cả câu lạc bộ</h1>
                        <p>Tìm một cộng đồng phù hợp với sở thích và nhịp sống của bạn.</p>
                    </div>
                </div>
                <SectionHeading
                    title="Bạn muốn thử điều gì?"
                    description="Tìm theo lĩnh vực, tên câu lạc bộ hoặc trạng thái tuyển thành viên."
                >
                    <span className="dx-muted">{entries.length} CLB trong ClubHub</span>
                </SectionHeading>
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
                            <div className="dx-club-grid" data-directory-mode="all">
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
