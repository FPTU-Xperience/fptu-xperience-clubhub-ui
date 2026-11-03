import { Bell, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import './NotificationPopover.scss';

export default function NotificationPopover({ status, data = [], retry, onClose }) {
    const closeRef = useRef(null);
    useEffect(() => {
        const previous = document.activeElement;
        closeRef.current?.focus();
        return () => { if (previous?.isConnected) previous.focus(); };
    }, []);
    const loading = status === 'loading';
    const messages = {
        empty: 'Bạn chưa có thông báo mới.',
        unavailable: 'Thông báo hiện chưa khả dụng.',
        forbidden: 'Bạn không có quyền xem thông báo này.',
        unauthorized: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        error: 'Không thể tải thông báo. Vui lòng thử lại.',
    };
    return (
        <section id="v2-rail-notification-popover" className="v2-rail-notification-popover v2-notice-panel"
            role="dialog" aria-labelledby="v2-notice-title">
            <header className="v2-notice-heading">
                <div className="v2-notice-title"><Bell size={19} aria-hidden="true" /><h2 id="v2-notice-title">Thông báo</h2></div>
                <button ref={closeRef} className="v2-notice-close" type="button" onClick={onClose} aria-label="Đóng thông báo"><X size={18} /></button>
            </header>
            <div className="v2-notice-toolbar">
                <p>6 thông báo gần nhất</p>
                <button className="v2-notice-refresh" type="button" disabled={loading} onClick={retry}>
                    <RefreshCw size={14} aria-hidden="true" /><span>{loading ? 'Đang tải…' : 'Làm mới'}</span>
                </button>
            </div>
            <div className="v2-notice-body" aria-busy={loading} tabIndex={0} aria-label="Nội dung thông báo">
                {loading ? <div className="v2-notice-state" role="status">
                    <span className="v2-notice-spinner" aria-hidden="true" /><p>Đang tải thông báo…</p>
                </div> : messages[status] ? <div className="v2-notice-state" role="status">
                    <Bell size={28} aria-hidden="true" /><p>{messages[status]}</p>
                    {status === 'error' && <button className="v2-notice-refresh" type="button" onClick={retry}><RefreshCw size={14} aria-hidden="true" />Thử lại</button>}
                </div> : <ul className="v2-notice-list" aria-label="Danh sách thông báo">
                    {data.map(notification => <li key={notification.id} className={notification.isRead ? 'is-read' : 'is-unread'}>
                        <div className="v2-notice-card-heading"><strong>{notification.title}</strong>
                            {!notification.isRead && <span className="v2-notice-unread-dot" aria-label="Chưa đọc" />}
                        </div>
                        <p>{notification.message}</p>
                        <div className="v2-notice-card-footer">
                            <time dateTime={notification.createdAt}>{Number.isFinite(Date.parse(notification.createdAt))
                                ? new Date(notification.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }) : 'Chưa rõ thời gian'}</time>
                            <span>{notification.isRead ? 'Đã đọc' : 'Chưa đọc'}</span>
                        </div>
                    </li>)}
                </ul>}
            </div>
        </section>
    );
}
