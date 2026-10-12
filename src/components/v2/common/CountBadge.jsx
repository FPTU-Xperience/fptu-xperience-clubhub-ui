import './CountBadge.scss';

export default function CountBadge({ count, label }) {
    if (!Number.isInteger(count) || count <= 0) return null;
    return (
        <small className="v2-count-badge" aria-label={`${count} ${label}`}>
            {count}
        </small>
    );
}
