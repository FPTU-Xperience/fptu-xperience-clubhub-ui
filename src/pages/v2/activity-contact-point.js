const contactFields = (value = {}) => ({
    userId: value.userId == null ? null : String(value.userId),
    displayName: String(value.displayName || '').trim(),
    email:
        typeof value.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim())
            ? value.email.trim()
            : '',
    phone: typeof value.phone === 'string' && /^\+?[\d ()-]{6,25}$/.test(value.phone.trim()) ? value.phone.trim() : '',
});

// Source contacts must be the server's permitted contact projections, never roster/profile PII.
export function resolveActivityContactPoint(raw = {}) {
    if (['FIRST_HOST', 'CLUB_PRESIDENT'].includes(raw.contactPoint?.source)) {
        return { source: raw.contactPoint.source, ...contactFields(raw.contactPoint) };
    }
    const hosts = (Array.isArray(raw.hostAssignments) ? raw.hostAssignments : []).filter(
        (assignment) => assignment.assignmentKind === 'HOST' && ['ASSIGNED', 'ACTIVE'].includes(assignment.status),
    );
    if (hosts.length) {
        // Without ordering metadata the client cannot safely decide who was assigned first.
        if (hosts.some((host) => !Number.isFinite(Date.parse(host.assignedAtUtc)) || !Number.isSafeInteger(host.id)))
            return { source: 'FIRST_HOST', ...contactFields() };
        const first = [...hosts].sort(
            (a, b) => Date.parse(a.assignedAtUtc) - Date.parse(b.assignedAtUtc) || a.id - b.id,
        )[0];
        return { source: 'FIRST_HOST', ...contactFields(first.contact) };
    }
    if (raw.clubPresidentContact) return { source: 'CLUB_PRESIDENT', ...contactFields(raw.clubPresidentContact) };
    return null;
}
