import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { formatBirthDate, parseBirthDate } from './profile-date.js';
import {
    PROFILE_STORAGE_VERSION,
    createMockProfile,
    mapProfileMemberships,
    loadProfileMemberships,
    profileStorageKey,
    readProfile,
    saveProfile,
    toSharedProfile,
    previewProfile,
    readProfileFromMemberships,
    projectOwnMemberProfile,
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

test('own membership seeds profile once and saved self edits override registration snapshots', () => {
    const storage = memoryStorage();
    const member = {
        id: 7,
        userId: studentA.id,
        fullName: 'Anh từ đơn CLB',
        phoneNumber: '0901234567',
        hobbies: 'Cloud, Cầu lông',
        skills: 'Linux',
        address: 'Hà Nội',
        expectations: 'Application only',
    };
    const imported = readProfileFromMemberships(
        studentA,
        [{ ...member, userId: studentB.id, fullName: 'Other' }, member],
        storage,
    );
    assert.equal(imported.profile.displayName, member.fullName);
    assert.deepEqual(imported.profile.interests, ['Cloud', 'Cầu lông']);
    assert.equal(imported.personal.address, 'Hà Nội');
    assert.ok(!('expectations' in imported.profile));
    saveProfile(studentA, { ...imported.profile, personal: { ...imported.personal, address: 'Đà Nẵng' } }, storage);
    const saved = readProfileFromMemberships(studentA, [member], storage);
    assert.equal(saved.personal.address, 'Đà Nẵng');
    const own = projectOwnMemberProfile(member, studentA, saved);
    assert.equal(own.address, 'Đà Nẵng');
    assert.equal(own.expectations, 'Application only');
    assert.equal(projectOwnMemberProfile(member, studentB, saved), member);
});

test('preview validates a draft without persisting or modifying the source', () => {
    const storage = memoryStorage();
    const before = readProfile(studentA, storage);
    const preview = previewProfile(before, { displayName: 'Draft', personal: { address: 'Preview address' } });
    assert.equal(preview.profile.displayName, 'Draft');
    assert.equal(before.profile.displayName, studentA.name);
    assert.equal(readProfile(studentA, storage).personal.address, '');
    assert.throws(() => previewProfile(before, { personal: { phoneNumber: 'invalid' } }), /điện thoại/);
});

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
    const saved = saveProfile(
        studentA,
        {
            displayName: 'Anh M.',
            headline: 'Build with purpose',
            skills: ['React', 'React', 'Design'],
            personal: { dateOfBirth: '2004-05-17', phoneNumber: '0901234567', address: 'TP. Hồ Chí Minh' },
        },
        storage,
    );
    const reloaded = readProfile(studentA, storage);
    const other = readProfile(studentB, storage);

    assert.equal(saved.profile.displayName, 'Anh M.');
    assert.deepEqual(reloaded.profile.skills, ['React', 'Design']);
    assert.equal(reloaded.personal.phoneNumber, '0901234567');
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

test('save validates editable profile and private application fields', () => {
    const storage = memoryStorage();
    const prior = saveProfile(studentA, { displayName: 'Anh profile', about: 'A short introduction.' }, storage);

    assert.throws(() => saveProfile(studentA, { displayName: '   ' }, storage), /tên hiển thị/i);
    assert.throws(() => saveProfile(studentA, { headline: 'x'.repeat(161) }, storage), /160/);
    assert.throws(() => saveProfile(studentA, { avatarUrl: 'javascript:alert(1)' }, storage), /ảnh đại diện/i);
    assert.throws(() => saveProfile(studentA, { personal: { phoneNumber: '123' } }, storage), /số điện thoại/i);
    assert.throws(
        () => saveProfile(studentA, { skills: Array.from({ length: 13 }, (_, index) => `Skill ${index}`) }, storage),
        /12/,
    );
    const current = readProfile(studentA, storage);
    assert.equal(current.profile.displayName, prior.profile.displayName);

    const ignored = saveProfile(studentA, { studentCode: 'SE00000', academic: { major: 'Changed' } }, storage);
    assert.notEqual(ignored.academic.studentCode, 'SE00000');
    assert.equal(ignored.academic.major, 'Changed');
    const withAvatar = saveProfile(studentA, { avatarUrl: 'https://cdn.example.edu/student/a.webp' }, storage);
    assert.equal(withAvatar.profile.avatarUrl, 'https://cdn.example.edu/student/a.webp');
    assert.equal(readProfile(studentB, storage).profile.avatarUrl, '');
    const withCover = saveProfile(studentA, { coverPreset: 'sunset' }, storage);
    assert.equal(withCover.profile.coverPreset, 'sunset');
    assert.equal(readProfile(studentB, storage).profile.coverPreset, 'default');
    assert.throws(() => saveProfile(studentA, { coverPreset: 'unknown' }, storage), /ảnh bìa/i);
    const withPersonalData = saveProfile(
        studentA,
        { personal: { dateOfBirth: '2004-05-17', phoneNumber: '0901234567' } },
        storage,
    );
    assert.equal(withPersonalData.personal.dateOfBirth, '2004-05-17');
    assert.equal(withPersonalData.personal.phoneNumber, '0901234567');
});

test('birth dates use DD/MM/YYYY in the editor and reject impossible calendar dates', () => {
    assert.equal(formatBirthDate('2004-05-17'), '17/05/2004');
    assert.equal(parseBirthDate('17/05/2004'), '2004-05-17');
    assert.equal(parseBirthDate('29/02/2004'), '2004-02-29');
    assert.equal(parseBirthDate('29/02/2000'), '2000-02-29');
    assert.equal(parseBirthDate(''), '');
    for (const invalid of [
        '29/02/2003',
        '29/02/1900',
        '31/04/2004',
        '00/05/2004',
        '17/13/2004',
        '17/05/0000',
        '2004-05-17',
    ]) {
        assert.throws(() => parseBirthDate(invalid), /ngày sinh/i);
    }
    const storage = memoryStorage();
    saveProfile(studentA, { personal: { dateOfBirth: '2004-05-17' } }, storage);
    assert.throws(() => saveProfile(studentA, { personal: { dateOfBirth: '2003-02-29' } }, storage), /ngày sinh/i);
    assert.equal(readProfile(studentA, storage).personal.dateOfBirth, '2004-05-17');
});

test('academic fields persist per account, support clearing and keep student code private', () => {
    const storage = memoryStorage();
    assert.equal(readProfile(studentA, storage).academic.campus, '');
    const academic = { campus: 'FPTU Hồ Chí Minh', major: 'Kỹ thuật phần mềm', year: 'K20', studentCode: 'SE123456' };
    saveProfile(studentA, { academic }, storage);
    assert.deepEqual(readProfile(studentA, storage).academic, academic);
    assert.equal(readProfile(studentB, storage).academic.campus, '');
    assert.equal(toSharedProfile(readProfile(studentA, storage)).academic.studentCode, '');
    assert.throws(() => saveProfile(studentA, { academic: { campus: 'x'.repeat(121) } }, storage), /campus/i);
    assert.equal(readProfile(studentA, storage).academic.campus, academic.campus);
    assert.equal(saveProfile(studentA, { academic: { major: '' } }, storage).academic.major, '');
    assert.equal(readProfile(studentA, storage).academic.campus, academic.campus);
});

test('shared preview removes private fields without mutating or persisting the profile', () => {
    const storage = memoryStorage();
    const privateProfile = saveProfile(studentA, { displayName: 'Anh profile' }, storage);
    const shared = toSharedProfile(privateProfile);

    assert.equal(shared.academic.studentCode, '');
    assert.equal(shared.summary.recognizedContributionTotal, null);
    assert.deepEqual(shared.evidence, []);
    assert.equal('personal' in shared, false);
    assert.equal(privateProfile.evidence.length > 0, true);
    assert.equal(readProfile(studentA, storage).profile.displayName, 'Anh profile');
});

test('profile clubs show only approved memberships from the API response', () => {
    const rows = [
        { clubId: 7, clubName: 'F-Code', role: 'MEMBER', status: 'APPROVED' },
        { clubId: 8, clubName: 'F-Style', role: 'MEMBER', status: 'PENDING' },
    ];
    assert.deepEqual(mapProfileMemberships(rows), [{ clubId: 7, clubName: 'F-Code', clubCode: '', logoUrl: '', role: 'MEMBER' }]);
    assert.deepEqual(mapProfileMemberships(null), []);
});

test('profile memberships load club logos and preserve approved clubs when a logo lookup fails', async () => {
    const requested = [];
    const clubs = await loadProfileMemberships({
        getMyMemberships: async () => [
            { clubId: 7, clubName: 'F-Code', status: 'APPROVED' },
            { clubId: 8, clubName: 'F-Style', status: 'PENDING' },
            { clubId: 9, clubName: 'Club 9', status: 'APPROVED' },
            { clubId: 10, clubName: 'Club 10', clubCode: 'C10', status: 'APPROVED', logoUrl: 'https://cdn.example.com/10.png' },
        ],
        getClub: async (id) => {
            requested.push(id);
            if (id === 9) throw new Error('Unavailable');
            return { id, code: 'F-CODE', logoUrl: 'https://cdn.example.com/7.png' };
        },
    });
    assert.deepEqual(requested, [7, 9]);
    assert.deepEqual(clubs.map((club) => club.clubCode), ['F-CODE', '', 'C10']);
    assert.deepEqual(
        clubs.map((club) => [club.clubId, club.logoUrl]),
        [
            [7, 'https://cdn.example.com/7.png'],
            [9, ''],
            [10, 'https://cdn.example.com/10.png'],
        ],
    );
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
    assert.match(
        source,
        /path="profile" element=\{<ProfilePage user=\{user\} sessionKey=\{sessionKey\} api=\{api\} profileImages=\{profileImages\} \/>\}/,
    );
});
