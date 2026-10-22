import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ACTION_ROLES,
    ACTIVITY_SCALES,
    actionEstimate,
    applicationEstimate,
    applicationPayload,
    applicationPermission,
    newApplication,
    validateApplication,
    applicationValidationIssue,
} from './activity-application/activity-application-data.js';

test('step navigation validates only preceding steps and submit finds the owning step', () => {
    const data = draft();
    data.independentActionsConfirmed = false;
    assert.equal(applicationValidationIssue(data, 0, now), null);
    assert.equal(applicationValidationIssue(data, 1, now).stage, 1);
    data.title = '';
    assert.deepEqual(applicationValidationIssue(data, 3, now), {
        message: 'Vui lòng nhập tên hoạt động.',
        stage: 0,
        field: 'title',
    });
    data.title = 'Workshop';
    data.independentActionsConfirmed = true;
    data.recruitment.enabled = true;
    assert.equal(applicationValidationIssue(data, 1, now), null);
    assert.equal(applicationValidationIssue(data, 3, now).stage, 2);
});

const now = Date.parse('2026-10-16T00:00:00Z');
const draft = () => ({
    ...newApplication(7, 'FA26'),
    title: 'Workshop',
    description: 'Nội dung',
    location: 'FPT',
    startTime: '2026-11-01T09:00',
    endTime: '2026-11-01T12:00',
    independentActionsConfirmed: true,
});
test('action budget matches agreed 7100 example and never applies tier base twice', () => {
    const data = draft();
    assert.equal(validateApplication(data, now), '');
    assert.deepEqual(
        applicationEstimate(data).actions.map((item) => item.rawXp),
        [5000, 1500, 600],
    );
    assert.equal(applicationEstimate(data).rawXp, 7100);
});
test('all role and scale combinations use multiplier cap and explicit role selection', () => {
    const action = draft().actions[0];
    for (const [role, , r] of ACTION_ROLES)
        for (const [scale, , s] of ACTIVITY_SCALES) {
            assert.equal(
                actionEstimate({ ...action, contributionRole: role }, scale).perOccurrence,
                50 * Math.min(r * s, 8),
            );
        }
    assert.equal(actionEstimate({ ...action, name: 'Hosting' }, 'Club').perOccurrence, 50);
    assert.equal(
        actionEstimate({ ...action, scaleSource: 'OVERRIDE', scale: 'Campus' }, 'International').perOccurrence,
        65,
    );
});
test('counts increase budgets, caps cannot undershoot plan, invalid inputs are rejected', () => {
    for (const field of ['expectedPeople', 'expectedOccurrencesPerPerson', 'maxAwardsPerPerson', 'maxAwardCount']) {
        for (const value of [-1, 0, 1.5, Infinity, 'invalid']) {
            const data = draft();
            data.actions[0][field] = value;
            assert.notEqual(validateApplication(data, now), '', `${field} ${value}`);
        }
    }
    const data = draft();
    data.actions[0].expectedOccurrencesPerPerson = 2;
    assert.match(validateApplication(data, now), /Giới hạn/);
    data.actions[0].maxAwardsPerPerson = 2;
    data.actions[0].maxAwardCount = 200;
    assert.equal(validateApplication(data, now), '');
    assert.equal(applicationEstimate(data).rawXp, 12100);
});
test('future dates, independent work confirmation, enums and finite totals are required', () => {
    for (const [key, value] of [
        ['startTime', ''],
        ['startTime', '2026-01-01T09:00'],
        ['endTime', '2026-01-01T09:00'],
        ['scale', 'unknown'],
        ['independentActionsConfirmed', false],
    ]) {
        assert.notEqual(validateApplication({ ...draft(), [key]: value }, now), '');
    }
    for (const [key, value] of [
        ['basePoints', Infinity],
        ['basePoints', 0],
        ['contributionRole', 'unknown'],
        ['stackingRule', 'EXCLUSIVE'],
    ]) {
        const data = draft();
        data.actions[0][key] = value;
        assert.notEqual(validateApplication(data, now), '');
    }
});
test('recruitment links real action IDs and private visibility enforces club eligibility', () => {
    const data = draft();
    data.recruitment.enabled = true;
    assert.notEqual(validateApplication(data, now), '');
    data.recruitment.actionIds = [data.actions[1].clientId];
    assert.equal(validateApplication(data, now), '');
    const body = applicationPayload(data);
    assert.equal(body.recruitment.positions[0].capacity, 10);
    assert.equal(body.recruitment.positions[0].actionClientId, body.actions[1].clientId);
    data.recruitment.visibility = 'PRIVATE';
    assert.notEqual(validateApplication(data, now), '');
    data.recruitment.eligibility = 'CLUB_MEMBERS';
    assert.equal(validateApplication(data, now), '');
    data.recruitment.actionIds = ['deleted'];
    assert.notEqual(validateApplication(data, now), '');
});
test('payload retains policy facts, uses Vietnam dates and omits client Xperience Point authority', () => {
    const data = draft();
    data.title = '  Workshop  ';
    data.actions[0].expectedRawXp = 999999;
    data.actions[0].roleMultiplier = 999;
    const body = applicationPayload(data);
    assert.equal(body.title, 'Workshop');
    assert.equal(body.startTimeUtc, '2026-11-01T02:00:00.000Z');
    assert.equal(body.endTimeUtc, '2026-11-01T05:00:00.000Z');
    assert.equal(body.recruitment, null);
    assert.equal(body.actions[0].scale, null);
    assert.equal(body.expectedRawXp, undefined);
    assert.equal(body.actions[0].rawXp, undefined);
    assert.equal(body.actions[0].expectedRawXp, undefined);
    assert.equal(body.actions[0].roleMultiplier, undefined);
});
test('scoped permissions override manager fallback and do not elevate members or activity staff', () => {
    assert.equal(applicationPermission({ isManager: true }, 'activity.create'), true);
    assert.equal(applicationPermission({ isManager: true, permissions: [] }, 'activity.create'), false);
    assert.equal(
        applicationPermission({ isManager: false, permissions: ['activity.create'] }, 'activity.create'),
        true,
    );
    assert.equal(applicationPermission({ isManager: false }, 'activity.create'), false);
    assert.equal(applicationPermission({ role: 'Hosting' }, 'activity.create'), false);
});
