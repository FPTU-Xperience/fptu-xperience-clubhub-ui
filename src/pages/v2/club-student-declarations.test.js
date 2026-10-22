import test from 'node:test';
import assert from 'node:assert/strict';
import {
    canViewClubDeclarations,
    filterClubDeclarations,
    loadClubDeclarationDetail,
    loadClubDeclarations,
} from './club-workspace-page/tabs/student-declarations/club-declarations-data.js';
import { selectionFromClubAccess } from '../../services/my-clubs-adapter.js';

test('club declaration visibility respects delegated capability, explicit denial and observer/member boundaries', () => {
    assert.equal(canViewClubDeclarations(true, {}), true);
    assert.equal(canViewClubDeclarations(false, { displayRole: 'VICE_PRESIDENT' }), true);
    assert.equal(
        canViewClubDeclarations(false, { studentDeclarationPermissions: ['club.declarations.process'] }),
        true,
    );
    assert.equal(canViewClubDeclarations(true, { canViewStudentDeclarations: false }), true);
    assert.equal(canViewClubDeclarations(true, { canViewStudentDeclarations: true }, true), false);
    const [club] = selectionFromClubAccess(
        [{ clubId: 7, isApprovedMember: true, canViewStudentDeclarations: true }],
        [{ id: 7, code: 'C7', name: 'Club' }],
    );
    assert.equal(club.canViewStudentDeclarations, true);
    assert.equal(club.role, 'MEMBER');
});
test('club declarations traverse all authorized pages and never retain another club or unshared external record', async () => {
    const calls = [];
    const items = Array.from({ length: 101 }, (_, i) => ({
        id: `row-${i}`,
        clubId: i === 100 ? 7 : 8,
        status: 'Submitted',
    }));
    items.push({ id: 'external', clubId: null, sourceType: 'EXTERNAL' });
    const result = await loadClubDeclarations(
        {
            request: async (path) => {
                calls.push(path);
                return { items: calls.length === 1 ? items.slice(0, 100) : items.slice(100), totalItems: 102 };
            },
        },
        7,
    );
    assert.deepEqual(
        result.map((row) => row.id),
        ['row-100'],
    );
    assert.equal(calls.length, 2);
    assert.match(calls[1], /page=2&pageSize=100/);
    assert.equal(
        calls.some((path) => path.includes('/users/me/')),
        false,
    );
});
test('club list and detail preserve denial/stale/mismatched scope instead of using samples or trusting a URL', async () => {
    await assert.rejects(
        () =>
            loadClubDeclarations(
                {
                    request: async () => {
                        throw Object.assign(Error('Denied'), { status: 403 });
                    },
                },
                7,
            ),
        /Denied/,
    );
    let call = 0;
    await assert.rejects(
        () =>
            loadClubDeclarations(
                {
                    request: async () => ({
                        items: Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
                        totalItems: ++call === 1 ? 101 : 102,
                    }),
                },
                7,
            ),
        /thay đổi/,
    );
    await assert.rejects(
        () => loadClubDeclarationDetail({ request: async () => ({ id: 'x', clubId: 8 }) }, 7, 'x'),
        /không thuộc/,
    );
    const data = await loadClubDeclarationDetail(
        {
            request: async (path) => {
                assert.equal(path, '/api/v1/declarations/x');
                return { contribution: { id: 'x', clubId: 7, evidenceRefs: ['private'] }, decisions: [] };
            },
        },
        7,
        'x',
    );
    assert.deepEqual(data.contribution.evidenceRefs, ['private']);
    await assert.rejects(() => loadClubDeclarations({}, 'not-a-club'));
});
test('club search and semester filters do not invent a semester for historical declarations', () => {
    const items = [
        {
            id: 1,
            title: 'Giải thể thao',
            studentName: 'Nguyễn An',
            semesterId: 'FALL2026',
            status: 'RevisionRequested',
        },
        { id: 2, title: 'Chứng chỉ', studentName: 'Trần Bình', status: 'Approved' },
    ];
    assert.equal(filterClubDeclarations(items, { query: 'nguyễn', status: 'REVISIONREQUESTED' }).length, 1);
    assert.deepEqual(
        filterClubDeclarations(items, { semester: 'FALL2026', period: 'workspace' }).map((r) => r.id),
        [1],
    );
    assert.deepEqual(
        filterClubDeclarations(items, { period: 'unassigned' }).map((r) => r.id),
        [2],
    );
});

import {
    declarationPermissions,
    toggleDeclarationPermission,
    validateDeclarationPermissionPolicy,
} from './club-workspace-page/tabs/student-declarations/club-declaration-permissions.js';
test('one scoped permission grants reading, club review and forwarding without configuration rights', () => {
    assert.deepEqual(declarationPermissions(false, { displayRole: 'VICE_PRESIDENT' }), { process: true, manage: true });
    assert.deepEqual(declarationPermissions(true, {}), { process: true, manage: true });
    assert.deepEqual(declarationPermissions(false, { studentDeclarationPermissions: ['club.declarations.process'] }), {
        process: true,
        manage: false,
    });
    assert.deepEqual(declarationPermissions(false, { canViewStudentDeclarations: true }), {
        process: false,
        manage: false,
    });
    assert.deepEqual(
        declarationPermissions(false, {
            studentDeclarationPermissions: ['club.declarations.read', 'club.declarations.review'],
        }),
        { process: false, manage: false },
    );
    assert.deepEqual(declarationPermissions(true, {}, true), { process: false, manage: false });
});
test('single checkbox and policy validation reject obsolete grants and wrong scope', () => {
    const grants = toggleDeclarationPermission([], 'club.declarations.process', true);
    assert.deepEqual(grants, ['club.declarations.process']);
    assert.deepEqual(toggleDeclarationPermission(grants, 'club.declarations.process', false), []);
    assert.throws(() => toggleDeclarationPermission([], 'club.declarations.read', true));
    assert.throws(() => validateDeclarationPermissionPolicy({ clubId: 8, version: 'v1', roles: [] }, 7));
    assert.throws(() =>
        validateDeclarationPermissionPolicy(
            { clubId: 7, version: 'v1', roles: [{ role: 'MEMBER', permissions: ['club.declarations.submit'] }] },
            7,
        ),
    );
    assert.throws(() =>
        validateDeclarationPermissionPolicy(
            { clubId: 7, version: 'v1', roles: [{ role: 'ADMIN', permissions: [] }] },
            7,
        ),
    );
    assert.equal(
        validateDeclarationPermissionPolicy(
            { clubId: 7, version: 'v1', roles: [{ role: 'MEMBER', permissions: grants }] },
            7,
        ).version,
        'v1',
    );
});
test('workspace adapter preserves scoped vice president and only the unified permission', () => {
    const [club] = selectionFromClubAccess(
        [
            {
                clubId: 7,
                isApprovedMember: true,
                displayRole: 'VICE_PRESIDENT',
                studentDeclarationPermissions: ['club.declarations.process', 'club.declarations.read', 'unknown'],
            },
        ],
        [{ id: 7, code: 'C7', name: 'Club' }],
    );
    assert.equal(club.displayRole, 'VICE_PRESIDENT');
    assert.deepEqual(club.studentDeclarationPermissions, ['club.declarations.process']);
});
