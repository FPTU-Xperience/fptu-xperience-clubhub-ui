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
export async function loadClubDeclarations(api, clubId) {
    assertClub(clubId);
    // The existing authorized declaration queue does not support clubId filtering.
    // Traverse its server pages, retaining only this club, so local counts/search stay correct.
    let page = 1,
        total,
        seenCount = 0;
    const seen = new Set(),
        items = [];
    do {
        const value = await api.request(`/api/v1/student-affairs/declarations/?page=${page}&pageSize=100`);
        const count = value?.totalItems ?? value?.total;
        if (!Array.isArray(value?.items) || !Number.isSafeInteger(count) || count < 0)
            throw new Error('Danh sách trải nghiệm trả về chưa hợp lệ.');
        if (total !== undefined && total !== count) throw new Error('Danh sách đã thay đổi. Vui lòng tải lại.');
        total = count;
        if (!value.items.length && seenCount < total) throw new Error('Danh sách đã thay đổi. Vui lòng tải lại.');
        for (const row of value.items) {
            if (!row?.id || seen.has(String(row.id)))
                throw new Error('Danh sách trải nghiệm bị trùng hoặc thiếu nguồn. Tải lại trước khi xem.');
            seen.add(String(row.id));
            if (belongsToClub(row, clubId)) items.push(row);
        }
        seenCount += value.items.length;
        page++;
    } while ((page - 1) * 100 < total);
    if (seenCount !== total) throw new Error('Danh sách đã thay đổi. Vui lòng tải lại.');
    return items;
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
