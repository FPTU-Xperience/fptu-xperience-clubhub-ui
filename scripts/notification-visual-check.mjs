import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { chromium } from 'playwright';
const server = spawn('node', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4173'], { stdio: 'inherit' });
let browser;
try {
    for (let attempt = 0; attempt < 60; attempt++) {
        try { if ((await fetch('http://127.0.0.1:4173/tests/fixtures/notifications.html')).ok) break; } catch {}
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/notifications', { recursive: true });
    for (const width of [1440, 768, 390, 320]) {
        for (const state of ['populated', 'loading', 'empty', 'error']) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto('http://127.0.0.1:4173/tests/fixtures/notifications.html?state=' + state);
            const panel = page.getByRole('dialog', { name: 'Thông báo' });
            await panel.waitFor();
            const rect = await panel.boundingBox();
            assert.ok(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width + 1 && rect.y + rect.height <= 801, 'Panel stays inside viewport');
            const heading = await panel.locator('h2').evaluate(el => ({ size: parseFloat(getComputedStyle(el).fontSize), transform: getComputedStyle(el).textTransform }));
            assert.equal(heading.size, 18);
            assert.equal(heading.transform, 'none');
            const refresh = panel.locator('.v2-notice-toolbar button');
            assert.ok((await refresh.boundingBox()).height <= 40, 'Refresh stays compact');
            const body = panel.locator('.v2-notice-body');
            assert.equal(await panel.evaluate(el => el.scrollHeight > el.clientHeight + 1), false, 'Panel shell never scrolls');
            if (state === 'populated') {
                assert.equal(await panel.locator('li').count(), 6);
                assert.equal(await body.evaluate(el => el.scrollHeight > el.clientHeight), true, 'Only content scrolls');
                assert.equal(await body.evaluate(el => el.scrollWidth > el.clientWidth + 1), false, 'Content has no horizontal overflow');
                await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
                await panel.getByRole('heading', { name: 'Thông báo' }).isVisible().then(assert.ok);
                await refresh.click();
                assert.equal(await page.locator('body').getAttribute('data-retried'), 'true');
            } else if (state === 'loading') assert.equal(await refresh.isDisabled(), true);
            await page.screenshot({ path: 'TestResults/notifications/' + width + '-' + state + '.png' });
            await panel.getByRole('button', { name: 'Đóng thông báo' }).click();
            assert.equal(await page.locator('body').getAttribute('data-closed'), 'true');
            assert.deepEqual(errors, []);
            await page.close();
        }
    }
    const dark = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await dark.goto('http://127.0.0.1:4173/tests/fixtures/notifications.html?theme=dark');
    await dark.getByRole('dialog').waitFor();
    assert.equal(await dark.getByRole('dialog').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(10, 15, 26)');
    await dark.screenshot({ path: 'TestResults/notifications/dark.png' });
    console.log('NOTIFICATION_VISUAL_OK: 16 viewport/state combinations and dark theme');
} finally { await browser?.close(); server.kill(); }
