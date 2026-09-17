import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClubLogo, Pill } from './DiscoveryLayout';

export default function ClubCard({ club }) {
    return (
        <article className="dx-club-card">
            <Link to={club.destination} className="dx-art-link" aria-label={`Khám phá ${club.name}`}>
                <ClubLogo club={club} />
            </Link>
            <div className="dx-club-card-body">
                <div className="dx-between">
                    <span className="dx-overline">{club.category || 'Chưa phân loại'}</span>
                    <Pill tone={club.isRecruiting ? 'orange' : ''}>
                        {club.hasRecruitmentStatus
                            ? club.isRecruiting
                                ? 'Đang tuyển thành viên'
                                : 'Chưa mở tuyển'
                            : 'Đang cập nhật'}
                    </Pill>
                </div>
                <h3>{club.name}</h3>
                <p>{club.description || 'Thông tin giới thiệu đang được cập nhật.'}</p>
                <div className="dx-meta">
                    <CalendarDays size={15} />
                    {club.scheduleLabel || 'Lịch sinh hoạt đang cập nhật'}
                </div>
                <div className="dx-card-footer">
                    <span>{club.tags.slice(0, 2).join(' · ') || 'FPTU Community'}</span>
                    <Link to={club.destination} className="dx-text-link">
                        Khám phá <ArrowUpRight size={16} />
                    </Link>
                </div>
            </div>
        </article>
    );
}
