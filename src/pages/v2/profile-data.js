import { useCallback, useEffect, useRef, useState } from 'react';
import { formatBirthDate, parseBirthDate } from './profile-date.js';
import { COVER_COLORS, getCoverShapes, canUseCoverItem, readCoverInventory } from './profile-page/cover-cosmetics.js';

import { normalizeCoverTransform, normalizeCoverText } from './profile-page/cover-design.js';

export const PROFILE_STORAGE_VERSION = 1;
const MAX_DISPLAY_NAME = 120;
const MAX_HEADLINE = 160;
const MAX_ABOUT = 2000;
const MAX_LIST_ITEMS = 12;
const MAX_LIST_ITEM_LENGTH = 80;
const PHONE_NUMBER_PATTERN = /^\+?[0-9]{9,15}$/;

const clone = (value) => structuredClone(value);
const accountIdentity = (user) => {
    const identity = user?.id ?? user?.email;
    return identity === undefined || identity === null || identity === '' ? '' : String(identity);
};
const text = (value, fallback = '') => String(value ?? fallback).trim();

function initials(value) {
    const result = text(value)
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return result || 'SV';
}

function normalizeList(value, field) {
    const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    if (values.length > MAX_LIST_ITEMS) throw new Error(`${field} chỉ được có tối đa ${MAX_LIST_ITEMS} mục.`);
    const normalized = [...new Set(values.map((item) => text(item)).filter(Boolean))];
    if (normalized.some((item) => item.length > MAX_LIST_ITEM_LENGTH)) {
        throw new Error(`Mỗi mục ${field.toLowerCase()} tối đa ${MAX_LIST_ITEM_LENGTH} ký tự.`);
    }
    return normalized;
}

function editableProfile(value, fallback, storage = globalThis.localStorage) {
    const displayName = value.displayName === undefined ? fallback.displayName : text(value.displayName);
    const headline = value.headline === undefined ? fallback.headline : text(value.headline);
    const about = value.about === undefined ? fallback.about : text(value.about);
    const skills = value.skills === undefined ? fallback.skills : normalizeList(value.skills, 'Kỹ năng');
    const interests = value.interests === undefined ? fallback.interests : normalizeList(value.interests, 'Sở thích');
    const avatarUrl = value.avatarUrl === undefined ? fallback.avatarUrl : text(value.avatarUrl);
    const coverPreset = value.coverPreset === undefined ? fallback.coverPreset : text(value.coverPreset);
    const coverShape = value.coverShape === undefined ? fallback.coverShape || 'petals' : text(value.coverShape);
    const coverBackgroundColor =
        coverPreset !== 'custom'
            ? coverPreset
            : text(value.coverBackgroundColor ?? fallback.coverBackgroundColor ?? 'default');
    if (!COVER_COLORS.some((item) => item.id === coverBackgroundColor))
        throw new Error('Màu nền ảnh bìa không hợp lệ.');

    if (!displayName) throw new Error('Vui lòng nhập tên hiển thị.');
    if (displayName.length > MAX_DISPLAY_NAME) throw new Error(`Tên hiển thị tối đa ${MAX_DISPLAY_NAME} ký tự.`);
    if (headline.length > MAX_HEADLINE) throw new Error(`Tiêu đề tối đa ${MAX_HEADLINE} ký tự.`);
    if (about.length > MAX_ABOUT) throw new Error(`Giới thiệu tối đa ${MAX_ABOUT} ký tự.`);
    if (avatarUrl && (avatarUrl.length > 1000 || !/^https:\/\//i.test(avatarUrl))) {
        throw new Error('Đường dẫn ảnh đại diện không hợp lệ.');
    }
    if (![...COVER_COLORS.map((item) => item.id), 'custom'].includes(coverPreset)) {
        throw new Error('Mẫu ảnh bìa không hợp lệ.');
    }
    if (!getCoverShapes(storage).some((item) => item.id === coverShape)) throw new Error('Shape ảnh bìa không hợp lệ.');

    return {
        displayName,
        headline,
        about,
        skills,
        interests,
        avatarUrl,
        coverPreset,
        coverShape,
        coverBackgroundColor,
        coverShapeTransform: normalizeCoverTransform(value.coverShapeTransform, fallback.coverShapeTransform),
        coverText: normalizeCoverText(value.coverText, fallback.coverText),
    };
}

function editablePersonal(value, fallback) {
    const dateOfBirth = value.dateOfBirth === undefined ? fallback.dateOfBirth : text(value.dateOfBirth);
    const phoneNumber = value.phoneNumber === undefined ? fallback.phoneNumber : text(value.phoneNumber);
    const address = value.address === undefined ? fallback.address : text(value.address);

    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        throw new Error('Ngày sinh không hợp lệ.');
    }
    if (dateOfBirth) parseBirthDate(formatBirthDate(dateOfBirth));
    if (phoneNumber && !PHONE_NUMBER_PATTERN.test(phoneNumber)) {
        throw new Error('Số điện thoại phải có từ 9 đến 15 chữ số.');
    }
    if (address.length > 500) throw new Error('Địa chỉ tối đa 500 ký tự.');

    return { dateOfBirth, phoneNumber, address };
}

