import { ChevronDown, LogOut } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';

export default function DiscoverShell({ user, onLogout }) {
    return (
        <div className="dx-app v2-discover-app">
            <a className="v2-skip-link" href="#v2-main">
                Đến nội dung chính
            </a>
            <header className="dx-header">
                <Link to="/v2" className="dx-brand">
                    <img src="/fptux.png" alt="FPTU Xperience" />
                    <span>
                        clubhub<span className="dx-brand-dot">.</span>
                        <small>YOUR CAMPUS, YOUR COMMUNITY</small>
                    </span>
                </Link>
                <div className="dx-header-right">
                    <span className="dx-campus">FPTU Hồ Chí Minh</span>
                    <div className="dx-account">
                        <span className="dx-avatar">{user?.avatar || 'SV'}</span>
                        <span>
                            <strong>{user?.name || 'Sinh viên FPTU'}</strong>
                            <small>{user?.email || 'ClubHub'}</small>
                        </span>
                        <ChevronDown size={15} />
                    </div>
                    <button className="dx-icon-button" type="button" onClick={onLogout} aria-label="Đăng xuất">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>
            <main id="v2-main" className="v2-main">
                <Outlet />
            </main>
        </div>
    );
}
