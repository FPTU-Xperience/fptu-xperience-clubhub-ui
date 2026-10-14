import assert from 'node:assert/strict';
import test from 'node:test';
import {
    normalizeAutoGiftRules,
    saveAutoGiftRules,
    readAutoGiftRules,
    autoGiftRecipients,
} from './profile-page/auto-gift-rules.js';
const rule = {
    id: 'top-three',
    type: 'contest',
    eventId: 'contest-1',
    eventLabel: 'Design contest',
    audience: 'rank',
    rankFrom: 1,
    rankTo: 3,
    enabled: true,
};
const result = {
    id: 'contest-1',
    type: 'contest',
    clubId: 'club-1',
    status: 'COMPLETED',
    endTimeUtc: '2030-01-01T00:00:00Z',
    resultsFinalized: true,
    participants: [
        { userId: 1, participated: true, rank: 1 },
        { userId: 2, participated: true, rank: 3 },
        { userId: 3, participated: true, rank: 3 },
        { userId: 4, participated: true, rank: 4 },
        { userId: 5, participated: true, rank: 2, disqualified: true },
        { userId: 6, participated: false, rank: 1 },
    ],
};
const now = Date.parse(result.endTimeUtc);
const storage = () => {
    const data = new Map();
    return { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) };
};
test('rank rewards include ties, exclude disqualified/nonparticipants and deduplicate overlapping conditions', () => {
    assert.deepEqual(autoGiftRecipients('club-1', [rule, { ...rule, id: 'winner', rankTo: 1 }], result, now), [
        '1',
        '2',
        '3',
    ]);
    assert.deepEqual(autoGiftRecipients('club-1', [{ ...rule, rankFrom: 2, rankTo: 2 }], result, now), []);
    assert.deepEqual(autoGiftRecipients('club-1', [{ ...rule, audience: 'all' }], result, now), ['1', '2', '3', '4']);
});
test('awards wait for completed event and finalized results, never use provisional rankings or a different club/event', () => {
    for (const patch of [
        { status: 'LIVE' },
        { status: 'CANCELLED' },
        { resultsFinalized: false },
        { endTimeUtc: 'invalid' },
        { clubId: 'club-2' },
        { id: 'contest-2' },
        { type: 'activity' },
    ])
        assert.deepEqual(autoGiftRecipients('club-1', [rule], { ...result, ...patch }, now), []);
    assert.deepEqual(autoGiftRecipients('club-1', [rule], result, now - 1), []);
    assert.deepEqual(autoGiftRecipients('club-1', [{ ...rule, enabled: false }], result, now), []);
});
test('rule storage isolates issuer and reward, persists toggles, and removes conditions', () => {
    const db = storage();
    saveAutoGiftRules('club-1', 'gift-1', [rule], db);
    assert.deepEqual(readAutoGiftRules('club-1', 'gift-1', db), [rule]);
    assert.deepEqual(readAutoGiftRules('club-2', 'gift-1', db), []);
    assert.deepEqual(readAutoGiftRules('club-1', 'gift-2', db), []);
    saveAutoGiftRules('club-1', 'gift-1', [{ ...rule, enabled: false }], db);
    assert.equal(readAutoGiftRules('club-1', 'gift-1', db)[0].enabled, false);
    saveAutoGiftRules('club-1', 'gift-1', [], db);
    assert.deepEqual(readAutoGiftRules('club-1', 'gift-1', db), []);
});
test('invalid event references, rank ranges and duplicate rule IDs cannot be saved', () => {
    for (const patch of [
        { eventId: '' },
        { rankFrom: 0 },
        { rankTo: 0 },
        { rankFrom: 4 },
        { rankTo: 100001 },
        { rankFrom: 1.5 },
        { enabled: 'yes' },
        { type: 'other' },
    ])
        assert.throws(() => normalizeAutoGiftRules([{ ...rule, ...patch }]));
    assert.throws(() => normalizeAutoGiftRules([rule, rule]));
    assert.throws(() => normalizeAutoGiftRules(Array.from({ length: 21 }, (_, i) => ({ ...rule, id: `r${i}` }))));
});
