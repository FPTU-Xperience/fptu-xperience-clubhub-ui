import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyActivityError, filterActivityFeed, mapActivityFeed, mapRecommendations } from './activity-data.js';

const activity = { id: 'a', clubId: 'c', clubName: 'F-Code', title: 'Workshop', description: 'React', location: 'Lab', status: 'UPCOMING' };

test('activity feed maps only current display-safe statuses and deduplicates', () => {
    const items = mapActivityFeed({ items: [activity, { ...activity, title: 'Duplicate' }, { id: 'old', status: 'COMPLETED' }] });
    assert.equal(items.length, 1); assert.equal(items[0].title, 'Workshop'); assert.equal('participants' in items[0], false);
});
test('activity feed search stays within authorized mapped values', () => { assert.equal(filterActivityFeed(mapActivityFeed([activity]), 'lab').length, 1); assert.equal(filterActivityFeed(mapActivityFeed([activity]), 'private').length, 0); });
test('recommendations are ranked, unique, and capped at six', () => { const rows = Array.from({ length: 7 }, (_, index) => ({ recommendationId: String(index), rank: 7 - index, activity: { ...activity, id: String(index) } })); assert.equal(mapRecommendations({ items: rows }).length, 6); assert.equal(mapRecommendations({ items: rows })[0].rank, 1); });
test('activity availability failures remain distinct', () => { assert.equal(classifyActivityError({ status: 403 }), 'forbidden'); assert.equal(classifyActivityError({ status: 401 }), 'unauthorized'); assert.equal(classifyActivityError(new Error()), 'error'); });
