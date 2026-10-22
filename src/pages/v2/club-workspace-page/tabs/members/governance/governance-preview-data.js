// UI rehearsal only. Never used by AuthContext or live API authorization.
import { DECLARATION_PERMISSIONS } from '../../student-declarations/club-declaration-permissions.js';
export const PREVIEW_PERMISSIONS = [
    ...DECLARATION_PERMISSIONS.map((permission)=>({...permission,area:'Trải nghiệm tự khai'})),
    { id: 'club.profile.write', label: 'Chỉnh sửa trang CLB', area: 'Nội dung' },
    { id: 'club.media.write', label: 'Cập nhật ảnh CLB', area: 'Nội dung' },
    { id: 'event.content.write', label: 'Chỉnh sửa nội dung sự kiện', area: 'Sự kiện' },
    { id: 'event.staff.assign', label: 'Phân công staff', area: 'Sự kiện' },
    { id: 'event.registrations.manage', label: 'Quản lý đơn sự kiện', area: 'Sự kiện' },
    { id: 'club.members.recruit', label: 'Tuyển và mời thành viên', area: 'Thành viên' },
    { id: 'club.reports.draft.write', label: 'Soạn biên bản, báo cáo', area: 'Báo cáo' },
    { id: 'club.finance.read', label: 'Xem tài chính', area: 'Tài chính' },
    { id: 'club.finance.draft.write', label: 'Lập dự toán, quyết toán', area: 'Tài chính' },
    { id: 'club.finance.submit', label: 'Nộp hồ sơ tài chính', area: 'Tài chính' },
];
export const PREVIEW_PRESETS = [
    { id: 'CUSTOM', label: 'Tùy chỉnh', permissions: [] },
    { id: 'CONTENT', label: 'Content', permissions: ['club.profile.write', 'club.media.write', 'event.content.write'] },
    { id: 'EVENT', label: 'Sự kiện', permissions: ['event.staff.assign', 'event.registrations.manage'] },
    { id: 'HR', label: 'Nhân sự', permissions: ['club.members.recruit', 'club.profile.write'] },
    { id: 'SECRETARY', label: 'Thư ký', permissions: ['club.reports.draft.write'] },
    {
        id: 'TREASURER',
        label: 'Thủ quỹ',
        permissions: ['club.finance.read', 'club.finance.draft.write', 'club.finance.submit'],
    },
];
export const PREVIEW_SEMESTERS = [
    { id: 'FA2026', label: 'Fall 2026', editable: true },
    { id: 'SU2026', label: 'Summer 2026', editable: false },
];
export const PREVIEW_MEMBERS = [
    { id: 'p1', name: 'Nguyễn Minh An', code: 'TV01' },
    { id: 'p2', name: 'Trần Gia Linh', code: 'TV02' },
    { id: 'p3', name: 'Lê Hoàng Nam', code: 'TV03' },
    { id: 'p4', name: 'Phạm Khánh Vy', code: 'TV04' },
    { id: 'p5', name: 'Võ Tuấn Anh', code: 'TV05' },
    { id: 'p6', name: 'Đặng Bảo Ngọc', code: 'TV06' },
];
// Presentation aliases retain immutable stored history.
export function governanceDisplayText(value) {
    const labels = {
        'Chủ nhiệm mẫu': 'Chủ nhiệm',
        'Người chạy thử': 'Người thực hiện',
        'Hệ thống chạy thử': 'Hệ thống',
        'Báo cáo minh họa kỳ trước': 'Báo cáo BQL kỳ trước',
        'Bổ nhiệm lãnh đạo đã duyệt — dữ liệu minh họa.': 'Phụ trách điều hành và định hướng câu lạc bộ.',
    };
    return labels[value] || value;
}
const copy = (value) => JSON.parse(JSON.stringify(value));
const groupSnapshot = (period, memberId) =>
    period.groups.filter((g) => g.memberIds.includes(memberId)).map((g) => ({ id: g.id, name: g.name }));
