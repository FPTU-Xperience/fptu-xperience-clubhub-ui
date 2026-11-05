import { CLUB_CAPABILITY_LABELS } from './club-capabilities.js';
export const governanceGuid = (value) =>
    typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const positive = (value) => Number.isSafeInteger(value) && value > 0;
export const governancePresetLabels = {
    CONTENT: 'Content',
    EVENT: 'Sự kiện',
    HR: 'Nhân sự',
    SECRETARY: 'Thư ký',
    TREASURER: 'Thủ quỹ',
    CUSTOM: 'Tùy chỉnh',
    CLUB_OWNER: 'Chủ nhiệm',
    VICE_PRESIDENT: 'Phó chủ nhiệm',
};
export function governancePeriod(semester) {
    const id = semester?.semesterKey || semester?.id;
    return governanceGuid(id)
        ? {
              id,
              code: semester.code || semester.semesterId,
              label: semester.label,
          }
        : null;
}
export function governanceCatalog(value, clubId, actorId) {
    if (
        !same(value?.clubId, clubId) ||
        !same(value.actorId, actorId) ||
        value.version !== 'CLUB_GROUPS_V1' ||
        !Array.isArray(value.permissions) ||
        !Array.isArray(value.presets) ||
        value.constraints?.multipleGroupsPerMember !== true ||
        value.constraints.maxTreasurers !== 2 ||
        value.constraints.ownerCanBeTreasurer !== false ||
        ['canManage', 'canNominateVice', 'canTransferOwner'].some(
            (key) => typeof value.capabilities?.[key] !== 'boolean',
        ) ||
        value.permissions.some(
            (item) => !Object.hasOwn(CLUB_CAPABILITY_LABELS, item.code) || item.delegable !== true,
        ) ||
        new Set(value.permissions.map((item) => item.code)).size !== value.permissions.length ||
        value.presets.some(
            (item) =>
                !governancePresetLabels[item.code] ||
                ['CLUB_OWNER', 'VICE_PRESIDENT'].includes(item.code) ||
                !Array.isArray(item.permissionCodes) ||
                item.permissionCodes.some((code) => !value.permissions.some((p) => p.code === code)),
        )
    )
        throw new Error('Danh mục quyền chưa được máy chủ xác nhận cho tài khoản và CLB này.');
    return value;
}
export function governanceConfiguration(value, semesterId) {
    if (
        !same(value?.semesterId, semesterId) ||
        !Array.isArray(value.groups) ||
        value.catalogVersion !== 'CLUB_GROUPS_V1' ||
        !Number.isFinite(Date.parse(value.startsAt)) ||
        !Number.isFinite(Date.parse(value.endsAt)) ||
        value.groups.some(
            (group) =>
                !governanceGuid(group.id) ||
                typeof group.name !== 'string' ||
                !group.name.trim() ||
                !governancePresetLabels[group.presetCode] ||
                typeof group.protected !== 'boolean' ||
                group.protected !== ['CLUB_OWNER', 'VICE_PRESIDENT'].includes(group.presetCode) ||
                !Array.isArray(group.permissionCodes) ||
                group.permissionCodes.some((code) => !Object.hasOwn(CLUB_CAPABILITY_LABELS, code)) ||
                !Array.isArray(group.assignments) ||
                group.assignments.some(
                    (a) => !governanceGuid(a.id) || !positive(a.membershipId) || !positive(a.userId) || !a.displayName,
                ) ||
                new Set(group.assignments.map((a) => a.membershipId)).size !== group.assignments.length,
        ) ||
        new Set(value.groups.map((group) => group.id)).size !== value.groups.length
    )
        throw new Error('Cấu trúc BQL không khớp học kỳ hoặc có dữ liệu phân công không hợp lệ.');
    return value;
}
export function governanceTerm(value, clubId, actorId, period) {
    if (
        !same(value?.clubId, clubId) ||
        !same(value.actorId, actorId) ||
        !same(value.semesterId, period.id) ||
        !governanceGuid(value.clubVersion) ||
        typeof value.initialized !== 'boolean' ||
        !/^[0-9A-F]{64}$/i.test(value.leadershipDigest || '') ||
        !Array.isArray(value.legacyTreasurers) ||
        value.legacyTreasurers.some(
            (member) => !positive(member.membershipId) || !positive(member.userId) || !member.displayName,
        ) ||
        !Array.isArray(value.leadership?.owners) ||
        !Array.isArray(value.leadership?.vicePresidents) ||
        ['canConfigure', 'canReadHistory', 'canSubmitReport'].some(
            (key) => typeof value.capabilities?.[key] !== 'boolean',
        ) ||
        (value.initialized &&
            (!governanceGuid(value.termId) || !governanceGuid(value.version) || !governanceGuid(value.revisionId)))
    )
        throw new Error('BQL chưa được xác nhận cho đúng tài khoản, CLB và học kỳ.');
    if (value.initialized) governanceConfiguration(value.configuration, period.id);
    else if (value.configuration != null) throw new Error('Cấu trúc chưa khởi tạo không được chứa phân công mẫu.');
    if (
        value.currentMemberNames != null &&
        (!Array.isArray(value.currentMemberNames) ||
            value.currentMemberNames.some(
                (member) =>
                    !positive(member.userId) || typeof member.displayName !== 'string' || !member.displayName.trim(),
            ) ||
            new Set(value.currentMemberNames.map((member) => member.userId)).size !== value.currentMemberNames.length)
    )
        throw new Error('Tên hiển thị hiện tại của BQL chưa hợp lệ.');
    return value;
}
export const governanceDisplayName = (term, member) =>
    term?.currentMemberNames
        ?.find((current) => String(current.userId) === String(member.userId))
        ?.displayName?.trim() ||
    member.displayName ||
    `Tài khoản ${member.userId}`;