function editableAcademic(value, fallback) {
    const fields = {
        campus: ['Campus', 120],
        major: ['Ngành học', 120],
        year: ['Khóa học', 30],
        studentCode: ['Mã sinh viên', 30],
    };
    const academic = { ...fallback };
    for (const [field, [label, limit]] of Object.entries(fields)) {
        academic[field] = value[field] === undefined ? fallback[field] : text(value[field]);
        if (academic[field].length > limit) throw new Error(`${label} tối đa ${limit} ký tự.`);
    }
    return academic;
}

export function profileStorageKey(user) {
    const identity = accountIdentity(user);
    return identity ? `clubhub:v2:profile:${identity}` : null;
}

export function createMockProfile(user) {
    const identity = accountIdentity(user);
    if (!identity) throw new Error('Không thể tải hồ sơ khi chưa có tài khoản.');
    const displayName = text(user?.name || user?.fullName, 'Sinh viên FPTU');
    const primaryTerm = 'FA26';
    const secondaryTerm = 'SU26';
    const participations = [
        { clubId: 'fcode', clubName: 'F-Code', clubLogoUrl: '', role: 'THÀNH VIÊN' },
        { clubId: 'fstyle', clubName: 'F-Style', clubLogoUrl: '', role: 'THÀNH VIÊN' },
    ];
    const evidence = [
        {
            id: `${identity}-evidence-1`,
            term: primaryTerm,
            date: '2026-09-12',
            clubId: 'fcode',
            clubName: 'F-Code',
            title: 'Đồng hành Code Camp: Build for Campus',
            source: 'Hoạt động CLB',
            verifier: 'Ban chủ nhiệm F-Code',
            points: 30,
        },
        {
            id: `${identity}-evidence-2`,
            term: primaryTerm,
            date: '2026-08-29',
            clubId: 'fstyle',
            clubName: 'F-Style',
            title: 'Hỗ trợ triển lãm Portfolio Night',
            source: 'Đóng góp CLB',
            verifier: 'Ban chủ nhiệm F-Style',
            points: 20,
        },
        {
            id: `${identity}-evidence-3`,
            term: secondaryTerm,
            date: '2026-06-18',
            clubId: 'fcode',
            clubName: 'F-Code',
            title: 'Tham dự Design Systems Workshop',
            source: 'Hoạt động CLB',
            verifier: 'Ban chủ nhiệm F-Code',
            points: 15,
        },
    ];
    const contributionTotal = evidence.reduce((total, item) => total + item.points, 0);
    return {
        profile: {
            displayName,
            avatarUrl: '',
            coverPreset: 'default',
            coverShape: 'petals',
            initials: text(user?.avatar, initials(displayName)),
            headline: 'Học hỏi, kết nối và tạo dấu ấn theo cách của mình.',
            about: '',
            interests: [],
            skills: [],
            project: 'Một hành trình được xây từ những lần dám thử.',
        },
        personal: {
            dateOfBirth: '',
            phoneNumber: '',
            address: '',
        },
        academic: {
            campus: '',
            major: '',
            year: '',
            studentCode: '',
        },
        participations,
        summary: {
            clubCount: participations.length,
            activityCount: evidence.filter((item) => item.source === 'Hoạt động CLB').length,
            recognizedContributionTotal: contributionTotal,
            contributionRecordCount: evidence.length,
            experiencePillars: {
                current: [66, 43, 36, 58, 78, 49],
                previous: [52, 31, 25, 44, 64, 35],
            },
        },
        evidence,
        terms: [
            { id: primaryTerm, label: 'Fall 2026' },
            { id: secondaryTerm, label: 'Summer 2026' },
        ],
    };
}

