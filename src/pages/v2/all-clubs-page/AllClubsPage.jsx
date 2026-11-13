import { useListQuery } from '../use-list-query';
import { useMemo } from 'react';
import ClubCard from '../../../components/v2/club-card/ClubCard';
import DirectoryFilterSelect from '../../../components/v2/directory-filter/DirectoryFilterSelect';
import ActiveDirectoryFilters from '../../../components/v2/directory-filter/ActiveDirectoryFilters';
import DirectoryPagination from '../../../components/v2/directory-pagination/DirectoryPagination';
import { EmptyState, SearchField } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { DiscoveryTagFilter } from '../../../components/v2/DiscoveryTagFields';
import { discoveryTagLabel } from '../../../services/discovery-tags';
import { prioritizeRecommendedItems } from '../../../services/student-read-api';
import {
    filterClubDirectory,
    orderDirectoryCategories,
    paginateClubDirectory,
    useClubDirectory,
    useRecommendedClubIds,
} from '../discover-data';

const PAGE_SIZE = 12;
const defaultFilters = { query: '', category: 'ALL', onlyRecruiting: false, tag: '' };

export default function AllClubsPage({ api, sessionKey }) {
    const [list, setList] = useListQuery({ ...defaultFilters, page: 1 });
    const { query, onlyRecruiting, page } = list;
    const result = useClubDirectory(api, sessionKey);
    const recommendations = useRecommendedClubIds(api, sessionKey);
    const entries = result.data || [];
    const legacyCategory = list.tag.startsWith('club-category:');
    const legacyClub = legacyCategory && entries.find((club) =>
        club.discoveryTags.some((item) => item.id === list.tag));
    const category = list.category === 'ALL' && legacyClub ? legacyClub.category || 'ALL' : list.category;
    const tag = legacyCategory && (legacyClub || list.category !== 'ALL') ? '' : list.tag;
    const categories = useMemo(
        () => orderDirectoryCategories([...new Set(entries.map((club) => club.category).filter(Boolean))]),
        [entries],
    );
    const recruitmentAvailable = entries.length > 0 && entries.every((club) => club.hasRecruitmentStatus);
    const clubs = useMemo(
        () => prioritizeRecommendedItems(
            filterClubDirectory(entries, { query, category, recruitingOnly: onlyRecruiting, tag }),
            recommendations.data,
        ),
        [entries, recommendations.data, query, category, onlyRecruiting, tag],
    );
    const pagination = useMemo(() => paginateClubDirectory(clubs, page, PAGE_SIZE), [clubs, page]);
    const activeFilters = [
        query && { key: 'query', label: `Tìm kiếm: ${query}`, onRemove: () => setList('query', '') },
        category !== 'ALL' && { key: 'category', label: category,
            onRemove: () => setList({ category: 'ALL', tag: legacyCategory ? '' : tag }) },
        tag && { key: 'tag', label: discoveryTagLabel(entries, tag), onRemove: () => setList('tag', '') },
        onlyRecruiting && { key: 'onlyRecruiting', label: 'Đang tuyển thành viên', onRemove: () => setList('onlyRecruiting', false) },
    ].filter(Boolean);

    const changePage = (nextPage) => {
        setList('page', nextPage);
        document.getElementById('all-clubs-directory')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="v2-public-content">
            <section id="all-clubs-directory">
                <header className="v2-page-heading">
                    <h1 className="v2-page-heading-title">Tất cả câu lạc bộ</h1>
                    <p>Tìm một cộng đồng phù hợp với sở thích và nhịp sống của bạn.</p>
                </header>
                <PageState status={result.status} onRetry={result.retry}>
                    <div className="v2-filter-bar v2-directory-toolbar">
                        <SearchField value={query} onChange={(value) => setList('query', value)} placeholder="Tìm câu lạc bộ..." />
                        <DirectoryFilterSelect label="Lĩnh vực CLB" value={category}
                            options={[[ 'ALL', 'Tất cả lĩnh vực'], ...categories.map((item) => [item, item])]}
                            onChange={(value) => setList({ category: value, tag: legacyCategory ? '' : tag })} />
                        <DiscoveryTagFilter items={entries} value={tag}
                            onChange={(value) => setList({ category, tag: value })} />
                        <label
                            className={`v2-checkbox ${recruitmentAvailable ? '' : 'is-disabled'}`}
                            title={recruitmentAvailable ? undefined : 'Dữ liệu tuyển thành viên đang được cập nhật'}
                        >
                            <input type="checkbox" checked={onlyRecruiting} disabled={!recruitmentAvailable}
                                onChange={(event) => setList('onlyRecruiting', event.target.checked)} />
                            Đang tuyển thành viên
                        </label>
                    </div>
                    <ActiveDirectoryFilters filters={activeFilters} onReset={() => setList(defaultFilters)} />
                    <p className="v2-directory-label" role="status">{clubs.length} câu lạc bộ phù hợp</p>
                    {clubs.length ? (
                        <>
                            <div className="v2-club-grid" data-directory-mode="all">
                                {pagination.items.map((club) => (
                                    <ClubCard key={club.id} club={club} interactionApi={api} />
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
