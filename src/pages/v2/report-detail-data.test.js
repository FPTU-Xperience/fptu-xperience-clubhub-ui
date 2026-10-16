import test from 'node:test';
import assert from 'node:assert/strict';
import { reportDetailAccess, safeReportEvidenceUrl } from './report-detail-page/report-detail-data.js';

const author = { id: 5, roles: ['CLUB_MANAGER'] };
const manager = [{ clubId: 7, isManager: true }];
const report = { id: 10, clubId: 7, createdByUserId: 5, status: 'Draft' };

test('report controls respect club scope and report ownership', () => {
    assert.equal(reportDetailAccess(report, author, manager).submit, true);
    assert.equal(reportDetailAccess(report, author, [{ clubId: 8, isManager: true }]).edit, false);
    assert.equal(reportDetailAccess(report, { id: 6, roles: [] }, manager).submit, false);
    assert.equal(reportDetailAccess(report, { id: 6, roles: [] }, manager).attachments, false);
    assert.equal(reportDetailAccess(report, { id: 5, roles: [] }, []).edit, false);
});

test('observation grants no mutations or export even to a manager or CTSV', () => {
    assert.deepEqual(reportDetailAccess(report, { ...author, roles: ['STUDENT_AFFAIRS_ADMIN'] }, manager, true), {});
});

test('review controls preserve the existing manager and final-review stages', () => {
    const submitted = { ...report, status: 'Submitted' };
    assert.equal(reportDetailAccess(submitted, author, manager).managerReview, false);
    assert.equal(reportDetailAccess(submitted, { id: 6 }, manager).managerReview, true);
    assert.equal(reportDetailAccess({ ...submitted, reportType: 'FUTURE_EVENT' }, author, manager).managerReview, true);
    assert.equal(
        reportDetailAccess({ ...report, status: 'Under Review' }, { id: 9, roles: ['STUDENT_AFFAIRS_ADMIN'] })
            .finalReview,
        true,
    );
    assert.equal(reportDetailAccess({ ...report, status: 'Under Review' }, author, manager).finalReview, false);
    assert.equal(reportDetailAccess({ ...report, status: 'Approved' }, author, manager).submit, false);
});

test('uploaded authors can submit but do not gain manager editing rights', () => {
    const access = reportDetailAccess({ ...report, contentSource: 'UPLOADED_FILE' }, author, []);
    assert.equal(access.submit, true);
    assert.equal(access.edit, false);
    assert.equal(access.attachments, false);
});

test('evidence links reject script and local-file protocols', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///secret', '/relative', ''])
        assert.equal(safeReportEvidenceUrl(url), null);
    assert.equal(safeReportEvidenceUrl('https://example.edu/proof'), 'https://example.edu/proof');
});
