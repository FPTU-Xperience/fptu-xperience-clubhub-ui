import test from 'node:test';
import assert from 'node:assert/strict';
import {
    applyGovernancePreview,
    createGovernancePreview,
    previewMemberPermissions,
    previewStorageKey,
    readGovernancePreview,
} from './governance-preview-data.js';

let sequence = 0;
const change = (state, command, semester = 'FA2026') =>
    applyGovernancePreview(
        state,
        semester,
        { reason: 'Phân công trong kỳ', ...command },
        {
            id: `change-${++sequence}`,
            actor: 'Chủ nhiệm mẫu',
            at: new Date(Date.UTC(2026, 9, 12, 3, sequence)).toISOString(),
        },
    );
test('promote, transfer and demote keep the full personal timeline independent of reports', () => {
    const initial = createGovernancePreview();
    let state = change(initial, { type: 'assign', groupId: 'content', memberIds: ['p5'] });
    state = change(state, { type: 'report' });
    const report = structuredClone(state.periods.FA2026.reports[0]);
    state = change(state, { type: 'transfer', groupId: 'content', destinationId: 'event', memberId: 'p5' });
    state = change(state, { type: 'remove', groupId: 'event', memberId: 'p5' });
    const events = state.periods.FA2026.history.filter((e) => e.memberId === 'p5');
    assert.deepEqual(
        events.map((e) => e.type),
        ['assign', 'transfer', 'remove'],
    );
    assert.deepEqual(
        events.map((e) => e.after.map((g) => g.name)),
        [['Content'], ['Sự kiện'], []],
    );
    assert.deepEqual(state.periods.FA2026.reports[0], report);
    assert.deepEqual(previewMemberPermissions(state.periods.FA2026, 'p5'), []);
    assert.equal(initial.periods.FA2026.revision, 1, 'commands must not mutate the old revision');
});
test('multiple groups union permissions and removal preserves permissions provided elsewhere', () => {
    let state = change(createGovernancePreview(), { type: 'assign', groupId: 'content', memberIds: ['p5'] });
    state = change(state, { type: 'assign', groupId: 'event', memberIds: ['p5'] });
    assert.equal(state.periods.FA2026.groups.filter((g) => g.memberIds.includes('p5')).length, 2);
    state = change(state, { type: 'remove', groupId: 'content', memberId: 'p5' });
    assert.deepEqual(previewMemberPermissions(state.periods.FA2026, 'p5'), [
        'event.registrations.manage',
        'event.staff.assign',
    ]);
});
test('editing group permissions records impact on people and keeps past group names', () => {
    let state = change(createGovernancePreview(), { type: 'assign', groupId: 'content', memberIds: ['p5'] });
    state = change(state, {
        type: 'saveGroup',
        groupId: 'content',
        presetId: 'CUSTOM',
        name: 'Truyền thông',
        description: '',
        permissions: ['club.profile.write'],
    });
    const personal = state.periods.FA2026.history.filter((e) => e.memberId === 'p5');
    assert.equal(personal[0].after[0].name, 'Content');
    assert.equal(personal[1].after[0].name, 'Truyền thông');
    assert.ok(personal[1].permissionsBefore.includes('event.content.write'));
    assert.ok(!personal[1].permissionsAfter.includes('event.content.write'));
});
test('treasurer limits apply across custom groups and failed transfer rolls back completely', () => {
    let state = change(createGovernancePreview(), { type: 'assign', groupId: 'treasurer', memberIds: ['p5'] });
    const before = structuredClone(state);
    assert.throws(
        () => change(state, { type: 'transfer', groupId: 'content', destinationId: 'treasurer', memberId: 'p2' }),
        /Tối đa 2/,
    );
    assert.deepEqual(state, before);
    assert.throws(
        () => change(state, { type: 'assign', groupId: 'treasurer', memberIds: ['p1'] }),
        /Tối đa 2|không kiêm/,
    );
    state = change(state, {
        type: 'saveGroup',
        presetId: 'CUSTOM',
        name: 'Kiểm soát ngân sách',
        description: '',
        permissions: ['club.finance.submit'],
    });
    const custom = state.periods.FA2026.groups.at(-1);
    assert.throws(() => change(state, { type: 'assign', groupId: custom.id, memberIds: ['p6'] }), /Tối đa 2/);
});
test('leadership requests never activate permissions and protected groups cannot be edited', () => {
    const state = change(createGovernancePreview(), { type: 'nominate', role: 'VICE_PRESIDENT', memberId: 'p5' });
    assert.equal(state.periods.FA2026.nominations[0].status, 'PendingApproval');
    assert.deepEqual(previewMemberPermissions(state.periods.FA2026, 'p5'), []);
    assert.throws(() => change(state, { type: 'assign', groupId: 'owner', memberIds: ['p5'] }), /CTSV/);
    assert.throws(
        () =>
            change(state, {
                type: 'saveGroup',
                presetId: 'CUSTOM',
                name: 'Fake leader',
                description: '',
                permissions: ['club.governance.groups.manage'],
            }),
        /danh mục/,
    );
});
test('archived semesters, stale writes and missing scope are rejected', () => {
    const state = createGovernancePreview();
    assert.throws(() => change(state, { type: 'assign', groupId: 'content', memberIds: ['p5'] }, 'SU2026'), /lưu trữ/);
    assert.throws(
        () => change(state, { type: 'assign', groupId: 'content', memberIds: ['p5'], expectedRevision: 0 }),
        /đã thay đổi/,
    );
    assert.throws(() => previewStorageKey('', 1), /Thiếu/);
    assert.notEqual(previewStorageKey(1, 1), previewStorageKey(2, 1));
    assert.notEqual(previewStorageKey(1, 1), previewStorageKey(1, 2));
});

test('default empty groups upgrade existing previews without rewriting assignments or reports', () => {
    const fresh = createGovernancePreview();
    assert.deepEqual(
        fresh.periods.FA2026.groups.map((g) => g.name),
        ['Chủ nhiệm', 'Phó chủ nhiệm', 'Content', 'Sự kiện', 'Nhân sự', 'Thư ký', 'Thủ quỹ'],
    );
    assert.ok(fresh.periods.FA2026.groups.find((g) => g.id === 'vice-president').protected);
    const old = change(fresh, { type: 'report' });
    old.schema = 1;
    old.periods.FA2026.groups = old.periods.FA2026.groups.filter(
        (g) => !['vice-president', 'hr', 'secretary'].includes(g.id),
    );
    const reports = structuredClone(old.periods.FA2026.reports);
    const archived = structuredClone(old.periods.SU2026);
    let saved = JSON.stringify(old);
    const storage = {
        getItem: () => saved,
        setItem: (_, value) => {
            saved = value;
        },
    };
    const upgraded = readGovernancePreview(storage, 'preview-test');
    assert.equal(upgraded.schema, 2);
    assert.equal(upgraded.periods.FA2026.groups.length, 7);
    assert.deepEqual(upgraded.periods.FA2026.reports, reports);
    assert.deepEqual(upgraded.periods.SU2026, archived);
    assert.deepEqual(upgraded.periods.FA2026.groups.find((g) => g.id === 'content').memberIds, ['p2']);
    for (const id of ['vice-president', 'hr', 'secretary'])
        assert.deepEqual(upgraded.periods.FA2026.groups.find((g) => g.id === id).memberIds, []);
    assert.deepEqual(
        readGovernancePreview(storage, 'preview-test'),
        upgraded,
        'migration must not add duplicate groups or events on reload',
    );
});
