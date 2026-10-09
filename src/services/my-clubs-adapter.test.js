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
        { clubId: 1, clubCode: 'ONE', name: 'One', logoUrl: 'https://example.test/one.png', role: 'MANAGER', pendingApplications: null },
        { clubId: 2, clubCode: '', name: 'Two', logoUrl: '', role: 'MEMBER', pendingApplications: undefined },
    ]);
});

test('membership reads do not advertise unsupported self withdrawal', () => {
    const result = applicationsFromMemberships([
        { id: 7, clubId: 1, clubName: 'One', status: 'Pending', reason: 'Interested' },
        { id: 8, clubId: 2, clubName: 'Two', status: 'Inactive' },
    ]);
    assert.deepEqual(result, [{
        applicationId: 7,
        club: { clubId: 1, name: 'One', logoUrl: '' },
        reason: 'Interested',
        status: 'PENDING',
        canWithdraw: false,
        canAcceptInvitation: false,
    }]);
});

test('unconsented pending memberships are shown as invitations', () => {
    const invitations = applicationsFromMemberships([
        { id: 1, clubId: 7, status: 'Pending', acceptedClubRules: false, committedToParticipate: false },
        { id: 2, clubId: 7, status: 'Pending', acceptedClubRules: true, committedToParticipate: true },
        { id: 3, clubId: 7, status: 'Approved', acceptedClubRules: false, committedToParticipate: false },
    ]);
    assert.deepEqual(invitations.map((record) => record.canAcceptInvitation), [true, false, false]);
});
