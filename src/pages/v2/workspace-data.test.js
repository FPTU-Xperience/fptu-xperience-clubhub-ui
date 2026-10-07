import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { decodeWorkspaceClubCode, resolveWorkspace } from './workspace-data.js';

test('workspace resolver accepts only the current selection route identifier', () => {
    const selection = { status: 'populated', data: [{ clubId: 7, clubCode: 'F-CODE', name: 'F-Code', role: 'MEMBER' }] };
    assert.equal(resolveWorkspace(selection, 'f-code').workspace.name, 'F-Code');
    assert.equal(resolveWorkspace(selection, 'f-code').clubId, 7);
    assert.equal(resolveWorkspace(selection, 'other').status, 'not-found');
    assert.equal(resolveWorkspace({ status: 'loading', data: [] }, 'f-code').status, 'loading');
});

test('workspace identifiers decode safely', () => {
    assert.equal(decodeWorkspaceClubCode('f%2Dcode'), 'f-code');
    assert.equal(decodeWorkspaceClubCode('%invalid'), '');
});

test('production workspace stays V2-local and does not consume demo state', () => {
    const page = readFileSync(new URL('./club-workspace-page/ClubWorkspacePage.jsx', import.meta.url), 'utf8');
    const app = readFileSync(new URL('./V2App.jsx', import.meta.url), 'utf8');
    assert.match(app, /path="my-clubs\/:clubCode\/\*"/);
    assert.match(page, /PageState/);
    const tabView = readFileSync(new URL('./club-workspace-page/tabs/WorkspaceTabView.jsx', import.meta.url), 'utf8');
    const activities = readFileSync(new URL('./club-workspace-page/tabs/ActivitiesTab.jsx', import.meta.url), 'utf8');
    const members = readFileSync(new URL('./club-workspace-page/tabs/MembersTab.jsx', import.meta.url), 'utf8');
    const workspaceRail = readFileSync(new URL('./club-workspace-page/WorkspaceLeftRail.jsx', import.meta.url), 'utf8');
    assert.match(page, /WorkspaceTabView/);
    assert.match(page, /WorkspaceLeftRail/);
    assert.match(workspaceRail, /v2-workspace-left-rail/);
    assert.match(tabView, /ActivitiesTab/);
    assert.match(tabView, /ClubPageTab/);
    assert.doesNotMatch(tabView, /SettingsTab/);
    assert.match(activities, /v2-preview-events/);
    assert.match(activities, /dashboard\.data\?\.activities/);
    assert.match(activities, /api\.createActivity/);
    assert.match(activities, /V2Modal/);
    assert.match(members, /v2-preview-members/);
    assert.match(members, /approvedMembers/);
    assert.doesNotMatch(members, /workspacePreviewRecords|roleOptions/);
    assert.doesNotMatch(page, /DemoContext|\.\.\/model|\/v2\/demo|useDemo/);
});
