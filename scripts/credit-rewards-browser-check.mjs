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
        '4188',
        '--strictPort',
    ],
    { stdio: 'ignore', windowsHide: true },
);
const id = (n) => '11111111-1111-4111-8111-' + String(n).padStart(12, '0');
let browser;
try {
    for (let attempt = 0; attempt < 60; attempt++) {
        try {
            if ((await fetch('http://127.0.0.1:4188/tests/fixtures/credit-rewards.html')).ok) break;
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/credit', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        page.setDefaultTimeout(20000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        let sequence = 10,
            version = 1,
            creates = 0,
            spends = 0,
            malformed = true,
            slow = false,
            walletReads = 0;
        const xp = { 100: 0, 200: 100, 201: 0 },
            paid = { 100: 0, 200: 0, 201: 0 };
        const palette = { background: '#E8F5EF', secondary: '#B7E4C7', accent: '#087F5B', ink: '#123B2A' };
        const grant = { cosmeticId: id(2), issuerClubId: 1, kind: 'COLOR', label: 'Open palette', definition: palette };
        const rewards = [
            {
                id: id(1),
                clubId: 1,
                label: 'Open palette',
                description: 'Real server contract fixture',
                kind: 'COLOR',
                price: 80,
                status: 'PUBLISHED',
                version: id(3),
                availability: 'OPEN',
                grants: [grant],
                opensAt: null,
                closesAt: null,
            },
            {
                id: id(4),
                clubId: 1,
                label: 'Free palette',
                description: '',
                kind: 'COLOR',
                price: 0,
                status: 'PUBLISHED',
                version: id(5),
                availability: 'OPEN',
                grants: [{ ...grant, cosmeticId: id(6), label: 'Free palette' }],
                opensAt: null,
                closesAt: null,
            },
        ];
        const receipts = [],
            keys = [],
            inventory = { 100: [], 200: [], 201: [] };
        const wallet = (actor) => ({
            userId: actor,
            clubId: 1,
            unit: 'CLUB_CREDIT',
            scope: 'LIFETIME',
            policyVersion: 'CLUB_VERIFIED_XP_1_TO_1_V1',
            version: id(version),
            earnedTotal: 100 === actor || 201 === actor ? 0 : 100,
            revokedTotal: actor === 200 ? 100 - xp[actor] : 0,
            spentTotal: paid[actor],
            balance: xp[actor] - paid[actor],
            hasDebt: xp[actor] - paid[actor] < 0,
        });
        await page.route('**/__credit_api/**', async (route) => {
            const request = route.request(),
                url = new URL(request.url()),
                path = url.pathname.replace('/__credit_api', ''),
                actor = Number(request.headers()['x-test-actor']);
            const ok = (body, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (path.endsWith('/wallet/me')) {
                walletReads++;
                return ok(wallet(actor));
            }
            if (path.endsWith('/wallet/me/graph'))
                return ok({
                    ...wallet(actor),
                    timezone: 'Asia/Ho_Chi_Minh',
                    from: '2026-11-04',
                    to: '2026-11-04',
                    points: [
                        { date: '2026-11-04', earned: xp[actor], spent: paid[actor], balance: xp[actor] - paid[actor] },
                    ],
                });
            if (path.endsWith('/points/me/ledger'))
                return ok({
                    userId: actor,
                    clubId: 1,
                    items:
                        actor === 200
                            ? [
                                  {
                                      id: 'XP:1',
                                      type: 'CREDIT',
                                      amount: 100,
                                      sourceType: 'VERIFIED_XP_EFFECT',
                                      sourceId: '1',
                                      at: new Date().toISOString(),
                                  },
                              ]
                            : [],
                    page: 1,
                    pageSize: 20,
                    totalItems: actor === 200 ? 1 : 0,
                    totalPages: actor === 200 ? 1 : 0,
                });
            if (path === '/api/users/me/cosmetics')
                return ok({
                    userId: actor,
                    items: inventory[actor],
                    page: 1,
                    pageSize: 100,
                    totalItems: inventory[actor].length,
                    totalPages: inventory[actor].length ? 1 : 0,
                });
            if (path.endsWith('/rewards') && request.method() === 'GET') {
                const items = rewards.filter(
                    (reward) => url.searchParams.get('manage') === 'true' || reward.status === 'PUBLISHED',
                );
                return ok({
                    clubId: 1,
                    capabilities: { canManage: actor === 100, canRedeem: actor === 200 },
                    items,
                    page: 1,
                    pageSize: 20,
                    totalItems: items.length,
                    totalPages: 1,
                });
            }
            const body = request.postDataJSON(),
                key = request.headers()['idempotency-key'];
            assert.ok(key);
            if (path.endsWith('/rewards')) {
                assert.equal(actor, 100);
                assert.equal(body.kind, 'COLOR');
                creates++;
                const reward = {
                    id: id(sequence++),
                    clubId: 1,
                    label: body.label,
                    description: body.description,
                    kind: body.kind,
                    price: body.price,
                    status: 'DRAFT',
                    availability: 'DRAFT',
                    version: id(sequence++),
                    grants: [{ ...grant, cosmeticId: id(sequence++), label: body.label, definition: body.palette }],
                    opensAt: null,
                    closesAt: null,
                };
                rewards.push(reward);
                return ok(reward, 201);
            }
            const reward = rewards.find((row) => path.includes(row.id));
            assert.ok(reward);
            if (path.endsWith('/publish')) {
                assert.equal(actor, 100);
                assert.equal(body.expectedVersion, reward.version);
                reward.status = 'PUBLISHED';
                reward.availability = body.opensAt ? 'SCHEDULED' : 'OPEN';
                reward.opensAt = body.opensAt;
                reward.closesAt = body.closesAt;
                reward.version = id(sequence++);
                return ok(reward);
            }
            if (path.endsWith('/redeem')) {
                assert.equal(actor, 200);
                assert.deepEqual(Object.keys(body).sort(), ['expectedRewardVersion', 'expectedWalletVersion']);
                keys.push(key);
                let receipt = receipts.find((row) => row.rewardId === reward.id);
                if (!receipt) {
                    assert.equal(body.expectedWalletVersion, id(version));
                    spends++;
                    paid[actor] += reward.price;
                    version++;
                    receipt = {
                        receiptId: id(sequence++),
                        userId: actor,
                        clubId: 1,
                        rewardId: reward.id,
                        rewardLabel: reward.label,
                        walletVersion: id(version),
                        balance: xp[actor] - paid[actor],
                        amount: reward.price,
                        grants: reward.grants.map((row) => row.cosmeticId),
                        unit: 'CLUB_CREDIT',
                    };
                    receipts.push(receipt);
                    inventory[actor].push(
                        ...reward.grants.map((cosmetic) => ({
                            cosmetic,
                            sourceReceiptId: receipt.receiptId,
                            acquiredAt: new Date().toISOString(),
                        })),
                    );
                }
                if (slow) await new Promise((resolve) => setTimeout(resolve, 500));
                const result = malformed ? { ...receipt, userId: 999 } : receipt;
                malformed = false;
                return ok(result);
            }
            throw new Error('Unexpected isolated credit request: ' + request.method() + ' ' + path);
        });
        await page.goto('http://127.0.0.1:4188/tests/fixtures/credit-rewards.html', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Mở tất cả', exact: true }).click();
        await page.getByRole('button', { name: 'Tạo quà', exact: true }).click();
        await page.getByLabel('Tên quà', { exact: true }).fill('Scheduled palette');
        await page.getByLabel('Giá credit', { exact: true }).fill('20');
        await page.getByRole('checkbox', { name: 'Miễn phí', exact: true }).check();
        assert.equal(await page.getByLabel('Giá credit', { exact: true }).inputValue(), '0');
        await page.getByRole('checkbox', { name: 'Miễn phí', exact: true }).uncheck();
        assert.equal(await page.getByLabel('Giá credit', { exact: true }).inputValue(), '20');
        await page.getByText('XEM TRƯỚC', { exact: true }).waitFor();
        await page.screenshot({ path: `TestResults/credit/editor-${width}.png`, fullPage: true });
        await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).evaluate((button) => {
            button.click();
            button.click();
        });
        await page.getByText('Đã lưu thay đổi phần quà.', { exact: true }).waitFor();
        assert.equal(creates, 1);
        await page.getByRole('button', { name: 'Mở/lên lịch đổi', exact: true }).click();
        await page.getByLabel('Mở đổi', { exact: true }).fill('2030-11-04T14:30');
        await page.getByLabel('Đóng đổi', { exact: true }).fill('2030-11-04T16:30');
        await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
        await page.locator('.v2-gift-status').filter({ hasText: 'Chưa mở đổi' }).waitFor();
        assert.equal(rewards.at(-1).opensAt, '2030-11-04T07:30:00.000Z');
        await page.getByRole('button', { name: 'Thành viên A', exact: true }).click();
        await page.getByRole('button', { name: 'Mở tất cả', exact: true }).click();
        await page.getByRole('searchbox', { name: 'Tìm quà', exact: true }).fill('not-a-real-gift');
        await page.getByRole('heading', { name: 'Chưa tìm thấy món quà phù hợp', exact: true }).waitFor();
        assert.equal(await page.locator('article.v2-gift-card').count(), 0);
        await page.getByRole('searchbox', { name: 'Tìm quà', exact: true }).fill('');
        await page.getByRole('combobox', { name: 'Sắp xếp quà', exact: true }).selectOption('descending');
        assert.equal(await page.locator('article.v2-gift-card h3').first().innerText(), 'Open palette');
        const card = page
            .locator('article')
            .filter({ has: page.getByRole('heading', { name: 'Open palette', exact: true }) });
        await card.getByRole('button', { name: 'Xem chi tiết Open palette', exact: true }).click();
        await page.getByRole('dialog', { name: 'Chi tiết quà', exact: true }).waitFor();
        await page.screenshot({ path: `TestResults/credit/detail-${width}.png`, fullPage: true });
        await page.getByRole('button', { name: 'Đóng hộp thoại', exact: true }).click();
        await card.getByRole('button', { name: 'Đổi quà', exact: true }).click();
        await page.getByRole('button', { name: 'Giữ nguyên', exact: true }).click();
        assert.equal(spends, 0);
        await card.getByRole('button', { name: 'Đổi quà', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận đổi quà', exact: true }).evaluate((button) => {
            button.click();
            button.click();
        });
        await page.getByRole('alert').filter({ hasText: 'Máy chủ chưa xác nhận đúng giao dịch' }).waitFor();
        assert.equal(spends, 1);
        await page.getByRole('button', { name: 'Xác nhận đổi quà', exact: true }).click();
        await page.getByText('Đã lưu phiếu đổi quà.', { exact: false }).waitFor();
        await card.getByRole('button', { name: 'Đã sở hữu', exact: true }).waitFor();
        assert.equal(spends, 1);
        assert.equal(keys[0], keys[1]);
        xp[200] = 0;
        version++;
        await page.getByRole('button', { name: 'Tải lại kho quà', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Ví giữ khoản âm' }).waitFor();
        const free = page
            .locator('article')
            .filter({ has: page.getByRole('heading', { name: 'Free palette', exact: true }) });
        assert.equal(await free.getByRole('button', { name: 'Ví đang có khoản âm', exact: true }).isDisabled(), true);
        await page.screenshot({ path: `TestResults/credit/debt-${width}.png`, fullPage: true });
        xp[200] = 100;
        version++;
        await page.getByRole('button', { name: 'Tải lại kho quà', exact: true }).click();
        await free.getByRole('button', { name: 'Nhận miễn phí', exact: true }).click();
        slow = true;
        await page.getByRole('button', { name: 'Xác nhận đổi quà', exact: true }).click();
        await page.getByRole('button', { name: 'Thành viên B', exact: true }).evaluate((button) => button.click());
        await page.getByText('CREDIT CỦA BẠN TẠI CLB', { exact: true }).waitFor();
        await page.waitForTimeout(700);
        assert.equal(await page.getByText('Đã lưu phiếu đổi quà.', { exact: false }).count(), 0);
        assert.equal(inventory[201].length, 0);
        await page.getByRole('button', { name: 'Đổi chế độ quan sát', exact: true }).click();
        await page.getByRole('button', { name: 'Tải lại kho quà', exact: true }).waitFor();
        await page.waitForTimeout(200);
        const beforeReads = walletReads;
        await page.getByRole('button', { name: 'Tải lại kho quà', exact: true }).click();
        await page.waitForTimeout(200);
        assert.equal(walletReads, beforeReads);
        assert.equal(await page.getByRole('heading', { name: 'Ví credit của tôi', exact: true }).count(), 0);
        assert.equal(
            await page
                .getByRole('button', { name: /^(Đổi quà|Nhận miễn phí|Tạo quà|Mở\/lên lịch đổi|Ngừng đổi)$/ })
                .count(),
            0,
        );
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        console.log(
            'CREDIT_REWARDS_BROWSER_OK',
            width,
            'restored groups/search/sort/detail, create/schedule, keep/redeem, malformed receipt/stable retry/no duplicate debit, debt, stale actor and observation mode; API isolated',
        );
        await page.close();
    }
} finally {
    await browser?.close();
    server.kill();
}
