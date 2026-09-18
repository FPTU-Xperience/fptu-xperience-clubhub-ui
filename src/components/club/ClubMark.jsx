import React from 'react';

export function ClubMark({ club, large = false }) {
    return (
        <span className={`dx-mark ${large ? 'large' : ''}`} style={{ '--club': club.color }}>
            {club.mark}
        </span>
    );
}

export default ClubMark;
