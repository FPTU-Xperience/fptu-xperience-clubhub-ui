import test from 'node:test';
import assert from 'node:assert/strict';
import { personalClubPoints, clubPointSummary, clubPointStatistics, clubPointPillars } from './club-points.js';
const row = (n, fields = {}) => ({
    id: `11111111-1111-4111-8111-${String(n).padStart(12, '0')}`,
    userId: 20,
    clubId: 1,
    sourceType: 'CLUB',
    title: 'Contribution',
    semesterId: 'FA2026',
    status: 'APPROVED',
    recognitionStatus: 'RECORDED',
    rawPoints: 30,
    ...fields,
});
test('personal points finish pagination, isolate clubs and exclude revoked and legacy points', async () => {
    const rows = [
        row(1),
        row(2, { clubId: 2, rawPoints: 999 }),
        row(3, { status: 'REVOKED', rawPoints: 100 }),
        row(4, { semesterId: 'SU2026', rawPoints: 50 }),
        row(5, { isAuthoritative: false, rawPoints: 800 }),
    ];
    const api = {
        request: async (path) => {
            const page = Number(new URL(path, 'https://test').searchParams.get('page'));
            return { page, total: 5, totalPages: 2, items: page === 1 ? rows.slice(0, 2) : rows.slice(2) };
        },
    };
    const result = clubPointSummary(await personalClubPoints(api, 20, 1), 'FA2026');
    assert.equal(result.periodXp, 30);
    assert.equal(result.lifetimeXp, 80);
    assert.equal(result.approvedCount, 1);
    assert.equal(result.rows.length, 2);
});
test('personal points reject another actor, duplicate or partial pagination and unrecognized approvals', async () => {
    for (const items of [[row(1, { userId: 99 })], [row(1), row(1)], [row(1, { recognitionStatus: 'NOT_REQUESTED' })]])
        await assert.rejects(
            personalClubPoints(
                { request: async () => ({ page: 1, total: items.length, totalPages: 1, items }) },
                20,
                1,
            ),
        );
    await assert.rejects(
        personalClubPoints({ request: async () => ({ page: 1, total: 2, totalPages: 1, items: [row(1)] }) }, 20, 1),
    );
});
test('club statistics require the canonical club, semester and verified ledger basis', () => {
    const value = {
        schemaVersion: 1,
        clubId: 1,
        semesterId: 'FA2026',
        ledgerBasis: 'VERIFIED_NET_LEDGER',
        ledgerRevision: 'abc',
        activities: { completedSessionCount: 2 },
        progress: Object.fromEntries(
            ['activities', 'sessions', 'uniqueParticipants'].map((key) => [key, { actual: 0, target: 0 }]),
        ),
        approvedContributionCount: 1,
        netPointsByPillar: Object.fromEntries(clubPointPillars.map(([key]) => [key, 0])),
    };
    assert.equal(clubPointStatistics(value, 1, 'FA2026'), value);
    for (const changes of [
        { clubId: 2 },
        { semesterId: 'SU2026' },
        { ledgerBasis: 'SAMPLE' },
        { netPointsByPillar: {} },
    ])
        assert.throws(() => clubPointStatistics({ ...value, ...changes }, 1, 'FA2026'));
});
