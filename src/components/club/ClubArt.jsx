import React from 'react';
import { ArrowUpRight } from 'lucide-react';

export function ClubArt({ club, hero = false }) {
    return (
        <div className={`dx-art ${club.tone} ${hero ? 'hero' : ''}`} aria-hidden="true">
            <span className="dx-art-grid" />
            <span className="dx-art-orbit" />
            <span className="dx-art-orbit second" />
            <span className="dx-art-word">{club.mark}</span>
            <span className="dx-art-stamp">
                FPTU COMMUNITY
                <br />
                EST. {club.founded}
            </span>
            <span className="dx-art-caption">{club.tagline}</span>
            <ArrowUpRight className="dx-art-arrow" size={28} />
        </div>
    );
}

export default ClubArt;
