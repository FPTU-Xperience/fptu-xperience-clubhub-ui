import { Bell, ChevronDown, ChevronRight, LogOut, Moon, Settings, Sun, UserRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { useHeaderNotifications } from '../../../../pages/v2/header-data';
import './LeftRail.scss';

function NotificationContent({ status, data, retry }) {
    if (status === 'loading') return <p className="v2-rail-notification-state">Đang tải thông báo...</p>;
    if (status === 'empty') return <p className="v2-rail-notification-state">Bạn chưa có thông báo mới.</p>;
    if (status === 'unavailable') return <p className="v2-rail-notification-state">Thông báo hiện chưa khả dụng.</p>;
    if (status === 'forbidden') return <p className="v2-rail-notification-state">Bạn không có quyền xem thông báo này.</p>;
    if (status === 'unauthorized') return <p className="v2-rail-notification-state">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</p>;
    if (status === 'error') {
        return (
            <div className="v2-rail-notification-state">
                <p>Không thể tải thông báo. Vui lòng thử lại.</p>
                <button className="v2-rail-notification-retry" type="button" onClick={retry}>Thử lại</button>
            </div>
        );
    }
    return (
        <ul className="v2-rail-notification-list" aria-label="Danh sách thông báo">
            {data.map((notification) => (
                <li key={notification.id} className={notification.isRead ? 'is-read' : 'is-unread'}>
                    <strong>{notification.title}</strong>
                    <span>{notification.message}</span>
                    <time dateTime={notification.createdAt}>{notification.createdAt}</time>
                </li>
            ))}
        </ul>
    );
}

const navigation = [
    ['/v2', 'Khám phá', true],
    ['/v2/clubs', 'Câu lạc bộ'],
    ['/v2/activities', 'Hoạt động'],
];

const personalNavigation = [
    ['/v2/my-clubs', 'Câu lạc bộ'],
    ['/v2/my-schedule', 'Lịch trình'],
];

export default function LeftRail({ user, onLogout, api }) {
    const location = useLocation();
    const accountMenuRef = useRef(null);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const [isPersonalNavOpen, setIsPersonalNavOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const sessionKey = user?.id || user?.email || null;
    const notifications = useHeaderNotifications(api, sessionKey);
    const displayName = user?.name || user?.fullName || 'Sinh viên FPTU';
    const secondaryIdentifier = user?.email || user?.studentCode || 'ClubHub';
    const avatar = user?.avatar || displayName.slice(0, 2).toUpperCase();

    useEffect(() => {
        notifications.close();
        setIsAccountMenuOpen(false);
    }, [location.pathname, notifications.close]);

    useEffect(() => {
        if (!notifications.isOpen && !isAccountMenuOpen) return undefined;
        const dismissOnEscape = (event) => {
            if (event.key === 'Escape') {
                notifications.close();
                setIsAccountMenuOpen(false);
            }
        };
        window.addEventListener('keydown', dismissOnEscape);
        return () => window.removeEventListener('keydown', dismissOnEscape);
    }, [isAccountMenuOpen, notifications.isOpen, notifications.close]);

    useEffect(() => {
        if (!isAccountMenuOpen) return undefined;
        const closeOnOutsidePress = (event) => {
            if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false);
        };
        document.addEventListener('pointerdown', closeOnOutsidePress);
        return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
    }, [isAccountMenuOpen]);

    const signOut = async () => {
        notifications.close();
        await onLogout?.();
    };

    return (
        <aside className="v2-left-rail" aria-label="Điều hướng ClubHub">
            <Link to="/v2" className="v2-left-rail-brand">
                <img src={`${import.meta.env.BASE_URL}fptux.png`} alt="FPTU Xperience" />
                <span>clubhub<span className="v2-left-rail-brand-dot">.</span><small>YOUR CAMPUS, YOUR COMMUNITY</small></span>
            </Link>

            <p className="v2-left-rail-campus">FPTU Hồ Chí Minh</p>
            <nav className="v2-left-rail-nav" aria-label="Điều hướng chính">
                {navigation.map(([to, label, end]) => (
                    <NavLink key={to} to={to} end={end}>{label}</NavLink>
                ))}
                <div className="v2-left-rail-nav-group">
                    <button
                        className="v2-left-rail-nav-group-trigger"
                        type="button"
                        aria-expanded={isPersonalNavOpen}
                        aria-controls="v2-left-rail-personal-nav"
                        onClick={() => setIsPersonalNavOpen((open) => !open)}
                    >
                        Của tôi <ChevronRight size={15} aria-hidden="true" />
                    </button>
                    {isPersonalNavOpen && (
                        <div id="v2-left-rail-personal-nav" className="v2-left-rail-nav-group-items">
                            {personalNavigation.map(([to, label]) => (
                                <NavLink key={label} to={to}>{label}</NavLink>
                            ))}
                        </div>
                    )}
                </div>
            </nav>

            <div className="v2-left-rail-bottom">
                <button
                    className="v2-left-rail-notification-button"
                    type="button"
                    aria-label="Mở thông báo"
                    aria-expanded={notifications.isOpen}
                    aria-controls="v2-rail-notification-popover"
                    onClick={notifications.isOpen ? notifications.close : notifications.open}
                >
                    <Bell size={18} aria-hidden="true" /> Thông báo
                    {notifications.unreadCount > 0 && <span aria-label={`${notifications.unreadCount} thông báo chưa đọc`}>{notifications.unreadCount}</span>}
                </button>
                <div className="v2-left-rail-account-menu" ref={accountMenuRef}>
                    <button className="v2-left-rail-account" type="button" aria-label="Mở menu tài khoản" aria-expanded={isAccountMenuOpen} aria-controls="v2-rail-account-menu" onClick={() => setIsAccountMenuOpen((open) => !open)}>
                        <span className="v2-left-rail-avatar" aria-hidden="true">{avatar}</span>
                        <span><strong>{displayName}</strong><small>{secondaryIdentifier}</small></span>
                        <ChevronDown size={15} aria-hidden="true" />
                    </button>
                    {isAccountMenuOpen && (
                        <div id="v2-rail-account-menu" className="v2-left-rail-account-popover" role="menu" aria-label="Tài khoản">
                            <Link to="/v2/profile" role="menuitem"><UserRound size={16} /> Hồ sơ</Link>
                            <Link to="/v2/profile?tab=settings" role="menuitem"><Settings size={16} /> Cài đặt</Link>
                            <button type="button" role="menuitem" onClick={toggleTheme}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Chế độ tối <span>{theme === 'dark' ? 'Bật' : 'Tắt'}</span></button>
                            <button className="v2-left-rail-logout" type="button" role="menuitem" onClick={signOut}><LogOut size={16} /> Đăng xuất</button>
                        </div>
                    )}
                </div>
            </div>

            {notifications.isOpen && (
                <section id="v2-rail-notification-popover" className="v2-rail-notification-popover" role="dialog" aria-label="Thông báo">
                    <div className="v2-rail-notification-heading"><h2>Thông báo</h2><button type="button" onClick={notifications.close} aria-label="Đóng thông báo"><X size={17} /></button></div>
                    <NotificationContent {...notifications} />
                </section>
            )}
        </aside>
    );
}
