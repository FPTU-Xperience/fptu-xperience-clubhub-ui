export const DECLARATION_PERMISSIONS = [
    { id: 'club.declarations.process', label: 'Xử lý trải nghiệm tự khai trong CLB' },
];
export const DECLARATION_ROLE_IDS = [
    'CLUB_OWNER',
    'VICE_PRESIDENT',
    'CONTENT',
    'EVENT',
    'HR',
    'SECRETARY',
    'TREASURER',
    'MEMBER',
];
export const isDeclarationLeadership = (manager, workspace) =>
    manager === true ||
    ['CLUB_OWNER', 'PRESIDENT', 'CLUB_PRESIDENT', 'VICE_PRESIDENT', 'CLUB_VICE_PRESIDENT'].includes(
        String(workspace?.displayRole || workspace?.role || '').toUpperCase(),
    );
export function declarationPermissions(manager, workspace, readOnly = false) {
    const leadership = !readOnly && isDeclarationLeadership(manager, workspace);
    const process =
        !readOnly &&
        (leadership ||
            (Array.isArray(workspace?.studentDeclarationPermissions) &&
                workspace.studentDeclarationPermissions.includes('club.declarations.process')));
    return { process, manage: leadership };
}
export function toggleDeclarationPermission(permissions, id, checked) {
    if (id !== 'club.declarations.process') throw new Error('Quyền trải nghiệm không hợp lệ.');
    return checked ? [id] : [];
}
export function validateDeclarationPermissionPolicy(value, clubId) {
    if (
        String(value?.clubId) !== String(clubId) ||
        typeof value?.version !== 'string' ||
        !value.version ||
        !Array.isArray(value.roles) ||
        new Set(value.roles.map((row) => row?.role)).size !== value.roles.length ||
        value.roles.some(
            (row) =>
                !DECLARATION_ROLE_IDS.includes(row?.role) ||
                !Array.isArray(row.permissions) ||
                new Set(row.permissions).size !== row.permissions.length ||
                row.permissions.some((id) => id !== 'club.declarations.process'),
        )
    )
        throw new Error('Cấu hình phân quyền trải nghiệm không đúng CLB hoặc phiên bản.');
    return value;
}
