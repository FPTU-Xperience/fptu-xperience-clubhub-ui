import test from 'node:test';
import assert from 'node:assert/strict';
import { createStudyScheduleApi, createAcademicCalendarApi } from './schedule-api.js';
import { canonicalProfileSnapshot, selfProfilePatch } from './self-profile-contract.js';
import { validApplicationReceipt, applicationXpLabel } from './activity-application-contract.js';
import { loadStudentActivityFeed, loadStudentActivityDetail, loadStudentRecommendations } from './student-read-api.js';
import { profileRadarValues, CORE_PILLARS } from './profile-experience.js';
import { validateStaffingMutationReceipt } from './activity-staffing.js';

test('deferred scoring is accepted only with the explicit server discriminator and null estimate', () => {
    const response = {
        id: 1,
        version: 1,
        expectedRawXp: null,
        canAwardPoints: false,
        scoringStatus: 'DEFERRED_BY_PRODUCT_OWNER',
    };
    assert.equal(validApplicationReceipt(response), true);
    assert.match(applicationXpLabel(response), /Tạm hoãn/);
    assert.equal(validApplicationReceipt({ ...response, scoringStatus: undefined }), false);
    assert.equal(validApplicationReceipt({ ...response, canAwardPoints: true }), false);
    assert.equal(validApplicationReceipt({ ...response, version: '1' }), false);
});

test('schedule writes carry both server versions and DELETE refreshes its 204 version before another write', async () => {
    const calls = [],
        user = { id: 4 },
        period = { year: 2026, term: 'FA', block: '3W' };
    let version = 'block-1';
    const client = createStudyScheduleApi({
        request: async (path, options) => {
            calls.push([path, options]);
            if (options?.method === 'DELETE') {
                version = 'block-3';
                return null;
            }
            if (options?.method === 'PUT')
                return { week: 1, day: 'mon', slotId: 'slot-7', version: 'block-2', calendarVersion: 'calendar-1' };
            return { version, calendarVersion: 'calendar-1', entries: [] };
        },
    });
    await client.get(user, period);
    await client.putSlot(user, period, 1, 'mon', 'slot-7', { subject: 'DB', room: 'A', userId: 8 });
    assert.deepEqual(JSON.parse(calls[1][1].body), {
        subject: 'DB',
        room: 'A',
        expectedVersion: 'block-1',
        expectedCalendarVersion: 'calendar-1',
    });
    assert.ok(calls[1][1].headers['Idempotency-Key']);
    await client.deleteSlot(user, period, 1, 'mon', 'slot-7');
    assert.match(calls[2][0], /expectedVersion=block-2&expectedCalendarVersion=calendar-1/);
    await client.putSlot(user, period, 2, 'mon', 'slot-7', { subject: 'DB', room: 'B' });
    assert.equal(JSON.parse(calls[4][1].body).expectedVersion, 'block-3');
});

test('schedule stale versions cannot be reused or cross account ownership', async () => {
    const user = { id: 4 },
        period = { year: 2026, term: 'FA', block: '10W' };
    const client = createStudyScheduleApi({
        request: async (_path, options) => {
            if (options) throw Object.assign(new Error('stale'), { status: 409 });
            return { version: 'v', calendarVersion: 'c' };
        },
    });
    await client.get(user, period);
    await assert.rejects(client.bulkImport({ id: 5 }, period, [], 'replace'), /tải lịch/);
    await assert.rejects(client.putSlot(user, period, 1, 'mon', 'slot-1', {}), /stale/);
    await assert.rejects(client.putSlot(user, period, 1, 'mon', 'slot-1', {}), /tải lịch/);
});

test('calendar payload excludes source identity and preserves opaque GET version', async () => {
    let captured;
    const client = createAcademicCalendarApi({
        request: async (...args) => {
            captured = args;
        },
    });
    await client.save(
        {},
        { year: 2026, term: 'FA' },
        { version: 'v', termStartDate: 'a', block10StartDate: 'b', block3StartDate: 'c', semesterId: 'do-not-write' },
    );
    assert.deepEqual(JSON.parse(captured[1].body), {
        expectedVersion: 'v',
        termStartDate: 'a',
        block10StartDate: 'b',
        block3StartDate: 'c',
    });
});

