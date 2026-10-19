import test from 'node:test';
import assert from 'node:assert/strict';
import {
    activityPublication,
    canManageActivityPublication,
    isActivityPublic,
    saveActivityPublication,
} from './activity-publication.js';
import { mapActivityDetailItem, mapActivityFeed, mapRecommendations } from './activity-data.js';
import { summarizeWorkspaceDashboard } from './workspace-dashboard-data.js';

const raw = {
    id: 15,
    clubId: 7,
    title: 'Chuẩn bị workshop',
    status: 'Scheduled',
    sourceApplicationId: 91,
    isPublished: false,
    publicationVersion: 1,
    publicationCapabilities: { canManage: true },
};
test('new approved application activities stay private and legacy visibility remains compatible', () => {
    assert.equal(isActivityPublic(raw), false);
    assert.equal(isActivityPublic({ sourceApplicationId: 91 }), false);
    assert.equal(isActivityPublic({ id: 1 }), true);
    assert.equal(isActivityPublic({ ...raw, isPublished: true }), true);
    assert.deepEqual(activityPublication({}), {
        isPublished: null,
        publicationVersion: null,
        sourceApplicationId: null,
        publicationCapabilities: { canManage: false },
    });
});

test('GUID lifecycle publication hides drafts from member feeds and keeps closed registration visible', () => {
    assert.equal(isActivityPublic({ publicationStatus: 'DRAFT' }), false);
    assert.equal(isActivityPublic({ publicationStatus: 'PUBLISHED' }), true);
    assert.equal(isActivityPublic({ publicationStatus: 'CLOSED' }), true);
    assert.equal(activityPublication({ publicationStatus: 'DRAFT', version: 'guid' }).isPublished, false);
    assert.deepEqual(mapActivityFeed([{ id: 7, status: 'UPCOMING', publicationStatus: 'DRAFT' }]), []);
});
test('workspace detail retains private activity while discovery/recommendations exclude it', () => {
    assert.equal(mapActivityDetailItem(raw).isPublished, false);
    assert.equal(mapActivityDetailItem(raw).publicationVersion, 1);
    assert.deepEqual(mapActivityFeed([raw]), []);
    assert.deepEqual(mapRecommendations([{ rank: 1, activity: raw }]), []);
    assert.equal(mapActivityFeed([{ ...raw, isPublished: true }]).length, 1);
});
test('workspace manager sees unpublished preparation; member does not see it or count it', () => {
    const fulfilled = (value) => ({ status: 'fulfilled', value });
    const results = [fulfilled({}), fulfilled([raw]), fulfilled([]), fulfilled({})];
    const manager = summarizeWorkspaceDashboard(results, true);
    assert.equal(manager.activities.length, 1);
    assert.equal(manager.activities[0].isPublished, false);
    const member = summarizeWorkspaceDashboard(results, false);
    assert.equal(member.activities.length, 0);
    assert.equal(member.activityCount, 0);
});
test('switch requires server capability/version and scoped publish permission', () => {
    assert.equal(canManageActivityPublication(raw, { isManager: true }), true);
    assert.equal(canManageActivityPublication(raw, { isManager: true, permissions: [] }), false);
    assert.equal(canManageActivityPublication(raw, { permissions: ['activity.publish'] }), true);
    assert.equal(canManageActivityPublication({ ...raw, publicationCapabilities: {} }, { isManager: true }), false);
    assert.equal(canManageActivityPublication({ ...raw, publicationVersion: null }, { isManager: true }), false);
    assert.equal(canManageActivityPublication(raw, { isManager: false }), false);
});
test('publication only accepts matching versioned server acknowledgement; retries carry key', async () => {
    const calls = [];
    const api = {
        setActivityPublication: async (...args) => {
            calls.push(args);
            return { id: 15, isPublished: true, publicationVersion: 2 };
        },
    };
    const saved = await saveActivityPublication(api, raw, true, 'stable-key');
    assert.equal(saved.isPublished, true);
    assert.deepEqual(calls[0], [15, { isPublished: true, expectedVersion: 1 }, 'stable-key']);
    for (const receipt of [
        {},
        { id: 16, isPublished: true, publicationVersion: 2 },
        { id: 15, isPublished: false, publicationVersion: 2 },
        { id: 15, isPublished: true, publicationVersion: 1 },
    ]) {
        await assert.rejects(
            saveActivityPublication({ setActivityPublication: async () => receipt }, raw, true, 'key'),
            /chưa xác nhận/,
        );
    }
});
