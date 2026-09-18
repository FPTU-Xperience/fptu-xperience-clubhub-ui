import { AlertTriangle, LoaderCircle, LockKeyhole, SearchX } from 'lucide-react';
import './PageState.scss';

export default function PageState({ status, title, description, onRetry, children }) {
    if (status === 'populated') return children;
    const config = {
        loading: [
            LoaderCircle,
            title || 'Đang tải dữ liệu...',
            description || 'ClubHub đang chuẩn bị nội dung cho bạn.',
        ],
        empty: [
            SearchX,
            title || 'Chưa có nội dung phù hợp',
            description || 'Hãy thử thay đổi bộ lọc hoặc quay lại sau.',
        ],
        forbidden: [
            LockKeyhole,
            title || 'Bạn không có quyền xem nội dung này',
            description || 'Quyền truy cập hiện tại không cho phép mở dữ liệu này.',
        ],
        unauthorized: [
            LockKeyhole,
            title || 'Phiên đăng nhập đã hết hạn',
            description || 'Vui lòng đăng nhập lại để tiếp tục.',
        ],
        'not-found': [
            SearchX,
            title || 'Không tìm thấy câu lạc bộ',
            description || 'Câu lạc bộ không tồn tại hoặc không còn khả dụng.',
        ],
        error: [
            AlertTriangle,
            title || 'Không thể tải dữ liệu',
            description || 'Đã có lỗi kết nối. Bạn có thể thử lại.',
        ],
    };
    const [Icon, heading, copy] = config[status] || config.error;
    return (
        <section className={`v2-page-state is-${status}`} role={status === 'error' ? 'alert' : 'status'}>
            <Icon className={status === 'loading' ? 'is-spinning' : ''} aria-hidden="true" />
            <h2>{heading}</h2>
            <p>{copy}</p>
            {onRetry && status === 'error' && (
                <button className="v2-button" type="button" onClick={onRetry}>
                    Thử lại
                </button>
            )}
        </section>
    );
}
