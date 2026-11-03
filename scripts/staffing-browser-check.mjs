import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--config', 'tests/fixtures/public-tabs.config.mjs', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { stdio: 'inherit', windowsHide: true });
let browser;
const ids = { application: '11111111-1111-4111-8111-111111111111', assignment: '22222222-2222-4222-8222-222222222222', completion: '33333333-3333-4333-8333-333333333333', resource: '44444444-4444-4444-8444-444444444444' };
try {
    for (let i = 0; i < 60; i++) {
        try { if ((await fetch('http://127.0.0.1:4176/tests/fixtures/staffing.html')).ok) break; } catch {}
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/staffing', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        page.setDefaultTimeout(60000);
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        let version = 1, application = null, assignment = null, completion = null, joins = 0, reviews = 0, submits = 0;
        let workflow = 'APPROVAL_REQUIRED_V1', failReview = false;
        await page.route('**/__staffing_api/**', async route => {
            const req = route.request(), path = new URL(req.url()).pathname;
            const actor = await page.evaluate(() => window.__TAB_TEST_AUTH__.user.id);
            const send = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (req.method() === 'GET') return send({ activityId: 1, version, applicationStatus: 'APPROVED', isPublished: true,
                capabilities: { canReviewApplications: actor === 200, canVerify: actor === 200 },
                actions: [{ id: 2, name: 'Hỗ trợ workshop', verificationMethod: 'WORK_REVIEW' }],
                assignments: assignment ? [{ ...assignment, completions: completion ? [{ ...completion, canVerify: actor === 200 }] : [] }] : [],
                publicAssignments: [{ id: 'public-host', displayName: 'Host công khai', actionName: 'Điều phối', assignmentKind: 'HOST' }],
                applications: application ? [{ ...application, canReview: actor === 200 && application.status === 'PENDING' }] : [],
                availableEvidenceResources: [{ id: ids.resource, title: 'Kết quả workshop', kind: 'DOCUMENT' }],
                recruitment: { applicationWorkflow: workflow, title: 'Tuyển workshop', status: 'OPEN', visibility: 'PUBLIC', eligibility: 'SCHOOL_STUDENTS', positions: [
                    { id: 'position', actionRuleId: 2, actionName: 'Hỗ trợ workshop', capacity: 1, filledCount: assignment ? 1 : 0, assignmentKind: 'STAFF', canJoin: !application,
                        myApplication: actor === 100 ? application : null, myAssignmentId: actor === 100 ? assignment?.id : null },
                ] } });
            assert.ok(req.headers()['idempotency-key']);
            const body = req.postDataJSON(); assert.equal(body.expectedVersion, version);
            if (path.endsWith('/join')) {
                joins++; application = { id: ids.application, positionId: 'position', userId: 100, displayName: 'Sinh viên đăng ký', status: 'PENDING', version: 1 };
                return send({ id: ids.application, version: ++version, status: 'PENDING' });
            }
            if (path.endsWith('/review')) {
                assert.equal(actor, 200); assert.equal(body.applicationVersion, 1);
                if (failReview) { failReview = false; return send({ message: 'Phiên bản đã thay đổi. Tải lại để duyệt.' }, 409); }
                reviews++; application = { ...application, status: body.decision, version: 2 };
                if (body.decision === 'APPROVED') assignment = { id: ids.assignment, userId: 100, displayName: 'Sinh viên đăng ký', actionRuleId: 2, actionName: 'Hỗ trợ workshop', assignmentKind: 'STAFF', status: 'ASSIGNED', canSubmit: true };
                return send({ id: ids.application, version: ++version });
            }
            if (path.endsWith('/completions')) {
                submits++; assert.deepEqual(body.resourceIds, [ids.resource]);
                completion = { id: ids.completion, version: 1, occurrenceLabel: body.occurrenceLabel, evidence: body.evidence, status: 'PENDING', resources: [{ id: ids.resource, title: 'Kết quả workshop', url: 'https://example.test/evidence.pdf' }] };
                return send({ id: ids.completion, version: ++version });
            }
            if (path.endsWith('/verify')) { assert.equal(actor, 200); assert.equal(body.completionVersion, 1); completion.status = 'VERIFIED'; return send({ id: ids.completion, version: ++version }); }
            throw new Error('Unexpected staffing mutation: ' + path);
        });
        await page.goto('http://127.0.0.1:4176/tests/fixtures/staffing.html', { waitUntil: 'domcontentloaded', timeout: 120000 });
        const join = page.getByRole('button', { name: 'Đăng ký vị trí', exact: true });
        await join.evaluate(el => { el.click(); el.click(); });
        await page.getByText('Đơn của bạn đang chờ duyệt.', { exact: false }).waitFor();
        assert.equal(joins, 1); assert.equal(assignment, null);
        await page.reload(); await page.getByText('Đơn của bạn đang chờ duyệt.', { exact: false }).waitFor();
        await page.getByRole('button', { name: 'Đổi vai kiểm thử' }).click();
        await page.getByRole('button', { name: 'Duyệt đơn', exact: true }).click();
        failReview = true;
        await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
        await page.getByRole('alert').filter({ hasText: 'Phiên bản đã thay đổi' }).waitFor();
        await page.getByRole('button', { name: 'Tải lại dữ liệu', exact: true }).click();
        await page.getByRole('button', { name: 'Duyệt đơn', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận quyết định' }).click();
        await page.getByText('Đã duyệt đơn và tạo phân công.', { exact: false }).waitFor();
        assert.equal(reviews, 1);
        await page.getByRole('button', { name: 'Đổi vai kiểm thử' }).click();
        await page.getByRole('button', { name: 'Đổi nội dung kiểm thử' }).click();
        await page.getByRole('heading', { name: 'Host công khai' }).waitFor();
        await page.getByRole('button', { name: 'Nộp minh chứng lượt thực hiện' }).click();
        await page.getByLabel('Mã lượt thực hiện').fill('buoi-1');
        await page.getByLabel('Tên lượt thực hiện').fill('Workshop 1');
        await page.getByLabel('Minh chứng', { exact: true }).fill('Đã hỗ trợ workshop');
        await page.getByLabel('Kết quả workshop', { exact: true }).check();
        await page.getByRole('button', { name: 'Gửi xác minh', exact: true }).click();
        await page.getByText('Đã nộp minh chứng để xác minh độc lập;', { exact: false }).waitFor();
        assert.equal(submits, 1); assert.equal(completion.status, 'PENDING');
        await page.locator('details summary').click();
        await page.getByRole('link', { name: 'Kết quả workshop' }).waitFor();
        await page.getByRole('button', { name: 'Đổi vai kiểm thử' }).click();
        await page.locator('details summary').click();
        await page.getByRole('button', { name: 'Xác minh hoàn thành' }).click();
        await page.getByText('Đã xác minh lượt thực hiện;', { exact: false }).waitFor();
        assert.equal(completion.status, 'VERIFIED');
        await page.screenshot({ path: `TestResults/staffing/flow-${width}.png`, fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.deepEqual(errors, []);
        // Older servers must not silently invoke the immediate-assignment join contract.
        workflow = undefined; application = null; assignment = null;
        await page.reload(); await page.getByRole('button', { name: 'Đăng ký vị trí', exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Đăng ký vị trí', exact: true }).isDisabled(), true);
        await page.close();
    }
    console.log('Staffing browser checks passed: pending/reload, review conflict/retry, approval, evidence resources, verification, public projection, old-server gate at 1440/390px. API traffic isolated.');
} finally { await browser?.close(); server.kill(); }
