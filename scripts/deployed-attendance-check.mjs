import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.ATTENDANCE_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const browser = await chromium.launch();
const version = '11111111-1111-4111-8111-111111111111';
fs.mkdirSync('TestResults/attendance-online', { recursive: true });
try {
    for (const width of [1440, 390]) {
        const context = await browser.newContext({
            viewport: { width, height: 1000 },
            serviceWorkers: 'block',
            geolocation: { latitude: 10, longitude: 106, accuracy: 20 },
            permissions: ['geolocation'],
        });
        const page = await context.newPage();
        page.setDefaultTimeout(45000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        let verified = false,
            checkIns = 0,
            sessionReads = 0;
        await page.addInitScript(() =>
            localStorage.setItem(
                'fptux:session:v1',
                JSON.stringify({ id: 'isolated-attendance-test', accessToken: 'intercepted-not-a-real-token' }),
            ),
        );
        await page.route('**/*', async (route) => {
            const req = route.request(),
                path = new URL(req.url()).pathname;
            if (!path.startsWith('/api/')) return route.continue();
            // All synthetic identity and mutation traffic is intercepted here.
            const send = (body, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (req.method() !== 'GET') {
                assert.equal(path, '/api/activities/4/check-in');
                checkIns++;
                assert.ok(req.headers()['idempotency-key']);
                const body = req.postDataJSON();
                assert.equal(body.sessionId, 1);
                assert.deepEqual(body.location, { latitude: 10, longitude: 106, accuracyMeters: 20 });
                if (body.challenge !== 'signed-isolated-fixture')
                    return send({ message: 'The QR is invalid, expired or belongs to another session.' }, 400);
                verified = true;
                return send({
                    attendanceId: 104,
                    activityId: 4,
                    sessionId: 1,
                    status: 'VERIFIED',
                    attendanceStatus: 'Present',
                    recognitionStatus: 'PENDING',
                    version,
                });
            }
            if (path === '/api/users/me')
                return send({
                    id: 104,
                    fullName: 'Isolated attendance student',
                    email: 'attendance@example.test',
                    roles: ['CLUB_MEMBER'],
                    isActive: true,
                    isLocked: false,
                    campusCode: 'HAN',
                });
            if (path === '/api/users/me/profile')
                return send({
                    userId: 104,
                    profile: { interests: [] },
                    personal: {},
                    academic: {},
                    editableFields: [],
                    onboarding: { version: 1, completedAt: '2026-01-01T00:00:00Z' },
                });
            if (path === '/api/v2/activities/4')
                return send({
                    id: 4,
                    clubId: 1,
                    clubCode: 'TEST',
                    clubName: 'Isolated Club',
                    title: 'Attendance online validation',
                    description: 'API traffic isolated',
                    status: 'LIVE',
                    isInternal: false,
                    isRegistered: true,
                    canRegister: false,
                    isEligible: true,
                    nextAction: 'VIEW',
                    startTime: '2026-09-15T05:30:00Z',
                    endTime: '2026-12-15T08:30:00Z',
                });
            if (path === '/api/clubs')
                return send([{ id: 1, code: 'TEST', name: 'Isolated Club', campusCode: 'HAN', isActive: true }]);
            if (path === '/api/clubs/me/access' || path === '/api/clubs/me/memberships') return send([]);
            if (path === '/api/v2/activities/4/sessions') {
                sessionReads++;
                const start = new Date(Date.now() - 300000).toISOString(),
                    end = new Date(Date.now() + 300000).toISOString();
                return send({
                    activityId: 4,
                    items: [
                        {
                            id: 1,
                            activityId: 4,
                            version,
                            startTimeUtc: start,
                            endTimeUtc: end,
                            status: 'SCHEDULED',
                            location: 'Campus',
                            alreadyVerified: verified,
                            attendanceWindow: { mode: 'ONSITE', requiresLocation: true, opensAt: start, closesAt: end },
                            sourceActions: {
                                canCheckIn: !verified,
                                manualAttendance: 'REQUIRES_SUBMISSION_VALIDATION',
                            },
                        },
                    ],
                    page: 1,
                    totalPages: 1,
                    totalItems: 1,
                });
            }
            return send({ items: [], total: 0, page: 1, totalPages: 0 });
        });
        const open = async () => {
            await page.goto(base + '/v2/activities/4', { waitUntil: 'domcontentloaded' });
            await page.locator('.v2-activity-profile-identity h1').waitFor();
            await page
                .getByRole('navigation', { name: 'Nội dung hoạt động' })
                .getByRole('button', { name: 'Điểm danh của tôi', exact: true })
                .click();
        };
        await open();
        await page.getByRole('button', { name: 'Điểm danh phiên', exact: true }).click();
        await page.getByLabel('Mã xác thực phiên', { exact: true }).fill('expired');
        await page.getByRole('button', { name: 'Lấy vị trí hiện tại', exact: true }).click();
        await page.getByText('Đã lấy vị trí;', { exact: false }).waitFor();
        await page.getByRole('button', { name: 'Xác nhận điểm danh', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'hết hạn' }).waitFor();
        assert.equal(verified, false);
        await page.getByLabel('Mã xác thực phiên', { exact: true }).fill('signed-isolated-fixture');
        await page.getByRole('button', { name: 'Xác nhận điểm danh', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByText('Đã xác minh điểm danh', { exact: true }).waitFor();
        assert.equal(checkIns, 2);
        await open();
        await page.getByText('Đã xác minh điểm danh', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Điểm danh phiên', exact: true }).count(), 0);
        assert.ok(sessionReads >= 2);
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.screenshot({ path: `TestResults/attendance-online/student-${width}.png`, fullPage: true });
        await context.close();
    }
    console.log(
        'DEPLOYED_ATTENDANCE_OK: actual deployed student UI 1440/390, GPS, expired token, duplicate guard and verified reload; API traffic isolated, no real account acceptance.',
    );
} finally {
    await browser.close();
}
