import test from 'node:test';
import assert from 'node:assert/strict';
import { loadClubEventTasks } from './club-event-tasks.js';
const staffing = (id, assignments) => ({
    activityId: id,
    version: 1,
    actions: [{ id: 10, title: 'Hậu cần' }],
    assignments,
    capabilities: {},
});
test('event tasks load complete recruitment pages and direct assignments without recruitment notices', async () => {
    const api = {
        getActivities: async () => [
            { id: 1, clubId: 2, title: 'Có tuyển dụng' },
            { id: 3, clubId: 2, title: 'Phân công trực tiếp' },
        ],
        request: async (path) => {
            if (path.includes('activity-recruitments')) {
                const page = Number(new URL(path, 'https://test').searchParams.get('page'));
                return {
                    page,
                    totalItems: 2,
                    totalPages: 2,
                    items: [
                        {
                            id: page,
                            activityId: 1,
                            clubId: 2,
                            activityTitle: 'Có tuyển dụng',
                            title: `Tin ${page}`,
                            visibility: 'PRIVATE',
                            canView: true,
                        },
                    ],
                };
            }
            if (path.includes('/activities/1/')) return staffing(1, []);
            return staffing(3, [
                { id: 'mine', actionRuleId: 10, userId: 20, status: 'ASSIGNED' },
                { id: 'other', userId: 30, status: 'ASSIGNED' },
                { id: 'removed', userId: 20, status: 'REMOVED' },
            ]);
        },
    };
    const value = await loadClubEventTasks(api, 2, 20);
    assert.equal(value.items.length, 3);
    assert.equal(value.items[2].activityId, 3);
    assert.deepEqual(
        value.items[2].assignments.map((row) => row.id),
        ['mine'],
    );
    assert.equal(value.items[2].assignments[0].actionTitle, 'Hậu cần');
    assert.deepEqual(value.warnings, []);
});
test('event tasks reject a foreign club and distinguish unavailable staffing from an empty task list', async () => {
    const empty = { page: 1, totalItems: 0, totalPages: 0, items: [] };
    await assert.rejects(
        loadClubEventTasks({ getActivities: async () => [{ id: 1, clubId: 9 }], request: async () => empty }, 2, 20),
        /khớp CLB/,
    );
    const result = await loadClubEventTasks(
        {
            getActivities: async () => [{ id: 1, clubId: 2, title: 'Event' }],
            request: async (path) => {
                if (path.includes('activity-recruitments')) return empty;
                throw Object.assign(new Error('Dependency unavailable'), { status: 503 });
            },
        },
        2,
        20,
    );
    assert.equal(result.items.length, 0);
    assert.match(result.warnings[0], /Dependency unavailable/);
});
test('event tasks keep authorized event-manager assignments and reject mismatched staffing identities', async () => {
    const empty = { page: 1, totalItems: 0, totalPages: 0, items: [] };
    const api = {
        getActivities: async () => [{ id: 1, clubId: 2 }],
        request: async (path) =>
            path.includes('activity-recruitments')
                ? empty
                : {
                      ...staffing(1, [{ id: 'other', userId: 30, status: 'ASSIGNED' }]),
                      capabilities: { canManageAssignments: true },
                  },
    };
    assert.equal((await loadClubEventTasks(api, 2, 20)).items[0].assignments.length, 1);
    api.request = async (path) => (path.includes('activity-recruitments') ? empty : staffing(99, []));
    assert.equal((await loadClubEventTasks(api, 2, 20)).warnings.length, 1);
});
