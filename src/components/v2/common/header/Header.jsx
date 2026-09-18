import { Bell, ChevronDown, LogOut, Moon, Settings, Sun, UserRound, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { useHeaderNotifications } from '../../../../pages/v2/header-data';
import './Header.scss';

function NotificationContent({ status, data, retry }) {
    if (status === 'loading') return <p className="v2-notification-state">Đang tải thông báo...</p>;
    if (status === 'empty') return <p className="v2-notification-state">Bạn chưa có thông báo mới.</p>;
    if (status === 'unavailable') return <p className="v2-notification-state">Thông báo hiện chưa khả dụng.</p>;
    if (status === 'forbidden') return <p className="v2-notification-state">Bạn không có quyền xem thông báo này.</p>;
    if (status === 'unauthorized')
        return <p className="v2-notification-state">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</p>;
    if (status === 'error') {
        return (
            <div className="v2-notification-state">
                <p>Không thể tải thông báo. Vui lòng thử lại.</p>
                <button className="v2-notification-retry" type="button" onClick={retry}>
                    Thử lại
                </button>
            </div>
        );
    }
    return (
        <ul className="v2-notification-list" aria-label="Danh sách thông báo">
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

export default function ProductionHeader({ user, onLogout, api }) {
    const location = useLocation();
    const primaryNavRef = useRef(null);
    const primaryNavLinkRefs = useRef([]);
    const accountMenuRef = useRef(null);
    const [navIndicator, setNavIndicator] = useState(null);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
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

    useLayoutEffect(() => {
        const updateIndicator = () => {
            const nav = primaryNavRef.current;
            const activeLink = primaryNavLinkRefs.current.find((link) => link?.classList.contains('active'));
            if (!nav || !activeLink) return;

            setNavIndicator({
                offset: activeLink.offsetLeft - 6,
                width: activeLink.offsetWidth + 12,
            });
        };

        updateIndicator();
        const observer = new ResizeObserver(updateIndicator);
        if (primaryNavRef.current) observer.observe(primaryNavRef.current);
        window.addEventListener('resize', updateIndicator);
        return () => {
            observer.disconnect();
            window.removeEventListener('resize', updateIndicator);
        };
    }, [location.pathname]);

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
        <header className="v2-header">
            <Link to="/v2" className="v2-header-brand">
                <img src="/fptux.png" alt="FPTU Xperience" />
                <span>
                    clubhub<span className="v2-header-brand-dot">.</span>
                    <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                </span>
            </Link>

            <nav className="v2-primary-nav" aria-label="Điều hướng chính" ref={primaryNavRef}>
                <NavLink to="/v2" end ref={(link) => (primaryNavLinkRefs.current[0] = link)}>
                    Khám phá
                </NavLink>
                <NavLink to="/v2/clubs" ref={(link) => (primaryNavLinkRefs.current[1] = link)}>
                    Câu lạc bộ
                </NavLink>
                <NavLink to="/v2/activities" ref={(link) => (primaryNavLinkRefs.current[2] = link)}>
                    Hoạt động mở
                </NavLink>
                <NavLink to="/v2/my-clubs" ref={(link) => (primaryNavLinkRefs.current[3] = link)}>
                    CLB của tôi
                </NavLink>
                <span
                    aria-hidden="true"
                    className="v2-primary-nav-indicator"
                    style={
                        navIndicator
                            ? { transform: `translateX(${navIndicator.offset}px)`, width: `${navIndicator.width}px` }
                            : undefined
                    }
                />
            </nav>

            <div className="v2-header-actions">
                <span className="v2-header-campus">FPTU Hồ Chí Minh</span>
                <button
                    className="v2-header-icon-button v2-header-bell"
                    type="button"
                    aria-label="Mở thông báo"
                    aria-expanded={notifications.isOpen}
                    aria-controls="v2-notification-popover"
                    onClick={notifications.isOpen ? notifications.close : notifications.open}
                >
                    <Bell size={19} aria-hidden="true" />
                    {notifications.unreadCount > 0 && (
                        <span
                            className="v2-header-unread-indicator"
                            aria-label={`${notifications.unreadCount} thông báo chưa đọc`}
                        />
                    )}
                </button>
                <div className="v2-header-account-menu" ref={accountMenuRef}>
                    <button
                        className="v2-header-account v2-header-account-trigger"
                        type="button"
                        aria-label="Mở menu tài khoản"
                        aria-expanded={isAccountMenuOpen}
                        aria-controls="v2-account-menu"
                        onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
                    >
                        <span className="v2-header-avatar" aria-hidden="true">
                            {avatar}
                        </span>
                        <span>
                            <strong>{displayName}</strong>
                            <small>{secondaryIdentifier}</small>
                        </span>
                        <ChevronDown size={15} aria-hidden="true" />
                    </button>
                    {isAccountMenuOpen && (
                        <div id="v2-account-menu" className="v2-account-menu" role="menu" aria-label="Tài khoản">
                            <Link to="/v2/profile" role="menuitem">
                                <UserRound size={16} aria-hidden="true" /> Hồ sơ
                            </Link>
                            <Link to="/v2/profile?tab=settings" role="menuitem">
                                <Settings size={16} aria-hidden="true" /> Cài đặt
                            </Link>
                            <button type="button" role="menuitem" onClick={toggleTheme}>
                                {theme === 'dark' ? (
                                    <Sun size={16} aria-hidden="true" />
                                ) : (
                                    <Moon size={16} aria-hidden="true" />
                                )}
                                Chế độ tối
                                <span className="v2-account-menu-state">{theme === 'dark' ? 'Bật' : 'Tắt'}</span>
                            </button>
                            <button className="v2-account-menu-logout" type="button" role="menuitem" onClick={signOut}>
                                <LogOut size={16} aria-hidden="true" /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {notifications.isOpen && (
                <section
                    id="v2-notification-popover"
                    className="v2-notification-popover"
                    role="dialog"
                    aria-label="Thông báo"
                >
                    <div className="v2-notification-heading">
                        <h2>Thông báo</h2>
                        <button type="button" onClick={notifications.close} aria-label="Đóng thông báo">
                            <X size={17} aria-hidden="true" />
                        </button>
                    </div>
                    <NotificationContent {...notifications} />
                </section>
            )}
        </header>
    );
}
