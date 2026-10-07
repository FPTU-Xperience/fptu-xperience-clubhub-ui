const rows = (value) => (Array.isArray(value) ? value : value?.items || []);

export function selectionFromClubAccess(accessResponse, clubsResponse) {
    const clubs = new Map(rows(clubsResponse).map((club) => [String(club.id), club]));
    return rows(accessResponse)
        .filter((access) => access.isManager || access.isApprovedMember)
        .map((access) => {
            const club = clubs.get(String(access.clubId));
            return {
                clubId: access.clubId,
                clubCode: club?.code || '',
                name: club?.name || access.clubName,
                logoUrl: club?.logoUrl || '',
                role: access.isManager ? 'MANAGER' : 'MEMBER',
                pendingApplications: access.isManager ? null : undefined,
            };
        });
}

export function applicationsFromMemberships(membershipsResponse) {
    return rows(membershipsResponse)
        .filter((membership) => ['PENDING', 'APPROVED', 'REJECTED'].includes(String(membership.status).toUpperCase()))
        .map((membership) => ({
            applicationId: membership.id,
            club: { clubId: membership.clubId, name: membership.clubName, logoUrl: '' },
            reason: membership.reason || membership.requestMessage || '',
            status: String(membership.status).toUpperCase(),
            // ClubService currently permits only managers/admins to delete memberships.
            canWithdraw: false,
        }));
}
