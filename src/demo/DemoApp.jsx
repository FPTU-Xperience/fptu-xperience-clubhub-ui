import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bell, ChevronDown, RotateCcw, X, FlaskConical, Check, ArrowRight } from 'lucide-react';
import { DemoProvider, useDemo } from './DemoContext';
import { PEOPLE, clubById, displayPerson, membership } from './model';
import { Avatar, Empty, Modal, Toast } from './ui';
import { Discover, ClubDetail, MyClubs, PublicEvents } from './Discover';
import { Workspace, ClubHome } from './Workspace';
import { Activities, Attendance } from './Activities';
import { Members, Quests, Points, Gifts, Reports, Finance, ClubSettings } from './Community';
import Profile from './Profile';
import './demo.scss';

function Shell() {
    const { state, actorId, setActorId, reset, scenario, setScenario } = useDemo();
    const actor = displayPerson(state, actorId);
    const location = useLocation();
    const navigate = useNavigate();
    const [resetOpen, setResetOpen] = useState(false),
        [notifications, setNotifications] = useState(false);
    const workspace = location.pathname.startsWith('/demo/my-clubs/');
    useEffect(() => {
        window.scrollTo(0, 0);
        setNotifications(false);
    }, [location.pathname, actorId]);
    const notices = state.notices.filter(
        (n) => n.userId === actorId || membership(state, actorId, n.clubId)?.role === 'manager',
    );
    return (
        <div className="dx-app">
            <a className="dx-skip" href="#demo-main">
                Đến nội dung chính
            </a>
            <div className="dx-demo-bar">
                <div>
                    <FlaskConical size={14} />
                    <strong>UI LAB</strong>
                    <span>Dữ liệu minh họa · Không kết nối server</span>
                </div>
                <div className="dx-demo-controls">
                    <label>
                        Xem với tư cách
                        <select
                            aria-label="Nhân vật demo"
                            value={actorId}
                            onChange={(e) => {
                                setActorId(e.target.value);
                                setScenario('normal');
                                navigate('/demo/my-clubs');
                            }}
                        >
                            {PEOPLE.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    {workspace && (
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
                        Reset demo
                    </button>
                    <a href="/dashboard">
                        Hệ thống hiện tại <ArrowUpRight size={13} />
                    </a>
                </div>
            </div>
            <header className="dx-header">
                <Link className="dx-brand" to="/demo">
                    <img src="/fptux.png" alt="FPTU Xperience" />
                    <span>
                        clubhub<span className="dx-brand-dot">.</span>
                        <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                    </span>
                </Link>
                <nav aria-label="Điều hướng chính">
                    <NavLink to="/demo" end>
                        Khám phá
                    </NavLink>
                    <NavLink to="/demo/events">Hoạt động mở</NavLink>
                    <NavLink to="/demo/my-clubs">CLB của tôi</NavLink>
                </nav>
                <div className="dx-header-right">
                    <span className="dx-campus">FPTU Hồ Chí Minh</span>
                    <button
                        className="dx-icon-button dx-bell"
                        aria-label="Thông báo demo"
                        aria-expanded={notifications}
                        onClick={() => setNotifications(!notifications)}
                    >
                        <Bell size={19} />
                        {notices.length > 0 && <i />}
                    </button>
                    <Link className="dx-account" to="/demo/profile">
                        <Avatar person={actor} />
                        <span>
                            <strong>{actor.name.split(' ').slice(-2).join(' ')}</strong>
                            <small>{actor.role === 'ADMIN' ? 'Role khác · Demo' : 'Sinh viên FPTU'}</small>
                        </span>
                        <ChevronDown size={15} />
                    </Link>
                </div>
            </header>
            {notifications && (
                <div className="dx-notification-popover">
                    <h3>Cập nhật trong phiên demo</h3>
                    {notices.length ? (
                        notices.slice(0, 6).map((n) => (
                            <div key={n.id}>
                                <strong>{clubById(n.clubId)?.name}</strong>
                                <p>{n.message}</p>
                            </div>
                        ))
                    ) : (
                        <p>Chưa có thao tác mới. Cập nhật sẽ xuất hiện sau khi bạn tương tác với bản mock.</p>
                    )}
                    <button className="dx-text-link" onClick={() => setNotifications(false)}>
                        Đóng
                    </button>
                </div>
            )}
            {workspace ? (
                <Outlet />
            ) : (
                <main id="demo-main">
                    <Outlet />
                </main>
            )}
            {!workspace && (
                <footer className="dx-footer">
                    <Link className="dx-brand" to="/demo">
                        clubhub.
                    </Link>
                    <p>Một phần của hành trình FPTU Xperience.</p>
                    <span>DESKTOP PREVIEW · FALL 2026</span>
                </footer>
            )}
            <Toast />
            {resetOpen && (
                <Modal title="Khôi phục dữ liệu demo?" onClose={() => setResetOpen(false)}>
                    <p>
                        Các đơn tham gia, check-in, đóng góp, đổi quà và chỉnh sửa hồ sơ trong phiên này sẽ trở về dữ
                        liệu mẫu ban đầu. Dữ liệu server không bị ảnh hưởng.
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
                                navigate('/demo');
                            }}
                        >
                            Reset demo
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
export default function DemoApp() {
    return (
        <DemoProvider>
            <Routes>
                <Route element={<Shell />}>
                    <Route index element={<Discover />} />
                    <Route path="events" element={<PublicEvents />} />
                    <Route path="clubs/:clubId" element={<ClubDetail />} />
                    <Route path="my-clubs" element={<MyClubs />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="my-clubs/:clubId" element={<Workspace />}>
                        <Route index element={<ClubHome />} />
                        <Route path="activities" element={<Activities />} />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="members" element={<Members />} />
                        <Route path="quests" element={<Quests />} />
                        <Route path="points" element={<Points />} />
                        <Route path="gifts" element={<Gifts />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="finance" element={<Finance />} />
                        <Route path="settings" element={<ClubSettings />} />
                        <Route path="*" element={<Empty title="Trang không tồn tại" />} />
                    </Route>
                    <Route
                        path="*"
                        element={
                            <Empty title="Không tìm thấy trang">
                                <Link className="dx-button" to="/demo">
                                    Về khám phá
                                </Link>
                            </Empty>
                        }
                    />
                </Route>
            </Routes>
        </DemoProvider>
    );
}
