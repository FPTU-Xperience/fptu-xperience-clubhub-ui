import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright';
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--config', 'tests/fixtures/public-tabs.config.mjs', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: 'inherit' });
let browser;
try {
    for (let attempt = 0; attempt < 60; attempt++) {
        try { if ((await fetch('http://127.0.0.1:4174/tests/fixtures/public-tabs.html')).ok) break; } catch {}
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/public-tabs', { recursive: true });
    for (const workspaceMode of [false, true]) for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors = [];
        page.on('pageerror', error => { errors.push(error.message); console.error('Public tab browser error:', error.message); });
        const counts = { detail: 0, resources: 0, staffing: 0, attendance: 0, sessions: 0, register: 0 };
        let slowNext = false, failNext = false, registered = false, delayedCompleted = false;
        await page.route('**/__tabs_api/**', async route => {
            const request = route.request();
            const path = new URL(request.url()).pathname.replace('/__tabs_api', '');
            const fulfill = body => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
            if (path === '/api/v2/activities/1') {
                const number = ++counts.detail;
                const slow = slowNext; slowNext = false;
                const fail = failNext; failNext = false;
                const account = request.headers()['x-test-account'];
                if (slow) await new Promise(resolve => setTimeout(resolve, 500));
                if (fail) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Temporary failure' }) });
                await fulfill({ id: 1, clubId: 1, clubCode: 'TEST', clubName: 'Test Club', title: 'Snapshot ' + number + ' ' + account,
                    description: 'Current server snapshot', status: 'UPCOMING', isInternal: workspaceMode, isEligible: true,
                    canRegister: !registered, nextAction: registered ? 'VIEW' : 'REGISTER',
                    startTime: '2026-11-13T07:00:00Z', endTime: '2026-11-13T10:00:00Z' });
                if (slow) delayedCompleted = true;
                return;
            }
            if (path.endsWith('/resources')) { counts.resources++; return fulfill({ items: [], availability: 'AVAILABLE', resourceCapabilities: { supportedKinds: ['DOCUMENT', 'MEDIA'], canManage: false, canUpload: false } }); }
            if (path.endsWith('/staffing')) { counts.staffing++; return fulfill({ activityId: 1, version: 1, actions: [], assignments: [], recruitment: null, capabilities: {}, applicationStatus: 'APPROVED', isPublished: true }); }
            if (path.endsWith('/my-attendance')) { counts.attendance++; return fulfill({ items: [], total: 0 }); }
            if (path.endsWith('/sessions')) { counts.sessions++; return fulfill({ items: [], totalPages: 0 }); }
            if (path.endsWith('/participants') && request.method() === 'POST') {
                counts.register++;
                assert.deepEqual(request.postDataJSON(), {});
                assert.ok(request.headers()['idempotency-key']);
                await new Promise(resolve => setTimeout(resolve, 100));
                registered = true;
                return fulfill({ success: true });
            }
            throw new Error('Unexpected test request: ' + path);
        });
        await page.goto('http://127.0.0.1:4174/tests/fixtures/public-tabs.html' + (workspaceMode ? '?workspace=1' : ''));
        const heading = page.locator('.v2-activity-profile-identity h1');
        const nav = page.getByRole('navigation', { name: 'Nội dung hoạt động' });
        const button = page.locator('.v2-activity-profile-actions').getByRole('button', { name: 'Đăng ký tham gia' });
        await heading.filter({ hasText: 'Snapshot 1 student-a' }).waitFor();
        assert.equal(await button.isEnabled(), true);
        assert.equal(await button.count(), 1, 'Registration action lives in the header');
        assert.equal(counts.detail, 1);
        const visit = async (name) => {
            const expected = counts.detail + 1;
            await nav.getByRole('button', { name, exact: true }).click();
            await heading.filter({ hasText: 'Snapshot ' + expected + ' student-a' }).waitFor();
            assert.equal(await nav.getByRole('button', { name, exact: true }).getAttribute('aria-pressed'), 'true');
            assert.equal(counts.detail, expected, 'Exactly one detail refresh per tab transition');
        };
        for (const tab of ['Tài liệu', 'Media', 'Tài liệu', 'Phân công', 'Tuyển dụng', 'Phân công', 'Điểm danh của tôi', 'Tuyển dụng', 'Điểm danh của tôi']) await visit(tab);
        await page.waitForFunction(() => document.body.textContent.includes('Phiên tham gia của tôi'));
        assert.equal(counts.staffing, 4, 'Assignment and recruitment re-entry fetch fresh staffing');
        assert.equal(counts.attendance, 2);
        assert.equal(counts.sessions, 2);
        slowNext = true;
        const slowNumber = counts.detail + 1;
        await nav.getByRole('button', { name: 'Tài liệu', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('.v2-activity-profile-content')?.textContent.includes('Đang'));
        await nav.getByRole('button', { name: 'Media', exact: true }).click();
        await heading.filter({ hasText: 'Snapshot ' + (slowNumber + 1) + ' student-a' }).waitFor();
        while (!delayedCompleted) await new Promise(resolve => setTimeout(resolve, 25));
        assert.equal(await heading.textContent(), 'Snapshot ' + (slowNumber + 1) + ' student-a', 'Slow old tab response cannot overwrite the current snapshot');
        assert.equal(await nav.getByRole('button', { name: 'Media', exact: true }).getAttribute('aria-pressed'), 'true');
        failNext = true;
        await nav.getByRole('button', { name: 'Tài liệu', exact: true }).click();
        await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
        await nav.getByRole('button', { name: 'Tài liệu', exact: true }).waitFor();
        assert.equal(await nav.getByRole('button', { name: 'Tài liệu', exact: true }).getAttribute('aria-pressed'), 'true', 'Retry preserves selected tab');
        const afterRegister = counts.detail + 1;
        await button.evaluate(el => { el.click(); el.click(); });
        await page.getByText('Máy chủ đã xác nhận đăng ký tham gia.', { exact: true }).waitFor();
        await heading.filter({ hasText: 'Snapshot ' + afterRegister + ' student-a' }).waitFor();
        await page.waitForFunction(() => document.querySelector('.v2-student-activity-actions button')?.disabled);
        assert.equal(counts.register, 1, 'Double press only submits once');
        const settled = counts.detail;
        await page.waitForTimeout(300);
        assert.equal(counts.detail, settled, 'No idle polling');
        slowNext = true;
        delayedCompleted = false;
        await nav.getByRole('button', { name: 'Media', exact: true }).click();
        await page.getByRole('button', { name: 'Đổi tài khoản kiểm thử' }).click();
        await heading.filter({ hasText: 'student-b' }).waitFor();
        while (!delayedCompleted) await new Promise(resolve => setTimeout(resolve, 25));
        assert.ok(!(await heading.textContent()).includes('student-a'), 'A different account cannot retain old activity state');
        assert.equal(await page.locator('body').evaluate(el => el.scrollWidth > innerWidth + 1), false, 'No horizontal overflow');
        await page.screenshot({ path: 'TestResults/public-tabs/' + (workspaceMode ? 'internal-' : 'public-') + width + '.png', fullPage: true });
        assert.deepEqual(errors, []);
        await page.close();
    }
    console.log('PUBLIC_ACTIVITY_TABS_OK: all tabs refetch; stale responses ignored; retry and account isolation; registration header/double-submit; mobile');
} finally { await browser?.close(); server.kill(); }
