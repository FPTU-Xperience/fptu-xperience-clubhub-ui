import { clubCapability } from '../../../services/club-capabilities.js';
import { tagSelectionPayload } from '../../../services/discovery-tags.js';
export const ACTION_ROLES = [
    ['Participant', 'Người tham gia', 1],
    ['Contributor', 'Người đóng góp', 1.6],
    ['Product', 'Tạo sản phẩm', 2.2],
    ['Organizer', 'Ban tổ chức / hỗ trợ', 3],
    ['Leader', 'Chủ trì', 4],
];
export const ACTIVITY_SCALES = [
    ['Club', 'Nội bộ CLB', 1],
    ['Campus', 'Toàn trường / cơ sở', 1.3],
    ['FptEducation', 'FPT Education', 1.6],
    ['National', 'Toàn quốc', 2.2],
    ['International', 'Quốc tế', 3],
];
export const formatXp = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);
export const activityTimeUtc = (value) => new Date(`${value}:00+07:00`).toISOString();
export const newAction = (values = {}) => ({
    clientId: crypto.randomUUID(),
    name: '',
    basePoints: 50,
    contributionRole: 'Participant',
    scaleSource: 'ACTIVITY',
    scale: 'Club',
    expectedPeople: 1,
    expectedOccurrencesPerPerson: 1,
    maxAwardsPerPerson: 1,
    maxAwardCount: 1,
    verificationMethod: 'WORK_REVIEW',
    completionMode: 'FULL_ONLY',
    stackingRule: 'ADDITIVE',
    ...values,
});
export const newApplication = (clubId, period = '') => ({
    clubId,
    period,
    title: '',
    description: '',
    objective: '',
    location: '',
    startTime: '',
    endTime: '',
    scale: 'Club',
    independentActionsConfirmed: false,
    isInternal: true,
    actions: [
        newAction({ name: 'Check-in', expectedPeople: 100, maxAwardCount: 100, verificationMethod: 'ATTENDANCE' }),
        newAction({ name: 'Staff supporting', contributionRole: 'Organizer', expectedPeople: 10, maxAwardCount: 10 }),
        newAction({ name: 'Hosting', basePoints: 75, contributionRole: 'Leader', expectedPeople: 2, maxAwardCount: 2 }),
    ],
    staffing: [],
    recruitment: { enabled: false, visibility: 'PUBLIC', eligibility: 'SCHOOL_STUDENTS', actionIds: [] },
});
export const STAFFING_KINDS = [
    ['HOST', 'Host', 'thành viên nhóm Event', 'Leader'],
    ['STAFF', 'Staff', 'thành viên thường', 'Organizer'],
];
export function staffingAction(actions, kind) {
    const preferredRole = STAFFING_KINDS.find(([id]) => id === kind)?.[3];
    return actions.find((action) => action.contributionRole === preferredRole)?.clientId ?? actions[0]?.clientId ?? '';
}
export const recruitmentCapacity = (draft, action) =>
    Number(action.expectedPeople) - draft.staffing.filter((row) => row.actionClientId === action.clientId).length;
