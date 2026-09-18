import React from 'react';

export function PageHeading({ eyebrow, title, description, actions }) {
    return (
        <div className="dx-page-heading">
            <div>
                {eyebrow && <div className="dx-eyebrow">{eyebrow}</div>}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="dx-actions">{actions}</div>}
        </div>
    );
}

export function SectionHeading({ title, description, children }) {
    return (
        <div className="dx-section-heading">
            <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {children}
        </div>
    );
}
