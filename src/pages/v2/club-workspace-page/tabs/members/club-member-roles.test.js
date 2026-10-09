import assert from 'node:assert/strict';
import test from 'node:test';
import {
    CLUB_MEMBER_ROLES,
    CLUB_ROLE_PERMISSION_COLUMNS,
    clubRoleHasResponsibility,
    clubMemberRoleLabel,
    supportedClubRoleChange,
} from './club-member-roles.js';

test('role labels preserve API aliases and unknown values', () => {
    assert.equal(clubMemberRoleLabel('CLUB_MEMBER'), 'Thành viên');
    assert.equal(clubMemberRoleLabel('CONTENT'), 'Nội dung (Content)');
    assert.equal(clubMemberRoleLabel('EXTERNAL_ROLE'), 'EXTERNAL_ROLE');
    assert.equal(new Set(CLUB_MEMBER_ROLES.map((role) => role.id)).size, 8);
});

test('leadership has all club scopes and specialist scopes match assigned duties', () => {
    for (const role of ['CLUB_OWNER', 'VICE_PRESIDENT']) {
        for (const permission of CLUB_ROLE_PERMISSION_COLUMNS)
            assert.equal(clubRoleHasResponsibility(role, permission.id), true);
    }
    for (const [role, scopes] of Object.entries({
        CONTENT: ['participate', 'profile', 'eventContent'],
        EVENT: ['participate', 'eventStaff', 'eventApplications'],
        HR: ['participate', 'profile', 'recruitment'],
    })) {
        for (const permission of CLUB_ROLE_PERMISSION_COLUMNS)
            assert.equal(clubRoleHasResponsibility(role, permission.id), scopes.includes(permission.id));
    }
    assert.ok(!CLUB_MEMBER_ROLES.some((role) => role.id === 'TECHNICAL'));
});

test('only supported member/treasurer transitions can invoke existing APIs', () => {
    assert.equal(supportedClubRoleChange('CLUB_MEMBER', 'TREASURER'), true);
    assert.equal(supportedClubRoleChange('TREASURER', 'MEMBER'), true);
    for (const role of CLUB_MEMBER_ROLES) {
        if (!role.supported || role.id === 'CLUB_OWNER') {
            assert.equal(supportedClubRoleChange('MEMBER', role.id), false);
            assert.equal(supportedClubRoleChange(role.id, 'TREASURER'), false);
        }
    }
    assert.equal(supportedClubRoleChange('MEMBER', 'MEMBER'), false);
    assert.equal(supportedClubRoleChange('UNKNOWN', 'TREASURER'), false);
});