function isPersistedProfile(value) {
    return value?.version === PROFILE_STORAGE_VERSION && value?.profile && typeof value.profile === 'object';
}

function storageFor(storage) {
    if (!storage?.getItem || !storage?.setItem) throw new Error('Bộ nhớ hồ sơ tạm thời hiện chưa khả dụng.');
    return storage;
}

function savedProfileRecord(user, storage) {
    const key = profileStorageKey(user);
    if (!key) return null;
    try {
        const stored = storageFor(storage).getItem(key);
        const value = stored ? JSON.parse(stored) : null;
        return isPersistedProfile(value) ? value : null;
    } catch {
        return null;
    }
}

export function readProfile(user, storage = globalThis.localStorage) {
    const seed = createMockProfile(user);
    const saved = savedProfileRecord(user, storage);
    if (!saved) return clone(seed);
    try {
        return {
            ...seed,
            profile: {
                ...seed.profile,
                ...editableProfile(saved.profile, seed.profile, storage),
            },
            personal: editablePersonal(saved.personal || {}, seed.personal),
            academic: editableAcademic(saved.academic || {}, seed.academic),
        };
    } catch {
        return clone(seed);
    }
}

export function saveProfile(user, patch, storage = globalThis.localStorage) {
    const key = profileStorageKey(user);
    if (!key) throw new Error('Không thể lưu hồ sơ khi chưa có tài khoản.');
    const current = readProfile(user, storage);
    const profile = editableProfile(patch || {}, current.profile, storage);
    const inventory = readCoverInventory(user, storage);
    if (
        !canUseCoverItem('color', profile.coverBackgroundColor, inventory, storage) ||
        !canUseCoverItem('shape', profile.coverShape, inventory, storage)
    ) {
        throw new Error('Bạn cần đổi màu hoặc shape này tại Kho quà của CLB trước khi sử dụng.');
    }
    const personal = editablePersonal(patch?.personal || {}, current.personal);
    const academic = editableAcademic(patch?.academic || {}, current.academic);
    const record = { version: PROFILE_STORAGE_VERSION, profile, personal, academic, savedAt: new Date().toISOString() };
    storageFor(storage).setItem(key, JSON.stringify(record));
    if (typeof window !== 'undefined')
        window.dispatchEvent(new CustomEvent('clubhub:profile-updated', { detail: { key } }));
    return readProfile(user, storage);
}

export function previewProfile(current, patch) {
    return {
        ...clone(current),
        profile: { ...current.profile, ...editableProfile(patch || {}, current.profile) },
        personal: editablePersonal(patch?.personal || {}, current.personal),
        academic: editableAcademic(patch?.academic || {}, current.academic),
    };
}

export function readProfileFromMemberships(user, memberships, storage = globalThis.localStorage) {
    const current = readProfile(user, storage);
    if (savedProfileRecord(user, storage)) return current;
    if (user?.id === undefined || user?.id === null) return current;
    const own = (Array.isArray(memberships) ? memberships : []).filter(
        (member) => String(member.userId) === String(user.id),
    );
    own.sort(
        (a, b) =>
            String(b.requestedAtUtc || '').localeCompare(String(a.requestedAtUtc || '')) || Number(b.id) - Number(a.id),
    );
    const member = own[0];
    if (!member) return current;
    try {
        return previewProfile(current, {
            displayName: member.fullName || current.profile.displayName,
            about: member.personalInfo || '',
            interests: member.hobbies || [],
            skills: member.skills || [],
            personal: {
                dateOfBirth: member.dateOfBirth || '',
                phoneNumber: member.phoneNumber || '',
                address: member.address || '',
            },
        });
    } catch {
        return current;
    }
}

export function projectOwnMemberProfile(member, user, snapshot) {
    if (!snapshot || !user?.id || String(member.userId) !== String(user.id)) return member;
    return {
        ...member,
        fullName: snapshot.profile.displayName,
        phoneNumber: snapshot.personal.phoneNumber,
        address: snapshot.personal.address,
        dateOfBirth: snapshot.personal.dateOfBirth,
        hobbies: snapshot.profile.interests.join(', '),
        skills: snapshot.profile.skills.join(', '),
        profileAbout: snapshot.profile.about,
        profileSource: 'local-self',
    };
}

