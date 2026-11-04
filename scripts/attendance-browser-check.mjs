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
        '4183',
        '--strictPort',
    ],
    { stdio: 'inherit', windowsHide: true },
);
const versions = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555',
];
let browser;
try {
    for (let i = 0; i < 60; i++) {
        try {
            if ((await fetch('http://127.0.0.1:4183/tests/fixtures/attendance.html')).ok) break;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/attendance', { recursive: true });
    for (const width of [1440, 390]) {
        const context = await browser.newContext({
            viewport: { width, height: 1000 },
            geolocation: { latitude: 10, longitude: 106, accuracy: 20 },
            permissions: ['geolocation'],
        });
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        let activityVersion = versions[0],
            sessionVersion = versions[0],
            status = 'SCHEDULED',
            blocked = false,
            malformed = false;
        let creates = 0,
            challenges = 0,
            manualWrites = 0,
            checkIns = 0,
            closeCalls = 0,
            cancelCalls = 0,
            slow = false,
            slowDone = false;
        let conflict = true;
        const verified = new Set();
        const start = new Date(Date.now() - 300000).toISOString(),
            end = new Date(Date.now() + 3300000).toISOString();
        const policy = {
            mode: 'ONSITE',
            opensAt: start,
            closesAt: end,
            manualConfirmationEnabled: true,
            geofence: { latitude: 10, longitude: 106, radiusMeters: 100 },
        };
        const session = () => ({
            id: 1,
            activityId: 1,
            version: sessionVersion,
            startTime: start,
            endTime: end,
            status,
            mode: 'ONSITE',
            location: 'Campus',
            attendancePolicy: policy,
            capabilities: {
                canEdit: false,
                canClose: status === 'SCHEDULED',
                canCancel: status !== 'CANCELLED',
                canIssueChallenge: status === 'SCHEDULED',
            },
        });
        await page.route('**/__attendance_api/**', async (route) => {
            const request = route.request(),
                url = new URL(request.url()),
                path = url.pathname.replace('/__attendance_api', ''),
                actor = Number(request.headers()['x-test-actor']);
            const send = (body, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (request.method() === 'GET') {
                if (path === '/api/activities/1/sessions')
                    return send({
                        activityId: 1,
                        activityVersion,
                        capabilities: { canManage: true, canCreate: !blocked },
                        creationBlockReason: blocked ? 'APPROVED_SCORING_SOURCE_REQUIRED' : null,
                        items: blocked ? [] : [session()],
                        total: blocked ? 0 : 1,
                    });
                if (path.includes('attendance-challenge')) {
                    challenges++;
                    const now = Date.now();
                    return send({
                        sessionId: 1,
                        challenge: 'signed-current-fixture',
                        serverTime: new Date(now).toISOString(),
                        expiresAt: new Date(now + (challenges === 1 ? 2000 : 30000)).toISOString(),
                    });
                }
                if (path === '/api/v2/activities/1/sessions')
                    return send({
                        activityId: malformed ? 999 : 1,
                        items: [
                            {
                                id: 1,
                                activityId: 1,
                                version: sessionVersion,
                                startTimeUtc: start,
                                endTimeUtc: end,
                                status,
                                location: 'Campus',
                                alreadyVerified: verified.has(actor),
                                attendanceWindow: {
                                    mode: 'ONSITE',
                                    opensAt: start,
                                    closesAt: end,
                                    requiresLocation: true,
                                },
                                sourceActions: {
                                    canCheckIn: !verified.has(actor) && status === 'SCHEDULED',
                                    manualAttendance: 'UNAVAILABLE',
                                },
                            },
                        ],
                        page: 1,
                        totalPages: 1,
                        totalItems: 1,
                    });
                if (path.endsWith('/attendance')) {
                    assert.equal(url.searchParams.get('sessionId'), '1');
                    return send({
                        activityId: 1,
                        sessionId: 1,
                        sessionVersion,
                        capabilities: { canVerify: true },
                        items: [104, 105, 100].map((id, index) => ({
                            memberId: index + 1,
                            userId: id,
                            fullName: id === 100 ? 'Manager' : `Student ${id}`,
                            isRegistered: true,
                            attendance: verified.has(id)
                                ? {
                                      attendanceId: id,
                                      activityId: 1,
                                      sessionId: 1,
                                      status: 'VERIFIED',
                                      attendanceStatus: 'Present',
                                      version: versions[3],
                                  }
                                : null,
                            canMarkPresent: id !== 100 && !verified.has(id),
                            canMarkAbsent: false,
                        })),
                        totalItems: 3,
                        totalPages: 1,
                        verifiedCount: verified.size,
                    });
                }
                throw new Error('Unexpected attendance read: ' + path);
            }
            assert.ok(request.headers()['idempotency-key']);
            const body = request.postDataJSON();
            if (path === '/api/activities/1/sessions') {
                creates++;
                assert.equal(body.expectedVersion, activityVersion);
                assert.equal(body.startAt, '2026-11-15T07:00:00.000Z');
                assert.equal(body.attendancePolicy.mode, 'ONLINE');
                activityVersion = versions[1];
                return send({ activityId: 1, activityVersion, items: [session()], total: 1 });
            }
            if (path.endsWith('/attendance')) {
                manualWrites++;
                assert.equal(body.sessionId, 1);
                assert.equal(body.expectedSessionVersion, sessionVersion);
                assert.equal(body.items[0].memberId, 2);
                assert.equal(body.items[0].expectedVersion, null);
                assert.ok(body.reason);
                if (conflict) {
                    conflict = false;
                    sessionVersion = versions[2];
                    return send({ message: 'Reload all attendance versions.' }, 409);
                }
                verified.add(105);
                return send({
                    items: [
                        {
                            attendanceId: 105,
                            activityId: 1,
                            sessionId: 1,
                            status: 'VERIFIED',
                            attendanceStatus: 'Present',
                            version: versions[3],
                        },
                    ],
                });
            }
            if (path.endsWith('/check-in')) {
                checkIns++;
                assert.equal(body.sessionId, 1);
                assert.deepEqual(body.location, { latitude: 10, longitude: 106, accuracyMeters: 20 });
                if (body.challenge !== 'signed-current-fixture')
                    return send({ message: 'The QR is invalid, expired or belongs to another session.' }, 400);
                if (slow) {
                    await new Promise((resolve) => setTimeout(resolve, 400));
                    slowDone = true;
                }
                verified.add(actor);
                return send({
                    attendanceId: actor,
                    activityId: 1,
                    sessionId: 1,
                    status: 'VERIFIED',
                    attendanceStatus: 'Present',
                    recognitionStatus: 'PENDING',
                    version: versions[3],
                });
            }
            if (path.endsWith('/close')) {
                closeCalls++;
                assert.equal(body.expectedVersion, sessionVersion);
                assert.ok(body.reason);
                status = 'CLOSED';
                sessionVersion = versions[3];
                return send(session());
            }
            if (path.endsWith('/cancel')) {
                cancelCalls++;
                assert.equal(body.expectedVersion, sessionVersion);
                assert.ok(body.reason);
                status = 'CANCELLED';
                sessionVersion = versions[4];
                return send(session());
            }
            throw new Error('Unexpected attendance mutation: ' + path);
        });
        await page.goto('http://127.0.0.1:4183/tests/fixtures/attendance.html', {
            waitUntil: 'domcontentloaded',
            timeout: 120000,
        });
        await page.getByRole('button', { name: 'Tạo phiên điểm danh', exact: true }).click();
        for (const [label, value] of [
            ['Bắt đầu phiên', '2026-11-15T14:00'],
            ['Kết thúc phiên', '2026-11-15T16:00'],
            ['Mở điểm danh', '2026-11-15T14:00'],
            ['Đóng điểm danh', '2026-11-15T14:30'],
        ])
            await page.getByLabel(label, { exact: true }).fill(value);
        await page.getByLabel('Hình thức', { exact: true }).selectOption('ONLINE');
        await page.getByRole('button', { name: 'Lưu phiên', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByText('Đã lưu thay đổi phiên điểm danh.', { exact: true }).waitFor();
        assert.equal(creates, 1);
        console.log('created', width);
        await page.getByRole('button', { name: 'Lấy mã xác thực phiên #1', exact: true }).click();
        await page.getByLabel('Mã do máy chủ cấp', { exact: true }).waitFor();
        await page.getByLabel('Mã do máy chủ cấp', { exact: true }).waitFor({ state: 'hidden' });
        assert.equal(challenges, 1, 'No automatic challenge polling');
        await page.getByRole('button', { name: 'Xem điểm danh phiên #1', exact: true }).click();
        await page.getByRole('button', { name: 'Ghi điểm danh · Student 105', exact: true }).click();
        await page.getByLabel('Lý do xác minh', { exact: true }).fill('Verified in person');
        await page.getByRole('button', { name: 'Lưu điểm danh', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Tải lại' }).waitFor();
        await page.getByRole('button', { name: 'Tải lại dữ liệu', exact: true }).click();
        await page.getByRole('button', { name: 'Ghi điểm danh · Student 105', exact: true }).click();
        await page.getByLabel('Lý do xác minh', { exact: true }).fill('Verified in person');
        await page.getByRole('button', { name: 'Lưu điểm danh', exact: true }).click();
        await page.getByText('Đã lưu trạng thái điểm danh.', { exact: false }).waitFor();
        assert.equal(manualWrites, 2);
        assert.equal(await page.getByRole('button', { name: 'Ghi điểm danh · Manager', exact: true }).count(), 0);
        console.log('manual saved', width);
        await page.getByRole('button', { name: 'Vai sinh viên A', exact: true }).click();
        await page.getByRole('button', { name: 'Điểm danh phiên', exact: true }).click();
        await page.getByLabel('Mã xác thực phiên', { exact: true }).fill('expired');
        await page.getByRole('button', { name: 'Lấy vị trí hiện tại', exact: true }).click();
        await page.getByText('Đã lấy vị trí;', { exact: false }).waitFor();
        await page.getByRole('button', { name: 'Xác nhận điểm danh', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'hết hạn' }).waitFor();
        assert.equal(verified.has(104), false);
        await page.getByLabel('Mã xác thực phiên', { exact: true }).fill('signed-current-fixture');
        await page.getByRole('button', { name: 'Xác nhận điểm danh', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByText('Đã xác minh điểm danh', { exact: true }).waitFor();
        assert.equal(checkIns, 2);
        await page.getByRole('button', { name: 'Tải lại phiên', exact: true }).click();
        await page.getByText('Đã xác minh điểm danh', { exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Điểm danh phiên', exact: true }).count(), 0);
        await page.screenshot({ path: `TestResults/attendance/student-${width}.png`, fullPage: true });
        verified.delete(104);
        await page.getByRole('button', { name: 'Tải lại phiên', exact: true }).click();
        await page.getByRole('button', { name: 'Điểm danh phiên', exact: true }).click();
        await page.getByLabel('Mã xác thực phiên', { exact: true }).fill('signed-current-fixture');
        await page.getByRole('button', { name: 'Lấy vị trí hiện tại', exact: true }).click();
        await page.getByText('Đã lấy vị trí;', { exact: false }).waitFor();
        const changes = await page.evaluate(() => window.__ATTENDANCE_CHANGES__);
        slow = true;
        await page.getByRole('button', { name: 'Xác nhận điểm danh', exact: true }).click();
        await page.getByRole('button', { name: 'Vai sinh viên B', exact: true }).evaluate((el) => el.click());
        await page.waitForTimeout(500);
        assert.equal(slowDone, true);
        assert.equal(
            await page.evaluate(() => window.__ATTENDANCE_CHANGES__),
            changes,
            'Old identity response cannot refresh the new user',
        );
        await page.getByRole('button', { name: 'Vai quản lý', exact: true }).click();
        await page.getByRole('button', { name: 'Đóng phiên #1', exact: true }).click();
        await page.getByLabel('Lý do', { exact: true }).fill('Session ended');
        await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
        await page.getByText('Campus · Trực tiếp · Đã đóng', { exact: true }).waitFor();
        assert.equal(closeCalls, 1);
        await page.getByRole('button', { name: 'Hủy phiên #1', exact: true }).click();
        await page.getByLabel('Lý do', { exact: true }).fill('Cancelled with history');
        await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
        await page.getByText('Campus · Trực tiếp · Đã hủy', { exact: true }).waitFor();
        assert.equal(cancelCalls, 1);
        assert.equal(await page.getByRole('button', { name: 'Lấy mã xác thực phiên #1', exact: true }).count(), 0);
        blocked = true;
        await page.getByRole('button', { name: 'Tải lại phiên điểm danh', exact: true }).click();
        await page.getByText('Chưa thể tạo phiên:', { exact: false }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Tạo phiên điểm danh', exact: true }).count(), 0);
        await page.screenshot({ path: `TestResults/attendance/blocked-${width}.png`, fullPage: true });
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await context.close();
    }
    console.log(
        'ATTENDANCE_BROWSER_OK: actual manager/student components at 1440/390; create, expired challenge/no polling, manual conflict/reload, scoped versions, GPS check-in, duplicate guard, verified reload, stale account, close/cancel and deferred-source gate. API traffic isolated.',
    );
} finally {
    await browser?.close();
    server.kill();
}
