import { ChevronRight, PinOff } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { usePinnedClubs } from '../../../../pages/v2/pinned-clubs';
import RailAccountSection from './RailAccountSection';
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
    const [isPersonalNavOpen, setIsPersonalNavOpen] = useState(() =>
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
                <div className="v2-left-rail-nav-group">
                    <button
                        className="v2-left-rail-nav-row v2-left-rail-nav-group-trigger"
                        type="button"
                        aria-expanded={isPersonalNavOpen}
                        aria-controls="v2-left-rail-personal-nav"
                        onClick={() => setIsPersonalNavOpen((open) => !open)}
                    >
                        <span className="v2-left-rail-nav-label">Của tôi</span>
                        <ChevronRight size={15} aria-hidden="true" />
                    </button>
                    {isPersonalNavOpen && (
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
            </nav>

            <RailAccountSection user={user} profile={profile} avatarUrl={avatarUrl} onLogout={onLogout} api={api} />
        </aside>
    );
}
