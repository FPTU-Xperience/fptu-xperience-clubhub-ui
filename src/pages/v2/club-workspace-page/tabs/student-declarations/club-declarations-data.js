import { declarationPermissions } from './club-declaration-permissions.js';
export function canViewClubDeclarations(manager, workspace, readOnly = false) {
    return declarationPermissions(manager, workspace, readOnly).process;
}
export const declarationStatus = (value) =>
    String(value || '')
        .replaceAll('_', '')
        .toUpperCase();
export const declarationStatusLabel = (value) =>
    ({
        SUBMITTED: 'Chờ xét duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED: 'Không thông qua',
        REVISIONREQUESTED: 'Cần bổ sung',
        REVOKED: 'Đã thu hồi',
    })[declarationStatus(value)] || value;
export function belongsToClub(row, clubId) {
    return row?.clubId != null && String(row.clubId) === String(clubId);
}
const assertClub = (id) => {
    if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) throw new Error('Không xác định được CLB.');
};
export async function loadClubDeclarations(
    api,
    clubId,
    { page = 1, query = '', status = '', period = 'all', semester = '' } = {},
) {
    assertClub(clubId);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (query.trim()) params.set('query', query.trim());
    if (status) params.set('status', status === 'REVISIONREQUESTED' ? 'REVISION_REQUESTED' : status);
    if (period === 'workspace') {
        if (!semester) throw new Error('Chọn học kỳ có mã hợp lệ.');
        params.set('semesterId', semester);
    }
    if (period === 'unassigned') params.set('unassigned', 'true');
    const value = await api.request(`/api/v1/declarations/clubs/${encodeURIComponent(clubId)}?${params}`);
    if (
        !Array.isArray(value?.items) ||
        value.page !== page ||
        value.pageSize !== 20 ||
        !Number.isSafeInteger(value.total) ||
        value.total < 0 ||
        !Number.isSafeInteger(value.totalPages) ||
        value.totalPages !== Math.ceil(value.total / 20) ||
        value.items.length > 20 ||
        new Set(value.items.map((row) => row?.id)).size !== value.items.length ||
        value.items.some(
            (row) => !row?.id || !belongsToClub(row, clubId) || String(row.referringClubId) !== String(clubId),
        )
    )
        throw new Error('Danh sách trải nghiệm trả về chưa đúng phạm vi CLB hoặc phân trang.');
    return { ...value, totalPages: Math.max(1, value.totalPages) };
}
export async function loadClubDeclarationDetail(api, clubId, id) {
    assertClub(clubId);
    const data = await api.request(`/api/v1/declarations/${encodeURIComponent(id)}`);
    const record = data?.contribution || data;
    if (String(record?.id) !== String(id) || !belongsToClub(record, clubId))
        throw new Error('Trải nghiệm không thuộc CLB đang xem hoặc quyền truy cập đã thay đổi.');
    return { ...data, contribution: record };
}
export function filterClubDeclarations(items, { query = '', status = '', semester = '', period = '' }) {
    const needle = query.trim().toLocaleLowerCase('vi-VN');
    return items.filter(
        (row) =>
            (!status || declarationStatus(row.status) === status) &&
            (period === 'unassigned'
                ? !row.semesterId
                : period !== 'workspace' || (semester && row.semesterId === semester)) &&
            (!needle ||
                [
                    row.title,
                    row.studentName,
                    row.studentCode,
                    row.studentEmail,
                    row.userId,
                    row.studentId,
                    row.organizationSource,
                ].some((value) =>
                    String(value ?? '')
                        .toLocaleLowerCase('vi-VN')
                        .includes(needle),
                )),
    );
}
