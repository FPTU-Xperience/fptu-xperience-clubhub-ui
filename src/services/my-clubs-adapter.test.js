import assert from 'node:assert/strict';
import test from 'node:test';
import { applicationsFromMemberships, selectionFromClubAccess } from './my-clubs-adapter.js';

test('selection uses only current-user access and strips private club details', () => {
    const result = selectionFromClubAccess([
        { clubId: 1, clubName: 'One', isManager: true, isApprovedMember: false },
        { clubId: 2, clubName: 'Two', isManager: false, isApprovedMember: true },
        { clubId: 3, clubName: 'Three', isManager: false, isApprovedMember: false },
    ], [
        { id: 1, code: 'ONE', name: 'One', logoUrl: 'https://example.test/one.png', members: [{ email: 'private' }] },
        { id: 3, code: 'THREE', name: 'Three' },
    ]);
    assert.deepEqual(result, [
        { clubId: 1, clubCode: 'ONE', name: 'One', logoUrl: 'https://example.test/one.png', role: 'MANAGER', displayRole: 'CLUB_OWNER', pendingApplications: null },
        { clubId: 2, clubCode: '', name: 'Two', logoUrl: '', role: 'MEMBER', displayRole: 'MEMBER', pendingApplications: undefined },
    ]);
});

test('treasurer display role preserves member workspace access', () => {
    const [club] = selectionFromClubAccess([
        { clubId: 2, isApprovedMember: true, isTreasurer: true, isManager: false },
    ], [{ id: 2, code: 'TWO', name: 'Two' }]);
    assert.equal(club.displayRole, 'TREASURER');
    assert.equal(club.role, 'MEMBER');
});

test('membership reads do not advertise unsupported self withdrawal', () => {
    const result = applicationsFromMemberships([
        { id: 7, clubId: 1, clubName: 'One', status: 'Pending', reason: 'Interested' },
        { id: 8, clubId: 2, clubName: 'Two', status: 'Inactive' },
    ]);
    assert.deepEqual(result, [{
        applicationId: 7,
        club: { clubId: 1, name: 'One', logoUrl: '', clubCode: '' },
        reason: 'Interested',
        status: 'PENDING',
        requestedAtUtc: '',
        reviewedAtUtc: '',
        canWithdraw: false,
        canAcceptInvitation: false,
    }]);
});

test('applications use existing club logos and codes without adding directory clubs to the inbox', () => {
    const result = applicationsFromMemberships([
        { id: 7, clubId: 1, clubName: 'Old name', status: 'Pending' },
        { id: 8, clubId: 2, clubName: 'Two', status: 'Rejected' },
    ], [
        { id: 1, name: 'One', code: 'F-ONE', logoUrl: 'https://example.test/logo.png' },
        { id: 2, name: 'Two', code: 'F-TWO', logoUrl: null },
        { id: 3, name: 'Unrelated', code: 'OTHER' },
    ]);
    assert.equal(result.length, 2);
    assert.deepEqual(result[0].club, { clubId: 1, name: 'One', clubCode: 'F-ONE', logoUrl: 'https://example.test/logo.png' });
    assert.equal(result[1].club.clubCode, 'F-TWO');
    assert.equal(result[1].club.logoUrl, '');
});

test('unconsented pending memberships are shown as invitations', () => {
    const invitations = applicationsFromMemberships([
        { id: 1, clubId: 7, status: 'Pending', acceptedClubRules: false, committedToParticipate: false },
        { id: 2, clubId: 7, status: 'Pending', acceptedClubRules: true, committedToParticipate: true },
        { id: 3, clubId: 7, status: 'Approved', acceptedClubRules: false, committedToParticipate: false },
    ]);
    assert.deepEqual(invitations.map((record) => record.canAcceptInvitation), [true, false, false]);
});

test('self withdrawal follows backend capability only for pending sent applications', () => {
    const applications = applicationsFromMemberships([
        { id: 1, clubId: 7, status: 'Pending', canWithdraw: true, acceptedClubRules: true, committedToParticipate: true },
        { id: 2, clubId: 7, status: 'Pending', canWithdraw: true, acceptedClubRules: false, committedToParticipate: false },
        { id: 3, clubId: 7, status: 'Approved', canWithdraw: true },
        { id: 4, clubId: 7, status: 'Rejected', canWithdraw: true },
        { id: 5, clubId: 7, status: 'Pending' },
    ]);
    assert.deepEqual(applications.map((item) => item.canWithdraw), [true, false, false, false, false]);
});
