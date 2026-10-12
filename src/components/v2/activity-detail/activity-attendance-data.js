export function canManageActivityAttendance(clubId, clubAccess = []) {
    return (
        Array.isArray(clubAccess) &&
        clubAccess.some((access) => String(access.clubId) === String(clubId) && access.isManager === true)
    );
}
