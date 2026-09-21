import { ArrowRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const dateLabel = (value) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function MyClubCard({ club }) {
    const manager = club.role === 'MANAGER';
    return <article className="v2-my-club-card">
        <div className="v2-my-club-art" aria-hidden="true">
            <span className="v2-my-club-art-meta">FPTU COMMUNITY<br />EST. 2017</span>
            <span className="v2-my-club-art-arrow">↗</span>
            {club.logoUrl ? <img src={club.logoUrl} alt="" /> : <strong>{club.name.slice(0, 3).toUpperCase()}</strong>}
            <em>{club.name} · Grow together</em>
        </div>
        <div className="v2-my-club-body">
            <div className="v2-my-club-top"><span className="v2-my-club-mark" aria-hidden="true">{club.name.slice(0, 3).toUpperCase()}</span><span className={`v2-my-club-role ${manager ? 'is-manager' : ''}`}>{manager ? 'Chủ nhiệm' : 'Thành viên'}</span></div>
            <h2>{club.name}</h2>
            <p>{manager ? (club.pendingApplications === null ? 'Đơn tham gia đang cập nhật' : `${club.pendingApplications} đơn tham gia đang chờ bạn xem xét`) : 'Hôm nay bạn muốn đóng góp điều gì?'}</p>
            <div className="v2-my-club-activity"><CalendarDays size={18} /><div><small>HOẠT ĐỘNG SẮP TỚI</small><strong>{club.upcomingActivity?.title || 'Lịch hoạt động đang cập nhật'}</strong>{club.upcomingActivity && <span>{dateLabel(club.upcomingActivity.startTime)}{club.upcomingActivity.location ? ` · ${club.upcomingActivity.location}` : ''}</span>}</div></div>
            <Link to={club.workspacePath} className="v2-button v2-button--primary">Vào không gian CLB <ArrowRight size={17} /></Link>
        </div>
    </article>;
}
