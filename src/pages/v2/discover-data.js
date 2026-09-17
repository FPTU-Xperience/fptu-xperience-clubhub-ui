import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

export function mapClubDirectoryEntry(raw = {}) {
    const recruitmentValue = firstDefined(raw.isRecruiting, raw.recruiting, raw.openForRecruitment);
    const id = String(firstDefined(raw.id, raw.clubId, raw.code, ''));
    const categoryKey = raw.category ? String(raw.category).toUpperCase() : '';
    const categoryLabels = {
        TECHNOLOGY: 'Công nghệ',
        ARTS: 'Nghệ thuật',
        ACADEMIC: 'Học thuật',
        SPORTS: 'Thể thao',
        VOLUNTEER: 'Cộng đồng',
        OTHER: 'Khác',
    };
    const category = categoryLabels[categoryKey] || String(raw.category || '');
    const toneMap = { TECHNOLOGY: 'blue', ARTS: 'pink', ACADEMIC: 'violet', SPORTS: 'orange', VOLUNTEER: 'green' };
    return {
        id,
        name: String(firstDefined(raw.name, raw.fullName, raw.code, 'Câu lạc bộ')),
        code: raw.code ? String(raw.code) : '',
        category,
        description: String(firstDefined(raw.description, raw.purpose, '')),
        logoUrl: raw.logoUrl || '',
        scheduleLabel: firstDefined(raw.scheduleLabel, raw.schedule, raw.expectedSchedule, ''),
        hasRecruitmentStatus: recruitmentValue !== undefined,
        isRecruiting: recruitmentValue === undefined ? null : Boolean(recruitmentValue),
        destination: id ? `/v2/clubs/${encodeURIComponent(id)}` : '/v2/clubs',
        fullName: String(firstDefined(raw.fullName, raw.name, raw.code, 'Câu lạc bộ')),
        tagline: String(firstDefined(raw.tagline, raw.purpose, 'Cùng học hỏi, kết nối và trưởng thành.')),
        tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [category, raw.code].filter(Boolean),
        mark: String(firstDefined(raw.mark, raw.code, raw.name, 'CLB'))
            .slice(0, 6)
            .toUpperCase(),
        founded: raw.founded ? String(raw.founded) : '',
        tone: raw.tone || toneMap[categoryKey] || 'orange',
        color: raw.color || '#f97316',
    };
}

export function mapClubPublicDetail(raw = {}, viewerAccess = []) {
    const entry = mapClubDirectoryEntry(raw);
    const access = Array.isArray(viewerAccess)
        ? viewerAccess.find((item) => String(firstDefined(item.clubId, item.id, '')) === entry.id)
        : null;
    return {
        ...entry,
        coverImageUrl: firstDefined(raw.coverImageUrl, raw.coverUrl, ''),
        locationLabel: firstDefined(raw.locationText, raw.location, raw.expectedLocation, ''),
        memberCount: Number.isFinite(raw.memberCount) ? raw.memberCount : null,
        publicLeaders: Array.isArray(raw.publicLeaders)
            ? raw.publicLeaders.map((leader) => ({
                  displayName: String(firstDefined(leader.displayName, leader.name, 'Đang cập nhật')),
                  roleLabel: String(firstDefined(leader.roleLabel, leader.role, 'Ban chủ nhiệm')),
              }))
            : [],
        contact: {
            email: raw.contact?.email || raw.contactEmail || '',
            phone: raw.contact?.phone || raw.contactPhone || '',
        },
        viewerRelationship: access?.isManager
            ? 'MANAGER'
            : access?.isMember || access?.isApprovedMember
              ? 'MEMBER'
              : String(firstDefined(raw.viewerRelationship, 'NONE')).toUpperCase(),
    };
}

export function filterClubDirectory(entries, criteria = {}) {
    const query = String(criteria.query || '')
        .trim()
        .toLocaleLowerCase('vi');
    const category = criteria.category || 'ALL';
    return entries.filter((entry) => {
        const text = `${entry.name} ${entry.code} ${entry.category} ${entry.description}`.toLocaleLowerCase('vi');
        return (
            (!query || text.includes(query)) &&
            (category === 'ALL' || entry.category === category) &&
            (!criteria.recruitingOnly || entry.isRecruiting === true)
        );
    });
}

export function createCuratedClubSet(entries, limit = 3) {
    return [...entries].sort((left, right) => left.name.localeCompare(right.name, 'vi')).slice(0, limit);
}

export function paginateClubDirectory(entries, requestedPage = 1, pageSize = 6) {
    const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
    const currentPage = Math.min(Math.max(Number(requestedPage) || 1, 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    return {
        items: entries.slice(start, start + pageSize),
        currentPage,
        totalPages,
        totalItems: entries.length,
    };
}

export function createRequestGate() {
    let current = 0;
    return {
        next() {
            current += 1;
            return current;
        },
        isCurrent(id) {
            return id === current;
        },
        invalidate() {
            current += 1;
        },
    };
}

export function classifyApiError(error) {
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 404) return 'not-found';
    if (error?.status === 401) return 'unauthorized';
    return 'error';
}

function useRequest(loader, mapper, dependencies) {
    const gateRef = useRef(null);
    if (!gateRef.current) gateRef.current = createRequestGate();
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'loading', data: null, error: null });

    useEffect(() => {
        const requestId = gateRef.current.next();
        setResult({ status: 'loading', data: null, error: null });
        Promise.resolve()
            .then(loader)
            .then((value) => {
                if (!gateRef.current.isCurrent(requestId)) return;
                const data = mapper(value);
                setResult({
                    status: Array.isArray(data) && data.length === 0 ? 'empty' : 'populated',
                    data,
                    error: null,
                });
            })
            .catch((error) => {
                if (!gateRef.current.isCurrent(requestId)) return;
                setResult({ status: classifyApiError(error), data: null, error });
            });
        return () => gateRef.current.invalidate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies, version]);

    const retry = useCallback(() => setVersion((current) => current + 1), []);
    return useMemo(() => ({ ...result, retry }), [result, retry]);
}

export function useClubDirectory(api, sessionKey) {
    return useRequest(
        () => api.getClubs(),
        (value) =>
            (Array.isArray(value) ? value : value?.items || value?.content || [])
                .map(mapClubDirectoryEntry)
                .filter((club) => club.id),
        [api, sessionKey],
    );
}

export function useClubDetail(api, clubId, viewerAccess, sessionKey) {
    return useRequest(
        () => api.getClub(clubId),
        (value) => mapClubPublicDetail(value, viewerAccess),
        [api, clubId, sessionKey],
    );
}
