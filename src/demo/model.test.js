import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, transition, membership, wallet, ownPoints, CURRENT_TERM } from './model.js';

const run = (s, type, clubId, payload = {}, userId = 'linh', term = CURRENT_TERM) =>
    transition(s, { type, clubId, payload, userId, term });
test('fixture: every membership and resource stays within its own club', () => {
    const s = createInitialState();
    assert.equal(membership(s, 'linh', 'fcode').role, 'manager');
    assert.equal(membership(s, 'linh', 'fstyle').role, 'member');
    assert.equal(membership(s, 'an', 'fcode'), undefined);
    s.activities.forEach((e) => e.checkedIn.forEach((id) => assert.ok(e.registered.includes(id))));
});
test('join, approve, enter; duplicate application and review rejected', () => {
    let s = createInitialState();
    const applied = run(s, 'apply', 'fcode', { reason: 'Muốn học React', newId: 'test-join' }, 'an');
    assert.ok(!applied.error);
    s = applied.state;
    assert.ok(run(s, 'apply', 'fcode', { reason: 'Lần 2' }, 'an').error);
    assert.equal(membership(s, 'an', 'fcode'), undefined);
    s = run(s, 'reviewApplication', 'fcode', { id: 'test-join', status: 'approved' }).state;
    assert.equal(membership(s, 'an', 'fcode').role, 'member');
    assert.ok(run(s, 'reviewApplication', 'fcode', { id: 'test-join', status: 'approved' }).error);
});
test('role of manager in A does not authorize B or another resource ID', () => {
    const s = createInitialState();
    assert.ok(run(s, 'createQuest', 'fstyle', { title: 'Bad' }).error);
    assert.ok(run(s, 'session', 'fcode', { id: 'fstyle-event-1' }).error);
    assert.ok(run(s, 'reviewApplication', 'green', { id: 'application-vy', status: 'approved' }).error);
    assert.ok(run(s, 'redeem', 'fcode', { id: 'fstyle-tote' }).error);
    assert.ok(run(s, 'settings', 'fcode', {}, 'staff').error);
    assert.ok(run(s, 'report', 'fcode', { id: 'green-report', title: 'Bad', content: 'Bad' }).error);
});
test('registration changes consistently and check-in awards only once', () => {
    let s = createInitialState();
    const id = 'fcode-event-0';
    assert.ok(s.activities.find((e) => e.id === id).registered.includes('minh'));
    s = run(s, 'register', 'fcode', { id }, 'minh').state;
    assert.ok(!s.activities.find((e) => e.id === id).registered.includes('minh'));
    s = run(s, 'register', 'fcode', { id }, 'minh').state;
    assert.ok(s.activities.find((e) => e.id === id).registered.includes('minh'));
    assert.ok(run(s, 'checkin', 'fcode', { id: 'fcode-event-1', code: 'BAD' }, 'minh').error);
    const before = ownPoints(s, 'minh', 'fcode');
    s = run(s, 'checkin', 'fcode', { id: 'fcode-event-1', code: 'FPT26' }, 'minh').state;
    assert.equal(ownPoints(s, 'minh', 'fcode'), before + 20);
    assert.ok(run(s, 'checkin', 'fcode', { id: 'fcode-event-1', code: 'FPT26' }, 'minh').error);
});
test('closed/full/completed events reject invalid participation', () => {
    const s = createInitialState();
    s.activities.find((e) => e.id === 'fcode-event-1').sessionOpen = false;
    assert.ok(run(s, 'checkin', 'fcode', { id: 'fcode-event-1', code: 'FPT26' }, 'minh').error);
    assert.ok(run(s, 'register', 'fcode', { id: 'fcode-event-2' }, 'minh').error);
    const upcoming = s.activities.find((e) => e.id === 'fcode-event-0');
    upcoming.registered = upcoming.registered.filter((id) => id !== 'minh');
    upcoming.capacity = upcoming.registered.length;
    assert.ok(run(s, 'register', 'fcode', { id: upcoming.id }, 'minh').error);
});
test('gift balance isolated; stock deducted, achievements unchanged', () => {
    let s = createInitialState();
    const points = ownPoints(s, 'linh', 'fcode');
    const other = wallet(s, 'linh', 'fstyle');
    const before = wallet(s, 'linh', 'fcode');
    s = run(s, 'redeem', 'fcode', { id: 'fcode-tote' }).state;
    assert.equal(wallet(s, 'linh', 'fcode'), before - 100);
    assert.equal(wallet(s, 'linh', 'fstyle'), other);
    assert.equal(ownPoints(s, 'linh', 'fcode'), points);
    assert.equal(s.gifts.find((g) => g.id === 'fcode-tote').stock, 7);
    assert.ok(run(s, 'redeem', 'fcode', { id: 'fcode-sticker' }).error);
    assert.ok(run(s, 'redeem', 'fcode', { id: 'fcode-bottle' }).error);
    const request = s.redemptions[0];
    s = run(s, 'fulfillGift', 'fcode', { id: request.id }).state;
    assert.equal(s.redemptions[0].status, 'received');
    assert.ok(run(s, 'fulfillGift', 'fcode', { id: request.id }).error);
});
test('contribution review requires reason, avoids duplicate and self awards', () => {
    let s = createInitialState();
    const payload = { id: 'sample-submission', status: 'approved', note: 'Sản phẩm đáp ứng yêu cầu' };
    assert.ok(run(s, 'reviewContribution', 'fcode', { id: 'sample-submission', status: 'approved' }).error);
    const points = ownPoints(s, 'minh', 'fcode');
    s = run(s, 'reviewContribution', 'fcode', payload).state;
    assert.equal(ownPoints(s, 'minh', 'fcode'), points + 50);
    assert.ok(run(s, 'reviewContribution', 'fcode', payload).error);
    s = run(s, 'contribute', 'fcode', { id: 'fcode-quest', evidence: 'Bài viết của tôi', newId: 'self-sub' }).state;
    assert.ok(run(s, 'reviewContribution', 'fcode', { id: 'self-sub', status: 'approved', note: 'Tự duyệt' }).error);
});
test('archived semester blocks mutations without changing input', () => {
    const s = createInitialState();
    const copy = structuredClone(s);
    for (const type of ['createActivity', 'report', 'redeem', 'register', 'settings'])
        assert.ok(run(s, type, 'fcode', { id: 'fcode-tote' }, 'linh', 'SU26').error);
    assert.deepEqual(s, copy);
});
test('report draft to submitted locks editing and validates fields', () => {
    let s = createInitialState();
    assert.ok(run(s, 'report', 'fcode', { title: '', content: '' }).error);
    s = run(s, 'report', 'fcode', {
        id: 'fcode-report',
        title: 'Báo cáo tháng 9',
        content: 'Nội dung',
        submit: true,
    }).state;
    assert.equal(s.reports.find((r) => r.id === 'fcode-report').status, 'submitted');
    assert.ok(run(s, 'report', 'fcode', { id: 'fcode-report', title: 'Sửa', content: 'Sửa' }).error);
});
test('settings affects recruitment; reset and profile do not touch other users', () => {
    let s = createInitialState();
    s = run(s, 'settings', 'fcode', { description: 'Giới thiệu mới', recruiting: false }).state;
    assert.ok(run(s, 'apply', 'fcode', { reason: 'Xin tham gia' }, 'an').error);
    s = run(s, 'profile', null, { headline: 'Hello', about: 'About', skills: 'React, Design' }).state;
    assert.deepEqual(s.profiles.linh.skills, ['React', 'Design']);
    assert.equal(s.profiles.minh, undefined);
    assert.equal(createInitialState().profiles.linh, undefined);
});
