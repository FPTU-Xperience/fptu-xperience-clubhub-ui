import assert from 'node:assert/strict';
import {
    MIN_INTERESTS,
    onboardingStorageKey,
    readOnboarding,
    saveOnboarding,
} from '../src/features/onboarding/onboarding.js';

function memoryStorage() {
    const data = new Map();
    return {
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => data.set(key, value),
    };
}

const storage = memoryStorage();
const student = { id: 'student-a' };

assert.equal(onboardingStorageKey(student), 'clubhub:v2:onboarding:student-a');
assert.notEqual(onboardingStorageKey(student), onboardingStorageKey({ id: 'student-b' }));

const preferences = saveOnboarding(
    student,
    {
        major: 'Kỹ thuật phần mềm',
        interests: ['technology', 'design', 'community', 'technology'],
        syncTimetable: true,
    },
    storage,
);
assert.deepEqual(readOnboarding(student, storage), preferences);
assert.deepEqual(preferences.interests, ['technology', 'design', 'community']);

assert.throws(
    () => saveOnboarding(student, { major: 'Kỹ thuật phần mềm', interests: ['technology', 'design'] }, memoryStorage()),
    new RegExp(`ít nhất ${MIN_INTERESTS} sở thích`),
);

assert.throws(
    () =>
        saveOnboarding(
            student,
            { major: 'Ngành không tồn tại', interests: ['technology', 'design', 'community'] },
            memoryStorage(),
        ),
    /chuyên ngành/,
);

console.log('All onboarding storage and validation tests passed.');
