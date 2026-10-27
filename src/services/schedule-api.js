const key = () => globalThis.crypto.randomUUID();
const segment = (value) => encodeURIComponent(value);
const periodPath = (period) => `${segment(period.year)}/${segment(period.term)}`;

export function createAcademicCalendarApi(api) {
    return {
        get: (_user, period) => api.request(`/api/academic-calendar/${periodPath(period)}`),
        save: (_user, period, calendar) =>
            api.request(`/api/academic-calendar/${periodPath(period)}`, {
                method: 'PUT',
                headers: { 'Idempotency-Key': key() },
                body: JSON.stringify({
                    termStartDate: calendar.termStartDate,
                    block10StartDate: calendar.block10StartDate,
                    block3StartDate: calendar.block3StartDate,
                    expectedVersion: calendar.version,
                }),
            }),
    };
}

// Version state belongs to the mounted account/period, never to browser storage.
export function createStudyScheduleApi(api) {
    const versions = new Map();
    const scope = (user, period) => `${user?.id}:${periodPath(period)}/${period.block}`;
    const path = (period) => `/api/users/me/study-schedule/${periodPath(period)}/${segment(period.block)}`;
    const remember = (user, period, result) => {
        if (typeof result?.version !== 'string' || typeof result?.calendarVersion !== 'string')
            throw new Error('Máy chủ chưa trả version lịch học hợp lệ. Hãy tải lại lịch.');
        versions.set(scope(user, period), {
            expectedVersion: result.version,
            expectedCalendarVersion: result.calendarVersion,
        });
        return result;
    };
    const current = (user, period) => {
        const value = versions.get(scope(user, period));
        if (!value) throw new Error('Hãy tải lịch học trước khi chỉnh sửa.');
        return value;
    };
    const mutate = async (user, period, endpoint, method, body) => {
        const version = current(user, period);
        try {
            const result = await api.request(endpoint, {
                method,
                headers: { 'Idempotency-Key': key() },
                ...(method === 'DELETE' ? {} : { body: JSON.stringify({ ...body, ...version }) }),
            });
            if (method === 'DELETE') {
                // DELETE is 204; read the new block version before allowing the next edit.
                versions.delete(scope(user, period));
                remember(user, period, await api.request(path(period)));
            } else remember(user, period, result);
            return result;
        } catch (error) {
            if (error.status === 409) versions.delete(scope(user, period));
            throw error;
        }
    };
    return {
        async get(user, period) {
            return remember(user, period, await api.request(path(period)));
        },
        putSlot(user, period, week, day, slotId, value) {
            return mutate(user, period, `${path(period)}/${week}/${segment(day)}/${segment(slotId)}`, 'PUT', {
                subject: value.subject,
                room: value.room,
            });
        },
        deleteSlot(user, period, week, day, slotId) {
            const query = new URLSearchParams(current(user, period));
            return mutate(
                user,
                period,
                `${path(period)}/${week}/${segment(day)}/${segment(slotId)}?${query}`,
                'DELETE',
            );
        },
        bulkImport(user, period, entries, mode) {
            return mutate(user, period, `${path(period)}/bulk-import`, 'POST', { entries, mode });
        },
    };
}
