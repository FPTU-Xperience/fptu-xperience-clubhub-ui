import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    classifyMyClubsError,
    createRequestGate,
    mapMyClubSelection,
    mapMyMembershipApplications,
    visibleSentApplications,
    APPLICATION_RESULT_WINDOW_MS,
} from './my-clubs-data.js';

test('selection maps only display-safe eligible roles and deduplicates cards', () => {
    const items = mapMyClubSelection({
        items: [
            { clubId: 1, clubCode: 'F-CODE', name: 'F-Code', role: 'MEMBER', members: [{ email: 'private' }], pendingApplications: 2 },
            { clubId: 1, clubCode: 'DUPLICATE', name: 'Duplicate', role: 'MANAGER' },
            {
                clubId: 2,
                clubCode: 'F-STYLE',
                name: 'F-Style',
                role: 'MANAGER',
                pendingApplications: null,
                upcomingActivity: { title: 'Show', startTime: '2026-10-01T09:00:00Z' },
            },
            { clubId: 3, clubCode: 'NO-ACCESS', name: 'No access', role: 'PENDING' },
        ],
    });
    assert.equal(items.length, 2);
    assert.equal(items[0].workspacePath, '/v2/my-clubs/F-CODE');
    assert.equal(items[0].pendingApplications, undefined);
    assert.equal('members' in items[0], false);
    assert.equal(items[1].pendingApplications, null);
});

test('application mapper limits data to the valid current-user fields', () => {
    const items = mapMyMembershipApplications({
        items: [
            {
                applicationId: 'x',
                club: { clubId: 3, name: 'Green' },
                status: 'PENDING',
                canWithdraw: true,
                reviewer: 'private',
            },
            { applicationId: 'bad', club: { clubId: 4 }, status: 'UNKNOWN' },
        ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0].canWithdraw, true);
    assert.equal('reviewer' in items[0], false);
});

test('availability outcomes and request gate remain distinct', () => {
    assert.equal(classifyMyClubsError({ status: 401 }), 'unauthorized');
    assert.equal(classifyMyClubsError({ status: 403 }), 'forbidden');
    assert.equal(classifyMyClubsError({ status: 404 }), 'not-found');
    assert.equal(classifyMyClubsError(new Error()), 'error');
    const gate = createRequestGate();
    const first = gate.next();
    const second = gate.next();
    assert.equal(gate.isCurrent(first), false);
    assert.equal(gate.isCurrent(second), true);
    gate.invalidate();
    assert.equal(gate.isCurrent(second), false);
});

test('sent applications retain pending requests and expire results exactly seven days after review', () => {
    const now = Date.parse('2026-10-13T12:00:00+07:00');
    const timestamp = (offset) => new Date(now + offset).toISOString();
    const records = [
        { applicationId: 'pending', status: 'PENDING', requestedAtUtc: timestamp(-30 * 86400000) },
        { applicationId: 'invitation', status: 'PENDING', canAcceptInvitation: true },
        { applicationId: 'recent-approved', status: 'APPROVED', reviewedAtUtc: timestamp(-APPLICATION_RESULT_WINDOW_MS + 1) },
        { applicationId: 'recent-rejected', status: 'REJECTED', reviewedAtUtc: timestamp(0) },
        { applicationId: 'expired', status: 'APPROVED', reviewedAtUtc: timestamp(-APPLICATION_RESULT_WINDOW_MS) },
        { applicationId: 'old', status: 'REJECTED', reviewedAtUtc: timestamp(-APPLICATION_RESULT_WINDOW_MS - 1) },
        { applicationId: 'missing', status: 'APPROVED', requestedAtUtc: timestamp(-1) },
        { applicationId: 'invalid', status: 'REJECTED', reviewedAtUtc: 'invalid' },
        { applicationId: 'future', status: 'APPROVED', reviewedAtUtc: timestamp(1) },
        { applicationId: 'withdrawn', status: 'WITHDRAWN' },
    ];
    assert.deepEqual(visibleSentApplications(records, now).map((item) => item.applicationId),
        ['pending', 'recent-approved', 'recent-rejected']);
});

test('application mapper carries review time through to the visibility filter', () => {
    const reviewedAtUtc = '2026-10-13T05:00:00Z';
    const [application] = mapMyMembershipApplications([
        { applicationId: 1, clubId: 3, status: 'APPROVED', reviewedAtUtc, requestedAtUtc: '2026-10-01T05:00:00Z' },
    ]);
    assert.equal(application.reviewedAtUtc, reviewedAtUtc);
    assert.equal(visibleSentApplications([application], Date.parse(reviewedAtUtc)).length, 1);
});

test('invitation acceptance is retained only for pending current-user records', () => {
    const records = mapMyMembershipApplications([
        { id: 1, clubId: 3, status: 'Pending', canAcceptInvitation: true },
        { id: 2, clubId: 3, status: 'Approved', canAcceptInvitation: true },
        { id: 3, clubId: 3, status: 'Pending' },
    ]);
    assert.deepEqual(records.map((record) => record.canAcceptInvitation), [true, false, false]);
});

test('production My Clubs route and files stay V2-local and demo-free', () => {
    const app = readFileSync(new URL('./V2App.jsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('./my-clubs-page/MyClubsPage.jsx', import.meta.url), 'utf8');
    const schedule = readFileSync(new URL('./personal-pages/PersonalPages.jsx', import.meta.url), 'utf8');
    const personalHeading = readFileSync(new URL('./personal-pages/PersonalPageHeading.jsx', import.meta.url), 'utf8');
    const card = readFileSync(new URL('../../components/v2/my-clubs/MyClubCard.jsx', import.meta.url), 'utf8');
    assert.match(app, /path="my-clubs"/);
    assert.match(app, /path="my-clubs\/:clubCode\/\*"/);
    assert.match(page, /PageState/);
    assert.match(card, /workspacePath/);
    assert.match(page, /PersonalPageHeading/);
    assert.match(schedule, /PersonalPageHeading/);
    assert.match(personalHeading, /KHÔNG GIAN CỦA BẠN/);
    for (const source of [page, card]) assert.doesNotMatch(source, /DemoContext|\.\.\/model|\/v2\/demo|UI LAB/);
});
