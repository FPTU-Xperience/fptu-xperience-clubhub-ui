export function activityTimeline(activity, now = Date.now()) {
    const timeline = activity.timeline;
    const startTime = activity.startTimeUtc || activity.startTime || timeline?.startTimeUtc || '';
    const endTime = activity.endTimeUtc || activity.endTime || timeline?.endTimeUtc || '';
    const asOf = Date.parse(timeline?.asOf);
    const clock = Number.isFinite(asOf) ? asOf : now;
    const start = Date.parse(startTime);
    const projectedStart = Date.parse(timeline?.startTimeUtc);
    // Older servers return the next session in the timeline's activity dates.
    const projectedNextSession = projectedStart > clock && projectedStart !== start
        ? timeline.startTimeUtc : '';
    const nextSessionStartTime = timeline?.nextSessionStartTimeUtc
        || activity.nextSessionStartTimeUtc || projectedNextSession;
    let status = timeline?.status;
    if (status === 'UPCOMING' && projectedNextSession && start <= clock)
        status = 'LIVE';
    if (status === 'COMPLETED' && String(activity.status).toUpperCase() === 'SCHEDULED'
        && Number.isFinite(start) && Date.parse(endTime) > clock)
        status = start > clock ? 'UPCOMING' : 'LIVE';
    return { startTime, endTime, nextSessionStartTime, status };
}
