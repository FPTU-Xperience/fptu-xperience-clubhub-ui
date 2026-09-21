import { useCallback, useEffect, useRef, useState } from 'react';

const rows = (value) => (Array.isArray(value) ? value : value?.items || []);
const text = (value, fallback = '') => String(value ?? fallback);

export function classifyMyClubsError(error) {
    if (error?.status === 401) return 'unauthorized';
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 404) return 'not-found';
    return 'error';
}

export function createRequestGate() {
    let current = 0;
    return { next: () => ++current, isCurrent: (id) => id === current, invalidate: () => ++current };
}

export function mapMyClubSelection(value) {
    const seen = new Set();
    return rows(value)
        .map((raw) => {
            const clubId = text(raw.clubId || raw.id);
            const role = text(raw.role).toUpperCase();
            if (!clubId || !['MEMBER', 'MANAGER'].includes(role) || seen.has(clubId)) return null;
            seen.add(clubId);
            const activity = raw.upcomingActivity;
            return {
                clubId,
                name: text(raw.name, 'Câu lạc bộ'),
                logoUrl: text(raw.logoUrl),
                role,
                workspacePath: `/v2/my-clubs/${encodeURIComponent(clubId)}`,
                upcomingActivity: activity?.title && activity?.startTime
                    ? { title: text(activity.title), startTime: text(activity.startTime), location: text(activity.location) }
                    : null,
                pendingApplications: role === 'MANAGER' && Number.isInteger(raw.pendingApplications) && raw.pendingApplications >= 0
                    ? raw.pendingApplications
                    : role === 'MANAGER' ? null : undefined,
            };
        })
        .filter(Boolean);
}

export function mapMyMembershipApplications(value) {
    const statuses = new Set(['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN']);
    return rows(value)
        .map((raw) => {
            const applicationId = text(raw.applicationId || raw.id);
            const clubId = text(raw.club?.clubId || raw.clubId);
            const status = text(raw.status).toUpperCase();
            if (!applicationId || !clubId || !statuses.has(status)) return null;
            return { applicationId, club: { clubId, name: text(raw.club?.name || raw.clubName, 'Câu lạc bộ'), logoUrl: text(raw.club?.logoUrl) }, reason: text(raw.reason), status, canWithdraw: status === 'PENDING' && raw.canWithdraw === true };
        })
        .filter(Boolean);
}

function useRequest(loader, mapper, sessionKey) {
    const gate = useRef(createRequestGate());
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'loading', data: [] });
    useEffect(() => {
        const id = gate.current.next();
        setResult({ status: 'loading', data: [] });
        Promise.resolve().then(loader).then((value) => {
            if (!gate.current.isCurrent(id)) return;
            const data = mapper(value);
            setResult({ status: data.length ? 'populated' : 'empty', data });
        }).catch((error) => {
            if (gate.current.isCurrent(id)) setResult({ status: classifyMyClubsError(error), data: [], error });
        });
        return () => gate.current.invalidate();
    }, [loader, mapper, sessionKey, version]);
    return { ...result, retry: () => setVersion((item) => item + 1) };
}

export function useMyClubSelection(api, sessionKey) {
    return useRequest(useCallback(() => api.getMyClubSelection(), [api]), useCallback(mapMyClubSelection, []), sessionKey);
}

export function useMyMembershipApplications(api, sessionKey) {
    return useRequest(useCallback(() => api.getMyMembershipApplications(), [api]), useCallback(mapMyMembershipApplications, []), sessionKey);
}
