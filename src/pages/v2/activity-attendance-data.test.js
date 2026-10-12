import assert from 'node:assert/strict';
import test from 'node:test';
import { canManageActivityAttendance } from '../../components/v2/activity-detail/activity-attendance-data.js';

test('attendance management is scoped to the activity club, not another club or a general role label', () => {
    const access = [{ clubId: 1, isManager: true }, { clubId: 2, isManager: false, isTreasurer: true }];
    assert.equal(canManageActivityAttendance('1', access), true);
    assert.equal(canManageActivityAttendance(2, access), false);
    assert.equal(canManageActivityAttendance(3, access), false);
    assert.equal(canManageActivityAttendance(1, [{ clubId: 1, role: 'MANAGER' }]), false);
    assert.equal(canManageActivityAttendance(1, null), false);
});
