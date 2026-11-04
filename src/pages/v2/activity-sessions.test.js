import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAttendanceRoster } from '../../services/activity-sessions.js';
import {
    sessionPayload,
    validateSessions,
    checkInPayload,
    validateCheckIn,
    validateManualAttendance,
    sessionMutation,
    validateSessionMutation,
    attendanceError,
} from '../../services/activity-sessions.js';
const version = '11111111-1111-4111-8111-111111111111',
    next = '22222222-2222-4222-8222-222222222222';
test('roster rejects stale or foreign records before enabling manual attendance', () => {
    const value = {
        activityId: 4,
        sessionId: 2,
        sessionVersion: version,
        totalPages: 1,
        items: [{ memberId: 1, userId: 104, attendance: { activityId: 4, sessionId: 2, version } }],
    };
    assert.equal(validateAttendanceRoster(value, 4, 2), value);
    for (const patch of [
        { sessionVersion: 'bad' },
        { sessionId: 3 },
        { items: [value.items[0], value.items[0]] },
        { items: [{ ...value.items[0], attendance: { activityId: 4, sessionId: 3, version } }] },
    ])
        assert.throws(() => validateAttendanceRoster({ ...value, ...patch }, 4, 2));
});
const draft = () => ({
    startAt: '2026-11-15T14:00',
    endAt: '2026-11-15T16:00',
    opensAt: '2026-11-15T14:00',
    closesAt: '2026-11-15T14:30',
    location: ' Hall ',
    mode: 'ONLINE',
    manualConfirmationEnabled: true,
});
test('session requests use Vietnam time and keep create/edit version contracts separate', () => {
    const payload = sessionPayload(draft(), version);
    assert.equal(payload.startAt, '2026-11-15T07:00:00.000Z');
    assert.equal(payload.attendancePolicy.closesAt, '2026-11-15T07:30:00.000Z');
    assert.equal(payload.timezone, 'Asia/Ho_Chi_Minh');
    assert.equal(payload.expectedVersion, version);
    assert.equal(payload.location, 'Hall');
    assert.equal(payload.attendancePolicy.geofence, null);
    assert.equal(Object.hasOwn(sessionPayload(draft(), version, true), 'timezone'), false);
});
test('invalid session windows, calendar dates and missing onsite policy cannot be submitted', () => {
    for (const patch of [
        { opensAt: '2026-11-15T13:59' },
        { closesAt: '2026-11-15T16:01' },
        { mode: 'FAKE' },
        { mode: 'ONSITE', latitude: '', longitude: 106, radiusMeters: 100 },
        { startAt: '2026-02-31T14:00' },
    ])
        assert.throws(() => sessionPayload({ ...draft(), ...patch }, version));
    const payload = sessionPayload(
        { ...draft(), mode: 'ONSITE', latitude: '10', longitude: '106', radiusMeters: '100' },
        version,
    );
    assert.deepEqual(payload.attendancePolicy.geofence, { latitude: 10, longitude: 106, radiusMeters: 100 });
});
test('session lists fail closed on foreign activity, malformed dates, duplicate IDs and invalid versions', () => {
    const row = {
        id: 1,
        activityId: 4,
        version,
        startTime: '2026-11-15T07:00:00Z',
        endTime: '2026-11-15T09:00:00Z',
        status: 'SCHEDULED',
    };
    assert.equal(validateSessions({ activityId: 4, items: [row] }, 4).items.length, 1);
    for (const value of [
        { activityId: 5, items: [row] },
        { activityId: 4, items: [{ ...row, activityId: 5 }] },
        { activityId: 4, items: [row, row] },
        { activityId: 4, items: [{ ...row, version: 'old' }] },
        { activityId: 4, items: [{ ...row, startTime: 'invalid' }] },
    ])
        assert.throws(() => validateSessions(value, 4));
});
test('check-in respects server eligibility and sends current location only for onsite mode', () => {
    const session = { id: 2, sourceActions: { canCheckIn: true }, attendanceWindow: { mode: 'ONSITE' } };
    const location = { latitude: 10, longitude: 106, accuracyMeters: 20 };
    assert.throws(() => checkInPayload(session, 'signed-challenge', null));
    assert.deepEqual(checkInPayload(session, ' signed-challenge ', location), {
        sessionId: 2,
        challenge: 'signed-challenge',
        location,
    });
    assert.deepEqual(
        checkInPayload({ ...session, attendanceWindow: { mode: 'ONLINE' } }, 'signed-challenge', location),
        { sessionId: 2, challenge: 'signed-challenge' },
    );
    assert.throws(() =>
        checkInPayload({ ...session, sourceActions: { canCheckIn: false } }, 'signed-challenge', location),
    );
    assert.throws(() => checkInPayload(session, '', { ...location }));
});
test('only a verified receipt for the requested activity/session confirms self attendance', () => {
    const receipt = { attendanceId: 12, activityId: 4, sessionId: 2, status: 'VERIFIED', version: next };
    assert.equal(validateCheckIn(receipt, 4, 2), receipt);
    for (const patch of [
        { activityId: 5 },
        { sessionId: 3 },
        { status: 'PENDING' },
        { version: 'bad' },
        { attendanceId: 0 },
    ])
        assert.throws(() => validateCheckIn({ ...receipt, ...patch }, 4, 2));
});
test('manual receipt cannot confirm another attendance row or multiple unrelated results', () => {
    const row = {
        attendanceId: 12,
        activityId: 4,
        sessionId: 2,
        status: 'VERIFIED',
        attendanceStatus: 'Present',
        version: next,
    };
    assert.equal(validateManualAttendance({ items: [row] }, 4, 2, 'Present', 12), row);
    assert.throws(() => validateManualAttendance({ items: [row, row] }, 4, 2, 'Present', 12));
    assert.throws(() => validateManualAttendance({ items: [row] }, 4, 2, 'Present', 13));
    assert.throws(() => validateManualAttendance({ items: [{ ...row, status: 'PENDING' }] }, 4, 2, 'Present', 12));
});
test('versioned session mutation uses the real route and stable idempotency key', async () => {
    const api = {
        request: async (path, options) => {
            assert.equal(path, '/api/activities/4/sessions/2/close');
            assert.equal(options.headers['Idempotency-Key'], 'stable-key');
            assert.deepEqual(JSON.parse(options.body), { expectedVersion: version, reason: 'Finished' });
            return { id: 2, activityId: 4, version: next };
        },
    };
    const receipt = await sessionMutation(
        api,
        4,
        'sessions/2/close',
        { expectedVersion: version, reason: 'Finished' },
        'stable-key',
    );
    assert.equal(validateSessionMutation(receipt, 4, version), receipt);
    assert.throws(() => validateSessionMutation({ ...receipt, version }, 4, version));
    assert.match(attendanceError({ message: 'The QR is invalid, expired or belongs to another session.' }), /hết hạn/);
});
