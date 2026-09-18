import assert from 'node:assert/strict';
import test from 'node:test';
import {
    classifyHeaderNotificationError,
    createHeaderRequestGate,
    mapHeaderNotification,
    selectHeaderNotifications,
    unwrapHeaderNotifications,
} from './header-data.js';

test('header notification mapping keeps only display-safe fields', () => {
    const mapped = mapHeaderNotification({
        id: 7,
        title: 'Hoạt động mới',
        message: 'Bạn có một hoạt động mới.',
        createdAtUtc: '2026-09-17T10:00:00Z',
        isRead: true,
        recipientUserId: 'private-user',
        club: { members: ['private'] },
    });

    assert.deepEqual(mapped, {
        id: '7',
        title: 'Hoạt động mới',
        message: 'Bạn có một hoạt động mới.',
        createdAt: '2026-09-17T10:00:00Z',
        isRead: true,
    });
    assert.equal(mapHeaderNotification({ title: 'No id' }), null);
});

test('header notification normalization supports common response envelopes', () => {
    assert.equal(unwrapHeaderNotifications([{ id: 'a' }]).length, 1);
    assert.equal(unwrapHeaderNotifications({ items: [{ id: 'a' }] }).length, 1);
    assert.equal(unwrapHeaderNotifications({ content: [{ id: 'a' }] }).length, 1);
    assert.equal(unwrapHeaderNotifications({ data: [{ id: 'a' }] }).length, 1);
    assert.deepEqual(unwrapHeaderNotifications({}), []);
});

test('header summaries order by timestamp and limit to six items', () => {
    const entries = Array.from({ length: 7 }, (_, index) => ({
        id: String(index + 1),
        title: `N${index + 1}`,
        createdAtUtc: `2026-09-${String(index + 10).padStart(2, '0')}T00:00:00Z`,
    })).reverse();
    const summaries = selectHeaderNotifications(entries);

    assert.equal(summaries.length, 6);
    assert.deepEqual(summaries.map((item) => item.id), ['7', '6', '5', '4', '3', '2']);
    assert.equal(summaries.every((item) => item.isRead === false), true);
});

test('header notification errors remain distinct', () => {
    assert.equal(classifyHeaderNotificationError({ status: 401 }), 'unauthorized');
    assert.equal(classifyHeaderNotificationError({ status: 403 }), 'forbidden');
    assert.equal(classifyHeaderNotificationError({ status: 404 }), 'unavailable');
    assert.equal(classifyHeaderNotificationError(new Error('offline')), 'error');
});

test('header request gate rejects stale session or unmounted requests', () => {
    const gate = createHeaderRequestGate();
    const first = gate.next('student-a');
    const second = gate.next('student-b');
    assert.equal(gate.isCurrent(first, 'student-a'), false);
    assert.equal(gate.isCurrent(second, 'student-b'), true);
    gate.invalidate();
    assert.equal(gate.isCurrent(second, 'student-b'), false);
});
