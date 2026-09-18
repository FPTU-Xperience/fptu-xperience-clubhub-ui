import React from 'react';

export function Pill({ children, tone = '' }) {
    return <span className={`dx-pill ${tone}`}>{children}</span>;
}

export default Pill;
