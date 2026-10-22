export const REPORT_EDITOR_STAGES = ['Thông tin chung', 'Hoạt động', 'Đánh giá', 'Báo cáo Xperience Point', 'Xem trước & nộp'];
export const xpReportApplicable = (type) => ['CLUB_ACTIVITY', 'CLUB_TERM_END'].includes(type);
export const xpReportTotal = (rows) => rows.reduce((sum, row) => sum + row.rawPoints, 0);

export function reportXpScope(draft, reportId) {
    const match = /^CLUB_ACTIVITY:([1-9]\d*)$/.exec(draft.tag || '');
    return {
        clubId: Number(draft.clubId),
        period: draft.period.trim(),
        reportType: draft.reportType,
        activityId: match ? Number(match[1]) : null,
        reportId: reportId ? Number(reportId) : null,
    };
}

export function validateReportXp(value, scope) {
    if (
        !Number.isSafeInteger(scope.clubId) ||
        scope.clubId <= 0 ||
        !scope.period ||
        (scope.reportType === 'CLUB_ACTIVITY' && (!Number.isSafeInteger(scope.activityId) || scope.activityId <= 0)) ||
        !value ||
        String(value.clubId) !== String(scope.clubId) ||
        value.period !== scope.period ||
        value.reportType !== scope.reportType ||
        String(value.activityId ?? '') !== String(scope.activityId ?? '') ||
        (scope.reportId && String(value.reportId) !== String(scope.reportId)) ||
        !Number.isSafeInteger(value.version) ||
        value.version < 1 ||
        !Number.isSafeInteger(value.sourceVersion) ||
        value.sourceVersion < 1 ||
        !Number.isFinite(value.budgetRaw) ||
        value.budgetRaw < 0 ||
        !Array.isArray(value.rows) ||
        !Array.isArray(value.changes)
    )
        throw new Error('Dữ liệu báo cáo Xperience Point không đúng CLB, kỳ, hoạt động hoặc phiên bản.');
    const sources = new Set();
    for (const row of value.rows) {
        if (
            !row.sourceId ||
            !row.studentCode ||
            !row.actionId ||
            !row.actionTitle ||
            !row.activityId ||
            (scope.activityId && String(row.activityId) !== String(scope.activityId)) ||
            !Number.isSafeInteger(row.quantity) ||
            row.quantity < 0 ||
            !Number.isFinite(row.points) ||
            row.points < 0 ||
            !Number.isFinite(row.rawPoints) ||
            row.rawPoints < 0 ||
            Math.abs(row.rawPoints - row.quantity * row.points) > 0.000001 ||
            typeof row.evidence !== 'string' ||
            !row.evidence.trim() ||
            sources.has(String(row.sourceId))
        )
            throw new Error('Dòng Xperience Point thiếu nguồn, sinh viên, action, minh chứng hoặc có số điểm không hợp lệ.');
        sources.add(String(row.sourceId));
    }
    for (const change of value.changes) {
        if (
            !change.id ||
            !change.studentCode ||
            !change.actionId ||
            !change.actionTitle ||
            !change.sourceId ||
            typeof change.actor !== 'string' ||
            typeof change.reason !== 'string' ||
            !Number.isFinite(Date.parse(change.at)) ||
            !change.after ||
            !Number.isSafeInteger(change.after.quantity) ||
            change.after.quantity < 0 ||
            !Number.isFinite(change.after.rawPoints) ||
            change.after.rawPoints < 0 ||
            typeof change.after.evidence !== 'string' ||
            (change.before != null &&
                (!Number.isSafeInteger(change.before.quantity) ||
                    change.before.quantity < 0 ||
                    !Number.isFinite(change.before.rawPoints) ||
                    change.before.rawPoints < 0 ||
                    typeof change.before.evidence !== 'string'))
        )
            throw new Error('Lịch sử thay đổi Xperience Point trả về không hợp lệ.');
    }
    if (xpReportTotal(value.rows) > value.budgetRaw) throw new Error('Bảng Xperience Point vượt ngân sách điểm thô.');
    return value;
}

