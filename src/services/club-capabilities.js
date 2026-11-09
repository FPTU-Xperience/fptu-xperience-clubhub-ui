export const CLUB_CAPABILITY_LABELS = Object.freeze({
    'club.profile.write': 'Chỉnh sửa trang CLB',
    'club.media.write': 'Cập nhật ảnh CLB',
    'event.content.write': 'Chỉnh sửa nội dung sự kiện',
    'event.staff.assign': 'Phân công staff và xử lý đơn ứng tuyển',
    'event.registrations.manage': 'Lập và quản lý đơn tổ chức sự kiện',
    'club.members.recruit': 'Tuyển và mời thành viên',
    'club.reports.draft.write': 'Soạn bản nháp biên bản, báo cáo của mình',
    'club.finance.read': 'Xem tài chính',
    'club.finance.draft.write': 'Soạn dự toán, quyết toán',
    'club.finance.submit': 'Nộp hồ sơ tài chính',
});
const valid = (scope, now) =>
    Number.isFinite(Date.parse(scope?.accessValidUntilUtc)) &&
    Date.parse(scope.accessValidUntilUtc) > now;
export const clubLeadership = (scope, now = Date.now()) =>
    scope?.isManager === true ||
    (scope?.isApprovedMember === true &&
        scope?.isVicePresident === true &&
        valid(scope, now));
export function clubCapability(scope, code, now = Date.now()) {
    if (!Object.hasOwn(CLUB_CAPABILITY_LABELS, code)) return false;
    if (clubLeadership(scope, now)) return true;
    if (scope?.isApprovedMember !== true) return false;
    if (
        scope.capabilities == null &&
        scope.isTreasurer === true &&
        code.startsWith('club.finance.')
    )
        return true;
    return (
        Array.isArray(scope.capabilities) &&
        scope.capabilities.includes(code) &&
        valid(scope, now)
    );
}
export const clubRoleSummary = (scope) =>
    scope?.isManager
        ? 'Chủ nhiệm'
        : clubLeadership(scope)
          ? 'Phó chủ nhiệm'
          : scope?.isTreasurer
            ? 'Thủ quỹ'
            : scope?.groupIds?.length
              ? 'Thành viên có phân công nhóm'
              : 'Thành viên';

export const clubFinancialReport = (report) =>
    [report?.tag, report?.reportType].some((value) =>
        ['FINANCE', 'FINANCIAL', 'FINANCIAL_REPORT', 'TÀI_CHÍNH'].includes(
            String(value || '')
                .trim()
                .toUpperCase()
                .replaceAll(' ', '_'),
        ),
    );
export const clubDraftReport = (scope, report) =>
    clubCapability(
        scope,
        clubFinancialReport(report)
            ? 'club.finance.draft.write'
            : 'club.reports.draft.write',
    );
export const clubSubmitReport = (scope, report) =>
    clubLeadership(scope) ||
    (clubFinancialReport(report) &&
        clubCapability(scope, 'club.finance.submit'));
