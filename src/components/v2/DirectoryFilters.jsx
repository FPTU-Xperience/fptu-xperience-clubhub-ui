import { SlidersHorizontal } from 'lucide-react';
import { SearchField } from './DiscoveryLayout';

export default function DirectoryFilters({
    query,
    category,
    onlyRecruiting,
    categories,
    resultCount,
    resultLabel = 'cộng đồng dành cho bạn',
    showRecruiting = true,
    recruitmentAvailable,
    onQueryChange,
    onCategoryChange,
    onRecruitingChange,
}) {
    return (
        <>
            <div className="dx-filter-bar">
                <div className="dx-tabs" role="group" aria-label="Lĩnh vực CLB">
                    <button
                        type="button"
                        className={category === 'ALL' ? 'active' : ''}
                        onClick={() => onCategoryChange('ALL')}
                        aria-pressed={category === 'ALL'}
                    >
                        Tất cả
                    </button>
                    {categories.map((item) => (
                        <button
                            type="button"
                            key={item}
                            className={category === item ? 'active' : ''}
                            onClick={() => onCategoryChange(item)}
                            aria-pressed={category === item}
                        >
                            {item}
                        </button>
                    ))}
                </div>
                <SearchField value={query} onChange={onQueryChange} placeholder="Tìm câu lạc bộ..." />
            </div>
            <div className="dx-directory-label">
                <span>
                    {resultCount} {resultLabel}
                </span>
                {showRecruiting && (
                    <label
                        className={`dx-checkbox ${!recruitmentAvailable ? 'is-disabled' : ''}`}
                        title={!recruitmentAvailable ? 'Dữ liệu tuyển thành viên đang được cập nhật' : ''}
                    >
                        <input
                            type="checkbox"
                            checked={onlyRecruiting}
                            disabled={!recruitmentAvailable}
                            onChange={(event) => onRecruitingChange(event.target.checked)}
                        />
                        <SlidersHorizontal size={15} /> Đang tuyển thành viên
                    </label>
                )}
            </div>
        </>
    );
}
