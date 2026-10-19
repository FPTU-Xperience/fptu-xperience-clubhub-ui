import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalProfilePatch, mergeCanonicalProfile } from './canonical-profile.js';

const local = {
    profile: {
        displayName: 'Old local',
        about: 'stale',
        skills: ['old'],
        interests: [],
        coverPreset: 'local-color',
        headline: 'device-only',
    },
    personal: { phoneNumber: 'old', address: 'device-only' },
    academic: { studentCode: 'device-only' },
};
const remote = {
    userId: 7,
    version: '00000000-0000-0000-0000-000000000001',
    profileSource: 'user-profile',
    profile: { displayName: 'Server', about: 'Canonical', skills: ['verified input'], interests: [] },
    personal: { phoneNumber: null },
};

test('canonical server fields override saved local text, without deleting local-only decoration', () => {
    const merged = mergeCanonicalProfile(local, remote, 7);
    assert.equal(merged.profile.displayName, 'Server');
    assert.equal(merged.profile.about, 'Canonical');
    assert.equal(merged.profile.coverPreset, 'local-color');
    assert.equal(merged.personal.phoneNumber, '');
    assert.equal(merged.personal.address, 'device-only');
});

test('profile rejects another account and malformed canonical responses', () => {
    assert.throws(() => mergeCanonicalProfile(local, remote, 8));
    assert.throws(() => mergeCanonicalProfile(local, { ...remote, profile: {} }, 7));
});

test('profile save sends version and only server-owned editable fields, excluding local academic and media data', () => {
    const merged = mergeCanonicalProfile(local, remote, 7);
    const body = canonicalProfilePatch(merged);
    assert.equal(body.expectedVersion, remote.version);
    assert.deepEqual(body.profile, remote.profile);
    assert.deepEqual(body.personal, { phoneNumber: null });
    assert.equal(Object.hasOwn(body, 'academic'), false);
    assert.equal(Object.hasOwn(body.profile, 'headline'), false);
    assert.equal(Object.hasOwn(body.profile, 'coverPreset'), false);
    assert.throws(() => canonicalProfilePatch(local));
});
