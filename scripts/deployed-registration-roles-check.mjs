import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.REGISTRATION_ROLES_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
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
        let actor = 104,
            registered = true,
            registrationVersion = v[0],
            clubVersion = v[0],
            memberVersion = v[0],
            role = 'MEMBER',
            cancelWrites = 0,
            roleWrites = 0;
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
            if (path === '/api/clubs/1/workspace-semesters') return send({ items: [] });
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
        await page.goto(base + '/v2/activities/4', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Đã đăng ký', exact: true }).click();
        await page.getByRole('button', { name: 'Giữ đăng ký', exact: true }).click();
        assert.equal(cancelWrites, 0);
        await page.getByRole('button', { name: 'Đã đăng ký', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận hủy đăng ký', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.getByRole('button', { name: 'Đăng ký tham gia', exact: true }).waitFor();
        assert.equal(cancelWrites, 1);
        await page.reload();
        await page.getByRole('button', { name: 'Đăng ký tham gia', exact: true }).waitFor();
        await page.screenshot({
            path: 'TestResults/registration-roles-online/cancellation-' + width + '.png',
            fullPage: true,
        });
        actor = 100;
        await page.goto(base + '/v2/my-clubs/TEST/members', { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Thành viên CLB', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Ban quản lý', exact: true }).waitFor();
        assert.equal(await page.locator('.v2-club-roles').count(), 0);
        assert.equal(await page.getByRole('heading', { name: 'Vai trò trong CLB', exact: true }).count(), 0);
        await page.screenshot({
            path: 'TestResults/registration-roles-online/member-layout-' + width + '.png',
            fullPage: true,
        });
        actor = 104;
        await page.goto(base + '/v2/my-clubs/TEST/members', { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: 'Thành viên CLB', exact: true }).waitFor();
        assert.equal(await page.locator('.v2-club-roles').count(), 0);
        assert.equal(roleWrites, 0);
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.close();
    }
    console.log(
        'DEPLOYED_REGISTRATION_ROLES_OK: actual deployed cancellation confirm/keep/duplicate/reload and member layout without the removed standalone role section at 1440/390. API isolated; no real account acceptance.',
    );
} finally {
    await browser.close();
}
