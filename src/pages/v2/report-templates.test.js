import test from 'node:test';
import assert from 'node:assert/strict';
import {
    REPORT_TEMPLATES,
    reportTemplateContext,
    reportTemplateUrl,
    reportTemplateTag,
    eligibleReportActivities,
    reportActivityDetail,
} from './report-detail-page/report-templates.js';

test('report template catalog contains the four requested templates', () => {
    assert.deepEqual(
        REPORT_TEMPLATES.map((item) => item.label),
        ['Báo cáo Hoạt động CLB', 'Báo cáo Tạo hoạt động', 'Báo cáo Đầu kỳ CLB', 'Báo cáo Cuối kỳ CLB'],
    );
    assert.deepEqual(
        REPORT_TEMPLATES.filter((item) => item.requiresActivity).map((item) => item.id),
        ['club-activity'],
    );
});

test('template navigation preserves canonical report period and requires activity for activity report', () => {
    const path = reportTemplateUrl('club-activity', 7, { reportPeriod: '2026-HK1', code: 'FA26' }, 15);
    const context = reportTemplateContext(path.split('?')[1]);
    assert.equal(context.clubId, 7);
    assert.equal(context.activityId, 15);
    assert.equal(context.period, '2026-HK1');
    assert.throws(() => reportTemplateUrl('club-activity', 7, null));
    assert.throws(() => reportTemplateUrl('missing', 7, null));
    assert.equal(reportTemplateContext('template=club-activity&clubId=7&activityId=0'), null);
    assert.equal(reportTemplateContext('template=term-start&clubId=other'), null);
});

test('term start and end remain distinct and activity report tags distinguish selected activities', () => {
    const start = reportTemplateContext('template=term-start&clubId=7&period=FA26&activityId=55');
    const end = reportTemplateContext('template=term-end&clubId=7&period=FA26');
    assert.equal(start.activityId, null);
    assert.notEqual(reportTemplateTag(start), reportTemplateTag(end));
    assert.notEqual(
        reportTemplateTag(reportTemplateContext('template=club-activity&clubId=7&activityId=1')),
        reportTemplateTag(reportTemplateContext('template=club-activity&clubId=7&activityId=2')),
    );
    assert.equal(reportTemplateContext('template=create-activity&clubId=7').template.reportType, 'FUTURE_EVENT');
});

test('activity selection excludes other clubs and periods and handles array and paged payloads', () => {
    const items = [
        { id: 1, clubId: 7, startTimeUtc: '2026-10-10T08:00:00Z' },
        { id: 2, clubId: 8, startTimeUtc: '2026-10-10T08:00:00Z' },
        { id: 3, clubId: 7, startTimeUtc: '2026-06-01T08:00:00Z' },
    ];
    const semester = { startUtc: '2026-09-01T00:00:00Z', endUtc: '2026-12-31T23:59:59Z' };
    assert.deepEqual(
        eligibleReportActivities({ items }, 7, semester).map((item) => item.id),
        [1],
    );
    assert.deepEqual(
        eligibleReportActivities(items, 7).map((item) => item.id),
        [1, 3],
    );
    assert.throws(() => eligibleReportActivities({}, 7));
});

test('activity prefilling uses Vietnam date and real source values without inventing participation', () => {
    const detail = reportActivityDetail({
        id: 15,
        title: 'Workshop',
        startTimeUtc: '2026-10-10T18:00:00Z',
        location: 'Lab',
        participantCount: 0,
    });
    assert.equal(detail.activityDate, '2026-10-11');
    assert.equal(detail.participantCount, 0);
    assert.equal(detail.activityName, 'Workshop');
    assert.equal(detail.dbId, null);
    assert.equal(detail.outcome, '');
});
