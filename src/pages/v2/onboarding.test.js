import test from 'node:test';
import assert from 'node:assert/strict';
import { MAJORS, readOnboarding, saveOnboarding, onboardingAutofill } from './onboarding.js';
import { campusLabel } from './profile-options.js';

const snapshot = (id = 4) => ({
    userId: id,
    version: 'v1',
    profile: { interests: [] },
    personal: {},
    academic: { major: null, studentCode: 'SE1' },
    onboarding: { version: 0, completedAt: null, syncTimetable: false },
    editableFields: [
        'academic.major',
        'profile.interests',
        'personal.address',
        'onboarding.completed',
        'onboarding.version',
        'onboarding.syncTimetable',
    ],
});
const preferences = {
    major: MAJORS[0],
    interests: ['technology', 'design', 'community'],
    personal: { address: 'HCM', userId: 8 },
    academic: { campus: 'FORGED' },
};

test('campus labels display the canonical campus without guessing missing data', () => {
    assert.equal(campusLabel('CAN'), 'FPTU Cần Thơ · Hovilo');
    assert.equal(campusLabel(''), '');
});

test('semester identity overrides email inference and campus always follows the account', () => {
    const value = onboardingAutofill(
        { email: 'cuongnkce161131@fpt.edu.vn', campusCode: 'HCM' },
        { academic: { studentCode: 'SE180123', semesterId: 'FALL2026', availability: 'AVAILABLE' } },
    );
    assert.equal(value.studentCode, 'SE180123');
    assert.equal(value.campus, 'HCM');
    assert.equal(value.year, 'K18');
    assert.equal(value.semesterId, 'FALL2026');
});

test('student email fills missing identity as suggestions without claiming roster membership', () => {
    const value = onboardingAutofill(
        { email: 'cuongnkce161131@fpt.edu.vn' },
        { academic: { availability: 'NOT_IN_ROSTER', semesterId: 'FALL2026' } },
    );
    assert.equal(value.studentCode, 'CE161131');
    assert.equal(value.campus, 'FPTU Cần Thơ');
    assert.equal(value.year, 'K16');
    assert.equal(value.availability, 'NOT_IN_ROSTER');
    const unknown = onboardingAutofill({ email: 'person@gmail.com' }, {});
    assert.equal(unknown.studentCode, '');
    assert.equal(unknown.campus, '');
    assert.equal(unknown.year, '');
});

test('onboarding reads the authenticated canonical profile and does not trust browser flags', async () => {
    const api = {
        request: async (path) => {
            assert.equal(path, '/api/users/me/profile');
            return snapshot();
        },
    };
    const value = await readOnboarding({ id: 4 }, api);
    assert.equal(value.preferences, null);
    assert.equal(value.snapshot.academic.studentCode, 'SE1');
    await assert.rejects(readOnboarding({ id: 5 }, api), /onboarding/);
});

test('onboarding completion atomically sends version, preferences and only editable private fields', async () => {
    let payload;
    const result = await saveOnboarding({ id: 4 }, preferences, snapshot(), {
        request: async (path, options) => {
            assert.equal(path, '/api/users/me/profile');
            assert.equal(options.method, 'PATCH');
            assert.ok(options.headers['Idempotency-Key']);
            payload = JSON.parse(options.body);
            return {
                ...snapshot(),
                academic: { major: MAJORS[0] },
                profile: payload.profile,
                onboarding: { version: 1, completedAt: '2026-10-27T10:00:00Z', syncTimetable: false },
            };
        },
    });
    assert.equal(result.major, MAJORS[0]);
    assert.equal(payload.expectedVersion, 'v1');
    assert.deepEqual(payload.academic, { major: MAJORS[0] });
    assert.deepEqual(payload.personal, { address: 'HCM' });
    assert.deepEqual(payload.onboarding, { completed: true, version: 1, syncTimetable: false });
    assert.equal(payload.profile.interests.length, 3);
});

test('invalid choices, unsupported backend and failed saves never complete onboarding', async () => {
    const noWrite = {
        request: async () => {
            throw new Error('must not write');
        },
    };
    for (const interests of [
        ['technology', 'technology', 'technology'],
        ['Code', 'CODE', 'code'],
    ])
        await assert.rejects(saveOnboarding({ id: 4 }, { ...preferences, interests }, snapshot(), noWrite), /3/);
    await assert.rejects(saveOnboarding({ id: 4 }, { ...preferences, major: 'Unknown' }, snapshot(), noWrite), /3/);
    await assert.rejects(
        saveOnboarding({ id: 4 }, preferences, { ...snapshot(), editableFields: [] }, noWrite),
        /cho phép/,
    );
    await assert.rejects(
        saveOnboarding({ id: 4 }, preferences, snapshot(), {
            request: async () => {
                throw Object.assign(new Error('stale'), { status: 409 });
            },
        }),
        { status: 409 },
    );
});

test('completed onboarding survives subsequent interest edits and is isolated across accounts', async () => {
    const value = {
        ...snapshot(),
        onboarding: { version: 1, completedAt: '2026-10-27T10:00:00Z', syncTimetable: false },
    };
    const api = { request: async () => value };
    assert.ok((await readOnboarding({ id: 4 }, api)).preferences);
    await assert.rejects(readOnboarding({ id: 5 }, api));
    await assert.rejects(readOnboarding({ id: 4 }, { request: async () => ({ ...value, onboarding: undefined }) }));
});
