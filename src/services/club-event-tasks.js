import { getActivityStaffing } from './activity-staffing.js';

async function allPages(read, key) {
    const rows = [];
    let total;
    for (let page = 1; page <= 100; page++) {
        const value = await read(page);
        if (Array.isArray(value)) {
            if (page !== 1) throw new Error('Nguồn sự kiện đã đổi định dạng phân trang.');
            rows.push(...value);
            total = rows.length;
            break;
        }
        const count = value?.totalItems ?? value?.total;
        if (
            !Array.isArray(value?.items) ||
            value.page !== page ||
            !Number.isSafeInteger(count) ||
            count < 0 ||
            !Number.isSafeInteger(value.totalPages) ||
            value.totalPages < 0 ||
            (total != null && count !== total)
        )
            throw new Error('Chưa tải được danh sách sự kiện/tuyển dụng đầy đủ.');
        total = count;
        rows.push(...value.items);
        if (page >= value.totalPages) break;
        if (page === 100) throw new Error('Danh sách sự kiện quá lớn để đối chiếu trong một lượt.');
    }
    if (rows.length !== total || new Set(rows.map(key)).size !== rows.length)
        throw new Error('Danh sách sự kiện/tuyển dụng đã thay đổi. Tải lại để đối chiếu.');
    return rows;
}

export async function loadClubEventTasks(api, clubId, actorId, filters = {}, manager = false) {
    const scoped = `/api/clubs/${encodeURIComponent(clubId)}`;
    const sources = await Promise.allSettled([
        allPages(
            (page) =>
                api.request(
                    scoped + '/activity-recruitments?' + new URLSearchParams({ ...filters, page, pageSize: 100 }),
                ),
            (row) => String(row.id),
        ),
        allPages(
            (page) => api.getActivities(clubId, { ...filters, page, pageSize: 100 }),
            (row) => String(row.id),
        ),
    ]);
    const warnings = sources.filter((result) => result.status === 'rejected').map((result) => result.reason.message);
    if (sources.every((result) => result.status === 'rejected')) throw new Error(warnings.join(' '));
    const recruitment = sources[0].status === 'fulfilled' ? sources[0].value : [];
    const activities = sources[1].status === 'fulfilled' ? sources[1].value : [];
    if (
        recruitment.some(
            (row) =>
                !row.id ||
                !row.activityId ||
                String(row.clubId) !== String(clubId) ||
                !['PUBLIC', 'PRIVATE'].includes(row.visibility),
        ) ||
        activities.some((row) => !row.id || String(row.clubId) !== String(clubId))
    )
        throw new Error('Nhiệm vụ chưa khớp CLB đang mở.');
    const cards = recruitment
        .filter((row) => row.canView === true || row.visibility === 'PUBLIC' || manager)
        .map((row) => ({ ...row, key: `recruitment:${row.id}`, kind: 'recruitment' }));
    const events = [
        ...new Map(
            [
                ...activities.map((row) => ({ id: row.id, title: row.title })),
                ...recruitment.map((row) => ({ id: row.activityId, title: row.activityTitle })),
            ].map((row) => [String(row.id), row]),
        ).values(),
    ];
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(4, events.length) }, async () => {
            while (next < events.length) {
                const event = events[next++];
                try {
                    const staffing = await getActivityStaffing(api, event.id);
                    const assignments = staffing.assignments.filter(
                        (row) =>
                            row.status !== 'REMOVED' &&
                            (manager ||
                                staffing.capabilities?.canManageAssignments === true ||
                                String(row.userId) === String(actorId)),
                    );
                    if (!assignments.length) continue;
                    cards.push({
                        key: `assignments:${event.id}`,
                        kind: 'assignments',
                        activityId: event.id,
                        activityTitle: event.title,
                        title: event.title,
                        assignments: assignments.map((row) => ({
                            ...row,
                            actionTitle:
                                row.actionName ||
                                row.actionTitle ||
                                staffing.actions.find((action) => String(action.id) === String(row.actionRuleId))
                                    ?.name ||
                                staffing.actions.find((action) => String(action.id) === String(row.actionRuleId))
                                    ?.title ||
                                'Phân công sự kiện',
                        })),
                    });
                } catch (issue) {
                    // Legacy events without action staffing and denied scopes are not task sources.
                    if (![403, 404].includes(issue.status))
                        warnings.push(`Không tải được phân công của ${event.title || event.id}: ${issue.message}`);
                }
            }
        }),
    );
    return {
        items: cards.sort((a, b) => Number(a.activityId) - Number(b.activityId) || a.kind.localeCompare(b.kind)),
        warnings: [...new Set(warnings)],
    };
}
