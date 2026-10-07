import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeWorkspaceDashboard } from './workspace-dashboard-data.js';

const ok = (value) => ({ status: 'fulfilled', value });
const failed = { status: 'rejected', reason: new Error('unavailable') };

test('dashboard counts backend records and chooses the next scheduled activity', () => {
    const summary = summarizeWorkspaceDashboard([
        ok({ members: [{ status: 'Approved' }, { status: 'Pending' }, { status: 'Approved' }] }),
        ok([
            { id: 1, status: 'Scheduled', title: 'Later', startTimeUtc: '2026-10-10T08:00:00Z' },
            { id: 2, status: 'Cancelled', title: 'Cancelled', startTimeUtc: '2026-10-06T08:00:00Z' },
            { id: 3, status: 'Scheduled', title: 'Next', startTimeUtc: '2026-10-06T08:00:00Z' },
            { id: 4, status: 'Completed', title: 'Past', startTimeUtc: '2026-09-01T08:00:00Z' },
        ]),
        ok([{ status: 'Pending' }, { status: 'Approved' }]),
        ok({ total: 4, items: [{}] }),
    ], true, Date.parse('2026-10-05T00:00:00Z'));
    assert.equal(summary.memberCount, 2);
    assert.equal(summary.approvedMembers.length, summary.memberCount);
    assert.equal(summary.activityCount, 3);
    assert.equal(summary.upcomingCount, 2);
    assert.equal(summary.pendingApplications, 1);
    assert.equal(summary.approvedReportCount, 4);
    assert.equal(summary.upcomingActivity.title, 'Next');
});

test('dashboard keeps an empty result distinct from a failed source', () => {
    const summary = summarizeWorkspaceDashboard([
        ok({ memberCount: 0 }), ok([]), failed, failed,
    ], true);
    assert.equal(summary.memberCount, 0);
    assert.equal(summary.activityCount, 0);
    assert.equal(summary.upcomingCount, 0);
    assert.equal(summary.pendingApplications, null);
    assert.equal(summary.approvedReportCount, null);
    assert.equal(summary.upcomingActivity, null);
    assert.equal(summary.activityAvailable, true);
});
