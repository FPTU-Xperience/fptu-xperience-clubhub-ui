import React from 'react';

export function Avatar({ person, large = false }) {
    const initials =
        person?.initials ||
        person?.name
            ?.split(' ')
            .slice(-2)
            .map((n) => n[0])
            .join('') ||
        'TV';

    return (
        <span className={`dx-avatar ${large ? 'large' : ''}`} aria-hidden="true">
            {initials}
        </span>
    );
}

export default Avatar;
