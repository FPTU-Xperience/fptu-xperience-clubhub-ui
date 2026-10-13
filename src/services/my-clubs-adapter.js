import { isPendingClubInvitation } from './club-invitations.js';

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
                coverImageUrl: club?.coverImageUrl || club?.coverUrl || '',
                role: access.isManager ? 'MANAGER' : 'MEMBER',
                displayRole: access.isManager ? 'CLUB_OWNER' : access.isTreasurer ? 'TREASURER' : 'MEMBER',
                pendingApplications: access.isManager ? null : undefined,
            };
        });
}

export function applicationsFromMemberships(membershipsResponse, clubsResponse) {
    const clubs = new Map(rows(clubsResponse).map((club) => [String(club.id), club]));
    return rows(membershipsResponse)
        .filter((membership) => ['PENDING', 'APPROVED', 'REJECTED'].includes(String(membership.status).toUpperCase()))
        .map((membership) => ({
            applicationId: membership.id,
            club: {
                clubId: membership.clubId,
                name: clubs.get(String(membership.clubId))?.name || membership.clubName,
                logoUrl: clubs.has(String(membership.clubId)) && Object.hasOwn(clubs.get(String(membership.clubId)), 'logoUrl')
                    ? clubs.get(String(membership.clubId)).logoUrl || '' : membership.logoUrl || '',
                clubCode: clubs.get(String(membership.clubId))?.code || membership.clubCode || '',
            },
            reason: membership.reason || membership.requestMessage || '',
            status: String(membership.status).toUpperCase(),
            requestedAtUtc: membership.requestedAtUtc || '',
            reviewedAtUtc: membership.reviewedAtUtc || '',
            // Only advertise self withdrawal when the backend declares the capability.
            canWithdraw:
                String(membership.status).toUpperCase() === 'PENDING' &&
                !isPendingClubInvitation(membership) &&
                membership.canWithdraw === true,
            canAcceptInvitation: isPendingClubInvitation(membership),
        }));
}
