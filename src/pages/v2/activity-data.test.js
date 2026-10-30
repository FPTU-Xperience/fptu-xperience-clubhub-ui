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