function staffingIssue(draft, candidates) {
    const rows = draft.staffing;
    for (const [kind, label, memberRole] of STAFFING_KINDS) {
        if (!rows.some((row) => row.assignmentKind === kind))
            return { message: `Chọn ít nhất một ${memberRole} làm ${label}.`, field: `staffing-${kind}` };
    }
    if (new Set(rows.map((row) => row.userId)).size !== rows.length)
        return { message: 'Mỗi thành viên chỉ được chọn một lần trong phân công nội bộ.' };
    for (const row of rows) {
        if (candidates && !candidates.some((member) => member.userId === row.userId && member.assignmentKind === row.assignmentKind))
            return { message: 'Thành viên đã chọn không còn đủ điều kiện. Vui lòng chọn lại.', field: `staffing-${row.assignmentKind}` };
        const action = draft.actions.find((item) => item.clientId === row.actionClientId);
        if (!action) return { message: 'Chọn action cho từng người được phân công.', field: `staffing-action-${row.assignmentKind}` };
        if (rows.filter((item) => item.actionClientId === action.clientId).length > Number(action.expectedPeople))
            return { message: `Số người phân công cho ${action.name} vượt số người dự kiến.`, field: `staffing-action-${row.assignmentKind}` };
    }
    return null;
}
export function actionEstimate(action, activityScale) {
    const role = ACTION_ROLES.find(([id]) => id === action.contributionRole)?.[2];
    const scale = ACTIVITY_SCALES.find(
        ([id]) => id === (action.scaleSource === 'ACTIVITY' ? activityScale : action.scale),
    )?.[2];
    const unit = Number(action.basePoints) * Math.min(role * scale, 8);
    const total = unit * Number(action.expectedPeople) * Number(action.expectedOccurrencesPerPerson);
    return { roleMultiplier: role, scaleMultiplier: scale, perOccurrence: unit, rawXp: total };
}
export function applicationEstimate(draft) {
    const actions = draft.actions.map((action) => ({
        clientId: action.clientId,
        ...actionEstimate(action, draft.scale),
    }));
    return { actions, rawXp: actions.reduce((sum, item) => sum + item.rawXp, 0) };
}
export function applicationPermission(access, permission) {
    if (!access) return false;
    if (Array.isArray(access.permissions)) return access.permissions.includes(permission);
    return clubCapability(access, 'event.registrations.manage');
}
const infoFields = [
    ['period', 'kỳ hoạt động', 40],
    ['title', 'tên hoạt động', 200],
    ['location', 'địa điểm hoạt động', 200],
    ['description', 'nội dung hoạt động', 2000],
    ['objective', 'mục tiêu hoạt động', 2000],
];
function activityInfoIssue(draft, now, requireComplete = false, semester) {
    if (!Number.isSafeInteger(Number(draft.clubId)) || Number(draft.clubId) <= 0)
        return { message: 'CLB không hợp lệ.' };
    for (const [field, label, limit] of infoFields) {
        const value = draft[field].trim();
        if (!value && (field !== 'objective' || requireComplete))
            return { field, message: `Vui lòng nhập ${label}.` };
        if (value.length > limit)
            return { field, message: `Giới hạn cho ${label} là ${limit.toLocaleString('vi-VN')} ký tự.` };
    }
    const start = Date.parse(`${draft.startTime}:00+07:00`);
    const end = Date.parse(`${draft.endTime}:00+07:00`);
    if (!Number.isFinite(start) || start <= now)
        return { field: 'startTime', message: 'Thời gian bắt đầu phải ở tương lai.' };
    if (!Number.isFinite(end) || end <= start)
        return { field: 'endTime', message: 'Thời gian kết thúc phải sau thời gian bắt đầu.' };
    if ([semester?.code, semester?.id, semester?.reportPeriod, semester?.invitationCode]
        .some((id) => String(id ?? '').toLowerCase() === draft.period.trim().toLowerCase())) {
        if (start < Date.parse(semester.startUtc))
            return { field: 'startTime', message: 'Thời gian bắt đầu nằm trước kỳ hoạt động.' };
        if (end >= Date.parse(semester.endUtc) + 24 * 60 * 60 * 1000)
            return { field: 'endTime', message: 'Thời gian kết thúc nằm sau kỳ hoạt động.' };
    }
    if (!ACTIVITY_SCALES.some(([id]) => id === draft.scale))
        return { field: 'scale', message: 'Quy mô hoạt động không hợp lệ.' };
    return null;
}
export function validateApplication(draft, now = Date.now(), throughStage = 3) {
    const issue = activityInfoIssue(draft, now);
    if (issue) return issue.message;
    if (throughStage === 0) return '';
    if (!draft.actions.length || draft.actions.length > 100) return 'Hồ sơ cần từ 1 đến 100 action.';
    if (new Set(draft.actions.map((action) => action.clientId)).size !== draft.actions.length)
        return 'Mã action bị trùng.';
    for (const action of draft.actions) {
        if (!action.name.trim()) return 'Nhập tên cho tất cả action.';
        if (action.name.trim().length > 200) return 'Tên action tối đa 200 ký tự.';
        const basePoints = Number(action.basePoints);
        if (!Number.isFinite(basePoints) || basePoints <= 0)
            return `Điểm nền của ${action.name} phải lớn hơn 0.`;
        if (basePoints > 100000 || Number(basePoints.toFixed(4)) !== basePoints)
            return `Điểm nền của ${action.name} tối đa 100.000 và có tối đa 4 chữ số thập phân.`;
        if (
            !['ACTIVITY', 'OVERRIDE'].includes(action.scaleSource) ||
            !Number.isFinite(actionEstimate(action, draft.scale).rawXp)
        )
            return 'Vai trò hoặc quy mô action không hợp lệ.';
        const limits = { expectedPeople: 100000, expectedOccurrencesPerPerson: 1000, maxAwardsPerPerson: 1000, maxAwardCount: 1000000 };
        for (const [field, limit] of Object.entries(limits)) {
            if (!Number.isSafeInteger(Number(action[field])) || Number(action[field]) <= 0)
                return `Số người, số lượt và giới hạn của ${action.name} phải là số nguyên dương.`;
            if (Number(action[field]) > limit)
                return `Số người, số lượt hoặc giới hạn của ${action.name} vượt mức cho phép.`;
        }
        if (
            Number(action.maxAwardsPerPerson) < Number(action.expectedOccurrencesPerPerson) ||
            Number(action.maxAwardCount) < Number(action.expectedPeople) * Number(action.expectedOccurrencesPerPerson)
        )
            return `Giới hạn cấp điểm của ${action.name} phải bao phủ kế hoạch dự kiến.`;
        if (
            !['ATTENDANCE', 'WORK_REVIEW'].includes(action.verificationMethod) ||
            action.completionMode !== 'FULL_ONLY' ||
            action.stackingRule !== 'ADDITIVE'
        )
            return 'Chính sách action không được hỗ trợ trong hồ sơ này.';
    }
    if (
        !Number.isFinite(applicationEstimate(draft).rawXp) ||
        applicationEstimate(draft).rawXp > Number.MAX_SAFE_INTEGER
    )
        return 'Tổng Xperience Point vượt giới hạn tính toán. Vui lòng giảm số lượng hoặc điểm nền.';
    if (!draft.independentActionsConfirmed)
        return 'Xác nhận các action đại diện phần việc độc lập để tránh cộng trùng Xperience Point.';
    if (throughStage === 1) return '';
    if (draft.recruitment.enabled) {
        if (
            !draft.recruitment.actionIds.length ||
            draft.recruitment.actionIds.some((id) => !draft.actions.some((action) => action.clientId === id))
        )
            return 'Chọn ít nhất một action cần tuyển nhân sự.';
        if (
            !['PUBLIC', 'PRIVATE'].includes(draft.recruitment.visibility) ||
            !['SCHOOL_STUDENTS', 'CLUB_MEMBERS'].includes(draft.recruitment.eligibility)
        )
            return 'Phạm vi tuyển dụng không hợp lệ.';
        if (draft.recruitment.visibility === 'PRIVATE' && draft.recruitment.eligibility !== 'CLUB_MEMBERS')
            return 'Tuyển riêng tư chỉ dành cho thành viên CLB.';
        if (draft.actions.some((action) => draft.recruitment.actionIds.includes(action.clientId) && recruitmentCapacity(draft, action) <= 0))
            return 'Chọn action còn vị trí trống để tuyển bổ sung.';
    }
    return '';
}
// Return the owning step so both step navigation and final submit validate the same draft.
export function applicationValidationIssue(draft, throughStage = 3, now = Date.now(), requireComplete = false, candidates, semester) {
    const infoIssue = activityInfoIssue(draft, now, requireComplete, semester);
    if (infoIssue) return { ...infoIssue, stage: 0 };
    for (let stage = 1; stage <= Math.min(throughStage, 2); stage++) {
        const message = validateApplication(draft, now, stage);
        if (message) return { message, stage };
        if (stage === 2 && requireComplete) {
            const issue = staffingIssue(draft, candidates);
            if (issue) return { ...issue, stage };
        }
    }
    return null;
}
export function applicationPayload(draft) {
    return {
        clubId: Number(draft.clubId),
        period: draft.period.trim(),
        title: draft.title.trim(),
        description: draft.description.trim(),
        objective: draft.objective.trim(),
        location: draft.location.trim(),
        startTimeUtc: activityTimeUtc(draft.startTime),
        endTimeUtc: activityTimeUtc(draft.endTime),
        scale: draft.scale,
        independentActionsConfirmed: draft.independentActionsConfirmed,
        isInternal: draft.isInternal !== false,
        ...(draft.discoveryTagDraft && { tagSelection: tagSelectionPayload(draft.discoveryTagDraft) }),
        actions: draft.actions.map((action) => ({
            clientId: action.clientId,
            name: action.name.trim(),
            basePoints: Number(action.basePoints),
            contributionRole: action.contributionRole,
            scaleSource: action.scaleSource,
            scale: action.scaleSource === 'ACTIVITY' ? null : action.scale,
            expectedPeople: Number(action.expectedPeople),
            expectedOccurrencesPerPerson: Number(action.expectedOccurrencesPerPerson),
            maxAwardsPerPerson: Number(action.maxAwardsPerPerson),
            maxAwardCount: Number(action.maxAwardCount),
            verificationMethod: action.verificationMethod,
            completionMode: action.completionMode,
            stackingRule: action.stackingRule,
        })),
        staffing: draft.staffing
            .filter((row) => draft.actions.some((action) => action.clientId === row.actionClientId))
            .map(({ userId, actionClientId, assignmentKind }) => ({ userId, actionClientId, assignmentKind })),
        recruitment: draft.recruitment.enabled
            ? {
                  visibility: draft.recruitment.visibility,
                  eligibility: draft.recruitment.eligibility,
                  positions: draft.recruitment.actionIds.map((id) => ({
                      actionClientId: id,
                      capacity: recruitmentCapacity(draft, draft.actions.find((action) => action.clientId === id)),
                  })),
              }
            : null,
    }; // Totals and multipliers are server-derived, never accepted as authoritative client input.
}
