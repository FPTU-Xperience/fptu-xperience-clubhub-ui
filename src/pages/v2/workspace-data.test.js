import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { decodeWorkspaceClubCode, resolveWorkspace } from './workspace-data.js';

test('workspace resolver accepts only the current selection route identifier', () => {
    const selection = {
        status: 'populated',
        data: [{ clubId: 7, clubCode: 'F-CODE', name: 'F-Code', role: 'MEMBER' }],
    };
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
    assert.match(activities, /components\/v2\/activity-card\/ActivityCard/);
    assert.match(activities, /dashboard\.data\?\.activities/);
    assert.match(activities, /reportTemplateUrl\(/);
    assert.doesNotMatch(activities, /api\.createActivity/);
    const application = readFileSync(
        new URL('./activity-application/ActivityApplicationPage.jsx', import.meta.url),
        'utf8',
    );
    assert.match(application, /api\.createActivityApplication/);
    assert.match(application, /api\.submitActivityApplication/);
    assert.doesNotMatch(application, /api\.createActivity\(|api\.createReport\(|localStorage/);
    assert.match(members, /v2-preview-members/);
    assert.match(members, /approvedMembers/);
    assert.match(members, /if \(manager \|\| readOnly\)\s+return <MemberManagement/);
    assert.match(members, /readOnly={readOnly}/);
    assert.doesNotMatch(members, /react-router-dom|to=|\/clubs\//);
    const management = readFileSync(
        new URL('./club-workspace-page/tabs/members/MemberManagement.jsx', import.meta.url),
        'utf8',
    );
    assert.match(management, /api\.getClubMembers/);
    assert.match(management, /api\.getClubMemberships/);
    assert.match(management, /api\.approveClubMembership/);
    assert.match(management, /api\.rejectClubMembership/);
    assert.match(management, /V2Modal/);
    assert.doesNotMatch(management, /updateClubMemberProfile|Chỉnh sửa hồ sơ|new FormData/);
    assert.doesNotMatch(management, /dialog\.member\.(additionalInfo|goals|personalInfo)/);
    assert.match(management, /Thông tin tại thời điểm đăng ký/);
    assert.match(management, /Nội dung đơn tham gia/);
    assert.doesNotMatch(management, /ClubMembersPage|DemoContext|useDemo|react-router-dom/);
    assert.doesNotMatch(members, /workspacePreviewRecords|roleOptions/);
    assert.doesNotMatch(page, /DemoContext|\.\.\/model|\/v2\/demo|useDemo/);
});
