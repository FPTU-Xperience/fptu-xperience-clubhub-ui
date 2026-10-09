export function semesterCode({ term, year }) {
    const names = { SP: 'SPRING', SU: 'SUMMER', FA: 'FALL' };
    return names[term] && Number.isInteger(Number(year)) && Number(year) >= 2000 && Number(year) <= 2100
        ? `${names[term]}${Number(year)}` : '';
}

export function isPendingClubInvitation(member) {
    return String(member?.status).toUpperCase() === 'PENDING'
        && member.acceptedClubRules === false && member.committedToParticipate === false;
}

export function eligibleInvitationCandidates(result, semesterId) {
    if (!semesterId || result?.semesterId !== semesterId || !Array.isArray(result?.items)) return [];
    return result.items.filter((student) => Number.isSafeInteger(Number(student.userId)) && Number(student.userId) > 0
        && typeof student.fullName === 'string' && student.fullName.trim()
        && student.isActive === true && student.isLocked === false && student.eligible === true);
}
