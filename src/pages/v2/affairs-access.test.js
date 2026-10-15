import assert from 'node:assert/strict';
import test from 'node:test';
import { adminAppUrl, getAdminAppUrl, getAdminClubUrl, isAffairsViewer } from './affairs-access.js';

test('only platform staff get observation navigation and bypass student onboarding', () => {
    for (const role of ['ADMIN', 'SYSTEM_ADMIN', 'STUDENT_AFFAIRS_ADMIN']) {
        assert.equal(isAffairsViewer({ roles: [role] }), true);
    }
    for (const roles of [[], ['CLUB_MEMBER'], ['CLUB_MANAGER'], ['TREASURER'], ['UNKNOWN']]) {
        assert.equal(isAffairsViewer({ roles }), false);
    }
    assert.equal(isAffairsViewer(null), false);
    assert.equal(isAffairsViewer({ roles: 'ADMIN' }), false);
    assert.equal(isAffairsViewer({ roles: ['CLUB_MEMBER', 'STUDENT_AFFAIRS_ADMIN'] }), true);
});

test('Admin handoff accepts only absolute web URLs', () => {
    assert.equal(adminAppUrl('https://admin.example.edu/#/ctsv/overview'), 'https://admin.example.edu/#/ctsv/overview');
    assert.equal(adminAppUrl('http://localhost:5174'), 'http://localhost:5174/');
    for (const value of ['', undefined, '/admin', 'javascript:alert(1)', 'data:text/html,test']) {
        assert.equal(adminAppUrl(value), null);
    }
});

test('Admin handoff selects local and production destinations without sharing tokens', () => {
    assert.equal(getAdminAppUrl({ development: true }), 'http://localhost:5174/');
    assert.equal(getAdminAppUrl(), 'https://fptux-admin-ui.pages.dev/');
    assert.equal(
        getAdminAppUrl({ override: 'https://admin.example.edu/', development: true }),
        'https://admin.example.edu/',
    );
    assert.equal(getAdminAppUrl({ override: 'javascript:alert(1)' }), null);
});

test('club handoff targets the existing Admin club detail query within HashRouter', () => {
    assert.equal(getAdminClubUrl(12), 'https://fptux-admin-ui.pages.dev/#/ctsv/clubs?club=12');
    assert.equal(getAdminClubUrl(12, { development: true }), 'http://localhost:5174/#/ctsv/clubs?club=12');
    assert.equal(getAdminClubUrl(null), null);
});
