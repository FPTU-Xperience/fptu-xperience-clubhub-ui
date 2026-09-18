import React from 'react';
import { Search } from 'lucide-react';

export function SearchField({ value, onChange, placeholder = 'Tìm kiếm...', label = 'Tìm kiếm' }) {
    return (
        <label className="dx-search">
            <Search size={18} />
            <input
                aria-label={label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}

export default SearchField;
