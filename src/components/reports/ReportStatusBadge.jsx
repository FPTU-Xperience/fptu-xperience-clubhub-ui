import { vi } from '../../locales/vi';

const STATUS_META = {
    DRAFT: { label: vi.reportStatuses.DRAFT, className: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
    AWAITINGFINANCE: {
        label: vi.reportStatuses.AWAITINGFINANCE,
        className: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200',
    },
    SUBMITTED: {
        label: vi.reportStatuses.SUBMITTED,
        className: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-500',
    },
    UNDERREVIEW: {
        label: vi.reportStatuses.UNDERREVIEW,
        className: 'border-yellow-400/30 bg-yellow-400/10 text-yellow-500',
    },
    APPROVED: {
        label: vi.reportStatuses.APPROVED,
        className: 'border-green-400/30 bg-green-400/10 text-green-500',
    },
    REJECTED: { label: vi.reportStatuses.REJECTED, className: 'border-rose-400/30 bg-rose-400/10 text-rose-200' },
};

export function normalizeReportStatus(status) {
    return status?.toUpperCase().replace(/\s+/g, '') || 'DRAFT';
}

export function reportStatusLabel(status) {
    return (STATUS_META[normalizeReportStatus(status)] || STATUS_META.DRAFT).label;
}

export default function ReportStatusBadge({ status, className = '' }) {
    const meta = STATUS_META[normalizeReportStatus(status)] || STATUS_META.DRAFT;

    return (
        <span
            className={`inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold ${meta.className} ${className}`}
        >
            {meta.label}
        </span>
    );
}
