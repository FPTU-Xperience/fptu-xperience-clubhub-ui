import { useState } from 'react';
import GraphicBanner from '../../media/GraphicBanner';
import { defaultGraphicBanner } from '../../media/graphic-banner';
import { useEntityMedia } from '../../media/EntityMediaContext';
import './ClubCardMedia.scss';

export function ClubCardLogo({ club: input, className = '' }) {
    const club = useEntityMedia('club', input);
    const [failedLogo, setFailedLogo] = useState(null);
    return (
        <span className={`v2-club-card-logo ${className}`}>
            {club.logoUrl && failedLogo !== club.logoUrl ? (
                <img
                    src={club.logoUrl}
                    alt={`Logo ${club.name}`}
                    loading="lazy"
                    onError={() => setFailedLogo(club.logoUrl)}
                />
            ) : (
                <strong>
                    {String(club.code || club.clubCode || club.mark || club.name || 'CLB')
                        .slice(0, 3)
                        .toUpperCase()}
                </strong>
            )}
        </span>
    );
}

export default function ClubCardMedia({ club: input, showLogo = true }) {
    const club = useEntityMedia('club', input);
    const [failedCover, setFailedCover] = useState(null);
    const identity = club.id ?? club.clubId ?? club.name;
    return (
        <div className="v2-club-card-media">
            <div className="v2-club-card-cover">
                {club.coverImageUrl && failedCover !== club.coverImageUrl ? (
                    <img
                        src={club.coverImageUrl}
                        alt={`Ảnh bìa ${club.name}`}
                        loading="lazy"
                        onError={() => setFailedCover(club.coverImageUrl)}
                    />
                ) : (
                    <GraphicBanner
                        preserveAspectRatio="xMinYMid slice"
                        design={defaultGraphicBanner('club', identity)}
                        label={`Banner ${club.name}`}
                    />
                )}
            </div>
            {showLogo && <ClubCardLogo club={club} />}
        </div>
    );
}
