import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.STAFFING_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const browser = await chromium.launch();
fs.mkdirSync('TestResults/staffing-online', { recursive: true });
const ids = { application: '11111111-1111-4111-8111-111111111111', assignment: '22222222-2222-4222-8222-222222222222', completion: '33333333-3333-4333-8333-333333333333', resource: '44444444-4444-4444-8444-444444444444' };
try {
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
        page.setDefaultTimeout(45000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        let actor = 100, version = 1, application = null, assignment = null, completion = null, joins = 0, reviews = 0;
        await page.addInitScript(() => localStorage.setItem('fptux:session:v1', JSON.stringify({ id: 'isolated-staffing-test', accessToken: 'intercepted-not-a-real-token' })));
        await page.route('**/*', async route => {
            const req = route.request(), path = new URL(req.url()).pathname;
            if (!path.startsWith('/api/')) return route.continue();
            // No synthetic identity or mutation is allowed to reach the real API.
            const send = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
            if (path === '/api/users/me') return send({ id: actor, fullName: 'Isolated staffing reviewer', email: 'staffing@example.test', roles: ['CLUB_MEMBER'], isActive: true, isLocked: false, campusCode: 'HAN' });
            if (path === '/api/users/me/profile') return send({ userId: actor, version: 'test', profile: { interests: [] }, personal: {}, academic: {}, editableFields: [], onboarding: { version: 1, completedAt: '2026-01-01T00:00:00Z' } });
            if (path === '/api/v2/activities/4') return send({ id: 4, clubId: 1, clubCode: 'TEST', clubName: 'Isolated Test Club', title: 'Online staffing validation', description: 'Isolated API traffic', status: 'LIVE', isInternal: false, isRegistered: true, canRegister: false, isEligible: true, nextAction: 'VIEW', startTime: '2026-09-15T05:30:00Z', endTime: '2026-12-15T08:30:00Z' });
            if (path === '/api/clubs') return send([{ id: 1, code: 'TEST', name: 'Isolated Test Club', campusCode: 'HAN', isActive: true }]);
            if (path === '/api/clubs/me/access' || path === '/api/clubs/me/memberships') return send([]);
            if (path === '/api/activities/4/resources') return send({ items: [], availability: 'AVAILABLE', resourceCapabilities: { supportedKinds: [], canManage: false, canUpload: false } });
            if (path === '/api/activities/4/staffing') return send({ activityId: 4, version, applicationStatus: 'APPROVED', isPublished: true,
                capabilities: { canReviewApplications: actor === 200, canVerify: actor === 200 },
                actions: [{ id: 2, name: 'Hỗ trợ workshop', verificationMethod: 'WORK_REVIEW' }],
                assignments: assignment ? [{ ...assignment, completions: completion ? [{ ...completion, canVerify: actor === 200 }] : [] }] : [],
                publicAssignments: [{ id: 'host', displayName: 'Host công khai', actionName: 'Điều phối', assignmentKind: 'HOST' }],
                applications: application ? [{ ...application, canReview: actor === 200 && application.status === 'PENDING' }] : [],
                availableEvidenceResources: [{ id: ids.resource, title: 'Kết quả workshop', kind: 'DOCUMENT' }],
                recruitment: { applicationWorkflow: 'APPROVAL_REQUIRED_V1', title: 'Tuyển workshop', status: 'OPEN', visibility: 'PUBLIC', eligibility: 'SCHOOL_STUDENTS', positions: [{ id: 'position', actionRuleId: 2, actionName: 'Hỗ trợ workshop', capacity: 1, filledCount: assignment ? 1 : 0, assignmentKind: 'STAFF', canJoin: !application, myApplication: actor === 100 ? application : null, myAssignmentId: actor === 100 ? assignment?.id : null }] } });
            if (req.method() !== 'GET') {
                assert.ok(req.headers()['idempotency-key']);
                const body = req.postDataJSON(); assert.equal(body.expectedVersion, version);
                if (path.endsWith('/join')) {
                    joins++; application = { id: ids.application, positionId: 'position', userId: 100, displayName: 'Ứng viên online', status: 'PENDING', version: 1 };
                    return send({ id: ids.application, version: ++version });
                }
                if (path.endsWith('/review')) {
                    assert.equal(actor, 200); assert.equal(body.applicationVersion, 1); reviews++;
                    application.status = 'APPROVED'; application.version++;
                    assignment = { id: ids.assignment, userId: 100, displayName: 'Ứng viên online', actionRuleId: 2, actionName: 'Hỗ trợ workshop', assignmentKind: 'STAFF', status: 'ASSIGNED', canSubmit: true };
                    return send({ id: ids.application, version: ++version });
                }
                if (path.endsWith('/completions')) {
                    assert.equal(actor, 100); assert.deepEqual(body.resourceIds, [ids.resource]);
                    completion = { id: ids.completion, version: 1, occurrenceLabel: body.occurrenceLabel, evidence: body.evidence, status: 'PENDING', resources: [{ id: ids.resource, title: 'Kết quả workshop', url: 'https://example.test/evidence.pdf' }] };
                    return send({ id: ids.completion, version: ++version });
                }
                if (path.endsWith('/verify')) { assert.equal(actor, 200); assert.equal(body.completionVersion, 1); completion.status = 'VERIFIED'; return send({ id: ids.completion, version: ++version }); }
                throw new Error('Unexpected mutation (blocked): ' + path);
            }
            return send({ items: [], total: 0, page: 1, totalPages: 0 });
        });
        const open = async tab => {
            await page.goto(base + '/v2/activities/4', { waitUntil: 'domcontentloaded' });
            await page.locator('.v2-activity-profile-identity h1').waitFor();
            await page.getByRole('navigation', { name: 'Nội dung hoạt động' }).getByRole('button', { name: tab, exact: true }).click();
        };
        await open('Tuyển dụng');
        await page.getByRole('button', { name: 'Đăng ký vị trí', exact: true }).click();
        await page.getByText('Đơn của bạn đang chờ duyệt.', { exact: false }).waitFor();
        assert.equal(assignment, null);
        await open('Tuyển dụng'); await page.getByText('Đơn của bạn đang chờ duyệt.', { exact: false }).waitFor();
        actor = 200; await open('Tuyển dụng');
        await page.getByRole('button', { name: 'Duyệt đơn', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
        await page.getByText('Đã duyệt đơn và tạo phân công.', { exact: false }).waitFor();
        actor = 100; await open('Phân công');
        await page.getByRole('heading', { name: 'Host công khai' }).waitFor();
        await page.getByRole('button', { name: 'Nộp minh chứng lượt thực hiện' }).click();
        await page.getByLabel('Mã lượt thực hiện').fill('online-check');
        await page.getByLabel('Tên lượt thực hiện').fill('Online evidence check');
        await page.getByLabel('Minh chứng', { exact: true }).fill('Minh chứng kiểm thử cô lập');
        await page.getByLabel('Kết quả workshop', { exact: true }).check();
        await page.getByRole('button', { name: 'Gửi xác minh', exact: true }).click();
        await page.getByText('Đã nộp minh chứng để xác minh độc lập;', { exact: false }).waitFor();
        actor = 200; await open('Phân công');
        await page.locator('details summary').click();
        await page.getByRole('link', { name: 'Kết quả workshop' }).waitFor();
        await page.getByRole('button', { name: 'Xác minh hoàn thành' }).click();
        await page.getByText('Đã xác minh lượt thực hiện;', { exact: false }).waitFor();
        assert.equal(joins, 1); assert.equal(reviews, 1); assert.equal(completion.status, 'VERIFIED');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `TestResults/staffing-online/flow-${width}.png`, fullPage: true });
        console.log('DEPLOYED_STAFFING_OK', JSON.stringify({ base, width, joins, reviews, status: completion.status, apiTraffic: 'isolated' }));
        await page.close();
    }
} finally { await browser.close(); }
