import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    PROFILE_STORAGE_VERSION,
    createMockProfile,
    profileStorageKey,
    readProfile,
    saveProfile,
    toSharedProfile,
} from './profile-data.js';

function memoryStorage() {
    const data = new Map();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
        removeItem: (key) => data.delete(key),
    };
}

const studentA = { id: 'student-a', name: 'Nguyễn Minh Anh', email: 'anh@fpt.edu.vn', avatar: 'NA' };
const studentB = { id: 'student-b', name: 'Trần Gia Hân', email: 'han@fpt.edu.vn', avatar: 'TH' };

test('profile storage requires an authenticated identity and isolates accounts', () => {
    assert.equal(profileStorageKey(null), null);
    assert.equal(profileStorageKey({}), null);
    assert.equal(profileStorageKey(studentA), 'clubhub:v2:profile:student-a');
    assert.equal(profileStorageKey({ id: 16 }), 'clubhub:v2:profile:16');
    assert.notEqual(profileStorageKey(studentA), profileStorageKey(studentB));
});

test('mock profile seeds representative data without mutating authenticated identity', () => {
    const before = structuredClone(studentA);
    const profile = createMockProfile(studentA);

    assert.deepEqual(studentA, before);
    assert.equal(profile.profile.displayName, studentA.name);
    assert.equal(profile.profile.initials, 'NA');
    assert.ok(profile.participations.length > 0);
    assert.ok(profile.evidence.length > 0);
    assert.equal(profile.summary.clubCount, profile.participations.length);
    assert.ok(profile.terms.some((term) => term.id === profile.evidence[0].term));
});

test('profile records round-trip per account and returned snapshots are cloned', () => {
    const storage = memoryStorage();
    const saved = saveProfile(studentA, { displayName: 'Anh M.', headline: 'Build with purpose', skills: ['React', 'React', 'Design'] }, storage);
    const reloaded = readProfile(studentA, storage);
    const other = readProfile(studentB, storage);

    assert.equal(saved.profile.displayName, 'Anh M.');
    assert.deepEqual(reloaded.profile.skills, ['React', 'Design']);
    assert.equal(other.profile.displayName, studentB.name);
    reloaded.profile.skills.push('Mutated by caller');
    assert.equal(readProfile(studentA, storage).profile.skills.includes('Mutated by caller'), false);
});

test('corrupt or old-version persisted values recover to an account seed', () => {
    const storage = memoryStorage();
    const key = profileStorageKey(studentA);
    storage.setItem(key, '{invalid-json');
    assert.equal(readProfile(studentA, storage).profile.displayName, studentA.name);

    storage.setItem(key, JSON.stringify({ version: PROFILE_STORAGE_VERSION - 1, profile: { displayName: 'Old' } }));
    assert.equal(readProfile(studentA, storage).profile.displayName, studentA.name);
});

test('save accepts only presentation fields and retains the prior record on validation failure', () => {
    const storage = memoryStorage();
    const prior = saveProfile(studentA, { displayName: 'Anh profile', about: 'A short introduction.' }, storage);

    assert.throws(() => saveProfile(studentA, { displayName: '   ' }, storage), /tên hiển thị/i);
    assert.throws(() => saveProfile(studentA, { headline: 'x'.repeat(161) }, storage), /160/);
    assert.throws(
        () => saveProfile(studentA, { skills: Array.from({ length: 13 }, (_, index) => `Skill ${index}`) }, storage),
        /12/,
    );
    const current = readProfile(studentA, storage);
    assert.equal(current.profile.displayName, prior.profile.displayName);

    const ignored = saveProfile(studentA, { studentCode: 'SE00000', academic: { major: 'Changed' } }, storage);
    assert.notEqual(ignored.academic.studentCode, 'SE00000');
    assert.notEqual(ignored.academic.major, 'Changed');
});

test('shared preview removes private fields without mutating or persisting the profile', () => {
    const storage = memoryStorage();
    const privateProfile = saveProfile(studentA, { displayName: 'Anh profile' }, storage);
    const shared = toSharedProfile(privateProfile);

    assert.equal(shared.academic.studentCode, '');
    assert.equal(shared.summary.recognizedContributionTotal, null);
    assert.deepEqual(shared.evidence, []);
    assert.equal(privateProfile.evidence.length > 0, true);
    assert.equal(readProfile(studentA, storage).profile.displayName, 'Anh profile');
});

test('production profile sources stay isolated from demo dependencies', () => {
    const sources = [
        readFileSync(new URL('./profile-data.js', import.meta.url), 'utf8'),
        readFileSync(new URL('./profile-page/ProfilePage.jsx', import.meta.url), 'utf8'),
    ];
    for (const source of sources) {
        assert.equal(source.includes('DemoContext'), false);
        assert.equal(source.includes("from './model"), false);
        assert.equal(source.includes("from './ui"), false);
        assert.equal(source.includes('/v2/demo'), false);
        assert.equal(source.includes('demo.scss'), false);
    }
});

test('authenticated V2 router owns the production profile route', () => {
    const source = readFileSync(new URL('./V2App.jsx', import.meta.url), 'utf8');
    assert.match(source, /path="profile" element=\{<ProfilePage user=\{user\} sessionKey=\{sessionKey\} \/>\}/);
});
