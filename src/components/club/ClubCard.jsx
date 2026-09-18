import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { membership } from '../../core/model';
import { Pill } from '../ui/Pill';
import { ClubArt } from './ClubArt';

export function ClubCard({ club }) {
    const { state, actorId, basePath = '' } = useClubHub();
    const access = membership(state, actorId, club.id);
    const recruiting = state.settings[club.id]?.recruiting ?? club.recruiting;
    const clubDetailUrl = `${basePath}/clubs/${club.id}`.replace(/^\/\//, '/');

    return (
        <article className="dx-club-card">
            <Link to={clubDetailUrl} className="dx-art-link" aria-label={`Khám phá ${club.name}`}>
                <ClubArt club={club} />
            </Link>
            <div className="dx-club-card-body">
                <div className="dx-between">
                    <span className="dx-overline">{club.category}</span>
                    <Pill tone={access ? 'green' : recruiting ? 'orange' : ''}>
                        {access ? 'CLB của bạn' : recruiting ? 'Đang tuyển thành viên' : 'Chưa mở tuyển'}
                    </Pill>
                </div>
                <h3>
                    <Link to={clubDetailUrl}>{club.name}</Link>
                </h3>
                <p>{state.settings[club.id]?.description || club.description}</p>
                <div className="dx-meta">
                    <CalendarDays size={15} />
                    {club.schedule}
                </div>
                <div className="dx-card-footer">
                    <span>{club.tags.slice(0, 2).join(' · ')}</span>
                    <Link to={clubDetailUrl} className="dx-text-link">
                        Khám phá <ArrowUpRight size={16} />
                    </Link>
                </div>
            </div>
        </article>
    );
}

export default ClubCard;
