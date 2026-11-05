import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const id = (n) => '11111111-1111-4111-8111-' + String(n).padStart(12, '0');
const base = process.env.CREDIT_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const browser = await chromium.launch();
const v = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
];
try {
    fs.mkdirSync('TestResults/registration-roles-online', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
        page.setDefaultTimeout(45000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        let actor = 200,
            registered = true,
            registrationVersion = v[0],
            clubVersion = v[0],
            memberVersion = v[0],
            role = 'MEMBER',
            cancelWrites = 0,
            roleWrites = 0;
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
        await page.addInitScript(() =>
            localStorage.setItem(
                'fptux:session:v1',
                JSON.stringify({ id: 'isolated-registration-roles', accessToken: 'intercepted-not-a-real-token' }),
            ),
        );
        await page.route('**/*', async (route) => {
            const req = route.request(),
                path = new URL(req.url()).pathname;
            if (!path.startsWith('/api/')) return route.continue();
            // Every synthetic identity and mutation is intercepted; none reaches production.
            const send = (body, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (
                path.includes('/wallet/me') ||
                path.includes('/points/me/ledger') ||
                path.includes('/rewards') ||
                path === '/api/users/me/cosmetics'
            ) {
                const ok = send,
                    request = req,
                    url = new URL(req.url());
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
                            {
                                date: '2026-11-04',
                                earned: xp[actor],
                                spent: paid[actor],
                                balance: xp[actor] - paid[actor],
                            },
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
            }
            if (req.method() !== 'GET') {
                assert.ok(req.headers()['idempotency-key']);
                const body = req.postDataJSON();
                if (path === '/api/activities/4/registration/cancel') {
                    cancelWrites++;
                    assert.equal(body.expectedVersion, registrationVersion);
                    registered = false;
                    registrationVersion = v[1];
                    return send({ activityId: 4, userId: actor, isRegistered: false, registrationVersion });
                }
                if (path === '/api/clubs/1/roles/2') {
                    roleWrites++;
                    assert.equal(actor, 100);
                    assert.equal(body.expectedVersion, memberVersion);
                    assert.equal(body.expectedClubVersion, clubVersion);
                    role = body.role;
                    memberVersion = role === 'TREASURER' ? v[1] : v[2];
                    clubVersion = memberVersion;
                    return send({ clubId: 1, memberId: 2, role, version: memberVersion, clubVersion });
                }
                throw new Error('Unexpected mutation blocked ' + path);
            }
            if (path === '/api/users/me')
                return send({
                    id: actor,
                    fullName: actor === 100 ? 'Owner' : 'Student A',
                    email: 'roles@example.test',
                    roles: ['CLUB_MEMBER'],
                    isActive: true,
                    isLocked: false,
                    campusCode: 'HAN',
                });
            if (path === '/api/users/me/profile')
                return send({
                    userId: actor,
                    version: 'isolated-profile',
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
                    title: 'Cancellation validation',
                    description: 'Isolated API traffic',
                    status: 'UPCOMING',
                    isInternal: false,
                    isRegistered: registered,
                    canRegister: !registered,
                    canCancelRegistration: registered,
                    registrationVersion: registered ? registrationVersion : null,
                    isEligible: true,
                    nextAction: 'VIEW',
                    startTime: '2027-11-15T05:30:00Z',
                    endTime: '2027-11-15T08:30:00Z',
                });
            if (path === '/api/clubs')
                return send([{ id: 1, code: 'TEST', name: 'Isolated Club', campusCode: 'HAN', isActive: true }]);
            if (path === '/api/clubs/me/access')
                return send([
                    {
                        clubId: 1,
                        clubName: 'Isolated Club',
                        isManager: actor === 100,
                        isApprovedMember: true,
                        isTreasurer: actor === 104 && role === 'TREASURER',
                    },
                ]);
            if (path === '/api/clubs/me/memberships' || path === '/api/clubs/1/memberships') return send([]);
            if (path === '/api/clubs/1')
                return send({
                    id: 1,
                    code: 'TEST',
                    name: 'Isolated Club',
                    category: 'TECHNOLOGY',
                    version: clubVersion,
                    members: [],
                    managers: [],
                    isActive: true,
                });
            if (path === '/api/clubs/1/workspace-semesters')
                return send({
                    items: [
                        {
                            id: id(900),
                            code: 'FA2026',
                            label: 'Fall 2026',
                            semesterId: 'FA2026',
                            isCurrent: true,
                            editable: true,
                            startUtc: '2026-09-01T00:00:00Z',
                            endUtc: '2027-01-01T00:00:00Z',
                        },
                    ],
                });
            if (path === '/api/clubs/1/experience-statistics')
                return send({
                    schemaVersion: 1,
                    clubId: 1,
                    semesterId: 'FA2026',
                    ledgerBasis: 'VERIFIED_NET_LEDGER',
                    ledgerRevision: 'isolated-revision',
                    approvedContributionCount: 2,
                    activities: { uniqueVerifiedParticipantCount: 2 },
                    netPointsByPillar: {
                        Academic: 70,
                        Research: 0,
                        Global: 0,
                        CultureSports: 0,
                        Community: 30,
                        Entrepreneurship: 0,
                        RealWorldWork: 0,
                    },
                    progress: {
                        activities: { actual: 1, target: 2 },
                        sessions: { actual: 2, target: 4 },
                        uniqueParticipants: { actual: 2, target: 3 },
                    },
                    plan: null,
                });
            if (path === '/api/clubs/1/experience-policies')
                return send({ items: [], availability: 'NO_APPROVED_POLICY' });
            if (path === '/api/users/me/contributions')
                return send({
                    items: [
                        {
                            id: id(901),
                            userId: actor,
                            clubId: 1,
                            sourceType: 'CLUB',
                            semesterId: 'FA2026',
                            occurredAt: '2026-11-01T00:00:00Z',
                            title: 'Verified club contribution',
                            status: 'APPROVED',
                            recognitionStatus: 'RECORDED',
                            rawPoints: 100,
                        },
                    ],
                    page: 1,
                    total: 1,
                    totalPages: 1,
                });
            if (path === '/api/clubs/1/roles')
                return send({
                    clubId: 1,
                    version: clubVersion,
                    capabilities: { canManageRoles: actor === 100 },
                    treasurerCount: role === 'TREASURER' ? 1 : 0,
                    treasurerLimit: 2,
                    totalPages: 1,
                    items: [
                        {
                            memberId: 1,
                            userId: 100,
                            displayName: 'Owner',
                            role: 'CLUB_OWNER',
                            version: v[0],
                            canAssignTreasurer: false,
                            canRevokeTreasurer: false,
                        },
                        {
                            memberId: 2,
                            userId: 104,
                            displayName: 'Student A',
                            role,
                            version: memberVersion,
                            canAssignTreasurer: actor === 100 && role === 'MEMBER',
                            canRevokeTreasurer: actor === 100 && role === 'TREASURER',
                        },
                    ],
                });
            if (path === '/api/clubs/1/members')
                return send({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
            if (path === '/api/activities/4/resources')
                return send({
                    items: [],
                    availability: 'AVAILABLE',
                    resourceCapabilities: { supportedKinds: [], canManage: false, canUpload: false },
                });
            return send({ items: [], page: 1, totalPages: 0, total: 0, totalItems: 0 });
        });
        await page.goto(base + '/v2/my-clubs/TEST/gifts', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Mở tất cả', exact: true }).click();
        const card = page
            .locator('article')
            .filter({ has: page.getByRole('heading', { name: 'Open palette', exact: true }) });
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
        await page.screenshot({
            path: `TestResults/registration-roles-online/credit-debt-${width}.png`,
            fullPage: true,
        });

        assert.equal(spends, 1);
        actor = 100;
        await page.goto(base + '/v2/my-clubs/TEST/gifts', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Tạo quà', exact: true }).click();
        await page.getByText('XEM TRƯỚC', { exact: true }).waitFor();
        assert.equal(await page.locator('.v2-create-gift-types input[type="radio"]').count(), 5);
        await page.screenshot({ path: `TestResults/registration-roles-online/gift-editor-${width}.png` });
        await page.getByRole('button', { name: 'Hủy', exact: true }).click();
        assert.equal(creates, 0);
        await page.goto(base + '/v2/my-clubs/TEST/points', { waitUntil: 'domcontentloaded' });
        await page.getByRole('tab', { name: 'Tính điểm CLB', exact: true }).waitFor();
        await page.getByRole('heading', { name: 'Phân bổ XP theo trụ cột', exact: true }).waitFor();
        assert.equal(await page.getByRole('tab').count(), 2);
        await page.screenshot({
            path: `TestResults/registration-roles-online/club-points-${width}.png`,
            fullPage: true,
        });
        await page.getByRole('tab', { name: 'Điểm cá nhân trong CLB', exact: true }).click();
        await page.getByRole('heading', { name: 'Sổ ghi nhận đóng góp trong học kỳ', exact: true }).waitFor();
        assert.equal(
            await page
                .locator('.v2-club-points-stat')
                .filter({ hasText: 'XP của tôi trong học kỳ' })
                .locator('strong')
                .innerText(),
            '100',
        );
        assert.equal(
            await page
                .locator('.v2-club-points-stat')
                .filter({ hasText: 'Credit đổi quà tại CLB' })
                .locator('strong')
                .innerText(),
            '0',
        );
        await page.screenshot({
            path: `TestResults/registration-roles-online/personal-points-${width}.png`,
            fullPage: true,
        });
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.close();
        console.log('ONLINE_CREDIT_OK ' + width);
    }
} finally {
    await browser.close();
}
