import React from 'react';

export function FormField({ label, name, value, onChange, textarea = false, ...props }) {
    const Element = textarea ? 'textarea' : 'input';
    return (
        <label className="dx-field">
            <span>{label}</span>
            <Element name={name} value={value} onChange={onChange} {...props} />
        </label>
    );
}

export default FormField;
