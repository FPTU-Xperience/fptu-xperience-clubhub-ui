import test from 'node:test';
import assert from 'node:assert/strict';
import { governanceDisplayName } from './club-governance.js';
test('live governance display names override username snapshots without changing historical records', () => {
    const member = { userId: 104, displayName: 'mr28042005' };
    const term = { currentMemberNames: [{ userId: 104, displayName: '  Tên hiển thị  ' }] };
    assert.equal(governanceDisplayName(term, member), 'Tên hiển thị');
    assert.equal(member.displayName, 'mr28042005');
    term.currentMemberNames[0].displayName = 'Tên vừa cập nhật';
    assert.equal(governanceDisplayName(term, member), 'Tên vừa cập nhật');
});
test('display names stay bound to their user and preserve old-server compatibility', () => {
    const member = { userId: 104, displayName: 'Tên đã lưu' };
    assert.equal(
        governanceDisplayName({ currentMemberNames: [{ userId: 105, displayName: 'Người khác' }] }, member),
        'Tên đã lưu',
    );
    assert.equal(governanceDisplayName({}, member), 'Tên đã lưu');
});
