import { readProfile, saveProfile } from './profile-data.js';

export const ONBOARDING_VERSION = 1;
export const MIN_INTERESTS = 3;

export const MAJORS = [
    'Kỹ thuật phần mềm',
    'Trí tuệ nhân tạo',
    'An toàn thông tin',
    'Thiết kế mỹ thuật số',
    'Truyền thông đa phương tiện',
    'Kinh doanh quốc tế',
    'Digital Marketing',
    'Ngôn ngữ Anh',
    'Ngôn ngữ Nhật',
];

export const INTERESTS = [
    { id: 'technology', label: 'Công nghệ', description: 'Lập trình, AI, sản phẩm số' },
    { id: 'design', label: 'Thiết kế & sáng tạo', description: 'UI/UX, hình ảnh, nội dung' },
    { id: 'business', label: 'Kinh doanh', description: 'Khởi nghiệp, marketing, tài chính' },
    { id: 'arts', label: 'Nghệ thuật', description: 'Âm nhạc, nhảy, biểu diễn' },
    { id: 'sports', label: 'Thể thao', description: 'Rèn luyện, thi đấu, đồng đội' },
    { id: 'community', label: 'Cộng đồng', description: 'Tình nguyện, môi trường, kết nối' },
    { id: 'languages', label: 'Ngôn ngữ & văn hóa', description: 'Giao lưu và khám phá thế giới' },
    { id: 'leadership', label: 'Lãnh đạo', description: 'Tổ chức, mentoring, điều phối' },
];

export function onboardingStorageKey(user) {
    const identity = user?.id || user?.email;
    return identity ? `clubhub:v2:onboarding:${identity}` : null;
}

export function isValidOnboarding(value) {
    return (
        value?.version === ONBOARDING_VERSION &&
        typeof value.major === 'string' &&
        value.major.length > 0 &&
        Array.isArray(value.interests) &&
        value.interests.length >= MIN_INTERESTS
    );
}

export function readOnboarding(user, storage = globalThis.localStorage) {
    const key = onboardingStorageKey(user);
    if (!key || !storage) return null;
    try {
        const value = JSON.parse(storage.getItem(key));
        if (!isValidOnboarding(value)) return null;
        const profile = readProfile(user, storage);
        if (!value.profileSynced) {
            try {
                saveProfile(user, {
                    academic: { major: profile.academic.major || value.major },
                    interests: profile.profile.interests.length ? profile.profile.interests : value.interests.map((id) => INTERESTS.find((item) => item.id === id)?.label || id),
                }, storage);
                value.profileSynced = true;
                storage.setItem(key, JSON.stringify(value));
            } catch {
                // A completed onboarding remains completed if local storage is unavailable.
                return value;
            }
        }
        const current = readProfile(user, storage);
        return {
            ...value,
            major: current.academic.major,
            interests: current.profile.interests.map((label) => INTERESTS.find((item) => item.label === label)?.id || label),
        };
    } catch {
        return null;
    }
}

export function saveOnboarding(user, preferences, storage = globalThis.localStorage) {
    const key = onboardingStorageKey(user);
    if (!key || !storage) throw new Error('Không thể lưu sở thích khi chưa có tài khoản.');
    const value = {
        version: ONBOARDING_VERSION,
        major: String(preferences.major || '').trim(),
        interests: [...new Set(preferences.interests)],
        syncTimetable: Boolean(preferences.syncTimetable),
        completedAt: new Date().toISOString(),
        profileSynced: true,
    };
    if (!isValidOnboarding(value)) throw new Error('Vui lòng chọn chuyên ngành và ít nhất 3 sở thích.');
    saveProfile(user, {
        ...(preferences.profile || {}),
        academic: { ...(preferences.academic || {}), major: value.major },
        ...(preferences.personal ? { personal: preferences.personal } : {}),
        interests: value.interests.map((id) => INTERESTS.find((item) => item.id === id)?.label || id),
    }, storage);
    storage.setItem(key, JSON.stringify(value));
    return value;
}
