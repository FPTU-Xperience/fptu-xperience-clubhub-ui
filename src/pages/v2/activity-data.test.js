import { mapMyActivitySchedule } from './activity-data.js';
import { loadStudentActivitySchedule } from '../../services/student-read-api.js';
import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyActivityError, filterActivityFeed, mapActivityDetailItem, mapActivityFeed, mapRecommendations, selectDiscoveryActivities } from './activity-data.js';
import { loadStudentRecommendations } from '../../services/student-read-api.js';

const activity = { id: 'a', clubId: 'c', clubName: 'F-Code', title: 'Workshop', description: 'React', location: 'Lab', status: 'UPCOMING' };

test('activity details retain completed/cancelled activities without exposing attendance or broadening the discovery feed', () => {
    for (const status of ['COMPLETED', 'CANCELLED']) {
        const raw = { ...activity, status, participants: [{ userId: 10 }], attendances: [{ userId: 11 }] };
        assert.equal(mapActivityDetailItem(raw).status, status);
        assert.equal('participants' in mapActivityDetailItem(raw), false);
        assert.equal('attendances' in mapActivityDetailItem(raw), false);
        assert.deepEqual(mapActivityFeed([raw]), []);
    }
});

test('activity feed maps only current display-safe statuses and deduplicates', () => {
    const items = mapActivityFeed({ items: [activity, { ...activity, title: 'Duplicate' }, { id: 'old', status: 'COMPLETED' }] });
    assert.equal(items.length, 1); assert.equal(items[0].title, 'Workshop'); assert.equal('participants' in items[0], false);
});
test('activity feed search stays within authorized mapped values', () => { assert.equal(filterActivityFeed(mapActivityFeed([activity]), 'lab').length, 1); assert.equal(filterActivityFeed(mapActivityFeed([activity]), 'private').length, 0); });
test('activity feed carries the public cover URL without private fields', () => {
    const [item] = mapActivityFeed([{ ...activity, coverImageUrl: 'https://cdn.example.edu/public/activities/a.webp', participants: [{ userId: 1 }] }]);
    assert.equal(item.coverImageUrl, 'https://cdn.example.edu/public/activities/a.webp');
    assert.equal('participants' in item, false);
});
test('recommendations are ranked, unique, and capped at six', () => { const rows = Array.from({ length: 7 }, (_, index) => ({ recommendationId: String(index), rank: 7 - index, activity: { ...activity, id: String(index) } })); assert.equal(mapRecommendations({ items: rows }).length, 6); assert.equal(mapRecommendations({ items: rows })[0].rank, 1); });
test('activity availability failures remain distinct', () => { assert.equal(classifyActivityError({ status: 403 }), 'forbidden'); assert.equal(classifyActivityError({ status: 401 }), 'unauthorized'); assert.equal(classifyActivityError(new Error()), 'error'); });

test('authorized internal activities retain their scope in feed and recommendations', () => {
    const internal = { ...activity, isInternal: true };
    assert.equal(mapActivityFeed([internal])[0].isInternal, true);
    assert.equal(mapRecommendations([{ rank: 1, activity: internal }])[0].activity.isInternal, true);
    assert.equal(mapActivityFeed([{ ...activity, isInternal: false }])[0].isInternal, false);
});

test('basic recommendations retain explicit unavailable-personalization metadata and real activities', async () => {
    const value = { available: true, mode: 'BASIC', personalizationAvailable: false,
        personalizationUnavailableReason: 'SCORE_POLICY_UNAPPROVED',
        items: [{ rank: 1, activity, radarSnapshot: null, targetPillar: null }] };
    const loaded = await loadStudentRecommendations({ request: async () => value });
    assert.equal(loaded.mode, 'BASIC');
    assert.equal(loaded.personalizationAvailable, false);
    assert.equal(mapRecommendations(loaded)[0].activity.id, activity.id);
});

test('discovery shows live and closed-registration feed activities when recommendations are empty', () => {
    const feed = mapActivityFeed([
        { ...activity, id: 'live', status: 'LIVE', isInternal: true, canRegister: false },
        { ...activity, id: 'upcoming', canRegister: false },
    ]);
    assert.deepEqual(selectDiscoveryActivities(feed, []).map(item => item.id), ['live', 'upcoming']);
    assert.deepEqual(selectDiscoveryActivities(feed, [], 'LIVE').map(item => item.id), ['live']);
    assert.deepEqual(selectDiscoveryActivities(feed, [], 'UPCOMING').map(item => item.id), ['upcoming']);
});

