import { useEffect, useId, useRef, useState } from 'react';
import {
    ArrowLeft,
    ArrowRightLeft,
    Award,
    CalendarDays,
    Check,
    FileText,
    Flag,
    Gift,
    Home,
    Users,
    Wallet,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import CountBadge from '../../../components/v2/common/CountBadge';
import { clubMemberRoleLabel } from './tabs/members/club-member-roles';
import './WorkspaceLeftRail.scss';
import { useEntityMedia } from '../../../components/media/EntityMediaContext';

export const workspaceSections = [
    ['', 'Trang chủ', Home],
    ['activities', 'Hoạt động', CalendarDays],
    ['quests', 'Nhiệm vụ & đóng góp', Flag],
    ['members', 'Thành viên', Users],
    ['points', 'Điểm & thành tích', Award],
    ['gifts', 'Kho quà', Gift],
    ['reports', 'Báo cáo', FileText, 'manager'],
    ['finance', 'Tài chính', Wallet, 'manager'],
    ['club-page', 'Trang CLB', Home, 'manager'],
];

export function getWorkspaceSections(manager) {
    return workspaceSections.filter((section) => !section[3] || manager);
}

function ClubIdentity({ club: input }) {
    const club = useEntityMedia('club', input);
    return (
        <>
            <span className="v2-workspace-club-logo" aria-hidden="true">
                {club.logoUrl ? (
                    <img src={club.logoUrl} alt="" />
                ) : (
                    <span className="v2-workspace-club-code" title={club.clubCode}>
                        {club.clubCode}
                    </span>
                )}
            </span>
            <span className="v2-workspace-club-copy">
                <strong title={club.name}>{club.name}</strong>
                <small>
                    {clubMemberRoleLabel(club.displayRole || (club.role === 'MANAGER' ? 'CLUB_OWNER' : 'MEMBER'))}
                </small>
            </span>
        </>
    );
}

export default function WorkspaceLeftRail({ workspace, selections = [], base, manager, onClubChange }) {
    const availableSections = getWorkspaceSections(manager);
    const [switchOpen, setSwitchOpen] = useState(false);
    const switchRef = useRef(null);
    const triggerRef = useRef(null);
    const listId = useId();
    useEffect(() => {
        if (!switchOpen) return;
        const closeOutside = (event) => {
            if (!switchRef.current?.contains(event.target)) setSwitchOpen(false);
        };
        const closeEscape = (event) => {
            if (event.key === 'Escape') {
                setSwitchOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeEscape);
        };
    }, [switchOpen]);
    return (
        <aside className="v2-workspace-left-rail" aria-label={`Điều hướng ${workspace.name}`}>
            <Link to="/v2" className="v2-workspace-left-rail-brand">
                <img src={`${import.meta.env.BASE_URL}fptux.png`} alt="FPTU Xperience" />
                <span>
                    <small className="v2-workspace-left-rail-brand-eyebrow">FPTU Xperience</small>
                    clubhub<span>.</span>
                    <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                </span>
            </Link>
            <Link className="v2-workspace-left-rail-back" to="/v2/my-clubs">
                <ArrowLeft size={16} /> CLB của tôi
            </Link>
            <div
                className="v2-workspace-club-switcher"
                ref={switchRef}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setSwitchOpen(false);
                }}
            >
                <div className="v2-workspace-left-rail-club">
                    <ClubIdentity club={workspace} />
                    <button
                        type="button"
                        className="v2-workspace-club-switch-trigger"
                        ref={triggerRef}
                        aria-label="Chuyển câu lạc bộ"
                        title="Chuyển câu lạc bộ"
                        aria-expanded={switchOpen}
                        aria-controls={switchOpen ? listId : undefined}
                        onClick={() => setSwitchOpen((open) => !open)}
                    >
                        <ArrowRightLeft size={17} aria-hidden="true" />
                    </button>
                </div>
                {switchOpen && (
                    <div className="v2-workspace-club-dropdown" id={listId}>
                        <ul aria-label="Câu lạc bộ của tôi">
                            {selections.map((club) => (
                                <li key={club.clubId}>
                                    <button
                                        type="button"
                                        className="v2-workspace-club-option"
                                        aria-current={club.clubId === workspace.clubId ? 'true' : undefined}
                                        onClick={() => {
                                            setSwitchOpen(false);
                                            triggerRef.current?.focus();
                                            if (club.clubId !== workspace.clubId) onClubChange(club.clubCode);
                                        }}
                                    >
                                        <ClubIdentity club={club} />
                                        {club.clubId === workspace.clubId && <Check size={16} aria-hidden="true" />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
            <span className="v2-workspace-left-rail-label">
                {manager ? 'VẬN HÀNH CÂU LẠC BỘ' : 'CỘNG ĐỒNG CỦA BẠN'}
            </span>
            <nav className="v2-workspace-left-rail-nav" aria-label="Menu CLB">
                {availableSections.map(([path, label, Icon]) => (
                    <NavLink key={path || 'home'} end={!path} to={path ? `${base}/${path}` : base}>
                        <Icon size={18} aria-hidden="true" />
                        <span>{label}</span>
                        {path === 'activities' && (
                            <CountBadge count={workspace.ongoingActivityCount} label="hoạt động sắp và đang diễn ra" />
                        )}
                        {path === 'members' && manager && (
                            <CountBadge count={workspace.pendingApplications} label="đơn chờ duyệt" />
                        )}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
