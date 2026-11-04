import test from 'node:test';
import assert from 'node:assert/strict';
import {
    clubCapability,
    clubLeadership,
    clubDraftReport,
    clubSubmitReport,
} from '../../services/club-capabilities.js';
import {
    governanceConfiguration,
    governancePage,
    governancePeriod,
    governanceReceipt,
} from '../../services/club-governance.js';
const period = '11111111-1111-4111-8111-111111111111';
const active = {
    isApprovedMember: true,
    capabilities: ['club.reports.draft.write', 'event.content.write'],
    accessValidUntilUtc: new Date(Date.now() + 60000).toISOString(),
};
test('specialist grants require current membership, explicit permission and live expiry', () => {
    assert.equal(clubCapability(active, 'event.content.write'), true);
    for (const scope of [
        { ...active, isApprovedMember: false },
        { ...active, accessValidUntilUtc: null },
        { ...active, accessValidUntilUtc: '2000-01-01' },
        { ...active, capabilities: [] },
    ])
        assert.equal(clubCapability(scope, 'event.content.write'), false);
    assert.equal(clubCapability(active, 'club.governance.write'), false);
    assert.equal(clubLeadership(active), false);
    assert.equal(clubLeadership({ ...active, isVicePresident: true }), true);
    assert.equal(
        clubLeadership({
            ...active,
            isVicePresident: true,
            accessValidUntilUtc: null,
        }),
        false,
    );
});
test('secretary can draft nonfinancial reports without submit or financial rights', () => {
    assert.equal(
        clubDraftReport(active, { reportType: 'CLUB_TERM_START' }),
        true,
    );
    assert.equal(clubDraftReport(active, { reportType: 'FINANCIAL' }), false);
    assert.equal(
        clubSubmitReport(active, { reportType: 'CLUB_TERM_START' }),
        false,
    );
    const finance = { ...active, capabilities: ['club.finance.draft.write'] };
    assert.equal(clubDraftReport(finance, { tag: 'FINANCE' }), true);
    assert.equal(clubSubmitReport(finance, { tag: 'FINANCE' }), false);
    assert.equal(
        clubSubmitReport(
            { ...finance, capabilities: ['club.finance.submit'] },
            { tag: 'FINANCE' },
        ),
        true,
    );
});
test('governance uses authoritative GUID period and rejects foreign or duplicate groups', () => {
    assert.equal(governancePeriod({ id: 'FA26' }), null);
    assert.equal(
        governancePeriod({ id: 'FA26', semesterKey: period }).id,
        period,
    );
    const group = {
        id: period,
        name: 'Content',
        presetCode: 'CONTENT',
        protected: false,
        permissionCodes: ['event.content.write'],
        assignments: [],
    };
    const config = {
        semesterId: period,
        catalogVersion: 'CLUB_GROUPS_V1',
        startsAt: '2026-01-01',
        endsAt: '2027-01-01',
        groups: [group],
    };
    assert.equal(governanceConfiguration(config, period), config);
    assert.throws(() =>
        governanceConfiguration({ ...config, groups: [group, group] }, period),
    );
    assert.throws(() =>
        governanceConfiguration({ ...config, semesterId: 'foreign' }, period),
    );
    assert.throws(() =>
        governanceConfiguration(
            {
                ...config,
                groups: [
                    { ...group, permissionCodes: ['club.governance.write'] },
                ],
            },
            period,
        ),
    );
});
test('receipts and pagination must match server scope without inventing success', () => {
    const page = {
        clubId: 1,
        items: [],
        page: 1,
        pageSize: 20,
        totalItems: 0,
        totalPages: 0,
    };
    assert.equal(governancePage(page, 1), page);
    assert.throws(() => governancePage(page, 2));
    assert.throws(() => governancePage({ ...page, totalPages: 3 }, 1));
    assert.throws(() =>
        governanceReceipt(
            {
                clubId: 1,
                semesterId: period,
                id: period,
                status: 'SUBMITTED',
                permissionsChanged: true,
            },
            1,
            period,
            'report',
        ),
    );
});
