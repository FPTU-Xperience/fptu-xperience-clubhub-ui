import { ArrowLeft, Award, CalendarDays, FileText, Flag, Gift, Home, ScanLine, Users, Wallet } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import './WorkspaceLeftRail.scss';

export const workspaceSections = [
    ['', 'Trang chủ', Home],
    ['activities', 'Hoạt động', CalendarDays],
    ['attendance', 'Điểm danh', ScanLine],
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

export default function WorkspaceLeftRail({ workspace, selections, base, manager, onClubChange }) {
    const availableSections = getWorkspaceSections(manager);
    return (
        <aside className="v2-workspace-left-rail" aria-label={`Điều hướng ${workspace.name}`}>
            <Link to="/v2" className="v2-workspace-left-rail-brand">
                <img src={`${import.meta.env.BASE_URL}fptux.png`} alt="FPTU Xperience" />
                <span>
                    clubhub<span>.</span>
                    <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                </span>
            </Link>
            <Link className="v2-workspace-left-rail-back" to="/v2/my-clubs">
                <ArrowLeft size={16} /> CLB của tôi
            </Link>
            <div className="v2-workspace-left-rail-club">
                <span>
                    {workspace.logoUrl ? (
                        <img src={workspace.logoUrl} alt="" />
                    ) : (
                        workspace.name.slice(0, 3).toUpperCase()
                    )}
                </span>
                <div>
                    <strong>{workspace.name}</strong>
                    <small>Không gian CLB</small>
                </div>
            </div>
            <span className="v2-workspace-left-rail-label">
                {manager ? 'VẬN HÀNH CÂU LẠC BỘ' : 'CỘNG ĐỒNG CỦA BẠN'}
            </span>
            <nav className="v2-workspace-left-rail-nav" aria-label="Menu CLB">
                {availableSections.map(([path, label, Icon]) => (
                    <NavLink key={path || 'home'} end={!path} to={path ? `${base}/${path}` : base}>
                        <Icon size={18} aria-hidden="true" />
                        <span>{label}</span>
                        {path === 'members' &&
                            manager &&
                            Number.isInteger(workspace.pendingApplications) &&
                            workspace.pendingApplications > 0 && <small>{workspace.pendingApplications}</small>}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
