import test from 'node:test';
import assert from 'node:assert/strict';
import { MIN_INTERESTS, onboardingStorageKey, readOnboarding, saveOnboarding } from './onboarding.js';

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
