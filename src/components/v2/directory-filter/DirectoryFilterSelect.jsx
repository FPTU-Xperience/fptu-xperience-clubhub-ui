import './DirectoryFilters.scss';

export default function DirectoryFilterSelect({ label, value, options, onChange }) {
    return (
        <label className="v2-directory-filter-select">
            <span>{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)}>
                {options.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
            </select>
        </label>
    );
}
