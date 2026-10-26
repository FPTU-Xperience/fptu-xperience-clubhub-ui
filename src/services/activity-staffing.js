export function validateStaffing(value, activityId) {
    if (
        String(value?.activityId) !== String(activityId) ||
        !Number.isSafeInteger(value?.version) ||
        value.version < 1 ||
        !Array.isArray(value.actions) ||
        !Array.isArray(value.assignments) ||
        (value.recruitment != null && !Array.isArray(value.recruitment.positions)) ||
        (value.eligibleAssignees != null && !Array.isArray(value.eligibleAssignees)) ||
        value.assignments.some((assignment) => assignment.completions != null && !Array.isArray(assignment.completions))
    )
        throw new Error('Máy chủ chưa trả về dữ liệu phân công và tuyển dụng hợp lệ.');
    return value;
}
export async function getActivityStaffing(api, activityId) {
    return validateStaffing(
        await api.request(`/api/activities/${encodeURIComponent(activityId)}/staffing`),
        activityId,
    );
}
export async function mutateActivityStaffing(api, activityId, path, body, key, method = 'POST') {
    return api.request(`/api/activities/${encodeURIComponent(activityId)}/${path}`, {
        method,
        headers: { 'Idempotency-Key': key },
        body: JSON.stringify(body),
    });
}
export function validateStaffingMutationReceipt(value, activityId, previousVersion) {
    if (
        !value ||
        typeof value.id !== 'string' ||
        !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value.id) ||
        (value.activityId != null && String(value.activityId) !== String(activityId)) ||
        !Number.isSafeInteger(value.version) ||
        value.version <= previousVersion
    )
        throw new Error('Máy chủ chưa xác nhận thay đổi. Vui lòng tải lại trước khi thử tiếp.');
    return value;
}
export function recruitmentPayload(draft, actions) {
    if (!draft.title.trim()) throw new Error('Nhập tên nhiệm vụ tuyển dụng.');
    if (
        !['PUBLIC', 'PRIVATE'].includes(draft.visibility) ||
        !['SCHOOL_STUDENTS', 'CLUB_MEMBERS'].includes(draft.eligibility) ||
        (draft.visibility === 'PRIVATE' && draft.eligibility !== 'CLUB_MEMBERS')
    )
        throw new Error('Phạm vi tuyển dụng không hợp lệ.');
    const positions = draft.positions
        .filter((position) => position.selected)
        .map((position) => ({
            actionRuleId: position.actionRuleId,
            capacity: Number(position.capacity),
            assignmentKind: position.assignmentKind,
        }));
    if (!positions.length) throw new Error('Chọn ít nhất một vị trí gắn với action.');
    for (const position of positions)
        if (
            !actions.some((action) => String(action.id) === String(position.actionRuleId)) ||
            !Number.isSafeInteger(position.capacity) ||
            position.capacity < 1 ||
            !['HOST', 'STAFF'].includes(position.assignmentKind)
        )
            throw new Error('Vị trí cần action hợp lệ, số lượng nguyên dương và loại phân công host/staff.');
    return {
        title: draft.title.trim(),
        description: draft.description.trim(),
        visibility: draft.visibility,
        eligibility: draft.eligibility,
        positions,
    };
}
export const staffingError = (issue) =>
    [404, 405, 501].includes(issue?.status)
        ? 'Máy chủ chưa hỗ trợ phân công và tuyển dụng hoạt động. Chưa có thay đổi nào được xác nhận.'
        : issue?.message || 'Không thể tải hoặc cập nhật phân công và tuyển dụng.';
