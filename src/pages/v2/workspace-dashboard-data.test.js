import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { isOngoingWorkspaceActivity, summarizeWorkspaceDashboard, useWorkspaceDashboard } from './workspace-dashboard-data.js';
import { useActivityDetail } from './activity-data.js';

const ok = (value) => ({ status: 'fulfilled', value });
const failed = { status: 'rejected', reason: new Error('unavailable') };

// Run the real hook's effects deterministically without a browser or a test-renderer dependency.
function dashboardHarness(hook = useWorkspaceDashboard) {
    const dispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher;
    const slots = [];
    let cursor;
    let effects;
    return {
        render(...args) {
            cursor = 0;
            effects = [];
            const previous = dispatcher.current;
            dispatcher.current = {
                useState(initial) {
                    const index = cursor++;
                    if (!slots[index]) slots[index] = { value: initial };
                    return [
                        slots[index].value,
                        (value) => {
                            slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
                        },
                    ];
                },
                useEffect(effect, deps) {
                    const index = cursor++;
                    const old = slots[index];
                    if (!old || deps.some((value, i) => !Object.is(value, old.deps[i]))) {
                        effects.push(() => {
                            old?.cleanup?.();
                            slots[index] = { deps, cleanup: effect() };
                        });
                    }
                },
            };
            let result;
            try {
                result = hook(...args);
            } finally {
                dispatcher.current = previous;
            }
            effects.forEach((effect) => effect());
            return result;
        },
        dispose() {
            slots.forEach((slot) => slot.cleanup?.());
        },
    };
}

const flushRequests = () => new Promise((resolve) => setImmediate(resolve));

test('direct activity detail rejects a late old ID response and loads completed activities independently of the feed', async () => {
    const requests = [];
    let resolveOld;
    const api = {
        getStudentActivity(id) {
            requests.push(id);
            return id === 1
                ? new Promise((resolve) => {
                      resolveOld = resolve;
                  })
                : Promise.resolve({ id, clubId: 7, status: 'Completed', title: 'Completed event' });
        },
    };
    const harness = dashboardHarness(useActivityDetail);
    try {
        assert.equal(harness.render(api, 'account', '1').status, 'loading');
        await flushRequests();
        harness.render(api, 'account', '2');
        await flushRequests();
        resolveOld({ id: 1, clubId: 7, status: 'Scheduled' });
        await flushRequests();
        const current = harness.render(api, 'account', '2');
        assert.equal(current.status, 'populated');
        assert.equal(current.data.id, '2');
        assert.equal(current.data.status, 'COMPLETED');
        harness.render(api, 'account', 'invalid');
        assert.equal(harness.render(api, 'account', 'invalid').status, 'not-found');
        assert.deepEqual(requests, [1, 2]);
    } finally {
        harness.dispose();
    }
});

test('dashboard hook leaves loading, reloads on tab entry and semester change, and exposes API failures', async () => {
    const requests = [];
    let rejectActivities = false;
    const api = {
        getClub: async () => ({ memberCount: 0 }),
        getActivities: async (clubId, query) => {
            requests.push({ clubId, query });
            if (rejectActivities) throw new Error('activities unavailable');
            return [{ id: 7, title: 'Workshop', status: 'Scheduled' }];
        },
        getReports: async () => ({ total: 0 }),
    };
    const harness = dashboardHarness();
    const semester = { id: 'FA2026', startUtc: '2026-09-01T00:00:00Z', endUtc: '2027-01-01T00:00:00Z' };
    let args = [api, 1, false, 'account', semester, 'activities-entry'];
    try {
        assert.equal(harness.render(...args).status, 'loading');
        await flushRequests();
        assert.equal(harness.render(...args).status, 'ready');
        assert.equal(harness.render(...args).data.activities[0].id, 7);
        assert.equal(requests.length, 1);
        args[5] = 'attendance-entry';
        assert.equal(harness.render(...args).status, 'loading');
        await flushRequests();
        assert.equal(harness.render(...args).status, 'ready');
        assert.equal(requests.length, 2);
        args[4] = { id: 'SU2026' };
        assert.equal(harness.render(...args).status, 'loading');
        await flushRequests();
        const ready = harness.render(...args);
        assert.equal(ready.status, 'ready');
        assert.deepEqual(requests[0].query, { from: semester.startUtc, to: semester.endUtc });
        assert.deepEqual(requests[2].query, {});
        rejectActivities = true;
        ready.retry();
        harness.render(...args);
        await flushRequests();
        const failure = harness.render(...args);
        assert.equal(failure.status, 'ready');
        assert.equal(failure.data.activityAvailable, false);
    } finally {
        harness.dispose();
    }
});

