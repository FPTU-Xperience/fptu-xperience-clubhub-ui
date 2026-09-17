import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DirectoryPagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <nav className="v2-directory-pagination" aria-label="Phân trang câu lạc bộ">
            <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Trang trước"
            >
                <ChevronLeft size={17} />
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                    type="button"
                    key={page}
                    className={page === currentPage ? 'active' : ''}
                    onClick={() => onPageChange(page)}
                    aria-label={`Trang ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                >
                    {page}
                </button>
            ))}
            <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Trang sau"
            >
                <ChevronRight size={17} />
            </button>
        </nav>
    );
}
