import { usePublicMediaRevision } from '../../services/use-public-media-revision.js';
import { workspaceSemesterQuery, workspaceSemesterKey } from './club-workspace-page/workspace-semester-data.js';
import { useEffect, useState } from 'react';
import { activityPublication, isActivityPublic } from './activity-publication.js';

const rows = (value) => (Array.isArray(value) ? value : value?.items || []);
const succeeded = (result) => result?.status === 'fulfilled';

export const isOngoingWorkspaceActivity = (activity) =>
    ['SCHEDULED', 'UPCOMING', 'LIVE'].includes(String(activity.status).toUpperCase());

export function workspaceActivityStatus(activity, now = Date.now()) {
    const state = String(activity.status).toUpperCase();
    if (!['SCHEDULED', 'UPCOMING', 'LIVE'].includes(state)) return state;
    if (['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'].includes(activity.timeline?.status))
        return activity.timeline.status;
    const end = Date.parse(activity.endTimeUtc || activity.endTime || '');
    const start = Date.parse(activity.startTimeUtc || activity.startTime || '');
    if (Number.isFinite(end) && end <= now) return 'COMPLETED';
    if (Number.isFinite(start) && Number.isFinite(end) && start <= now) return 'LIVE';
    if (Number.isFinite(start) && start > now) return 'UPCOMING';
    return state;
}

export function summarizeWorkspaceDashboard(results, manager, now = Date.now()) {
    const [club, activities, memberships, reports] = results;
    const clubData = succeeded(club) ? club.value : null;
    const activityRows = succeeded(activities) ? rows(activities.value) : null;
    const membershipRows = manager && succeeded(memberships) ? rows(memberships.value) : null;
    const reportData = succeeded(reports) ? reports.value : null;

    const memberCount = Number.isInteger(clubData?.memberCount)
        ? clubData.memberCount
        : Array.isArray(clubData?.members)
          ? clubData.members.filter((member) => String(member.status).toUpperCase() === 'APPROVED').length
          : null;
    const activeActivities =
        activityRows?.filter(
            (activity) =>
                String(activity.status).toUpperCase() !== 'CANCELLED' && (manager || isActivityPublic(activity)),
        ) || null;
    const upcomingActivities = activeActivities
        ?.filter(
            (activity) =>
                workspaceActivityStatus(activity, now) === 'UPCOMING' &&
                Number.isFinite(Date.parse(activity.timeline?.startTimeUtc || activity.startTimeUtc || activity.startTime)) &&
                Date.parse(activity.timeline?.startTimeUtc || activity.startTimeUtc || activity.startTime) >= now,
        )
        .sort(
            (left, right) =>
                Date.parse(left.timeline?.startTimeUtc || left.startTimeUtc || left.startTime) -
                Date.parse(right.timeline?.startTimeUtc || right.startTimeUtc || right.startTime),
        );
    const upcomingActivity = upcomingActivities?.[0];
    const approvedMembers = Array.isArray(clubData?.members)
        ? clubData.members
              .filter((member) => String(member.status).toUpperCase() === 'APPROVED')
              .map((member) => ({
                  id: member.id,
                  name: member.fullName,
                  role: member.role,
                  joinedAt: member.reviewedAtUtc || member.requestedAtUtc,
              }))
        : null;

    return {
        memberCount,
        approvedMembers,
        publicLeaders: Array.isArray(clubData?.publicLeaders)
            ? clubData.publicLeaders.map((leader) => ({ name: leader.displayName, role: leader.roleLabel }))
            : null,
        isRecruiting: typeof clubData?.isRecruiting === 'boolean' ? clubData.isRecruiting : null,
        activityCount: activeActivities?.length ?? null,
        ongoingActivityCount:
            activeActivities?.filter((activity) => isOngoingWorkspaceActivity({ status: workspaceActivityStatus(activity, now) })).length ?? null,
        activities:
            activeActivities?.map((activity) => ({
                ...activityPublication(activity),
                id: activity.id,
                isInternal: typeof activity.isInternal === 'boolean' ? activity.isInternal : null,
                clubId: activity.clubId,
                title: activity.title,
                description: activity.description,
                location: activity.location,
                startTime: activity.timeline?.startTimeUtc || activity.startTimeUtc || activity.startTime,
                endTime: activity.timeline?.endTimeUtc || activity.endTimeUtc || activity.endTime,
                status: workspaceActivityStatus(activity, now),
                coverImageUrl: activity.coverImageUrl || '',
            })) || null,
        upcomingCount: upcomingActivities?.length ?? null,
        pendingApplications: membershipRows
            ? membershipRows.filter((membership) => String(membership.status).toUpperCase() === 'PENDING').length
            : null,
        pendingMemberships: membershipRows
            ? membershipRows
                  .filter((membership) => String(membership.status).toUpperCase() === 'PENDING')
                  .map((membership) => ({ id: membership.id, name: membership.fullName }))
            : null,
        approvedReportCount: Number.isInteger(reportData?.total)
            ? reportData.total
            : Array.isArray(reportData)
              ? reportData.length
              : null,
        upcomingActivity: upcomingActivity
            ? {
                  title: upcomingActivity.title,
                  startTime: upcomingActivity.timeline?.startTimeUtc || upcomingActivity.startTimeUtc || upcomingActivity.startTime,
                  location: upcomingActivity.location,
              }
            : null,
        activityAvailable: activityRows !== null,
    };
}

export function useWorkspaceDashboard(api, clubId, manager, sessionKey, semester = null, refreshKey = null) {
    const mediaRevision = usePublicMediaRevision('activity');
    const scopeKey = workspaceSemesterKey(semester);
    const [result, setResult] = useState({ clubId, scopeKey, refreshKey, status: 'loading', data: null });
    const [version, setVersion] = useState(0);
    useEffect(() => {
        let active = true;
        const numericClubId = Number(clubId);
        if (!Number.isSafeInteger(numericClubId) || numericClubId <= 0) {
            setResult({ clubId, scopeKey, refreshKey, status: 'unavailable', data: null });
            return undefined;
        }
        setResult({ clubId, scopeKey, refreshKey, status: 'loading', data: null });
        Promise.allSettled([
            api.getClub(numericClubId),
            api.getActivities(numericClubId, workspaceSemesterQuery(semester, 'activities')),
            manager ? api.getClubMemberships(numericClubId) : Promise.resolve(null),
            api.getReports({
                ...workspaceSemesterQuery(semester, 'reports'),
                clubId: numericClubId,
                status: 'Approved',
                page: 1,
                pageSize: 1,
            }),
        ]).then((results) => {
            if (active)
                setResult({
                    clubId,
                    scopeKey,
                    refreshKey,
                    status: 'ready',
                    data: summarizeWorkspaceDashboard(results, manager),
                });
        });
        return () => {
            active = false;
        };
    }, [api, clubId, manager, sessionKey, version, scopeKey, refreshKey, mediaRevision]);
    const current =
        result.clubId === clubId && result.scopeKey === scopeKey && result.refreshKey === refreshKey
            ? result
            : { clubId, scopeKey, refreshKey, status: 'loading', data: null };
    return { ...current, retry: () => setVersion((value) => value + 1) };
}
