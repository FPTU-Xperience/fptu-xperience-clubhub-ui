const affairsViewerRoles = new Set(['ADMIN', 'SYSTEM_ADMIN', 'STUDENT_AFFAIRS_ADMIN']);

// Observation access only; review and management rights remain API-authorized in Admin.
export function isAffairsViewer(user) {
    return Array.isArray(user?.roles) && user.roles.some((role) => affairsViewerRoles.has(role));
}

export const affairsNavigation = [
    ['/v2/ctsv/activities', 'Hoạt động cấp trường'],
    ['/v2/ctsv/rewards', 'Phần thưởng cấp trường'],
    ['/v2/ctsv/admin', 'Trang quản trị'],
];

export function adminAppUrl(value) {
    try {
        const url = new URL(value);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch {
        return null;
    }
}

export function getAdminAppUrl({ override, development = false } = {}) {
    return adminAppUrl(override || (development ? 'http://localhost:5174/' : 'https://fptux-admin-ui.pages.dev/'));
}

export function getAdminClubUrl(clubId, options) {
    const base = getAdminAppUrl(options);
    if (!base || clubId == null || clubId === '') return null;
    const url = new URL(base);
    url.hash = `/ctsv/clubs?club=${encodeURIComponent(clubId)}`;
    return url.href;
}
