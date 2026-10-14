import { useCallback, useEffect, useRef, useState } from 'react';
import { mapActivityResources } from '../../components/v2/activity-detail/activity-resources-data.js';
import { usePublicMediaRevision } from '../../services/use-public-media-revision.js';

export function classifyActivityError(error) {
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 401) return 'unauthorized';
    return 'error';
}

export function mapActivityDetailItem(raw = {}) {
    const legacyStatus = String(raw.status || '').toUpperCase();
    const status = legacyStatus === 'SCHEDULED' ? 'UPCOMING' : legacyStatus;
    if (!raw.id || !['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(status)) return null;
    return {
        id: String(raw.id),
        clubId: String(raw.clubId || ''),
        clubCode: String(raw.clubCode || raw.code || ''),
        clubName: String(raw.clubName || 'CLB'),
        title: String(raw.title || 'Hoạt động'),
        description: String(raw.description || ''),
        coverImageUrl: String(raw.coverImageUrl || ''),
        startTime: raw.startTime || raw.startTimeUtc || '',
        endTime: raw.endTime || raw.endTimeUtc || '',
        resources: mapActivityResources(raw.resources),
        resourceCapabilities: {
            canManage: raw.resourceCapabilities?.canManage === true,
            canUpload: raw.resourceCapabilities?.canUpload === true,
        },
        location: String(raw.location || ''),
        status,
        nextAction: raw.nextAction || { kind: 'VIEW_CLUB', label: 'Đến trang CLB', available: Boolean(raw.clubId) },
    };
}

export function mapActivityFeedItem(raw = {}) {
    const item = mapActivityDetailItem(raw);
    return item && ['UPCOMING', 'LIVE'].includes(item.status) ? item : null;
}

export function useActivityDetail(api, sessionKey, activityId) {
    const mediaRevision = usePublicMediaRevision('activity');
    const identity = `${sessionKey}:${activityId}`;
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ identity, status: 'loading', data: null });
    useEffect(() => {
        let active = true;
        const id = Number(activityId);
        if (!Number.isSafeInteger(id) || id <= 0) {
            setResult({ identity, status: 'not-found', data: null });
            return undefined;
        }
        setResult({ identity, status: 'loading', data: null });
        Promise.resolve()
            .then(() => api.getActivity(id))
            .then(
                (raw) => {
                    const activity = mapActivityDetailItem(raw);
                    if (active)
                        setResult({
                            identity,
                            status: activity && Number(activity.id) === id ? 'populated' : 'not-found',
                            data: activity && Number(activity.id) === id ? activity : null,
                        });
                },
                (error) => {
                    if (active)
                        setResult({
                            identity,
                            status: error?.status === 404 ? 'not-found' : classifyActivityError(error),
                            data: null,
                        });
                },
            );
        return () => {
            active = false;
        };
    }, [api, activityId, sessionKey, version, mediaRevision]);
    const current = result.identity === identity ? result : { status: 'loading', data: null };
    return { ...current, retry: () => setVersion((value) => value + 1) };
}

export function mapActivityFeed(value) {
    const rows = Array.isArray(value) ? value : value?.items || [];
    const unique = new Map();
    rows.map(mapActivityFeedItem)
        .filter(Boolean)
        .forEach((item) => {
            if (!unique.has(item.id)) unique.set(item.id, item);
        });
    return [...unique.values()];
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

export function sortActivitiesNewestFirst(items) {
    const timestamp = (item) => {
        const value = Date.parse(item.startTime || item.startTimeUtc || '');
        return Number.isFinite(value) ? value : -Infinity;
    };
    return [...items].sort((left, right) => {
        const a = timestamp(left);
        const b = timestamp(right);
        return a === b ? 0 : b - a;
    });
}

export function filterActivityFeed(items, query = '', status = 'ALL') {
    const needle = String(query).trim().toLocaleLowerCase('vi');
    return sortActivitiesNewestFirst(
        items.filter(
            (item) =>
                (status === 'ALL' || item.status === status) &&
                (!needle ||
                    `${item.clubName} ${item.title} ${item.description} ${item.location}`
                        .toLocaleLowerCase('vi')
                        .includes(needle)),
        ),
    );
}

function useActivityRequest(loader, mapper, sessionKey) {
    const mediaRevision = usePublicMediaRevision('activity');
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
    }, [loader, mapper, sessionKey, version, mediaRevision]);
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