export function governancePage(value, clubId, semesterId = null) {
    if (
        !same(value?.clubId, clubId) ||
        (semesterId && !same(value.semesterId, semesterId)) ||
        !Array.isArray(value.items) ||
        !Number.isSafeInteger(value.page) ||
        value.page < 1 ||
        !Number.isSafeInteger(value.pageSize) ||
        value.pageSize < 1 ||
        !Number.isSafeInteger(value.totalItems) ||
        value.totalItems < 0 ||
        value.totalPages !== Math.ceil(value.totalItems / value.pageSize)
    )
        throw new Error('Lịch sử hoặc danh sách phân công không có phân trang hợp lệ.');
    return value;
}
export function governanceReceipt(value, clubId, semesterId, kind) {
    if (!same(value?.clubId, clubId) || (semesterId && !same(value.semesterId, semesterId)))
        throw new Error('Kết quả thay đổi không khớp phạm vi đang xem.');
    if (kind === 'report') {
        if (!governanceGuid(value.id) || value.status !== 'SUBMITTED' || value.permissionsChanged !== false)
            throw new Error('Chưa xác nhận được bản chụp báo cáo.');
    } else if (
        kind !== 'nominate' &&
        kind !== 'transfer' &&
        (!governanceGuid(value.version) || !governanceGuid(value.revisionId))
    )
        throw new Error('Chưa xác nhận được phiên bản cấu trúc mới.');
    else if (kind === 'nominate' && (!governanceGuid(value.id) || value.status !== 'PENDING'))
        throw new Error('Chưa xác nhận được đề nghị bổ nhiệm.');
    else if (kind === 'transfer' && (!positive(value.id) || value.status !== 'Pending'))
        throw new Error('Chưa xác nhận được đề nghị chuyển giao.');
    return value;
}
export function governanceError(error) {
    return error?.status === 409
        ? 'Dữ liệu hoặc quyền đã thay đổi. Tải lại bản mới trước khi thực hiện tiếp.'
        : error?.status === 403
          ? 'Bạn không còn quyền thực hiện thao tác này trong CLB.'
          : error?.message || 'Không thể cập nhật BQL. Vui lòng thử lại.';
}
