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
    actions: [
        newAction({ name: 'Check-in', expectedPeople: 100, maxAwardCount: 100, verificationMethod: 'ATTENDANCE' }),
        newAction({ name: 'Staff supporting', contributionRole: 'Organizer', expectedPeople: 10, maxAwardCount: 10 }),
        newAction({ name: 'Hosting', basePoints: 75, contributionRole: 'Leader', expectedPeople: 2, maxAwardCount: 2 }),
    ],
    recruitment: { enabled: false, visibility: 'PUBLIC', eligibility: 'SCHOOL_STUDENTS', actionIds: [] },
});
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
    return Boolean(access.isManager); // Compatibility until scoped capabilities are returned by Clubs API.
}
export function validateApplication(draft, now = Date.now(), throughStage = 3) {
    if (!Number.isSafeInteger(Number(draft.clubId)) || Number(draft.clubId) <= 0) return 'CLB không hợp lệ.';
    if (!draft.period.trim()) return 'Vui lòng nhập kỳ hoạt động.';
    if (!draft.title.trim()) return 'Vui lòng nhập tên hoạt động.';
    if (!draft.location.trim()) return 'Vui lòng nhập địa điểm hoạt động.';
    if (!draft.description.trim()) return 'Vui lòng nhập nội dung hoạt động.';
    const start = Date.parse(`${draft.startTime}:00+07:00`),
        end = Date.parse(`${draft.endTime}:00+07:00`);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start <= now || end <= start)
        return 'Thời gian bắt đầu phải ở tương lai; thời gian kết thúc phải sau bắt đầu.';
    if (!ACTIVITY_SCALES.some(([id]) => id === draft.scale)) return 'Quy mô hoạt động không hợp lệ.';
    if (throughStage === 0) return '';
    if (!draft.actions.length) return 'Cần ít nhất một action.';
    if (new Set(draft.actions.map((action) => action.clientId)).size !== draft.actions.length)
        return 'Mã action bị trùng.';
    for (const action of draft.actions) {
        if (!action.name.trim()) return 'Nhập tên cho tất cả action.';
        if (!Number.isFinite(Number(action.basePoints)) || Number(action.basePoints) <= 0)
            return `Điểm nền của ${action.name} phải lớn hơn 0.`;
        if (
            !['ACTIVITY', 'OVERRIDE'].includes(action.scaleSource) ||
            !Number.isFinite(actionEstimate(action, draft.scale).rawXp)
        )
            return 'Vai trò hoặc quy mô action không hợp lệ.';
        for (const field of ['expectedPeople', 'expectedOccurrencesPerPerson', 'maxAwardsPerPerson', 'maxAwardCount']) {
            if (!Number.isSafeInteger(Number(action[field])) || Number(action[field]) <= 0)
                return `Số người, số lượt và giới hạn của ${action.name} phải là số nguyên dương.`;
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
    }
    return '';
}
// Return the owning step so both step navigation and final submit validate the same draft.
export function applicationValidationIssue(draft, throughStage = 3, now = Date.now()) {
    for (let stage = 0; stage <= Math.min(throughStage, 2); stage++) {
        const message = validateApplication(draft, now, stage);
        if (message) {
            let field;
            if (stage === 0) {
                field = !draft.period.trim()
                    ? 'period'
                    : !draft.title.trim()
                      ? 'title'
                      : !draft.location.trim()
                        ? 'location'
                        : !draft.description.trim()
                          ? 'description'
                          : !Number.isFinite(Date.parse(`${draft.startTime}:00+07:00`)) ||
                              Date.parse(`${draft.startTime}:00+07:00`) <= now
                            ? 'startTime'
                            : 'endTime';
            }
            return { message, stage, field };
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
        recruitment: draft.recruitment.enabled
            ? {
                  visibility: draft.recruitment.visibility,
                  eligibility: draft.recruitment.eligibility,
                  positions: draft.recruitment.actionIds.map((id) => ({
                      actionClientId: id,
                      capacity: Number(draft.actions.find((action) => action.clientId === id).expectedPeople),
                  })),
              }
            : null,
    }; // Totals and multipliers are server-derived, never accepted as authoritative client input.
}