test('recommendations prioritize authorized feed entries without expanding campus or membership scope', () => {
    const feed = mapActivityFeed([
        { ...activity, id: 'live', status: 'LIVE' },
        { ...activity, id: 'later' },
        { ...activity, id: 'soon' },
    ]);
    const ranking = mapRecommendations([
        { rank: 1, activity: { ...activity, id: 'outside-feed' } },
        { rank: 2, activity: { ...activity, id: 'soon' } },
        { rank: 3, activity: { ...activity, id: 'later' } },
    ]);
    assert.deepEqual(selectDiscoveryActivities(feed, ranking).map(item => item.id), ['soon', 'later', 'live']);
    assert.deepEqual(selectDiscoveryActivities([], ranking), []);
    assert.deepEqual(feed.map(item => item.id), ['live', 'later', 'soon']);
});

test('discovery filters the complete feed before limiting the preview to six', () => {
    const feed = mapActivityFeed([
        ...Array.from({ length: 7 }, (_, index) => ({ ...activity, id: `upcoming-${index}` })),
        { ...activity, id: 'live', status: 'LIVE' },
    ]);
    assert.equal(selectDiscoveryActivities(feed, []).length, 6);
    assert.deepEqual(selectDiscoveryActivities(feed, [], 'LIVE').map(item => item.id), ['live']);
});

test('registration permission survives public detail, feed and recommendation mapping without requiring membership', () => {
    const raw = { ...activity, isInternal: false, canRegister: true, isEligible: true };
    for (const mapped of [mapActivityDetailItem(raw), mapActivityFeed([raw])[0], mapRecommendations([{ rank: 1, activity: raw }])[0].activity]) {
        assert.equal(mapped.isInternal, false);
        assert.equal(mapped.canRegister, true);
        assert.equal(mapped.isEligible, true);
    }
});

test('scope does not fabricate registration permission when the API denies or omits it', () => {
    for (const isInternal of [true, false]) {
        for (const canRegister of [false, undefined, 'true', 1]) {
            assert.equal(mapActivityDetailItem({ ...activity, isInternal, canRegister }).canRegister, false);
        }
        assert.equal(mapActivityDetailItem({ ...activity, isInternal, canRegister: true }).canRegister, true);
    }
});

test('personal schedule keeps registered cross-club sessions, deduplicates and excludes ended/cancelled items', () => {
    const now = Date.parse('2026-11-03T00:00:00Z');
    const row = { activityId: 4, clubId: 999, title: 'Public external club', activityStatus: 'Scheduled',
        startTime: '2026-11-05T00:00:00Z', endTime: '2026-11-05T02:00:00Z' };
    const rows = mapMyActivitySchedule([row, row, {...row, sessionId: 2},
        {...row, activityId: 5, endTime: '2026-11-03T00:00:00Z'},
        {...row, activityId: 6, activityStatus: 'Cancelled'},
        {...row, activityId: 7, sessionStatus: 'CANCELLED'},
        {...row, activityId: 8, startTime: 'invalid'}], now);
    assert.deepEqual(rows.map(item => item.scheduleKey), ['4:legacy', '4:2']);
    assert.equal(rows[0].clubId, '999');
    assert.equal(rows[0].status, 'UPCOMING');
});

test('personal schedule loads every server page and propagates failures rather than inventing an empty calendar', async () => {
    const calls = [];
    const rows = await loadStudentActivitySchedule({request: async path => {
        calls.push(path);
        return {items: [{activityId: calls.length}], page: calls.length, totalPages: 2};
    }});
    assert.deepEqual(rows.map(item => item.activityId), [1, 2]);
    assert.ok(calls[1].includes('page=2'));
    await assert.rejects(loadStudentActivitySchedule({request: async () => ({items: [], page: 9, totalPages: 1})}));
    await assert.rejects(loadStudentActivitySchedule({request: async () => {throw new Error('Unavailable');}}), /Unavailable/);
});
