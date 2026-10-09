import { useState } from 'react';

export default function ProfileClubLogo({ club }) {
    const [failedUrl, setFailedUrl] = useState('');
    const showLogo = club.logoUrl && club.logoUrl !== failedUrl;
    return (
        <span className="v2-profile-club-logo">
            {showLogo ? (
                <img
                    src={club.logoUrl}
                    alt={`Logo ${club.clubName}`}
                    loading="lazy"
                    onError={() => setFailedUrl(club.logoUrl)}
                />
            ) : (
                <span role="img" aria-label={`Logo ${club.clubName}`} title={club.clubCode || undefined}>
                    {club.clubCode || '—'}
                </span>
            )}
        </span>
    );
}
