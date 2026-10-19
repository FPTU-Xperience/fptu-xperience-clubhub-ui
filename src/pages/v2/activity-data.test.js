import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyActivityError, filterActivityFeed, loadStudentActivityFeed, mapActivityDetailItem, mapActivityFeed, mapRecommendations } from './activity-data.js';

const activity = { id: 'a', clubId: 'c', clubName: 'F-Code', title: 'Workshop', description: 'React', location: 'Lab', status: 'UPCOMING' };

test('student feed reads every server page and refuses to combine changed visibility scopes', async () => {
    const calls = [];
    const api = { getStudentActivities: async (query) => { calls.push(query); return { items: [{ id: query.page }], totalPages: 2, scopeVersion: 's1' }; } };
    assert.deepEqual((await loadStudentActivityFeed(api, 7)).map((item) => item.id), [1, 2]);
    assert.deepEqual(calls.map((query) => [query.clubId, query.page, query.pageSize]), [[7, 1, 100], [7, 2, 100]]);
    await assert.rejects(loadStudentActivityFeed({ getStudentActivities: async ({ page }) => ({ items: [], totalPages: 2, scopeVersion: String(page) }) }), /Quyền xem/);
    await assert.rejects(loadStudentActivityFeed({ getStudentActivities: async () => ({ items: [] }) }), /không hợp lệ/);
});

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
