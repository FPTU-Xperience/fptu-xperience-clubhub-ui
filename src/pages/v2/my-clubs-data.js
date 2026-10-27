import { useCallback, useEffect, useRef, useState } from 'react';
import { usePublicMediaRevision } from '../../services/use-public-media-revision.js';

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
            const clubCode = text(raw.clubCode || raw.code).trim();
            const role = text(raw.role).toUpperCase();
            if (!clubId || !clubCode || !['MEMBER', 'MANAGER'].includes(role) || seen.has(clubId)) return null;
            seen.add(clubId);
            const activity = raw.upcomingActivity;
            return {
                clubId,
                clubCode,
                name: text(raw.name, 'Câu lạc bộ'),
                logoUrl: text(raw.logoUrl),
                coverImageUrl: text(raw.coverImageUrl || raw.coverUrl),
                role,
                displayRole: text(raw.displayRole, role === 'MANAGER' ? 'CLUB_OWNER' : 'MEMBER'),
                ...(Array.isArray(raw.studentDeclarationPermissions) ? { studentDeclarationPermissions: raw.studentDeclarationPermissions.filter((id)=>['club.declarations.process'].includes(id)) } : {}),
                ...(typeof raw.canViewStudentDeclarations === 'boolean' ? { canViewStudentDeclarations: raw.canViewStudentDeclarations } : {}),
                workspacePath: `/v2/my-clubs/${encodeURIComponent(clubCode)}`,
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
            return { applicationId, club: { clubId, name: text(raw.club?.name || raw.clubName, 'Câu lạc bộ'), logoUrl: text(raw.club?.logoUrl), clubCode: text(raw.club?.clubCode || raw.clubCode) }, reason: text(raw.reason), status, requestedAtUtc: text(raw.requestedAtUtc), reviewedAtUtc: text(raw.reviewedAtUtc), canWithdraw: status === 'PENDING' && raw.canAcceptInvitation !== true && raw.canWithdraw === true, canAcceptInvitation: status === 'PENDING' && raw.canAcceptInvitation === true };
        })
        .filter(Boolean);
}

export const APPLICATION_RESULT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function visibleSentApplications(applications, now = Date.now()) {
    return applications.filter((application) => {
        if (application.canAcceptInvitation) return false;
        if (application.status === 'PENDING') return true;
        if (!['APPROVED', 'REJECTED'].includes(application.status)) return false;
        const reviewedAt = Date.parse(application.reviewedAtUtc);
        return Number.isFinite(reviewedAt) && reviewedAt <= now && now < reviewedAt + APPLICATION_RESULT_WINDOW_MS;
    });
}

function useRequest(loader, mapper, sessionKey) {
    const mediaRevision = usePublicMediaRevision('club');
    const gate = useRef(createRequestGate());
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'loading', data: [] });
    useEffect(() => {
        const id = gate.current.next();
        setResult((current) => current.sessionKey === sessionKey && current.status === 'populated'
            ? current : { sessionKey, status: 'loading', data: [] });
        Promise.resolve().then(loader).then((value) => {
            if (!gate.current.isCurrent(id)) return;
            const data = mapper(value);
            setResult({ sessionKey, status: data.length ? 'populated' : 'empty', data });
        }).catch((error) => {
            if (gate.current.isCurrent(id)) setResult({ sessionKey, status: classifyMyClubsError(error), data: [], error });
        });
        return () => gate.current.invalidate();
    }, [loader, mapper, sessionKey, version, mediaRevision]);
    return { ...(result.sessionKey === sessionKey ? result : { status: 'loading', data: [] }), retry: () => setVersion((item) => item + 1) };
}

export function useMyClubSelection(api, sessionKey) {
    return useRequest(
        useCallback(() => api.getMyClubSelection(), [api]),
        useCallback(mapMyClubSelection, []),
        sessionKey,
    );
}

export function useMyMembershipApplications(api, sessionKey) {
    return useRequest(
        useCallback(() => api.getMyMembershipApplications(), [api]),
        useCallback(mapMyMembershipApplications, []),
        sessionKey,
    );
}
