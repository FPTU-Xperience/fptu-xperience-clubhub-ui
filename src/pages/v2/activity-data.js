import { useCallback, useEffect, useRef, useState } from 'react';
import { mapActivityResources } from '../../components/v2/activity-detail/activity-resources-data.js';
import { usePublicMediaRevision } from '../../services/use-public-media-revision.js';
import { activityPublication, isActivityPublic } from './activity-publication.js';
import { resolveActivityContactPoint } from './activity-contact-point.js';
import { activityTimeline } from './activity-timeline.js';
import {
    loadStudentActivityFeed,
    loadStudentActivitySchedule,
    loadStudentActivityDetail,
    loadStudentRecommendations,
} from '../../services/student-read-api.js';

export function classifyActivityError(error) {
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 401) return 'unauthorized';
    return 'error';
}

export function mapActivityDetailItem(raw = {}) {
    const legacyStatus = String(raw.status || '').toUpperCase();
    const timeline = activityTimeline(raw);
    const status = legacyStatus === 'SCHEDULED' && timeline.status
        ? timeline.status
        : legacyStatus === 'SCHEDULED' ? 'UPCOMING' : legacyStatus;
    if (!raw.id || !['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(status)) return null;
    return {
        ...activityPublication(raw),
        id: String(raw.id),
        canRegister: raw.canRegister === true,
        isRegistered: raw.isRegistered === true,
        canCancelRegistration: raw.canCancelRegistration === true,
        registrationVersion: typeof raw.registrationVersion === 'string' ? raw.registrationVersion : null,
        isEligible: raw.isEligible === true,
        isInternal: typeof raw.isInternal === 'boolean' ? raw.isInternal : null,
        version: typeof raw.version === 'string' ? raw.version : null,
        resourceAvailability: raw.resourceAvailability || 'UNCONFIGURED',
        clubId: String(raw.clubId || ''),
        clubCode: String(raw.clubCode || raw.code || ''),
        clubName: String(raw.clubName || 'CLB'),
        title: String(raw.title || 'Hoạt động'),
        description: String(raw.description || ''),
        contactPoint: resolveActivityContactPoint(raw),
        coverImageUrl: String(raw.coverImageUrl || ''),
        startTime: timeline.startTime,
        endTime: timeline.endTime,
        nextSessionStartTime: timeline.nextSessionStartTime,
        registrationOpensAt: raw.registrationOpensAt || '',
        registrationClosesAt: raw.registrationClosesAt || '',
        resources: mapActivityResources(raw.resources),
        resourceCapabilities: {
            supportedKinds: Array.isArray(raw.resourceCapabilities?.supportedKinds)
                ? raw.resourceCapabilities.supportedKinds
                : [],
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
    return item && isActivityPublic(item) && ['UPCOMING', 'LIVE'].includes(item.status) ? item : null;
}

export function useActivityDetail(api, sessionKey, activityId, student = false, refreshKey = 0) {
    const mediaRevision = usePublicMediaRevision('activity');
    const identity = `${sessionKey}:${activityId}:${student}`;
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ identity, refreshKey, status: 'loading', data: null });
    useEffect(() => {
        let active = true;
        const id = Number(activityId);
        if (!Number.isSafeInteger(id) || id <= 0) {
            setResult({ identity, refreshKey, status: 'not-found', data: null });
            return undefined;
        }
        setResult((previous) => ({
            identity, refreshKey, status: 'loading',
            data: previous.identity === identity ? previous.data : null,
        }));
        Promise.resolve()
            .then(() => (student ? loadStudentActivityDetail(api, id) : api.getActivity(id)))
            .then(
                (raw) => {
                    const activity = mapActivityDetailItem(raw);
                    if (active)
                        setResult({
                            identity,
                            refreshKey,
                            status: activity && Number(activity.id) === id ? 'populated' : 'not-found',
                            data: activity && Number(activity.id) === id ? activity : null,
                        });
                },
                (error) => {
                    if (active)
                        setResult({
                            identity,
                            refreshKey,
                            status: error?.status === 404 ? 'not-found' : classifyActivityError(error),
                            data: null,
                        });
                },
            );
        return () => {
            active = false;
        };
    }, [api, activityId, sessionKey, version, mediaRevision, student, refreshKey]);
    const current = result.identity === identity && result.refreshKey === refreshKey ? result : {
        status: 'loading', data: result.identity === identity ? result.data : null,
    };
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

// Discovery includes live and non-registerable activities too. Recommendations
// only order the authorized feed; they never determine its availability or scope.
export function selectDiscoveryActivities(feed, recommendations, status = 'ALL') {
    const ranks = new Map(recommendations.map(({ activity, rank }) => [activity.id, rank]));
    return filterActivityFeed(feed, '', status)
        .sort((left, right) => (ranks.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (ranks.get(right.id) ?? Number.MAX_SAFE_INTEGER))
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
                setResult({ status: data.length ? 'populated' : 'empty', data,
                    metadata: typeof value?.mode === 'string' ? {
                        mode: value.mode, personalizationAvailable: value.personalizationAvailable,
                        personalizationUnavailableReason: value.personalizationUnavailableReason,
                    } : null });
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
    const loader = useCallback(() => loadStudentActivityFeed(api, clubId), [api, clubId]);
    const mapper = useCallback(mapActivityFeed, []);
    return useActivityRequest(loader, mapper, sessionKey);
}
export function useRecommendedActivities(api, sessionKey) {
    const loader = useCallback(() => loadStudentRecommendations(api), [api]);
    const mapper = useCallback(mapRecommendations, []);
    return useActivityRequest(loader, mapper, sessionKey);
}

export function mapMyActivitySchedule(rows, now = Date.now()) {
    const seen = new Set();
    return rows.filter(row => {
        const key = `${row.activityId}:${row.sessionId ?? 'legacy'}`;
        if (!row.activityId || seen.has(key) || !Number.isFinite(Date.parse(row.startTime)) ||
            !(Date.parse(row.endTime) > now) ||
            [row.activityStatus, row.sessionStatus].some(status => ['CANCELLED', 'COMPLETED'].includes(String(status).toUpperCase())))
            return false;
        seen.add(key);
        return true;
    }).map(row => ({
        id: String(row.activityId),
        scheduleKey: `${row.activityId}:${row.sessionId ?? 'legacy'}`,
        title: row.title,
        clubId: String(row.clubId),
        clubName: row.clubName,
        startTime: row.startTime,
        endTime: row.endTime,
        location: row.location,
        status: Date.parse(row.startTime) > now ? 'UPCOMING' : 'LIVE',
    })).sort((left, right) => Date.parse(left.startTime) - Date.parse(right.startTime));
}

export function useMyActivitySchedule(api, sessionKey) {
    const loader = useCallback(() => loadStudentActivitySchedule(api), [api]);
    const mapper = useCallback(mapMyActivitySchedule, []);
    return useActivityRequest(loader, mapper, sessionKey);
}
