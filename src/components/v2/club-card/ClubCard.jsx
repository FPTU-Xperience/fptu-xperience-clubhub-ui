import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClubLogo, Pill } from '../DiscoveryLayout';
import './ClubCard.scss';

export default function ClubCard({ club }) {
    return (
        <article className="v2-club-card">
            <Link to={club.destination} className="v2-art-link" aria-label={`Khám phá ${club.name}`}>
                <ClubLogo club={club} />
            </Link>
            <div className="v2-club-card-body">
                <div className="v2-between">
                    <span className="v2-overline">{club.category || 'Chưa phân loại'}</span>
                    <Pill tone={club.isRecruiting ? 'orange' : ''}>
                        {club.hasRecruitmentStatus
                            ? club.isRecruiting
                                ? 'Đang tuyển thành viên'
                                : 'Chưa mở tuyển'
                            : 'Đang cập nhật'}
                    </Pill>
                </div>
                <h3>{club.name}</h3>
                <div className="v2-meta">
                    <CalendarDays size={15} />
                    {club.scheduleLabel || 'Lịch sinh hoạt đang cập nhật'}
                </div>
                <p>{club.description || 'Thông tin giới thiệu đang được cập nhật.'}</p>
                <div className="v2-card-footer">
                    <span>{club.tags.slice(0, 2).join(' · ') || 'FPTU Community'}</span>
                    <Link to={club.destination} className="v2-text-link">
                        Khám phá <ArrowUpRight size={16} />
                    </Link>
                </div>
            </div>
        </article>
    );
}
