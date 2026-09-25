import { useCallback, useEffect, useRef, useState } from 'react';

export const PROFILE_STORAGE_VERSION = 1;
const MAX_DISPLAY_NAME = 120;
const MAX_HEADLINE = 160;
const MAX_ABOUT = 2000;
const MAX_LIST_ITEMS = 12;
const MAX_LIST_ITEM_LENGTH = 80;

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

function seededNumber(identity, offset) {
    return [...identity].reduce((value, character) => (value * 31 + character.charCodeAt(0)) % 997, offset) % 31;
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

function editableProfile(value, fallback) {
    const displayName = value.displayName === undefined ? fallback.displayName : text(value.displayName);
    const headline = value.headline === undefined ? fallback.headline : text(value.headline);
    const about = value.about === undefined ? fallback.about : text(value.about);
    const skills = value.skills === undefined ? fallback.skills : normalizeList(value.skills, 'Kỹ năng');
    const interests = value.interests === undefined ? fallback.interests : normalizeList(value.interests, 'Sở thích');

    if (!displayName) throw new Error('Vui lòng nhập tên hiển thị.');
    if (displayName.length > MAX_DISPLAY_NAME) throw new Error(`Tên hiển thị tối đa ${MAX_DISPLAY_NAME} ký tự.`);
    if (headline.length > MAX_HEADLINE) throw new Error(`Tiêu đề tối đa ${MAX_HEADLINE} ký tự.`);
    if (about.length > MAX_ABOUT) throw new Error(`Giới thiệu tối đa ${MAX_ABOUT} ký tự.`);

    return { displayName, headline, about, skills, interests };
}

export function profileStorageKey(user) {
    const identity = accountIdentity(user);
    return identity ? `clubhub:v2:profile:${identity}` : null;
}

export function createMockProfile(user) {
    const identity = accountIdentity(user);
    if (!identity) throw new Error('Không thể tải hồ sơ khi chưa có tài khoản.');
    const displayName = text(user?.name || user?.fullName, 'Sinh viên FPTU');
    const variation = seededNumber(identity, 11);
    const primaryTerm = 'FA26';
    const secondaryTerm = 'SU26';
    const participations = [
        { clubId: 'fcode', clubName: 'F-Code', clubLogoUrl: '', role: 'THÀNH VIÊN' },
        { clubId: 'fstyle', clubName: 'F-Style', clubLogoUrl: '', role: 'THÀNH VIÊN' },
    ];
    const evidence = [
        {
            id: `${identity}-evidence-1`, term: primaryTerm, date: '2026-09-12', clubId: 'fcode', clubName: 'F-Code',
            title: 'Đồng hành Code Camp: Build for Campus', source: 'Hoạt động CLB', verifier: 'Ban chủ nhiệm F-Code', points: 30,
        },
        {
            id: `${identity}-evidence-2`, term: primaryTerm, date: '2026-08-29', clubId: 'fstyle', clubName: 'F-Style',
            title: 'Hỗ trợ triển lãm Portfolio Night', source: 'Đóng góp CLB', verifier: 'Ban chủ nhiệm F-Style', points: 20,
        },
        {
            id: `${identity}-evidence-3`, term: secondaryTerm, date: '2026-06-18', clubId: 'fcode', clubName: 'F-Code',
            title: 'Tham dự Design Systems Workshop', source: 'Hoạt động CLB', verifier: 'Ban chủ nhiệm F-Code', points: 15,
        },
    ];
    const contributionTotal = evidence.reduce((total, item) => total + item.points, 0);
    return {
        profile: {
            displayName,
            avatarUrl: '',
            initials: text(user?.avatar, initials(displayName)),
            headline: 'Học hỏi, kết nối và tạo dấu ấn theo cách của mình.',
            about: 'Mình muốn biến những trải nghiệm nhỏ ở FPTU thành hành trình có ý nghĩa.',
            interests: ['Công nghệ', 'Thiết kế trải nghiệm', 'Cộng đồng'],
            skills: ['React', 'Thiết kế UI', 'Làm việc nhóm'],
            project: 'Một hành trình được xây từ những lần dám thử.',
        },
        academic: {
            campus: 'FPTU Hồ Chí Minh',
            major: variation % 2 ? 'Kỹ thuật phần mềm' : 'Thiết kế mỹ thuật số',
            year: `K${20 + (variation % 4)}`,
            studentCode: `HE${String(170000 + variation).padStart(6, '0')}`,
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

function savedEditableProfile(user, storage) {
    const key = profileStorageKey(user);
    if (!key) return null;
    try {
        const stored = storageFor(storage).getItem(key);
        const value = stored ? JSON.parse(stored) : null;
        return isPersistedProfile(value) ? value.profile : null;
    } catch {
        return null;
    }
}

export function readProfile(user, storage = globalThis.localStorage) {
    const seed = createMockProfile(user);
    const saved = savedEditableProfile(user, storage);
    if (!saved) return clone(seed);
    try {
        return {
            ...seed,
            profile: {
                ...seed.profile,
                ...editableProfile(saved, seed.profile),
            },
        };
    } catch {
        return clone(seed);
    }
}

export function saveProfile(user, patch, storage = globalThis.localStorage) {
    const key = profileStorageKey(user);
    if (!key) throw new Error('Không thể lưu hồ sơ khi chưa có tài khoản.');
    const current = readProfile(user, storage);
    const profile = editableProfile(patch || {}, current.profile);
    const record = { version: PROFILE_STORAGE_VERSION, profile, savedAt: new Date().toISOString() };
    storageFor(storage).setItem(key, JSON.stringify(record));
    return readProfile(user, storage);
}

export function toSharedProfile(snapshot) {
    const shared = clone(snapshot);
    shared.academic.studentCode = '';
    shared.summary.recognizedContributionTotal = null;
    shared.summary.contributionRecordCount = null;
    shared.evidence = [];
    return shared;
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

export function useProfile(user, sessionKey) {
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
            .then(() => readProfile(user))
            .then((data) => {
                if (gate.current.isCurrent(request, sessionKey)) setResult({ status: 'populated', data, error: null });
            })
            .catch((error) => {
                if (gate.current.isCurrent(request, sessionKey)) setResult({ status: classifyProfileError(error), data: null, error });
            });
        return () => gate.current.invalidate();
    }, [sessionKey, user, version]);

    const retry = useCallback(() => setVersion((value) => value + 1), []);
    const save = useCallback(
        async (patch) => {
            const data = saveProfile(user, patch);
            setResult({ status: 'populated', data, error: null });
            return data;
        },
        [user],
    );
    return { ...result, retry, save };
}
