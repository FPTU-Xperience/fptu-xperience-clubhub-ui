// Temporary development catalog. Production must receive Admin-owned metadata.
export const DEVELOPMENT_WORKSPACE_SEMESTERS = [
    {
        id: 'FA2026',
        label: 'Fall 2026',
        code: 'FA2026',
        year: 2026,
        term: 'FA',
        invitationCode: 'FALL2026',
        isCurrent: true,
        editable: true,
    },
    {
        id: 'SU2026',
        label: 'Summer 2026',
        code: 'SU2026',
        year: 2026,
        term: 'SU',
        invitationCode: 'SUMMER2026',
        isCurrent: false,
        editable: false,
    },
];

export function workspaceSemesterQuery(semester, resource) {
    if (!semester) return {};
    if (resource === 'reports') return semester.reportPeriod ? { period: semester.reportPeriod } : {};
    if (resource === 'activities') {
        const start = Date.parse(semester.startUtc),
            end = Date.parse(semester.endUtc);
        return Number.isFinite(start) && Number.isFinite(end) && start < end
            ? { from: semester.startUtc, to: semester.endUtc }
            : {};
    }
    return {};
}
export const workspaceSemesterKey = (semester) =>
    semester
        ? JSON.stringify([semester.id, semester.startUtc, semester.endUtc, semester.reportPeriod])
        : 'unconfigured';
