import { useEffect, useState } from 'react';

const rows = (value) => (Array.isArray(value) ? value : value?.items || []);
const succeeded = (result) => result?.status === 'fulfilled';

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
    const activeActivities = activityRows?.filter((activity) =>
        String(activity.status).toUpperCase() !== 'CANCELLED') || null;
    const upcomingActivities = activeActivities
        ?.filter((activity) => String(activity.status).toUpperCase() === 'SCHEDULED'
            && Number.isFinite(Date.parse(activity.startTimeUtc || activity.startTime))
            && Date.parse(activity.startTimeUtc || activity.startTime) >= now)
        .sort((left, right) => Date.parse(left.startTimeUtc || left.startTime) - Date.parse(right.startTimeUtc || right.startTime));
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
        activities: activeActivities?.map((activity) => ({
            id: activity.id,
            clubId: activity.clubId,
            title: activity.title,
            description: activity.description,
            location: activity.location,
            startTime: activity.startTimeUtc || activity.startTime,
            status: String(activity.status).toUpperCase(),
            coverImageUrl: activity.coverImageUrl || '',
        })) || null,
        upcomingCount: upcomingActivities?.length ?? null,
        pendingApplications: membershipRows
            ? membershipRows.filter((membership) => String(membership.status).toUpperCase() === 'PENDING').length
            : null,
        pendingMemberships: membershipRows
            ? membershipRows.filter((membership) => String(membership.status).toUpperCase() === 'PENDING')
                .map((membership) => ({ id: membership.id, name: membership.fullName }))
            : null,
        approvedReportCount: Number.isInteger(reportData?.total)
            ? reportData.total
            : Array.isArray(reportData) ? reportData.length : null,
        upcomingActivity: upcomingActivity
            ? {
                title: upcomingActivity.title,
                startTime: upcomingActivity.startTimeUtc || upcomingActivity.startTime,
                location: upcomingActivity.location,
            }
            : null,
        activityAvailable: activityRows !== null,
    };
}

export function useWorkspaceDashboard(api, clubId, manager, sessionKey) {
    const [result, setResult] = useState({ clubId, status: 'loading', data: null });
    const [version, setVersion] = useState(0);
    useEffect(() => {
        let active = true;
        const numericClubId = Number(clubId);
        if (!Number.isSafeInteger(numericClubId) || numericClubId <= 0) {
            setResult({ clubId, status: 'unavailable', data: null });
            return undefined;
        }
        setResult({ clubId, status: 'loading', data: null });
        Promise.allSettled([
            api.getClub(numericClubId),
            api.getActivities(numericClubId),
            manager ? api.getClubMemberships(numericClubId) : Promise.resolve(null),
            api.getReports({ clubId: numericClubId, status: 'Approved', page: 1, pageSize: 1 }),
        ]).then((results) => {
            if (active) setResult({ clubId, status: 'ready', data: summarizeWorkspaceDashboard(results, manager) });
        });
        return () => { active = false; };
    }, [api, clubId, manager, sessionKey, version]);
    const current = result.clubId === clubId ? result : { clubId, status: 'loading', data: null };
    return { ...current, retry: () => setVersion((value) => value + 1) };
}
