export const REPORT_TEMPLATES = Object.freeze([
    {
        id: 'club-activity',
        label: 'Báo cáo Hoạt động CLB',
        description: 'Tổng kết kết quả và minh chứng của một hoạt động.',
        reportType: 'CLUB_ACTIVITY',
        requiresActivity: true,
    },
    {
        id: 'create-activity',
        label: 'Báo cáo Tạo hoạt động',
        description: 'Đề xuất tổ chức hoạt động mới của câu lạc bộ.',
        reportType: 'FUTURE_EVENT',
    },
    {
        id: 'term-start',
        label: 'Báo cáo Đầu kỳ CLB',
        description: 'Trình bày mục tiêu và kế hoạch hoạt động đầu kỳ.',
        reportType: 'CLUB_TERM_START',
    },
    {
        id: 'term-end',
        label: 'Báo cáo Cuối kỳ CLB',
        description: 'Tổng kết hoạt động, kết quả và kiến nghị cuối kỳ.',
        reportType: 'CLUB_TERM_END',
    },
]);

export function reportTemplateContext(search) {
    const params = new URLSearchParams(search);
    const template = REPORT_TEMPLATES.find((item) => item.id === params.get('template'));
    if (!template) return null;
    const clubId = Number(params.get('clubId')),
        activityId = Number(params.get('activityId'));
    if (!Number.isSafeInteger(clubId) || clubId <= 0) return null;
    if (template.requiresActivity && (!Number.isSafeInteger(activityId) || activityId <= 0)) return null;
    return {
        template,
        clubId,
        activityId: template.requiresActivity ? activityId : null,
        period: params.get('period') || '',
    };
}

export function reportTemplateUrl(templateId, clubId, semester, activityId, basePath = '/v2/reports') {
    const template = REPORT_TEMPLATES.find((item) => item.id === templateId);
    if (!template) throw new Error('Mẫu báo cáo không hợp lệ.');
    const params = new URLSearchParams({ template: templateId, clubId: String(clubId) });
    const period = semester?.reportPeriod || semester?.invitationCode || semester?.code || semester?.id;
    if (period) params.set('period', period);
    if (template.requiresActivity) params.set('activityId', String(activityId));
    if (!reportTemplateContext(params.toString())) throw new Error('Vui lòng chọn hoạt động và CLB hợp lệ.');
    return `${basePath}/create?${params}`;
}

export const reportTemplateTag = (context) =>
    !context
        ? ''
        : context.template.requiresActivity
          ? `${context.template.reportType}:${context.activityId}`
          : context.template.reportType;
export const reportTemplateLabel = (report) =>
    REPORT_TEMPLATES.find((item) => item.reportType === report?.reportType)?.label || '';

export function eligibleReportActivities(payload, clubId, semester) {
    const items = Array.isArray(payload) ? payload : payload?.items;
    if (!Array.isArray(items)) throw new Error('Danh sách hoạt động không hợp lệ.');
    const start = Date.parse(semester?.startUtc),
        end = Date.parse(semester?.endUtc);
    const bounded = Number.isFinite(start) && Number.isFinite(end) && start < end;
    return items
        .filter((item) => {
            if (String(item.clubId) !== String(clubId)) return false;
            if (!Number.isSafeInteger(Number(item.id)) || Number(item.id) <= 0) return false;
            const time = Date.parse(item.startTimeUtc || item.startTime);
            return !bounded || (Number.isFinite(time) && time >= start && time <= end);
        })
        .sort(
            (a, b) =>
                Date.parse(b.startTimeUtc || b.startTime || '') - Date.parse(a.startTimeUtc || a.startTime || '') ||
                Number(b.id) - Number(a.id),
        );
}

export function reportActivityDetail(activity) {
    return {
        id: `source-activity-${activity.id}`,
        dbId: null,
        activityName: activity.title || '',
        activityType: activity.activityType || 'Chuyên môn',
        activityDate: Number.isFinite(Date.parse(activity.startTimeUtc || activity.startTime))
            ? new Date(activity.startTimeUtc || activity.startTime).toLocaleDateString('en-CA', {
                  timeZone: 'Asia/Ho_Chi_Minh',
              })
            : '',
        location: activity.location || '',
        partnerUnit: '',
        objective: '',
        description: activity.description || '',
        targetParticipantCount: activity.targetParticipantCount ?? 0,
        participantCount: activity.participantCount ?? 0,
        outcome: '',
        budgetSpent: 0,
        evidenceUrl: '',
    };
}
