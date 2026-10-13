import { ArrowRight, CalendarDays, Pin, PinOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import ClubCardMedia, { ClubCardLogo } from '../club-card/ClubCardMedia';
import { useEntityMedia } from '../../media/EntityMediaContext';

const dateLabel = (value) =>
    new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function MyClubCard({ club: input, pinned = false, onTogglePin }) {
    const club = useEntityMedia('club', input);
    const manager = club.role === 'MANAGER';
    return (
        <article className="v2-my-club-card">
            <ClubCardMedia club={club} showLogo={false} />
            <div className="v2-my-club-body">
                <header className="v2-my-club-identity">
                    <ClubCardLogo club={club} />
                    <div className="v2-my-club-identity-copy">
                        <span className={`v2-my-club-role ${manager ? 'is-manager' : ''}`}>
                            {manager ? 'Chủ nhiệm' : 'Thành viên'}
                        </span>
                        <h2>{club.name}</h2>
                        <p>
                            {manager
                                ? club.pendingApplications === null
                                    ? 'Đơn tham gia đang cập nhật'
                                    : `${club.pendingApplications} đơn tham gia đang chờ bạn xem xét`
                                : 'Hôm nay bạn muốn đóng góp điều gì?'}
                        </p>
                    </div>
                </header>
                <div className="v2-my-club-activity">
                    <CalendarDays size={18} />
                    <div>
                        <small>HOẠT ĐỘNG SẮP TỚI</small>
                        <strong>{club.upcomingActivity?.title || 'Lịch hoạt động đang cập nhật'}</strong>
                        {club.upcomingActivity && (
                            <span>
                                {dateLabel(club.upcomingActivity.startTime)}
                                {club.upcomingActivity.location ? ` · ${club.upcomingActivity.location}` : ''}
                            </span>
                        )}
                    </div>
                </div>
                <div className="v2-my-club-actions">
                    <Link to={club.workspacePath} className="v2-button v2-button--primary">
                        Vào không gian CLB <ArrowRight size={17} />
                    </Link>
                    <button
                        type="button"
                        className="v2-my-club-pin"
                        aria-pressed={pinned}
                        aria-label={`${pinned ? 'Bỏ ghim' : 'Ghim'} ${club.name}`}
                        title={pinned ? 'Bỏ ghim khỏi thanh điều hướng' : 'Ghim vào thanh điều hướng'}
                        onClick={onTogglePin}
                    >
                        {pinned ? <PinOff size={19} aria-hidden="true" /> : <Pin size={19} aria-hidden="true" />}
                    </button>
                </div>
            </div>
        </article>
    );
}
