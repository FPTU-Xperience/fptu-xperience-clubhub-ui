import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveActivityContactPoint } from './activity-contact-point.js';
import { mapActivityDetailItem } from './activity-data.js';
const president = { userId: 1, displayName: 'Chủ tịch CLB', email: 'president@example.edu', phone: '0901234567' };
const host = (id, at, extra = {}) => ({
    id,
    assignmentKind: 'HOST',
    status: 'ASSIGNED',
    assignedAtUtc: at,
    contact: { userId: id, displayName: `Host ${id}`, email: `host${id}@example.edu` },
    ...extra,
});
test('contact falls back to explicit club president when no host has been assigned', () => {
    assert.equal(resolveActivityContactPoint({ clubPresidentContact: president }).source, 'CLUB_PRESIDENT');
    assert.equal(resolveActivityContactPoint({ clubPresidentContact: president }).userId, '1');
    assert.equal(resolveActivityContactPoint({ clubContactEmail: 'club@example.edu' }), null);
});
test('first active host is chosen by assignment timestamp then stable ID, never array order', () => {
    const data = {
        clubPresidentContact: president,
        hostAssignments: [
            host(5, '2026-10-16T10:00:00Z'),
            host(3, '2026-10-15T10:00:00Z'),
            host(2, '2026-10-15T10:00:00Z'),
        ],
    };
    assert.equal(resolveActivityContactPoint(data).userId, '2');
    data.hostAssignments[2].status = 'REMOVED';
    assert.equal(resolveActivityContactPoint(data).userId, '3');
    data.hostAssignments = [host(3, '2026-10-15T10:00:00Z', { assignmentKind: 'STAFF' })];
    assert.equal(resolveActivityContactPoint(data).source, 'CLUB_PRESIDENT');
});
test('host without contact or ordering data does not incorrectly fall back to president', () => {
    const result = resolveActivityContactPoint({
        clubPresidentContact: president,
        hostAssignments: [host(2, '2026-10-15T10:00:00Z', { contact: {} })],
    });
    assert.equal(result.source, 'FIRST_HOST');
    assert.equal(result.email, '');
    assert.equal(
        resolveActivityContactPoint({ clubPresidentContact: president, hostAssignments: [host(2, null)] }).displayName,
        '',
    );
});
test('canonical contact DTO takes precedence and public mapping drops raw assignments', () => {
    const raw = {
        id: 15,
        status: 'Scheduled',
        contactPoint: { ...president, source: 'CLUB_PRESIDENT' },
        hostAssignments: [host(2, '2026-10-15T10:00:00Z')],
    };
    const mapped = mapActivityDetailItem(raw);
    assert.equal(mapped.contactPoint.userId, '1');
    assert.equal(mapped.hostAssignments, undefined);
    assert.equal(
        resolveActivityContactPoint({
            contactPoint: { source: 'FIRST_HOST', email: 'javascript:alert(1)', phone: 'javascript:alert(1)' },
        }).email,
        '',
    );
});
