import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_INTERESTS, onboardingStorageKey, readOnboarding, saveOnboarding } from './onboarding.js';
import { readProfile, saveProfile } from './profile-data.js';

function memoryStorage() {
    const data = new Map();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
    };
}

test('onboarding is isolated by authenticated user', () => {
    assert.equal(onboardingStorageKey({ id: 'student-a' }), 'clubhub:v2:onboarding:student-a');
    assert.notEqual(onboardingStorageKey({ id: 'student-a' }), onboardingStorageKey({ id: 'student-b' }));
});

test('completed preferences round-trip and deduplicate interests', () => {
    const storage = memoryStorage();
    const user = { id: 'student-a' };
    const value = saveOnboarding(
        user,
        {
            major: 'Kỹ thuật phần mềm',
            interests: ['technology', 'design', 'community', 'technology'],
            syncTimetable: true,
        },
        storage,
    );
    assert.deepEqual(readOnboarding(user, storage), value);
    assert.deepEqual(value.interests, ['technology', 'design', 'community']);
});

test(`onboarding requires at least ${MIN_INTERESTS} interests`, () => {
    assert.throws(
        () =>
            saveOnboarding(
                { id: 'student-a' },
                { major: 'Kỹ thuật phần mềm', interests: ['technology', 'design'] },
                memoryStorage(),
            ),
        /ít nhất 3 sở thích/,
    );
});

test('onboarding saves all supplied fields into the same account profile', () => {
    const storage = memoryStorage();
    const user = { id: 'student-a', name: 'Minh Anh' };
    saveOnboarding(user, {
        major: 'Kỹ thuật phần mềm',
        interests: ['technology', 'design', 'community'],
        profile: { displayName: 'Anh', headline: 'Hello campus', about: 'About me', skills: ['React', 'Design'] },
        academic: { campus: 'FPTU Hồ Chí Minh', year: 'K20', studentCode: 'SE123456' },
        personal: { dateOfBirth: '2004-05-17', phoneNumber: '0901234567', address: 'TP. Hồ Chí Minh' },
    }, storage);
    const profile = readProfile(user, storage);
    assert.equal(profile.profile.displayName, 'Anh');
    assert.equal(profile.profile.headline, 'Hello campus');
    assert.equal(profile.profile.about, 'About me');
    assert.deepEqual(profile.profile.skills, ['React', 'Design']);
    assert.deepEqual(profile.profile.interests, ['Công nghệ', 'Thiết kế & sáng tạo', 'Cộng đồng']);
    assert.deepEqual(profile.academic, { campus: 'FPTU Hồ Chí Minh', year: 'K20', studentCode: 'SE123456', major: 'Kỹ thuật phần mềm' });
    assert.equal(profile.personal.dateOfBirth, '2004-05-17');
    assert.equal(profile.personal.phoneNumber, '0901234567');
    assert.equal(profile.personal.address, 'TP. Hồ Chí Minh');
    assert.equal(readProfile({ id: 'student-b' }, storage).academic.major, '');
});

test('legacy onboarding fills missing profile data once and respects later edits', () => {
    const storage = memoryStorage();
    const user = { id: 'student-a' };
    storage.setItem(onboardingStorageKey(user), JSON.stringify({ version: 1, major: 'Kỹ thuật phần mềm', interests: ['technology', 'design', 'community'], completedAt: '2026-01-01' }));
    assert.ok(readOnboarding(user, storage));
    assert.equal(readProfile(user, storage).academic.major, 'Kỹ thuật phần mềm');
    assert.deepEqual(readProfile(user, storage).profile.interests, ['Công nghệ', 'Thiết kế & sáng tạo', 'Cộng đồng']);
    saveProfile(user, { academic: { major: 'Ngôn ngữ Anh' }, interests: ['Nghệ thuật', 'Nhiếp ảnh'] }, storage);
    const preferences = readOnboarding(user, storage);
    assert.equal(preferences.major, 'Ngôn ngữ Anh');
    assert.deepEqual(preferences.interests, ['arts', 'Nhiếp ảnh']);
    assert.equal(readProfile(user, storage).academic.major, 'Ngôn ngữ Anh');
    saveProfile(user, { academic: { major: '' }, interests: [] }, storage);
    assert.ok(readOnboarding(user, storage));
    assert.equal(readProfile(user, storage).academic.major, '');
    assert.deepEqual(readProfile(user, storage).profile.interests, []);
});

test('legacy migration preserves profile information already supplied by the student', () => {
    const storage = memoryStorage();
    const user = { id: 'student-a' };
    saveProfile(user, { academic: { major: 'Ngôn ngữ Anh', campus: 'Campus của tôi' }, interests: ['Nghệ thuật'] }, storage);
    storage.setItem(onboardingStorageKey(user), JSON.stringify({ version: 1, major: 'Kỹ thuật phần mềm', interests: ['technology', 'design', 'community'] }));
    readOnboarding(user, storage);
    assert.equal(readProfile(user, storage).academic.major, 'Ngôn ngữ Anh');
    assert.equal(readProfile(user, storage).academic.campus, 'Campus của tôi');
    assert.deepEqual(readProfile(user, storage).profile.interests, ['Nghệ thuật']);
});

test('invalid personal data cannot complete onboarding or overwrite a saved profile', () => {
    const storage = memoryStorage();
    const user = { id: 'student-a' };
    saveProfile(user, { displayName: 'Existing name' }, storage);
    assert.throws(() => saveOnboarding(user, { major: 'Kỹ thuật phần mềm', interests: ['technology', 'design', 'community'], profile: { displayName: 'New name' }, personal: { dateOfBirth: '2003-02-29' } }, storage), /ngày sinh/i);
    assert.equal(readOnboarding(user, storage), null);
    assert.equal(readProfile(user, storage).profile.displayName, 'Existing name');
});
