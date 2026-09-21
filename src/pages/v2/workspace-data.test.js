import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { decodeWorkspaceClubId, resolveWorkspace } from './workspace-data.js';

test('workspace resolver accepts only the current selection route identifier', () => {
    const selection = { status: 'populated', data: [{ clubId: 'f-code', name: 'F-Code', role: 'MEMBER' }] };
    assert.equal(resolveWorkspace(selection, 'f-code').workspace.name, 'F-Code');
    assert.equal(resolveWorkspace(selection, 'other').status, 'not-found');
    assert.equal(resolveWorkspace({ status: 'loading', data: [] }, 'f-code').status, 'loading');
});

test('workspace identifiers decode safely', () => {
    assert.equal(decodeWorkspaceClubId('f%2Dcode'), 'f-code');
    assert.equal(decodeWorkspaceClubId('%invalid'), '');
});

test('production workspace stays V2-local and does not consume demo state', () => {
    const page = readFileSync(new URL('./club-workspace-page/ClubWorkspacePage.jsx', import.meta.url), 'utf8');
    const app = readFileSync(new URL('./V2App.jsx', import.meta.url), 'utf8');
    assert.match(app, /path="my-clubs\/:clubId\/\*"/);
    assert.match(page, /PageState/);
    assert.match(page, /đang được cập nhật/);
    assert.doesNotMatch(page, /DemoContext|\.\.\/model|\/v2\/demo|useDemo/);
});
