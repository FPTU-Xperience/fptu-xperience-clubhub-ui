import test from 'node:test';
import assert from 'node:assert/strict';
import {
    REPORT_EDITOR_STAGES,
    editReportXp,
    mergeReportXp,
    reportXpPayload,
    reportXpScope,
    validateReportXp,
    validateSavedReportXp,
    xpReportApplicable,
    xpReportTotal,
} from './report-detail-page/report-xp.js';

const scope = { clubId: 7, period: 'FALL2026', activityId: 42, reportType: 'CLUB_ACTIVITY', reportId: null };
const source = () => ({
    ...scope,
    version: 1,
    sourceVersion: 2,
    budgetRaw: 50,
    capabilities: { canEdit: true },
    rows: [
        {
            sourceId: 'completion-1',
            activityId: 42,
            studentCode: 'SE001',
            fullName: 'Nguyễn An',
            actionId: 3,
            actionTitle: 'Hỗ trợ tổ chức',
            quantity: 2,
            points: 5,
            rawPoints: 10,
            evidence: 'Biên bản đã xác minh',
        },
    ],
    changes: [],
    baseChangeCount: 0,
    dirty: false,
});

test('report editor has a dedicated Xperience Point stage before preview; only closing templates settle Xperience Point', () => {
    assert.deepEqual(REPORT_EDITOR_STAGES, [
        'Thông tin chung',
        'Hoạt động',
        'Đánh giá',
        'Báo cáo Xperience Point',
        'Xem trước & nộp',
    ]);
    assert.equal(xpReportApplicable('CLUB_TERM_END'), true);
    assert.equal(xpReportApplicable('FUTURE_EVENT'), false);
    assert.equal(xpReportApplicable('CLUB_TERM_START'), false);
    assert.deepEqual(
        reportXpScope({ clubId: 7, period: ' FALL2026 ', reportType: 'CLUB_ACTIVITY', tag: 'CLUB_ACTIVITY:42' }),
        scope,
    );
});

test('Xperience Point sources reject mismatched scopes, duplicate identities, malformed totals and history', () => {
    assert.equal(validateReportXp(source(), scope).rows.length, 1);
    for (const patch of [
        { clubId: 8 },
        { activityId: 43 },
        { period: 'SPRING2027' },
        { version: 0 },
        { sourceVersion: null },
        { rows: [...source().rows, ...source().rows] },
        { changes: [{}] },
        { budgetRaw: 1 },
    ])
        assert.throws(() => validateReportXp({ ...source(), ...patch }, scope));
    assert.throws(() => validateReportXp({ ...source(), rows: [{ ...source().rows[0], rawPoints: 15 }] }, scope));
    assert.throws(() => validateReportXp(source(), { ...scope, activityId: null }));
    assert.throws(() => validateReportXp(source(), { ...scope, reportId: 99 }));
});

test('Xperience Point edits retain evidence and before/after history; approved rates and budget cannot be bypassed', () => {
    const initial = source(),
        original = structuredClone(initial);
    const draft = editReportXp(
        initial,
        'completion-1',
        { quantity: 1, evidence: 'Xác minh một lượt', reason: 'Loại lượt chưa đủ cơ sở' },
        'Chủ nhiệm',
    );
    assert.deepEqual(initial, original);
    assert.equal(xpReportTotal(draft.rows), 5);
    assert.equal(draft.changes[0].before.rawPoints, 10);
    assert.equal(draft.changes[0].after.rawPoints, 5);
    for (const edit of [{ quantity: -1 }, { quantity: 1.5 }, { quantity: 100 }, { reason: ' ' }, { evidence: '' }])
        assert.throws(() =>
            editReportXp(
                initial,
                'completion-1',
                { quantity: 1, evidence: 'Xác minh', reason: 'Điều chỉnh hợp lệ', ...edit },
                'Chủ nhiệm',
            ),
        );
    assert.throws(() =>
        editReportXp(
            { ...initial, capabilities: {} },
            'completion-1',
            { quantity: 0, evidence: 'Loại điểm', reason: 'Không đủ điều kiện' },
            'Chủ nhiệm',
        ),
    );
    assert.equal(
        editReportXp(
            draft,
            'completion-1',
            { quantity: 0, evidence: 'Không đủ điều kiện', reason: 'Loại nguồn chưa xác minh' },
            'Chủ nhiệm',
        ).rows[0].rawPoints,
        0,
    );
    const payload = reportXpPayload(draft);
    assert.deepEqual(payload.rows, [{ sourceId: 'completion-1', quantity: 1, evidence: 'Xác minh một lượt' }]);
    assert.equal(payload.expectedVersion, 1);
    assert.equal(payload.sourceVersion, 2);
    assert.equal('points' in payload.rows[0], false);
});

test('Xperience Point autofill merges new sources while preserving reviewed edits and rejecting concurrent rule changes', () => {
    const draft = editReportXp(
        source(),
        'completion-1',
        { quantity: 1, evidence: 'Xác minh một lượt', reason: 'Loại lượt chưa đủ cơ sở' },
        'Chủ nhiệm',
    );
    const next = {
        ...source(),
        sourceVersion: 3,
        rows: [...source().rows, { ...source().rows[0], sourceId: 'completion-2', studentCode: 'SE002' }],
    };
    const merged = mergeReportXp(draft, next);
    assert.equal(xpReportTotal(merged.rows), 15);
    assert.equal(merged.changes.length, 1);
    assert.equal(merged.sourceVersion, 3);
    assert.throws(() => mergeReportXp(draft, { ...next, version: 2 }));
    assert.throws(() => mergeReportXp(draft, { ...next, rows: [] }));
    assert.throws(() => mergeReportXp(draft, { ...next, rows: [{ ...next.rows[0], points: 7 }] }));
    assert.throws(() => mergeReportXp(draft, { ...next, budgetRaw: 1 }));
});

test('Xperience Point save acknowledgement confirms reviewed rows, new version and complete history', () => {
    const draft = editReportXp(
        source(),
        'completion-1',
        { quantity: 1, evidence: 'Một lượt đã xác minh', reason: 'Loại lượt thiếu minh chứng' },
        'Chủ nhiệm',
    );
    const saved = { ...structuredClone(draft), version: 2, reportId: 99 };
    const savedScope = { ...scope, reportId: 99 };
    assert.equal(validateSavedReportXp(saved, draft, savedScope), saved);
    assert.throws(() => validateSavedReportXp({ ...saved, version: 1 }, draft, savedScope));
    assert.throws(() => validateSavedReportXp({ ...saved, changes: [] }, draft, savedScope));
    assert.throws(() => validateSavedReportXp({ ...saved, rows: source().rows }, draft, savedScope));
    assert.throws(() =>
        validateSavedReportXp({ ...saved, rows: [{ ...saved.rows[0], points: 7, rawPoints: 7 }] }, draft, savedScope),
    );
    assert.deepEqual(reportXpPayload(draft).changes[0].before, { quantity: 2, evidence: 'Biên bản đã xác minh' });
    assert.deepEqual(reportXpPayload(draft).changes[0].after, { quantity: 1, evidence: 'Một lượt đã xác minh' });
});
