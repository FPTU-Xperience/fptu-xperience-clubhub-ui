import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pill } from '../DiscoveryLayout';
import ClubCardMedia, { ClubCardLogo } from './ClubCardMedia';
import './ClubCard.scss';

export default function ClubCard({ club }) {
    return (
        <article className="v2-club-card">
            <Link to={club.destination} className="v2-art-link" aria-label={`Khám phá ${club.name}`}>
                <ClubCardMedia club={club} showLogo={false} />
            </Link>
            <div className="v2-club-card-body">
                <header className="v2-club-card-identity">
                    <ClubCardLogo club={club} />
                    <div className="v2-club-card-identity-copy">
                        <div className="v2-club-card-labels">
                            <Pill>{club.category || 'Chưa phân loại'}</Pill>
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
                    </div>
                </header>
                <p className="v2-club-card-description">
                    {club.description || 'Thông tin giới thiệu đang được cập nhật.'}
                </p>
                <div className="v2-card-footer">
                    <span>{club.code || club.clubCode || '—'}</span>
                    <Link to={club.destination} className="v2-text-link">
                        Khám phá <ArrowUpRight size={16} />
                    </Link>
                </div>
            </div>
        </article>
    );
}
