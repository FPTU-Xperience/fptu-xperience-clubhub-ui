import assert from 'node:assert/strict';
import test from 'node:test';
import { buildClubRegistrationPayload } from './my-clubs-page/club-registration.js';

function applicationData() {
    const data = new FormData();
    for (const [name, value] of Object.entries({
        name: '  New Club  ',
        category: 'TECHNOLOGY',
        purpose: 'Learn',
        description: 'Build together',
        founderFullName: 'Student',
        founderRole: 'Owner',
        founderEmail: 'student@example.edu',
        founderPhone: '0912345678',
        founderOrganization: 'SE',
        mainActivities: 'Workshops',
        venueSupport: 'SELF_MANAGED',
        fundingSupport: 'SELF_FUNDED',
        activityFrequencyCount: '2',
        activityFrequencyUnit: 'MONTH',
        code: 'new_club',
        foundingMemberCount: '1',
        foundingMembersCommitted: 'on',
        committedToRules: 'on',
        committedToResponsibility: 'on',
        committedToReporting: 'on',
    }))
        data.set(name, value);
    for (const [name, value] of [
        ['memberName', 'Student'],
        ['memberEmail', 'student@example.edu'],
        ['memberOrganization', 'SE'],
    ])
        data.append(name, value);
    return data;
}

test('club opening submission normalizes the API payload and preserves founding member rows', () => {
    const data = applicationData();
    data.append('memberName', '  Second Student  ');
    data.append('memberEmail', 'second@example.edu');
    data.append('memberOrganization', 'AI');
    data.set('foundingMemberCount', '2');
    const payload = buildClubRegistrationPayload(data);
    assert.equal(payload.name, 'New Club');
    assert.equal(payload.code, 'NEW_CLUB');
    assert.equal(payload.activityFrequency, '2 lần mỗi tháng');
    assert.equal(payload.foundingMemberCount, 2);
    assert.deepEqual(payload.foundingMembers[1], {
        fullName: 'Second Student',
        email: 'second@example.edu',
        organization: 'AI',
    });
    for (const optional of [
        'logoUrl',
        'advisorNeeded',
        'expectedLocation',
        'expectedSchedule',
        'majorEvents',
        'equipmentNeeds',
    ])
        assert.equal(Object.hasOwn(payload, optional), false);
    assert.equal(payload.committedToReporting, true);
    assert.ok(!('memberName' in payload));
});
test('Viết tắt is the canonical club code and optional form data is not submitted', () => {
    const data = applicationData();
    data.set('code', '  my-club_26  ');
    data.set('logoUrl', 'https://example.test/old.png');
    data.set('equipmentNeeds', 'Do not submit');
    const payload = buildClubRegistrationPayload(data);
    assert.equal(payload.code, 'MY-CLUB_26');
    assert.equal(Object.hasOwn(payload, 'logoUrl'), false);
    assert.equal(Object.hasOwn(payload, 'equipmentNeeds'), false);
    for (const code of ['', 'a', 'bad code', 'x'.repeat(21)]) {
        data.set('code', code);
        assert.throws(() => buildClubRegistrationPayload(data), /Viết tắt/);
    }
});

test('club opening keeps the declared V1 member count separate from the detailed member list', () => {
    const data = applicationData();
    data.set('foundingMemberCount', '15');
    assert.equal(buildClubRegistrationPayload(data).foundingMemberCount, 15);
    for (const count of ['0', '201', '1.5', '']) {
        data.set('foundingMemberCount', count);
        assert.throws(() => buildClubRegistrationPayload(data), /Số thành viên sáng lập/);
    }
    data.set('foundingMemberCount', '1');
    data.append('memberName', 'Second');
    data.append('memberEmail', 'second@example.edu');
    data.append('memberOrganization', 'AI');
    assert.throws(() => buildClubRegistrationPayload(data), /Số thành viên sáng lập/);
});

test('club opening submission rejects missing commitments and incomplete founding members', () => {
    const data = applicationData();
    data.delete('committedToRules');
    assert.throws(() => buildClubRegistrationPayload(data), /cam kết/);
    data.set('committedToRules', 'on');
    data.set('memberName', '  ');
    assert.throws(() => buildClubRegistrationPayload(data), /thành viên sáng lập/);
});

test('club opening submission rejects invalid frequency and whitespace-only required content', () => {
    const data = applicationData();
    for (const frequency of ['0', '1.5', '1000', '-1']) {
        data.set('activityFrequencyCount', frequency);
        assert.throws(() => buildClubRegistrationPayload(data), /Tần suất/);
    }
    data.set('activityFrequencyCount', '1');
    data.set('purpose', '   ');
    assert.throws(() => buildClubRegistrationPayload(data), /bắt buộc/);
});
