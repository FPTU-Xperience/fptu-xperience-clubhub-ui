// Workspace navigation requires approved self-membership, independently of management access.
export function activityWorkspacePath(activityClubId, selection, memberships) {
    const id = String(activityClubId ?? '').trim();
    if (!id || selection?.status !== 'populated' || memberships?.status !== 'populated') return null;
    const approved = memberships.data.some((row) =>
        String(row.clubId) === id && String(row.status).toUpperCase() === 'APPROVED',
    );
    if (!approved) return null;
    const workspace = selection.data.find((club) => String(club.clubId) === id);
    const code = typeof workspace?.clubCode === 'string' ? workspace.clubCode.trim() : '';
    return code ? `/v2/my-clubs/${encodeURIComponent(code)}` : null;
}
