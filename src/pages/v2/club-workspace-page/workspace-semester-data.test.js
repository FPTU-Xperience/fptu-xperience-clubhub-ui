import test from 'node:test';
import assert from 'node:assert/strict';
import { workspaceSemesterQuery, workspaceSemesterKey, workspaceSemesterPath } from './workspace-semester-data.js';

test('workspace navigation retains the selected semester without carrying other tab filters', () => {
    assert.equal(workspaceSemesterPath('/my-clubs/C1/finance', { id: 'SUMMER2026' }), '/my-clubs/C1/finance?semester=SUMMER2026');
    assert.equal(workspaceSemesterPath('/my-clubs/C1', { id: 'SUMMER2026' }), '/my-clubs/C1?semester=SUMMER2026');
    assert.equal(workspaceSemesterPath('/ctsv/clubs/C1/workspace/members?tab=members#roster', { id: 's 1' }), '/ctsv/clubs/C1/workspace/members?tab=members&semester=s+1#roster');
    assert.equal(workspaceSemesterPath('/my-clubs/C2/activities', null), '/my-clubs/C2/activities');
});

test('workspace filters require authoritative bounds and explicit report period mapping', () => {
    assert.deepEqual(workspaceSemesterQuery({ id: 'FA2026' }, 'activities'), {});
    assert.deepEqual(workspaceSemesterQuery({ id: 'FA2026' }, 'reports'), {});
    const semester = { id: 'semester-guid', startUtc: '2026-09-01T00:00:00Z', endUtc: '2026-12-31T23:59:59Z', reportPeriod: 'FALL-2026-APPROVED' };
    assert.deepEqual(workspaceSemesterQuery(semester, 'activities'), { from: semester.startUtc, to: semester.endUtc });
    assert.deepEqual(workspaceSemesterQuery(semester, 'reports'), { period: semester.reportPeriod });
    assert.deepEqual(workspaceSemesterQuery({ ...semester, endUtc: '2026-01-01T00:00:00Z' }, 'activities'), {});
    assert.deepEqual(workspaceSemesterQuery(semester, 'finance'), {}, 'financial attribution must not be guessed from the report or creation date');
});
test('scope identities change when the selected semester or authoritative mapping changes', () => {
    assert.notEqual(workspaceSemesterKey({ id: 'a' }), workspaceSemesterKey({ id: 'b' }));
    assert.notEqual(workspaceSemesterKey({ id: 'a', reportPeriod: 'old' }), workspaceSemesterKey({ id: 'a', reportPeriod: 'new' }));
});
