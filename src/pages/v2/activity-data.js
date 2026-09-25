import { useCallback, useEffect, useRef, useState } from 'react';

export function classifyActivityError(error) {
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 401) return 'unauthorized';
    return 'error';
}

export function mapActivityFeedItem(raw = {}) {
    const legacyStatus = String(raw.status || '').toUpperCase();
    const status = legacyStatus === 'SCHEDULED' ? 'UPCOMING' : legacyStatus;
    if (!raw.id || !['UPCOMING', 'LIVE'].includes(status)) return null;
    return {
        id: String(raw.id),
        clubId: String(raw.clubId || ''),
        clubName: String(raw.clubName || 'CLB'),
        title: String(raw.title || 'Hoạt động'),
        description: String(raw.description || ''),
        startTime: raw.startTime || raw.startTimeUtc || '',
        endTime: raw.endTime || raw.endTimeUtc || '',
        location: String(raw.location || ''),
        status,
        nextAction: raw.nextAction || { kind: 'VIEW_CLUB', label: 'Xem CLB', available: Boolean(raw.clubId) },
    };
}

export function mapActivityFeed(value) {
    const rows = Array.isArray(value) ? value : value?.items || [];
    return [
        ...new Map(
            rows
                .map(mapActivityFeedItem)
                .filter(Boolean)
                .map((item) => [item.id, item]),
        ).values(),
    ];
}

export function mapRecommendations(value) {
    const rows = Array.isArray(value) ? value : value?.items || [];
    return rows
        .map((row) => ({
            rank: Number(row.rank),
            activity: mapActivityFeedItem(row.activity),
            recommendationId: String(row.recommendationId || ''),
        }))
        .filter((row) => Number.isInteger(row.rank) && row.rank > 0 && row.activity)
        .sort((a, b) => a.rank - b.rank)
        .filter((row, index, list) => list.findIndex((item) => item.activity.id === row.activity.id) === index)
        .slice(0, 6);
}

export function filterActivityFeed(items, query = '', status = 'ALL') {
    const needle = String(query).trim().toLocaleLowerCase('vi');
    return items.filter(
        (item) =>
            (status === 'ALL' || item.status === status) &&
            (!needle ||
                `${item.clubName} ${item.title} ${item.description} ${item.location}`
                    .toLocaleLowerCase('vi')
                    .includes(needle)),
    );
}

function useActivityRequest(loader, mapper, sessionKey) {
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'loading', data: [] });
    const request = useRef(0);
    useEffect(() => {
        const id = ++request.current;
        setResult({ status: 'loading', data: [] });
        Promise.resolve()
            .then(loader)
            .then((value) => {
                if (id !== request.current) return;
                const data = mapper(value);
                setResult({ status: data.length ? 'populated' : 'empty', data });
            })
            .catch((error) => {
                if (id === request.current) setResult({ status: classifyActivityError(error), data: [], error });
            });
        return () => {
            request.current += 1;
        };
    }, [loader, mapper, sessionKey, version]);
    return { ...result, retry: () => setVersion((value) => value + 1) };
}

export function useActivityFeed(api, sessionKey, clubId) {
    const loader = useCallback(() => api.getActivities(clubId), [api, clubId]);
    const mapper = useCallback(mapActivityFeed, []);
    return useActivityRequest(loader, mapper, sessionKey);
}
export function useRecommendedActivities(api, sessionKey) {
    const loader = useCallback(() => api.getActivities(), [api]);
    const mapper = useCallback(
        (value) =>
            mapActivityFeed(value)
                .slice(0, 6)
                .map((activity, index) => ({
                    recommendationId: `temporary-${activity.id}`,
                    rank: index + 1,
                    activity,
                })),
        [],
    );
    return useActivityRequest(loader, mapper, sessionKey);
}
