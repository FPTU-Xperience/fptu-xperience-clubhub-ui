import assert from 'node:assert/strict';
import test from 'node:test';
import { activityWorkspacePath } from './activity-club-navigation.js';
const populated = (data) => ({ status: 'populated', data });
const selection = populated([{ clubId: '7', clubCode: 'FU-IGO', role: 'MANAGER' }]);

test('manager access alone, pending/inactive membership, and another club membership hide workspace link', () => {
    for (const data of [[], [{ clubId: 7, status: 'Pending' }], [{ clubId: 7, status: 'Inactive' }], [{ clubId: 8, status: 'Approved' }]])
        assert.equal(activityWorkspacePath(7, selection, populated(data)), null);
});
test('approved member uses current workspace code rather than stale activity code', () => {
    assert.equal(activityWorkspacePath(7, selection, populated([{ clubId: 7, status: 'Approved' }])), '/v2/my-clubs/FU-IGO');
    assert.equal(activityWorkspacePath(7, populated([{ clubId: 7, clubCode: 'IGo / HCM' }]), populated([{ clubId: 7, status: 'APPROVED' }])), '/v2/my-clubs/IGo%20%2F%20HCM');
});
test('membership loading/errors and missing matching workspace fail closed', () => {
    for (const status of ['loading', 'error', 'unauthorized', 'empty'])
        assert.equal(activityWorkspacePath(7, selection, { status, data: [{ clubId: 7, status: 'Approved' }] }), null);
    assert.equal(activityWorkspacePath(7, populated([]), populated([{ clubId: 7, status: 'Approved' }])), null);
    assert.equal(activityWorkspacePath(7, populated([{ clubId: 7, clubCode: '' }]), populated([{ clubId: 7, status: 'Approved' }])), null);
});
