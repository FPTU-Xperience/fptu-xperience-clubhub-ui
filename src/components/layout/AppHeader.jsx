import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Bell, ChevronDown, RotateCcw, FlaskConical, LogIn, LogOut } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { PEOPLE, clubById, displayPerson, membership } from '../../core/model';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';

export function AppHeader({ sessionUser, onLogout = () => {}, isWorkspace = false }) {
    const { state, actorId, setActorId, reset, scenario, setScenario, basePath = '' } = useClubHub();

    const actor = displayPerson(state, actorId);
    const signedInPerson = {
        name: sessionUser?.name || sessionUser?.fullName || actor.name,
        initials: sessionUser?.avatar || actor.initials,
    };

    const navigate = useNavigate();
    const [resetOpen, setResetOpen] = useState(false);
    const [notifications, setNotifications] = useState(false);

    const notices = state.notices.filter(
        (n) => n.userId === actorId || membership(state, actorId, n.clubId)?.role === 'manager',
    );

    const homePath = basePath || '/';
    const eventsPath = `${basePath}/events`.replace(/^\/\//, '/');
    const myClubsPath = `${basePath}/my-clubs`.replace(/^\/\//, '/');
    const profilePath = `${basePath}/profile`.replace(/^\/\//, '/');

    const location = useLocation();
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true' || location.search.includes('demo=true');

    return (
        <>
            {isDemoMode && (
                <div className="dx-demo-bar">
                    <div>
                        <FlaskConical size={14} />
                        <strong>UI LAB (DEMO MODE)</strong>
                        <span>
                            {sessionUser
                                ? `Đã kết nối tài khoản: ${sessionUser.name || sessionUser.email}`
                                : 'Cổng thông tin Sinh viên & CTSV · FPTU Xperience'}
                        </span>
                    </div>
                    <div className="dx-demo-controls">
                        <label>
                            Xem với tư cách
                            <select
                                aria-label="Nhân vật trải nghiệm"
                                value={actorId}
                                onChange={(e) => {
                                    setActorId(e.target.value);
                                    setScenario('normal');
                                    navigate(myClubsPath);
                                }}
                            >
                                {PEOPLE.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {isWorkspace && (
                            <select
                                aria-label="Trạng thái demo"
                                value={scenario}
                                onChange={(e) => setScenario(e.target.value)}
                            >
                                <option value="normal">Đầy đủ dữ liệu</option>
                                <option value="empty">Màn hình rỗng</option>
                                <option value="loading">Đang tải</option>
                                <option value="error">Lỗi tải</option>
                            </select>
                        )}
                        <button onClick={() => setResetOpen(true)}>
                            <RotateCcw size={13} />
                            Khôi phục mẫu
                        </button>
                        {sessionUser && <button onClick={onLogout}>Đăng xuất</button>}
                    </div>
                </div>
            )}

            <header className="dx-header">
                <Link className="dx-brand" to={homePath}>
                    <img src="/fptux.png" alt="FPTU Xperience" />
                    <span>
                        clubhub<span className="dx-brand-dot">.</span>
                        <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                    </span>
                </Link>
                <nav aria-label="Điều hướng chính">
                    <NavLink to={homePath} end>
                        Khám phá
                    </NavLink>
                    <NavLink to={eventsPath}>Hoạt động mở</NavLink>
                    <NavLink to={myClubsPath}>CLB của tôi</NavLink>
                </nav>
                <div className="dx-header-right">
                    <span className="dx-campus">FPTU Hồ Chí Minh</span>
                    <button
                        className="dx-icon-button dx-bell"
                        aria-label="Thông báo"
                        aria-expanded={notifications}
                        onClick={() => setNotifications(!notifications)}
                    >
                        <Bell size={19} />
                        {notices.length > 0 && <i />}
                    </button>
                    {sessionUser ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Link className="dx-account" to={profilePath}>
                                <Avatar person={signedInPerson} />
                                <span>
                                    <strong>{signedInPerson.name.split(' ').slice(-2).join(' ')}</strong>
                                    <small>
                                        {sessionUser?.email ||
                                            (actor.role === 'ADMIN' ? 'Cán bộ CTSV / Quản lý' : 'Sinh viên FPTU')}
                                    </small>
                                </span>
                                <ChevronDown size={15} />
                            </Link>
                            <button
                                className="dx-icon-button"
                                title="Đăng xuất"
                                onClick={onLogout}
                                style={{ color: '#7a8577' }}
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.45rem 1rem',
                                fontSize: '0.85rem',
                                borderRadius: '999px',
                                background: '#d45b2e',
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                        >
                            <LogIn size={15} /> Đăng nhập
                        </Link>
                    )}
                </div>
            </header>

            {notifications && (
                <div className="dx-notification-popover">
                    <h3>Thông báo mới</h3>
                    {notices.length ? (
                        notices.slice(0, 6).map((n) => (
                            <div key={n.id}>
                                <strong>{clubById(n.clubId)?.name}</strong>
                                <p>{n.message}</p>
                            </div>
                        ))
                    ) : (
                        <p>Chưa có thông báo mới trong phiên hoạt động này.</p>
                    )}
                    <button className="dx-text-link" onClick={() => setNotifications(false)}>
                        Đóng
                    </button>
                </div>
            )}

            {resetOpen && (
                <Modal title="Khôi phục dữ liệu ban đầu?" onClose={() => setResetOpen(false)}>
                    <p>
                        Các đơn tham gia, check-in, đóng góp, đổi quà và chỉnh sửa hồ sơ trong phiên này sẽ trở về dữ
                        liệu mẫu ban đầu.
                    </p>
                    <div className="dx-form-footer">
                        <button className="dx-button" onClick={() => setResetOpen(false)}>
                            Giữ lại
                        </button>
                        <button
                            className="dx-button primary"
                            onClick={() => {
                                reset();
                                setResetOpen(false);
                                navigate(homePath);
                            }}
                        >
                            Khôi phục
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default AppHeader;
