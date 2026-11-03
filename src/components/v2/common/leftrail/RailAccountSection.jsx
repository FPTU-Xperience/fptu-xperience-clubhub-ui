import NotificationPopover from './NotificationPopover';
import { getDisplayName } from '../../../../services/display-name';
import { Bell, ChevronDown, CircleHelp, LogOut, Moon, Settings, Sun, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../context/ThemeContext';
import { useHeaderNotifications } from '../../../../pages/v2/header-data';
import ProfileAvatar from '../../../../pages/v2/profile-page/ProfileAvatar';
import './LeftRail.scss';
export default function RailAccountSection({ user, profile, avatarUrl, onLogout, api, onStartGuide }) {
    const location = useLocation();
    const navigate = useNavigate();
    const accountMenuRef = useRef(null);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const sessionKey = user?.id || user?.email || null;
    const notifications = useHeaderNotifications(api, sessionKey);
    const displayName = getDisplayName(user, profile, 'Sinh viên FPTU');
    const secondaryIdentifier = user?.email || user?.studentCode || 'ClubHub';
    const avatar = user?.avatar || displayName.slice(0, 2).toUpperCase();

    useEffect(() => {
        notifications.close();
        setIsAccountMenuOpen(false);
    }, [location.pathname, location.search, notifications.close]);

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
        if (location.pathname.startsWith('/v2/demo')) await onLogout?.();
        else navigate('/logout');
    };

    return (
        <>
            <div className="v2-left-rail-bottom">
                <div className="v2-left-rail-account-menu" ref={accountMenuRef}>
                    <div className="v2-left-rail-account">
                        <Link
                            to="/v2/profile"
                            className="v2-left-rail-profile-link"
                            aria-label={`Mở hồ sơ cá nhân của ${displayName}`}
                        >
                            <span className="v2-left-rail-avatar" aria-hidden="true">
                                <ProfileAvatar
                                    profile={profile || { initials: avatar, avatarUrl: user?.avatarUrl }}
                                    imageUrl={avatarUrl}
                                />
                            </span>
                            <span className="v2-left-rail-account-copy">
                                <strong>{displayName}</strong>
                                <small>{secondaryIdentifier}</small>
                            </span>
                        </Link>
                        <button
                            className="v2-left-rail-notification-button"
                            type="button"
                            aria-label="Mở thông báo"
                            title="Thông báo"
                            aria-expanded={notifications.isOpen}
                            aria-controls="v2-rail-notification-popover"
                            onClick={() => {
                                setIsAccountMenuOpen(false);
                                if (notifications.isOpen) notifications.close();
                                else notifications.open();
                            }}
                        >
                            <Bell size={18} aria-hidden="true" />
                            {notifications.unreadCount > 0 && (
                                <span aria-label={`${notifications.unreadCount} thông báo chưa đọc`}>
                                    {notifications.unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            className="v2-left-rail-account-trigger"
                            type="button"
                            aria-label="Mở menu tài khoản"
                            aria-expanded={isAccountMenuOpen}
                            aria-controls="v2-rail-account-menu"
                            onClick={() => {
                                notifications.close();
                                setIsAccountMenuOpen((open) => !open);
                            }}
                        >
                            <ChevronDown size={15} aria-hidden="true" />
                        </button>
                    </div>
                    {isAccountMenuOpen && (
                        <div
                            id="v2-rail-account-menu"
                            className="v2-left-rail-account-popover"
                            role="menu"
                            aria-label="Tài khoản"
                        >
                            <Link to="/v2/profile" role="menuitem">
                                <UserRound size={16} /> Hồ sơ
                            </Link>
                            <Link to="/v2/profile?tab=settings" role="menuitem">
                                <Settings size={16} /> Cài đặt
                            </Link>
                            {onStartGuide && (
                                <button type="button" role="menuitem" onClick={() => {
                                    setIsAccountMenuOpen(false);
                                    onStartGuide();
                                }}>
                                    <CircleHelp size={16} /> Hướng dẫn sử dụng
                                </button>
                            )}
                            <button type="button" role="menuitem" onClick={toggleTheme}>
                                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />} Chế độ tối{' '}
                                <span>{theme === 'dark' ? 'Bật' : 'Tắt'}</span>
                            </button>
                            <button className="v2-left-rail-logout" type="button" role="menuitem" onClick={signOut}>
                                <LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {notifications.isOpen && (
                <NotificationPopover {...notifications} onClose={notifications.close} />
            )}
        </>
    );
}
