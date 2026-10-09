import assert from 'node:assert/strict';
import test from 'node:test';
import { eligibleInvitationCandidates, isPendingClubInvitation, semesterCode } from './club-invitations.js';

test('semester lookup uses CTSV season identifiers and rejects invalid periods', () => {
    assert.equal(semesterCode({ term: 'FA', year: 2026 }), 'FALL2026');
    assert.equal(semesterCode({ term: 'SP', year: '2027' }), 'SPRING2027');
    assert.equal(semesterCode({ term: 'SU', year: 2026 }), 'SUMMER2026');
    assert.equal(semesterCode({ term: 'FA', year: '' }), '');
    assert.equal(semesterCode({ term: 'BAD', year: 2026 }), '');
});

test('lookup cannot reuse another semester or invite inactive, locked or ineligible students', () => {
    const student = { userId: 10, fullName: 'Nguyễn Văn A', isActive: true, isLocked: false, eligible: true };
    const result = { semesterId: 'FALL2026', items: [student, { ...student, userId: 11, isActive: false }, { ...student, userId: 12, isLocked: true }, { ...student, userId: 13, eligible: false }, { ...student, userId: 0 }, { ...student, userId: 14, fullName: '' }] };
    assert.deepEqual(eligibleInvitationCandidates(result, 'FALL2026'), [student]);
    assert.deepEqual(eligibleInvitationCandidates(result, 'SUMMER2026'), []);
    assert.deepEqual(eligibleInvitationCandidates({ items: [student] }, 'FALL2026'), []);
});

test('only a pending unconsented invitation exposes acceptance', () => {
    const member = { status: 'Pending', acceptedClubRules: false, committedToParticipate: false };
    assert.equal(isPendingClubInvitation(member), true);
    assert.equal(isPendingClubInvitation({ ...member, acceptedClubRules: true, committedToParticipate: true }), false);
    assert.equal(isPendingClubInvitation({ ...member, status: 'Approved' }), false);
    assert.equal(isPendingClubInvitation({ status: 'Pending' }), false);
});