test('canonical self profile overwrites local identity fields and never imports mock experience', () => {
    const value = canonicalProfileSnapshot(
        { id: 4, campusCode: 'HAN' },
        { profile: { displayName: 'old' }, evidence: [{ id: 'fake' }] },
        {
            userId: 4,
            version: 'v',
            editableFields: ['profile.displayName'],
            profile: { displayName: 'New' },
            personal: {},
            academic: { availability: 'NOT_IN_ROSTER' },
        },
    );
    assert.equal(value.profile.displayName, 'New');
    assert.equal(value.academic.studentCode, '');
    assert.deepEqual(value.evidence, []);
    assert.equal(value.summary.recognizedContributionTotal, null);
    assert.throws(() => canonicalProfileSnapshot({ id: 5 }, {}, { userId: 4 }), /hợp lệ/);
});

test('self patch sends only changed declared fields, null clears and never writes academic or cosmetics', () => {
    const value = selfProfilePatch(
        {
            version: 'v',
            profile: { displayName: 'A', interests: ['Music'] },
            personal: { address: 'old' },
            editableFields: ['profile.displayName', 'profile.interests', 'personal.address'],
        },
        {
            displayName: 'A',
            interests: 'Music, Code',
            avatarFrame: 'paid',
            personal: { address: '' },
            academic: { studentCode: 'fake' },
        },
    );
    assert.deepEqual(value, {
        expectedVersion: 'v',
        profile: { interests: ['Music', 'Code'] },
        personal: { address: null },
    });
});

test('student feed reads every page and rejects an authority scope change', async () => {
    const api = {
        request: async (path) => {
            const page = Number(new URL(path, 'https://fixture.test').searchParams.get('page'));
            return { items: [{ id: page }], page, totalPages: 2, scopeVersion: 'scope' };
        },
    };
    assert.deepEqual((await loadStudentActivityFeed(api, 4)).items, [{ id: 1 }, { id: 2 }]);
    api.request = async (path) => {
        const page = Number(new URL(path, 'https://fixture.test').searchParams.get('page'));
        return { items: [], page, totalPages: 2, scopeVersion: String(page) };
    };
    await assert.rejects(loadStudentActivityFeed(api), /Quyền xem/);
});

test('student detail never falls back to management reads or treats unavailable gallery as empty', async () => {
    const calls = [];
    const value = await loadStudentActivityDetail(
        {
            request: async (path) => {
                calls.push(path);
                if (path.endsWith('/resources')) throw Object.assign(new Error('denied'), { status: 403 });
                return { id: 4 };
            },
        },
        4,
    );
    assert.deepEqual(calls, ['/api/v2/activities/4', '/api/activities/4/resources']);
    assert.equal(value.resources, null);
    assert.equal(value.resourceAvailability, 'ACCESS_DENIED');
    await assert.rejects(
        loadStudentRecommendations({ request: async () => ({ items: [], available: false }) }),
        /chưa khả dụng/,
    );
});

test('profile radar uses server saturation in canonical order and rejects legacy preview', () => {
    const value = {
        studentId: 4,
        isAuthoritative: true,
        radarAxes: CORE_PILLARS.map((pillar, index) => ({ pillar, saturatedScore: index + 1 })).reverse(),
    };
    assert.deepEqual(profileRadarValues(value, 4), [1, 2, 3, 4, 5, 6]);
    assert.throws(() => profileRadarValues({ ...value, isAuthoritative: false }, 4), /chính thức/);
    assert.throws(() => profileRadarValues({ ...value, radarAxes: [] }, 4), /sáu trụ cột/);
});

test('staffing receipts accept the implemented resource ID and increasing version without fabricating activityId', () => {
    const receipt = { id: '11111111-1111-1111-1111-111111111111', version: 3, status: 'ACTIVE' };
    assert.equal(validateStaffingMutationReceipt(receipt, 12, 2), receipt);
    assert.throws(() => validateStaffingMutationReceipt({ ...receipt, activityId: 13 }, 12, 2));
    assert.throws(() => validateStaffingMutationReceipt({ ...receipt, version: 2 }, 12, 2));
});
