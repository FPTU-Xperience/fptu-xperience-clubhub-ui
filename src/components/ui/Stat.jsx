import React from 'react';

export function Stat({ label, value, note, icon: Icon }) {
    return (
        <div className="dx-stat">
            <div className="dx-between">
                <span>{label}</span>
                {Icon && <Icon size={18} />}
            </div>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
        </div>
    );
}

export default Stat;