export function previewMemberPermissions(period, memberId) {
    return [
        ...new Set(period.groups.filter((g) => g.memberIds.includes(memberId)).flatMap((g) => g.permissions)),
    ].sort();
}
export function createGovernancePreview() {
    const makePeriod = () => ({
        revision: 1,
        groups: [
            {
                id: 'owner',
                name: 'Chủ nhiệm',
                duty: 'CLUB_OWNER',
                protected: true,
                description: 'Phụ trách điều hành và định hướng câu lạc bộ.',
                permissions: PREVIEW_PERMISSIONS.map((p) => p.id),
                memberIds: ['p1'],
            },
            {
                id: 'vice-president',
                name: 'Phó chủ nhiệm',
                duty: 'VICE_PRESIDENT',
                protected: true,
                description: 'Chỉ có hiệu lực sau khi CTSV duyệt bổ nhiệm.',
                permissions: PREVIEW_PERMISSIONS.map((p) => p.id),
                memberIds: [],
            },
            {
                id: 'content',
                name: 'Content',
                duty: null,
                description: 'Trang CLB và nội dung sự kiện.',
                permissions: [...PREVIEW_PRESETS[1].permissions],
                memberIds: ['p2'],
            },
            {
                id: 'event',
                name: 'Sự kiện',
                duty: null,
                description: 'Điều phối staff và đơn đăng ký.',
                permissions: [...PREVIEW_PRESETS[2].permissions],
                memberIds: ['p3'],
            },
            {
                id: 'hr',
                name: 'Nhân sự',
                duty: null,
                description: 'Tuyển thành viên và cập nhật trang CLB.',
                permissions: [...PREVIEW_PRESETS[3].permissions],
                memberIds: [],
            },
            {
                id: 'secretary',
                name: 'Thư ký',
                duty: null,
                description: 'Soạn biên bản và báo cáo được phân công.',
                permissions: [...PREVIEW_PRESETS[4].permissions],
                memberIds: [],
            },
            {
                id: 'treasurer',
                name: 'Thủ quỹ',
                duty: 'TREASURER',
                description: 'Phụ trách dự toán và quyết toán.',
                permissions: [...PREVIEW_PRESETS[5].permissions],
                memberIds: ['p4'],
            },
        ],
        history: [],
        reports: [],
        nominations: [],
    });
    const previous = makePeriod();
    previous.reports.push({
        id: 'sample-report',
        number: 1,
        sourceRevision: 1,
        at: '2026-08-20T03:00:00Z',
        actor: 'Chủ nhiệm',
        reason: 'Báo cáo BQL kỳ trước',
        groups: copy(previous.groups),
    });
    return { schema: 2, periods: { FA2026: makePeriod(), SU2026: previous } };
}
export function previewStorageKey(actorId, clubId) {
    if (!actorId || !clubId) throw new Error('Thiếu thông tin tài khoản hoặc CLB.');
    return `clubhub:ui-rehearsal:governance:v1:${encodeURIComponent(String(actorId))}:${encodeURIComponent(String(clubId))}`;
}
export function readGovernancePreview(storage, key) {
    try {
        const data = JSON.parse(storage?.getItem(key));
        if (
            [1, 2].includes(data?.schema) &&
            PREVIEW_SEMESTERS.every(
                (s) =>
                    Array.isArray(data.periods?.[s.id]?.groups) &&
                    Array.isArray(data.periods?.[s.id]?.history) &&
                    Array.isArray(data.periods?.[s.id]?.reports) &&
                    Array.isArray(data.periods?.[s.id]?.nominations),
            )
        ) {
            if (data.schema === 1) {
                const defaults = createGovernancePreview();
                const at = new Date().toISOString();
                for (const semester of PREVIEW_SEMESTERS.filter((s) => s.editable)) {
                    const period = data.periods[semester.id];
                    const additions = defaults.periods[semester.id].groups
                        .filter(
                            (group) =>
                                !period.groups.some(
                                    (existing) =>
                                        existing.id === group.id ||
                                        existing.name.trim().toLocaleLowerCase('vi') ===
                                            group.name.toLocaleLowerCase('vi'),
                                ),
                        )
                        .map((group) => ({ ...copy(group), memberIds: [] }));
                    if (additions.length) {
                        period.revision++;
                        period.groups.push(...additions);
                        period.history.push(
                            ...additions.map((group) => ({
                                id: `default-groups-v2:${semester.id}:${group.id}`,
                                changeSetId: `default-groups-v2:${semester.id}`,
                                type: 'saveGroup',
                                memberId: null,
                                groupId: group.id,
                                groupName: group.name,
                                groupBefore: null,
                                groupAfter: copy(group),
                                before: [],
                                after: [],
                                permissionsBefore: [],
                                permissionsAfter: [],
                                at,
                                actor: 'Hệ thống',
                                reason: 'Khởi tạo các group vai trò mặc định',
                                revision: period.revision,
                            })),
                        );
                    }
                }
                data.schema = 2;
                // Preserve existing assignments, history and submitted snapshots during the UI upgrade.
                try {
                    storage?.setItem(key, JSON.stringify(data));
                } catch {
                    /* Rehearsal can still render if storage is full. */
                }
            }
            return data;
        }
    } catch {
        /* Corrupt preview data never affects the authenticated app. */
    }
    return createGovernancePreview();
}
function validateGroups(groups) {
    const names = new Set();
    const allowed = new Set(PREVIEW_PERMISSIONS.map((p) => p.id));
    for (const group of groups) {
        const name = group.name.trim().toLocaleLowerCase('vi');
        if (!name || group.name.length > 80 || names.has(name))
            throw new Error('Tên group phải khác nhau, từ 1 đến 80 ký tự.');
        names.add(name);
        if (group.permissions.some((id) => !allowed.has(id))) throw new Error('Quyền không thuộc danh mục được phép.');
        if (group.memberIds.some((id) => !PREVIEW_MEMBERS.some((m) => m.id === id)))
            throw new Error('Chỉ chọn thành viên đã được duyệt.');
        if (new Set(group.memberIds).size !== group.memberIds.length)
            throw new Error('Thành viên bị trùng trong group.');
    }
    const financeIds = new Set(
        groups
            .filter(
                (g) =>
                    !g.protected &&
                    (g.duty === 'TREASURER' ||
                        g.permissions.some((p) => ['club.finance.draft.write', 'club.finance.submit'].includes(p))),
            )
            .flatMap((g) => g.memberIds),
    );
    if (financeIds.size > 2) throw new Error('Tối đa 2 người có nhiệm vụ thủ quỹ, kể cả ở nhiều group.');
    if (groups.some((g) => g.duty === 'CLUB_OWNER' && g.memberIds.some((id) => financeIds.has(id))))
        throw new Error('Chủ nhiệm không kiêm thủ quỹ.');
}
export function applyGovernancePreview(state, semesterId, command, meta) {
    if (!PREVIEW_SEMESTERS.find((s) => s.id === semesterId)?.editable)
        throw new Error('Kỳ đã lưu trữ chỉ cho phép xem.');
    if (!meta?.actor || !meta.at || !meta.id || !command.reason?.trim()) throw new Error('Nhập lý do thay đổi.');
    const original = state.periods[semesterId];
    if (command.expectedRevision !== undefined && command.expectedRevision !== original.revision)
        throw new Error('Cơ cấu đã thay đổi. Mở lại và thử lại.');
    const next = copy(state);
    const period = next.periods[semesterId];
    if (period.history.some((e) => e.changeSetId === meta.id) || period.reports.some((r) => r.id === meta.id))
        return next;
    const target = period.groups.find((g) => g.id === command.groupId);
    const assertEditable = (group) => {
        if (!group) throw new Error('Không tìm thấy group.');
        if (group.protected) throw new Error('Chủ nhiệm/Phó chủ nhiệm phải qua CTSV duyệt.');
    };
    if (command.type === 'report') {
        period.reports.push({
            id: meta.id,
            number: period.reports.length + 1,
            sourceRevision: period.revision,
            at: meta.at,
            actor: meta.actor,
            reason: command.reason.trim(),
            groups: copy(period.groups),
        });
        return next;
    }
    if (command.type === 'nominate') {
        if (
            !['CLUB_OWNER', 'VICE_PRESIDENT'].includes(command.role) ||
            !PREVIEW_MEMBERS.some((m) => m.id === command.memberId)
        )
            throw new Error('Đề nghị bổ nhiệm không hợp lệ.');
        if (period.nominations.some((n) => n.role === command.role && n.memberId === command.memberId))
            throw new Error('Người này đã có đề nghị đang chờ.');
        period.nominations.push({
            id: meta.id,
            role: command.role,
            memberId: command.memberId,
            status: 'PendingApproval',
            at: meta.at,
            reason: command.reason.trim(),
        });
        period.history.push({
            id: meta.id,
            changeSetId: meta.id,
            memberId: command.memberId,
            type: 'nominate',
            at: meta.at,
            actor: meta.actor,
            reason: command.reason.trim(),
            before: groupSnapshot(original, command.memberId),
            after: groupSnapshot(original, command.memberId),
            permissionsBefore: previewMemberPermissions(original, command.memberId),
            permissionsAfter: previewMemberPermissions(original, command.memberId),
            revision: period.revision,
        });
        return next;
    }
    if (command.type === 'saveGroup') {
        if (target) assertEditable(target);
        if (!PREVIEW_PRESETS.some((p) => p.id === command.presetId)) throw new Error('Vai trò có sẵn không hợp lệ.');
        const value = {
            id: target?.id || meta.id,
            name: command.name.trim(),
            description: command.description.trim(),
            permissions: [...new Set(command.permissions)],
            duty: command.presetId === 'TREASURER' ? 'TREASURER' : null,
            memberIds: target?.memberIds || [],
            protected: false,
        };
        if (target) period.groups = period.groups.map((g) => (g.id === target.id ? value : g));
        else period.groups.push(value);
    } else if (command.type === 'assign') {
        assertEditable(target);
        target.memberIds = [...new Set([...target.memberIds, ...command.memberIds])];
    } else if (command.type === 'remove') {
        assertEditable(target);
        target.memberIds = target.memberIds.filter((id) => id !== command.memberId);
    } else if (command.type === 'transfer') {
        assertEditable(target);
        const destination = period.groups.find((g) => g.id === command.destinationId);
        assertEditable(destination);
        if (target.id === destination.id || !target.memberIds.includes(command.memberId))
            throw new Error('Chọn group đích khác group nguồn.');
        if (destination.memberIds.includes(command.memberId))
            throw new Error('Thành viên đã thuộc group đích. Dùng gỡ phân công group nguồn nếu cần.');
        target.memberIds = target.memberIds.filter((id) => id !== command.memberId);
        destination.memberIds = [...new Set([...destination.memberIds, command.memberId])];
    } else if (command.type === 'deleteGroup') {
        assertEditable(target);
        period.groups = period.groups.filter((g) => g.id !== target.id);
    } else throw new Error('Thao tác không được hỗ trợ.');
    validateGroups(period.groups);
    if (JSON.stringify(period.groups) === JSON.stringify(original.groups)) throw new Error('Chưa có thay đổi để lưu.');
    period.revision++;
    const common = {
        changeSetId: meta.id,
        type: command.type,
        at: meta.at,
        actor: meta.actor,
        reason: command.reason.trim(),
        revision: period.revision,
    };
    const changedGroupId = target?.id || meta.id;
    period.history.push({
        ...common,
        id: `${meta.id}:group`,
        memberId: null,
        groupId: changedGroupId,
        groupName: target?.name || command.name,
        groupBefore: copy(original.groups.find((g) => g.id === changedGroupId) || null),
        groupAfter: copy(period.groups.find((g) => g.id === changedGroupId) || null),
        before: [],
        after: [],
        permissionsBefore: [],
        permissionsAfter: [],
    });
    for (const member of PREVIEW_MEMBERS) {
        const before = groupSnapshot(original, member.id),
            after = groupSnapshot(period, member.id);
        const permissionsBefore = previewMemberPermissions(original, member.id),
            permissionsAfter = previewMemberPermissions(period, member.id);
        if (
            JSON.stringify(before) !== JSON.stringify(after) ||
            JSON.stringify(permissionsBefore) !== JSON.stringify(permissionsAfter)
        )
            period.history.push({
                ...common,
                id: `${meta.id}:${member.id}`,
                memberId: member.id,
                before,
                after,
                permissionsBefore,
                permissionsAfter,
            });
    }
    return next;
}