test('dashboard ignores late results from the previous semester and resolves an invalid club', async () => {
    let resolveOld;
    const api = {
        getClub: async () => ({}),
        getActivities: (_clubId, query) =>
            query.from
                ? new Promise((resolve) => {
                      resolveOld = resolve;
                  })
                : Promise.resolve([{ id: 2, status: 'Scheduled' }]),
        getReports: async () => ({}),
    };
    const harness = dashboardHarness();
    const old = { id: 'old', startUtc: '2026-01-01T00:00:00Z', endUtc: '2026-02-01T00:00:00Z' };
    try {
        harness.render(api, 1, false, 'account', old);
        harness.render(api, 1, false, 'account', { id: 'new' });
        await flushRequests();
        resolveOld([{ id: 1, status: 'Scheduled' }]);
        await flushRequests();
        assert.equal(harness.render(api, 1, false, 'account', { id: 'new' }).data.activities[0].id, 2);
        harness.render(api, null, false, 'account', { id: 'new' });
        assert.equal(harness.render(api, null, false, 'account', { id: 'new' }).status, 'unavailable');
    } finally {
        harness.dispose();
    }
});

test('dashboard counts backend records and chooses the next scheduled activity', () => {
    const summary = summarizeWorkspaceDashboard(
        [
            ok({ members: [{ status: 'Approved' }, { status: 'Pending' }, { status: 'Approved' }] }),
            ok([
                { id: 1, status: 'Scheduled', title: 'Later', startTimeUtc: '2026-10-10T08:00:00Z' },
                { id: 2, status: 'Cancelled', title: 'Cancelled', startTimeUtc: '2026-10-06T08:00:00Z' },
                { id: 3, status: 'Scheduled', title: 'Next', startTimeUtc: '2026-10-06T08:00:00Z' },
                { id: 4, status: 'Completed', title: 'Past', startTimeUtc: '2026-09-01T08:00:00Z' },
            ]),
            ok([{ status: 'Pending' }, { status: 'Approved' }]),
            ok({ total: 4, items: [{}] }),
        ],
        true,
        Date.parse('2026-10-05T00:00:00Z'),
    );
    assert.equal(summary.memberCount, 2);
    assert.equal(summary.approvedMembers.length, summary.memberCount);
    assert.equal(summary.activityCount, 3);
    assert.equal(summary.upcomingCount, 2);
    assert.equal(summary.pendingApplications, 1);
    assert.equal(summary.approvedReportCount, 4);
    assert.equal(summary.upcomingActivity.title, 'Next');
});

test('dashboard keeps an empty result distinct from a failed source', () => {
    const summary = summarizeWorkspaceDashboard([ok({ memberCount: 0 }), ok([]), failed, failed], true);
    assert.equal(summary.memberCount, 0);
    assert.equal(summary.activityCount, 0);
    assert.equal(summary.upcomingCount, 0);
    assert.equal(summary.pendingApplications, null);
    assert.equal(summary.approvedReportCount, null);
    assert.equal(summary.upcomingActivity, null);
    assert.equal(summary.activityAvailable, true);
});

test('home activity filter matches the rail badge regardless of start date', () => {
    const summary = summarizeWorkspaceDashboard([
        ok({}),
        ok([
            { id: 1, status: 'Scheduled', startTimeUtc: '2020-01-01T00:00:00Z' },
            { id: 2, status: 'Upcoming' },
            { id: 3, status: 'Live', startTimeUtc: 'invalid' },
            { id: 4, status: 'Completed' },
            { id: 5, status: 'Cancelled' },
            { id: 6, status: 'Draft' },
        ]),
        ok([]),
        ok([]),
    ], true);
    const homeActivities = summary.activities.filter(isOngoingWorkspaceActivity);
    assert.deepEqual(homeActivities.map((activity) => activity.id), [1, 2, 3]);
    assert.equal(summary.ongoingActivityCount, 3);
    assert.equal(homeActivities.length, summary.ongoingActivityCount);
});
