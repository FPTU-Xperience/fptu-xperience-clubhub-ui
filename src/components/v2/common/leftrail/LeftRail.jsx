import { ArrowUpRight, ChevronRight, PinOff } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePinnedClubs } from '../../../../pages/v2/pinned-clubs';
import { affairsNavigation, getAdminAppUrl, isAffairsViewer } from '../../../../pages/v2/affairs-access';
import RailAccountSection from './RailAccountSection';
import useRailDropdown from './useRailDropdown';
import './LeftRail.scss';
const navigation = [
    ['/v2', 'Khám phá', true],
    ['/v2/clubs', 'Câu lạc bộ'],
    ['/v2/activities', 'Hoạt động'],
];

const personalNavigation = [
    ['/v2/my-clubs', 'Câu lạc bộ'],
    ['/v2/my-schedule', 'Lịch trình'],
    ['/v2/study-schedule', 'Lịch học'],
];

export default function LeftRail({ user, profile, avatarUrl, onLogout, api }) {
    const location = useLocation();
    const { pinnedClubs = [], togglePin } = usePinnedClubs() || {};
    const affairs = isAffairsViewer(user);
    const adminUrl = getAdminAppUrl({ override: import.meta.env.VITE_ADMIN_APP_URL, development: import.meta.env.DEV });
    const affairsMenu = useRailDropdown(true);
    const personalMenu = useRailDropdown(() =>
        personalNavigation.some(([path]) => location.pathname === path),
    );
    return (
        <aside className="v2-left-rail" aria-label="Điều hướng ClubHub">
            <Link to="/v2" className="v2-left-rail-brand">
                <img src={`${import.meta.env.BASE_URL}fptux.png`} alt="FPTU Xperience" />
                <span>
                    <small className="v2-left-rail-brand-eyebrow">FPTU Xperience</small>
                    clubhub<span className="v2-left-rail-brand-dot">.</span>
                    <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                </span>
            </Link>

            <p className="v2-left-rail-campus">FPTU Hồ Chí Minh</p>
            <nav className="v2-left-rail-nav" aria-label="Điều hướng chính">
                {navigation.map(([to, label, end]) => (
                    <NavLink key={to} to={to} end={end} className="v2-left-rail-nav-row">
                        <span className="v2-left-rail-nav-label">{label}</span>
                    </NavLink>
                ))}
                {affairs ? (
                    <div className="v2-left-rail-nav-group" ref={affairsMenu.containerRef} onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget) && window.matchMedia('(max-width: 768px)').matches) affairsMenu.setOpen(false);
                    }}>
                        <button
                            className="v2-left-rail-nav-row v2-left-rail-nav-group-trigger"
                            type="button"
                            ref={affairsMenu.triggerRef}
                            aria-expanded={affairsMenu.open}
                            aria-controls="v2-left-rail-affairs-nav"
                            onClick={() => affairsMenu.setOpen((open) => !open)}
                        >
                            <span className="v2-left-rail-nav-label">Công tác sinh viên</span>
                            <ChevronRight size={15} aria-hidden="true" />
                        </button>
                        {affairsMenu.open && (
                            <div id="v2-left-rail-affairs-nav" className="v2-left-rail-nav-group-items">
                                {affairsNavigation.map(([to, label]) =>
                                    to === '/v2/ctsv/admin' && adminUrl ? (
                                        <a key={to} href={adminUrl} target="_blank" rel="noopener noreferrer" onClick={() => {
                                            if (window.matchMedia('(max-width: 768px)').matches) affairsMenu.setOpen(false);
                                        }}>
                                            {label} <ArrowUpRight size={14} aria-hidden="true" />
                                        </a>
                                    ) : (
                                        <NavLink key={to} to={to}>
                                            {label}
                                        </NavLink>
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="v2-left-rail-nav-group" ref={personalMenu.containerRef} onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget) && window.matchMedia('(max-width: 768px)').matches) personalMenu.setOpen(false);
                    }}>
                        <button
                            className="v2-left-rail-nav-row v2-left-rail-nav-group-trigger"
                            type="button"
                            ref={personalMenu.triggerRef}
                            aria-expanded={personalMenu.open}
                            aria-controls="v2-left-rail-personal-nav"
                            onClick={() => personalMenu.setOpen((open) => !open)}
                        >
                            <span className="v2-left-rail-nav-label">Của tôi</span>
                            <ChevronRight size={15} aria-hidden="true" />
                        </button>
                        {personalMenu.open && (
                            <div id="v2-left-rail-personal-nav" className="v2-left-rail-nav-group-items">
                                {personalNavigation.map(([to, label]) => (
                                    <NavLink key={label} to={to}>
                                        {label}
                                    </NavLink>
                                ))}
                                {pinnedClubs.map((club) => (
                                    <div className="v2-left-rail-pinned-club" key={club.clubId}>
                                        <NavLink to={club.workspacePath} title={club.name}>
                                            <span className="v2-left-rail-club-name">{club.name}</span>
                                        </NavLink>
                                        <button
                                            type="button"
                                            className="v2-left-rail-unpin"
                                            aria-label={`Bỏ ghim ${club.name}`}
                                            title="Bỏ ghim"
                                            onClick={() => togglePin(club.clubId)}
                                        >
                                            <PinOff size={12} aria-hidden="true" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            <RailAccountSection user={user} profile={profile} avatarUrl={avatarUrl} onLogout={onLogout} api={api} />
        </aside>
    );
}
