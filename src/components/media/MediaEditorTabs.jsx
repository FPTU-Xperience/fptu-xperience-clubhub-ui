import './MediaEditorTabs.scss';

export default function MediaEditorTabs({ id, items, value, onChange, disabled, label }) {
    return (
        <div className="media-editor-tabs" role="tablist" aria-label={label}>
            {items.map(([key, title], index) => (
                <button
                    key={key}
                    id={`${id}-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={value === key}
                    aria-controls={`${id}-panel-${key}`}
                    tabIndex={value === key ? 0 : -1}
                    disabled={disabled}
                    onClick={() => onChange(key)}
                    onKeyDown={(event) => {
                        const next =
                            event.key === 'ArrowRight'
                                ? (index + 1) % items.length
                                : event.key === 'ArrowLeft'
                                  ? (index + items.length - 1) % items.length
                                  : event.key === 'Home'
                                    ? 0
                                    : event.key === 'End'
                                      ? items.length - 1
                                      : null;
                        if (next === null) return;
                        event.preventDefault();
                        onChange(items[next][0]);
                        event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
                    }}
                >
                    {title}
                </button>
            ))}
        </div>
    );
}