export function editReportXp(snapshot, sourceId, edit, actor, at = new Date().toISOString()) {
    if (snapshot.capabilities?.canEdit !== true) throw new Error('Bạn không có quyền chỉnh sửa bảng Xperience Point này.');
    const before = snapshot.rows.find((row) => row.sourceId === sourceId);
    if (!before) throw new Error('Không tìm thấy dòng Xperience Point. Tự điền lại dữ liệu.');
    const quantity = Number(edit.quantity),
        evidence = edit.evidence.trim(),
        reason = edit.reason.trim();
    if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error('Số lượt phải là số nguyên từ 0 trở lên.');
    if (!evidence || reason.length < 5) throw new Error('Nhập minh chứng và lý do chỉnh sửa ít nhất 5 ký tự.');
    const after = { ...before, quantity, evidence, rawPoints: quantity * before.points };
    if (
        !Number.isFinite(after.rawPoints) ||
        xpReportTotal(snapshot.rows) - before.rawPoints + after.rawPoints > snapshot.budgetRaw
    )
        throw new Error('Điểm đề xuất vượt ngân sách Xperience Point của hoạt động.');
    if (quantity === before.quantity && evidence === before.evidence) throw new Error('Dòng Xperience Point chưa có thay đổi.');
    return {
        ...snapshot,
        rows: snapshot.rows.map((row) => (row.sourceId === sourceId ? after : row)),
        changes: [
            ...snapshot.changes,
            {
                id: crypto.randomUUID(),
                sourceId,
                studentCode: before.studentCode,
                actionId: before.actionId,
                actionTitle: before.actionTitle,
                activityId: before.activityId,
                before: { ...before },
                after: { ...after },
                reason,
                actor,
                at,
            },
        ],
        dirty: true,
    };
}

export function mergeReportXp(current, incoming) {
    if (!current?.dirty) return incoming;
    const edited = new Set(current.changes.slice(current.baseChangeCount).map((change) => String(change.sourceId)));
    const rows = incoming.rows.map((row) => {
        const previous = current.rows.find((old) => String(old.sourceId) === String(row.sourceId));
        if (!edited.has(String(row.sourceId))) return row;
        if (
            !previous ||
            previous.points !== row.points ||
            String(previous.actionId) !== String(row.actionId) ||
            previous.studentCode !== row.studentCode
        )
            throw new Error('Nguồn của dòng đã sửa thay đổi. Lưu hoặc đối chiếu lại trước khi tự điền.');
        return previous;
    });
    if ([...edited].some((id) => !incoming.rows.some((row) => String(row.sourceId) === id)))
        throw new Error('Một nguồn đã sửa không còn trong dữ liệu. Đối chiếu lại trước khi tự điền.');
    if (current.version !== incoming.version)
        throw new Error('Bảng Xperience Point trên máy chủ đã thay đổi. Tải lại báo cáo trước khi tiếp tục.');
    if (xpReportTotal(rows) > incoming.budgetRaw)
        throw new Error('Dữ liệu tự điền mới vượt ngân sách cùng các dòng đã sửa.');
    return {
        ...incoming,
        rows,
        changes: [...incoming.changes, ...current.changes.slice(current.baseChangeCount)],
        baseChangeCount: incoming.changes.length,
        dirty: true,
    };
}

export function reportXpPayload(snapshot) {
    return {
        expectedVersion: snapshot.version,
        sourceVersion: snapshot.sourceVersion,
        rows: snapshot.rows.map(({ sourceId, quantity, evidence }) => ({ sourceId, quantity, evidence })),
        changes: snapshot.changes.slice(snapshot.baseChangeCount).map(({ sourceId, reason, at, before, after }) => ({
            sourceId,
            reason,
            at,
            before: { quantity: before.quantity, evidence: before.evidence },
            after: { quantity: after.quantity, evidence: after.evidence },
        })),
    };
}

export function validateSavedReportXp(value, submitted, scope) {
    validateReportXp(value, scope);
    if (
        value.version <= submitted.version ||
        value.sourceVersion !== submitted.sourceVersion ||
        value.rows.length !== submitted.rows.length ||
        submitted.rows.some(
            (row) =>
                !value.rows.some(
                    (saved) =>
                        String(saved.sourceId) === String(row.sourceId) &&
                        String(saved.actionId) === String(row.actionId) &&
                        String(saved.activityId) === String(row.activityId) &&
                        saved.studentCode === row.studentCode &&
                        saved.points === row.points &&
                        saved.rawPoints === row.rawPoints &&
                        saved.quantity === row.quantity &&
                        saved.evidence === row.evidence,
                ),
        ) ||
        submitted.changes
            .slice(submitted.baseChangeCount)
            .some(
                (change) =>
                    !value.changes.some(
                        (saved) =>
                            String(saved.sourceId) === String(change.sourceId) &&
                            saved.reason === change.reason &&
                            saved.before?.quantity === change.before.quantity &&
                            saved.after.quantity === change.after.quantity &&
                            saved.before?.evidence === change.before.evidence &&
                            saved.after.evidence === change.after.evidence,
                    ),
            )
    )
        throw new Error('Chưa xác nhận máy chủ đã lưu đúng bảng Xperience Point và lịch sử. Báo cáo chưa được nộp.');
    return value;
}
