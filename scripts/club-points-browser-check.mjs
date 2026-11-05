import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = spawn(
    'node',
    [
        'node_modules/vite/bin/vite.js',
        '--config',
        'tests/fixtures/public-tabs.config.mjs',
        '--host',
        '127.0.0.1',
        '--port',
        '4187',
        '--strictPort',
    ],
    { stdio: 'ignore', windowsHide: true },
);
const id = (n) => '11111111-1111-4111-8111-' + String(n).padStart(12, '0');
let browser;
try {
    for (let i = 0; i < 60; i++) {
        try {
            if ((await fetch('http://127.0.0.1:4187/tests/fixtures/club-points.html')).ok) break;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/club-points', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        page.setDefaultTimeout(15000);
        const errors = [],
            reads = [];
        let wrongActor = false,
            clubReads = 0;
        page.on('pageerror', (issue) => errors.push(issue.message));
        await page.route('**/__points_api/**', async (route) => {
            const request = route.request(),
                url = new URL(request.url()),
                path = url.pathname.replace('/__points_api', '');
            reads.push(path);
            assert.equal(request.method(), 'GET');
            const actor = Number(request.headers()['x-test-actor']);
            const send = (value) =>
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(value) });
            if (path.endsWith('experience-statistics')) {
                assert.equal(actor, 100);
                clubReads++;
                const clubId = Number(path.split('/')[3]);
                return send({
                    schemaVersion: 1,
                    clubId,
                    semesterId: url.searchParams.get('semesterId'),
                    ledgerBasis: 'VERIFIED_NET_LEDGER',
                    ledgerRevision: 'revision',
                    activities: { uniqueVerifiedParticipantCount: 3 },
                    approvedContributionCount: 4,
                    netPointsByPillar: {
                        Academic: 90,
                        Research: 0,
                        Global: 0,
                        CultureSports: 0,
                        Community: 10,
                        Entrepreneurship: 0,
                        RealWorldWork: 0,
                    },
                    progress: {
                        activities: { actual: 2, target: 4 },
                        sessions: { actual: 3, target: 6 },
                        uniqueParticipants: { actual: 3, target: 5 },
                    },
                    plan: { planVersion: id(1) },
                });
            }
            if (path.endsWith('experience-policies')) return send({ items: [], availability: 'NO_APPROVED_POLICY' });
            if (path.endsWith('/wallet/me'))
                return send({
                    userId: actor,
                    clubId: Number(path.split('/')[3]),
                    unit: 'CLUB_CREDIT',
                    policyVersion: 'CLUB_VERIFIED_XP_1_TO_1_V1',
                    version: id(2),
                    earnedTotal: 80,
                    revokedTotal: 0,
                    spentTotal: 60,
                    balance: 20,
                });
            if (path.endsWith('/wallet/me/graph'))
                return send({
                    userId: actor,
                    clubId: Number(path.split('/')[3]),
                    unit: 'CLUB_CREDIT',
                    policyVersion: 'CLUB_VERIFIED_XP_1_TO_1_V1',
                    version: id(2),
                    timezone: 'Asia/Ho_Chi_Minh',
                    from: '2026-11-01',
                    to: '2026-11-01',
                    points: [{ date: '2026-11-01', earned: 80, spent: 60, balance: 20 }],
                });
            if (path.endsWith('/points/me/ledger'))
                return send({
                    userId: actor,
                    clubId: Number(path.split('/')[3]),
                    items: [],
                    page: 1,
                    totalItems: 0,
                    totalPages: 0,
                });
            if (path === '/api/users/me/contributions') {
                const row = (n, extra = {}) => ({
                    id: id(n),
                    userId: wrongActor ? 999 : actor,
                    clubId: 1,
                    sourceType: 'CLUB',
                    title: 'Đóng góp ' + n,
                    semesterId: 'FA2026',
                    occurredAt: '2026-11-01T10:00:00Z',
                    status: 'APPROVED',
                    recognitionStatus: 'RECORDED',
                    rawPoints: 30,
                    ...extra,
                });
                const items = [
                    row(1),
                    row(2, { semesterId: 'SU2026', rawPoints: 50 }),
                    row(3, { clubId: 2, title: 'Đóng góp CLB khác', rawPoints: 900 }),
                    row(4, { status: 'REVOKED', rawPoints: 500 }),
                ];
                return send({ items, page: 1, total: 4, totalPages: 1 });
            }
            throw new Error('Unexpected points request ' + path);
        });
        await page.goto('http://127.0.0.1:4187/tests/fixtures/club-points.html', { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Tổng hợp điểm CLB', exact: true }).waitFor();
        await page.getByText('Phân bổ XP theo trụ cột', { exact: true }).waitFor();
        assert.equal(await page.getByRole('tab').count(), 2);
        assert.equal(
            await page.getByRole('tab', { name: 'Tính điểm CLB', exact: true }).getAttribute('aria-selected'),
            'true',
        );
        await page.screenshot({ path: `TestResults/club-points/club-${width}.png`, fullPage: true });
        await page.getByRole('tab', { name: 'Điểm cá nhân trong CLB', exact: true }).click();
        const stat = (label) =>
            page
                .locator('.v2-club-points-stat')
                .filter({ has: page.getByText(label, { exact: true }) })
                .locator('strong');
        await page.getByRole('heading', { name: 'Sổ ghi nhận đóng góp trong học kỳ', exact: true }).waitFor();
        assert.equal(await stat('XP của tôi trong học kỳ').innerText(), '30');
        assert.equal(await stat('XP tích lũy tại CLB').innerText(), '80');
        assert.equal(await stat('Credit đổi quà tại CLB').innerText(), '20');
        assert.equal(await page.getByText('Đóng góp CLB khác', { exact: true }).count(), 0);
        assert.equal(await page.getByText('Đã thu hồi', { exact: true }).count(), 1);
        await page.screenshot({ path: `TestResults/club-points/personal-${width}.png`, fullPage: true });
        assert.equal(
            reads.some((path) => path.includes('/wallet/me/graph')),
            false,
        );
        await page.getByText('Ví đổi quà và lịch sử credit', { exact: true }).click();
        await page.getByRole('img', { name: /Biểu đồ credit/ }).waitFor();
        assert.equal(await stat('XP của tôi trong học kỳ').innerText(), '30');
        await page.getByRole('button', { name: 'Đổi học kỳ', exact: true }).click();
        await page.getByRole('heading', { name: 'Sổ ghi nhận đóng góp trong học kỳ', exact: true }).waitFor();
        assert.equal(await stat('XP của tôi trong học kỳ').innerText(), '50');
        await page.getByRole('button', { name: 'Đổi CLB', exact: true }).click();
        await page.getByRole('heading', { name: 'Sổ ghi nhận đóng góp trong học kỳ', exact: true }).waitFor();
        assert.equal(await stat('XP của tôi trong học kỳ').innerText(), '0');
        assert.equal(await stat('XP tích lũy tại CLB').innerText(), '900');
        const count = clubReads;
        await page.getByRole('button', { name: 'Vai thành viên', exact: true }).click();
        await page.getByRole('heading', { name: 'Sổ ghi nhận đóng góp trong học kỳ', exact: true }).waitFor();
        assert.equal(await page.getByRole('tab').count(), 0);
        assert.equal(clubReads, count);
        wrongActor = true;
        await page.getByRole('button', { name: 'Tải lại điểm', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Không đối chiếu' }).waitFor();
        assert.equal(await page.locator('.v2-club-points-stat').count(), 0);
        await page.getByRole('button', { name: 'Đổi chế độ quan sát', exact: true }).click();
        await page.getByText('Chế độ quan sát không hiển thị điểm và ví cá nhân.', { exact: true }).waitFor();
        const before = reads.length;
        await page.waitForTimeout(100);
        assert.equal(reads.length, before);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.deepEqual(errors, []);
        console.log(
            'CLUB_POINTS_BROWSER_OK',
            width,
            'club/personal tabs; XP versus credit; actor/club/semester isolation; revoked and failed states; read-only privacy',
        );
        await page.close();
    }
} finally {
    await browser?.close();
    server.kill();
}
