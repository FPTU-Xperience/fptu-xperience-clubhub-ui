import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function BackLink({ to, children }) {
    return (
        <Link to={to} className="dx-back">
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
            {children}
        </Link>
    );
}

export default BackLink;
