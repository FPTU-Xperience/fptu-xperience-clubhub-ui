import { RotateCcw, X } from 'lucide-react';
import './DirectoryFilters.scss';

export default function ActiveDirectoryFilters({ filters, onReset }) {
    if (!filters.length) return null;

    return (
        <div className="v2-active-filters" role="group" aria-label="Bộ lọc đang áp dụng">
            {filters.map(({ key, label, onRemove }) => (
                <button key={key} type="button" className="v2-filter-chip" aria-label={`Bỏ bộ lọc ${label}`} onClick={onRemove}>
                    <span>{label}</span>
                    <X size={14} aria-hidden="true" />
                </button>
            ))}
            <button type="button" className="v2-filter-reset" aria-label="Xóa tất cả bộ lọc"
                title="Xóa tất cả bộ lọc" onClick={onReset}>
                <RotateCcw size={16} aria-hidden="true" />
            </button>
        </div>
    );
}
