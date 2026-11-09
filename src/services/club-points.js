import { creditGuid } from './club-credit.js';
export const clubPointPillars = [
    ['Academic', 'Học thuật'],
    ['Research', 'Nghiên cứu'],
    ['Global', 'Hội nhập quốc tế'],
    ['CultureSports', 'Văn hóa & thể thao'],
    ['Community', 'Cộng đồng'],
    ['Entrepreneurship', 'Khởi nghiệp'],
    ['RealWorldWork', 'Kinh nghiệm thực tế'],
];
export async function personalClubPoints(api, userId, clubId) {
    const rows = [];
    let total;
    for (let page = 1; page <= 100; page++) {
        const value = await api.request(`/api/users/me/contributions?page=${page}&pageSize=100`);
        if (
            !Array.isArray(value?.items) ||
            value.page !== page ||
            !Number.isSafeInteger(value.total) ||
            value.total < 0 ||
            !Number.isSafeInteger(value.totalPages) ||
            value.totalPages < 0 ||
            (total != null && total !== value.total) ||
            value.items.some((row) => String(row.userId) !== String(userId) || !creditGuid(row.id))
        )
            throw new Error('Không đối chiếu được danh sách đóng góp của tài khoản này. Tải lại để thử lại.');
        total = value.total;
        rows.push(...value.items);
        if (page >= value.totalPages) {
            if (rows.length !== total || new Set(rows.map((row) => row.id)).size !== total)
                throw new Error('Danh sách đóng góp chưa đầy đủ. Tải lại để đối chiếu.');
            const scoped = rows.filter(
                (row) =>
                    row.sourceType === 'CLUB' && String(row.clubId) === String(clubId) && row.isAuthoritative !== false,
            );
            if (
                scoped.some(
                    (row) =>
                        !row.title ||
                        !row.semesterId ||
                        !['SUBMITTED', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED', 'REVOKED'].includes(row.status) ||
                        (row.status === 'APPROVED' &&
                            (!Number.isFinite(row.rawPoints) ||
                                row.rawPoints < 0 ||
                                row.recognitionStatus !== 'RECORDED')),
                )
            )
                throw new Error('Điểm CLB chưa có bản ghi xác minh hợp lệ.');
            return scoped;
        }
    }
    throw new Error('Danh sách đóng góp vượt giới hạn tải. Chưa thể xác nhận tổng điểm.');
}
export function clubPointSummary(rows, semesterId) {
    const approved = rows.filter((row) => row.status === 'APPROVED'),
        period = rows.filter((row) => row.semesterId === semesterId);
    return {
        rows: period,
        periodXp: period.filter((row) => row.status === 'APPROVED').reduce((sum, row) => sum + row.rawPoints, 0),
        lifetimeXp: approved.reduce((sum, row) => sum + row.rawPoints, 0),
        approvedCount: period.filter((row) => row.status === 'APPROVED').length,
    };
}
export function clubPointStatistics(value, clubId, semesterId) {
    if (
        String(value?.clubId) !== String(clubId) ||
        value.semesterId !== semesterId ||
        value.ledgerBasis !== 'VERIFIED_NET_LEDGER' ||
        value.schemaVersion !== 1 ||
        !value.ledgerRevision ||
        !value.activities ||
        !value.progress ||
        !value.netPointsByPillar ||
        !Number.isSafeInteger(value.approvedContributionCount) ||
        value.approvedContributionCount < 0 ||
        Object.values(value.activities).some((number) => !Number.isSafeInteger(number) || number < 0) ||
        clubPointPillars.some(([key]) => !Number.isFinite(value.netPointsByPillar[key]))
    )
        throw new Error('Bảng điểm chưa khớp CLB, học kỳ hoặc nguồn đã xác minh.');
    if (
        ['activities', 'sessions', 'uniqueParticipants'].some(
            (key) =>
                !Number.isSafeInteger(value.progress[key]?.actual) ||
                value.progress[key].actual < 0 ||
                !Number.isSafeInteger(value.progress[key]?.target) ||
                value.progress[key].target < 0,
        )
    )
        throw new Error('Chỉ tiêu học kỳ chưa có dữ liệu đầy đủ.');
    return value;
}