export function toSharedProfile(snapshot) {
    const shared = clone(snapshot);
    delete shared.personal;
    shared.academic.studentCode = '';
    shared.summary.recognizedContributionTotal = null;
    shared.summary.contributionRecordCount = null;
    shared.evidence = [];
    return shared;
}

export function mapProfileMemberships(rows) {
    if (!Array.isArray(rows)) return [];
    return rows
        .filter((item) => String(item.status).toUpperCase() === 'APPROVED' && item.clubId && item.clubName)
        .map((item) => ({
            clubId: item.clubId,
            clubName: item.clubName,
            clubCode: item.clubCode || item.club?.code || '',
            logoUrl: item.logoUrl || item.clubLogoUrl || item.club?.logoUrl || '',
            role: item.role || 'MEMBER',
        }));
}

export async function loadProfileMemberships(api) {
    const memberships = mapProfileMemberships(await api.getMyMemberships());
    if (!api.getClub) return memberships;
    return Promise.all(
        memberships.map(async (membership) => {
            if (membership.logoUrl && membership.clubCode) return membership;
            try {
                const club = await api.getClub(membership.clubId);
                return {
                    ...membership,
                    clubCode: club?.code || club?.clubCode || membership.clubCode,
                    logoUrl: club?.logoUrl || membership.logoUrl,
                };
            } catch {
                // A failed logo lookup must not hide an approved membership.
                return membership;
            }
        }),
    );
}

export function useProfileMemberships(api, sessionKey) {
    const [result, setResult] = useState({ status: 'loading', data: [] });
    useEffect(() => {
        let active = true;
        setResult({ status: 'loading', data: [] });
        loadProfileMemberships(api)
            .then((data) => {
                if (active) setResult({ status: 'ready', data });
            })
            .catch(() => {
                if (active) setResult({ status: 'error', data: [] });
            });
        return () => {
            active = false;
        };
    }, [api, sessionKey]);
    return result;
}

export function classifyProfileError(error) {
    if (error?.status === 401) return 'unauthorized';
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 404) return 'empty';
    return 'error';
}

export function createProfileRequestGate() {
    let current = 0;
    return {
        next: (sessionKey) => ({ id: ++current, sessionKey }),
        isCurrent: (request, sessionKey) => request?.id === current && request?.sessionKey === sessionKey,
        invalidate: () => ++current,
    };
}

export function useProfile(user, sessionKey, api) {
    const gate = useRef(null);
    if (!gate.current) gate.current = createProfileRequestGate();
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'loading', data: null, error: null });

    useEffect(() => {
        if (!accountIdentity(user)) {
            setResult({ status: 'unauthorized', data: null, error: null });
            return undefined;
        }
        const request = gate.current.next(sessionKey);
        setResult({ status: 'loading', data: null, error: null });
        Promise.resolve()
            .then(async () => {
                const current = readProfile(user);
                if (!api?.getMyMemberships || savedProfileRecord(user, globalThis.localStorage)) return current;
                try {
                    return readProfileFromMemberships(user, await api.getMyMemberships());
                } catch (issue) {
                    if (issue?.status === 401 || issue?.status === 403) throw issue;
                    return current;
                }
            })
            .then((data) => {
                if (gate.current.isCurrent(request, sessionKey)) setResult({ status: 'populated', data, error: null });
            })
            .catch((error) => {
                if (gate.current.isCurrent(request, sessionKey))
                    setResult({ status: classifyProfileError(error), data: null, error });
            });
        return () => gate.current.invalidate();
    }, [sessionKey, user, api, version]);

    useEffect(() => {
        const key = profileStorageKey(user);
        const updated = (event) => {
            if (event.key === key || event.detail?.key === key) setVersion((value) => value + 1);
        };
        window.addEventListener('storage', updated);
        window.addEventListener('clubhub:profile-updated', updated);
        return () => {
            window.removeEventListener('storage', updated);
            window.removeEventListener('clubhub:profile-updated', updated);
        };
    }, [user]);

    const retry = useCallback(() => setVersion((value) => value + 1), []);
    const save = useCallback(
        async (patch) => {
            const snapshot = previewProfile(result.data || readProfile(user), patch);
            const data = saveProfile(user, {
                ...snapshot.profile,
                personal: snapshot.personal,
                academic: snapshot.academic,
            });
            setResult({ status: 'populated', data, error: null });
            return data;
        },
        [user, result.data],
    );
    return { ...result, retry, save };
}
