import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(
    process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const id = (n) => '11111111-1111-4111-8111-' + String(n).padStart(12, '0');
const period = id(1);
const base =
    process.env.GOVERNANCE_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const browser = await chromium.launch();
const v = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
];
try {
    fs.mkdirSync('TestResults/registration-roles-online', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({
            viewport: { width, height: 1000 },
            serviceWorkers: 'block',
        });
        page.setDefaultTimeout(45000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        let actor = 100,
            registered = true,
            registrationVersion = v[0],
            clubVersion = v[0],
            memberVersion = v[0],
            role = 'MEMBER',
            cancelWrites = 0,
            roleWrites = 0;
        let version = 10,
            writes = 0,
            assignments = [];
        const snapshots = [];
        const groups = () => [
            {
                id: id(2),
                name: 'Chủ nhiệm',
                presetCode: 'CLUB_OWNER',
                protected: true,
                permissionCodes: [],
                assignments: [],
                archived: false,
            },
            {
                id: id(3),
                name: 'Phó chủ nhiệm',
                presetCode: 'VICE_PRESIDENT',
                protected: true,
                permissionCodes: [],
                assignments: [],
                archived: false,
            },
            {
                id: id(4),
                name: 'Content',
                presetCode: 'CONTENT',
                protected: false,
                permissionCodes: ['event.content.write'],
                assignments,
                archived: false,
            },
        ];
        const config = () => ({
            semesterId: period,
            catalogVersion: 'CLUB_GROUPS_V1',
            startsAt: '2026-09-01',
            endsAt: '2027-01-01',
            groups: groups(),
        });
        await page.addInitScript(() =>
            localStorage.setItem(
                'fptux:session:v1',
                JSON.stringify({
                    id: 'isolated-registration-roles',
                    accessToken: 'intercepted-not-a-real-token',
                }),
            ),
        );
        await page.route('**/*', async (route) => {
            const req = route.request(),
                path = new URL(req.url()).pathname;
            if (!path.startsWith('/api/')) return route.continue();
            // Every synthetic identity and mutation is intercepted; none reaches production.
            const send = (body, status = 200) =>
                route.fulfill({
                    status,
                    contentType: 'application/json',
                    body: JSON.stringify(body),
                });
            if (path.includes('/governance/')) {
                const ok = send;
                const paged = (items) => ({
                    clubId: 1,
                    semesterId: period,
                    items,
                    page: 1,
                    pageSize: 20,
                    totalItems: items.length,
                    totalPages: Math.ceil(items.length / 20),
                });
                if (req.method() === 'POST') {
                    assert.equal(actor, 100);
                    assert.ok(req.headers()['idempotency-key']);
                    writes++;
                    const body = req.postDataJSON();
                    if (path.endsWith('/assignment-changes')) {
                        assert.equal(body.expectedVersion, id(version));
                        assert.deepEqual(body.membershipIds, [7]);
                        assignments = [
                            {
                                id: id(8),
                                membershipId: 7,
                                userId: 104,
                                displayName: 'Thành viên QA',
                            },
                        ];
                        version++;
                        return ok({
                            clubId: 1,
                            semesterId: period,
                            version: id(version),
                            revisionId: id(version + 100),
                        });
                    }
                    if (path.endsWith('/report-submissions')) {
                        assert.equal(body.expectedClubVersion, id(5));
                        snapshots.push({
                            id: id(500),
                            number: 1,
                            reason: body.reason,
                            at: '2026-11-05T00:00:00Z',
                            snapshotJson: JSON.stringify({
                                configuration: config(),
                                leadership: {
                                    owners: [
                                        {
                                            userId: 100,
                                            displayName: 'Chủ nhiệm QA',
                                        },
                                    ],
                                    vicePresidents: [],
                                },
                                legacyTreasurers: [
                                    {
                                        membershipId: 9,
                                        userId: 105,
                                        displayName: 'Thủ quỹ cũ',
                                    },
                                ],
                            }),
                        });
                        return ok(
                            {
                                clubId: 1,
                                semesterId: period,
                                id: id(500),
                                status: 'SUBMITTED',
                                permissionsChanged: false,
                            },
                            201,
                        );
                    }
                    throw new Error('Unexpected write ' + path);
                }
                if (path.endsWith('/permission-catalog'))
                    return ok({
                        clubId: 1,
                        actorId: actor,
                        version: 'CLUB_GROUPS_V1',
                        permissions: [
                            { code: 'event.content.write', delegable: true },
                        ],
                        presets: [
                            {
                                code: 'CONTENT',
                                permissionCodes: ['event.content.write'],
                            },
                        ],
                        constraints: {
                            multipleGroupsPerMember: true,
                            maxTreasurers: 2,
                            ownerCanBeTreasurer: false,
                        },
                        capabilities: {
                            canManage: actor === 100,
                            canNominateVice: actor === 100,
                            canTransferOwner: actor === 100,
                        },
                    });
                if (path.endsWith('/terms/' + period))
                    return ok({
                        clubId: 1,
                        actorId: actor,
                        semesterId: period,
                        semesterCode: 'FA26',
                        clubVersion: id(5),
                        initialized: true,
                        termId: id(6),
                        version: id(version),
                        revisionId: id(version + 100),
                        sequence: version,
                        leadershipDigest: 'a'.repeat(64),
                        leadership: {
                            owners: [
                                { userId: 100, displayName: 'Chủ nhiệm QA' },
                            ],
                            vicePresidents: [],
                        },
                        legacyTreasurers: [
                            {
                                membershipId: 9,
                                userId: 105,
                                displayName: 'Thủ quỹ cũ',
                            },
                        ],
                        configuration: config(),
                        capabilities: {
                            canConfigure: actor === 100,
                            canReadHistory: true,
                            canSubmitReport: actor === 100,
                        },
                    });
                if (path.endsWith('/eligible-members'))
                    return ok(
                        paged([
                            {
                                memberId: 7,
                                userId: 104,
                                displayName: 'Thành viên QA',
                            },
                        ]),
                    );
                if (path.endsWith('/report-submissions'))
                    return ok(paged(snapshots));
                if (path.endsWith('/report-submissions/' + id(500)))
                    return ok({
                        clubId: 1,
                        semesterId: period,
                        submission: snapshots[0],
                    });
                if (path.endsWith('/history')) return ok(paged([]));
                if (path.endsWith('/leadership-nominations'))
                    return ok({ ...paged([]), clubVersion: id(5) });
                throw new Error('Unexpected governance route ' + path);
            }
            if (req.method() !== 'GET') {
                assert.ok(req.headers()['idempotency-key']);
                const body = req.postDataJSON();
                if (path === '/api/activities/4/registration/cancel') {
                    cancelWrites++;
                    assert.equal(body.expectedVersion, registrationVersion);
                    registered = false;
                    registrationVersion = v[1];
                    return send({
                        activityId: 4,
                        userId: actor,
                        isRegistered: false,
                        registrationVersion,
                    });
                }
                if (path === '/api/clubs/1/roles/2') {
                    roleWrites++;
                    assert.equal(actor, 100);
                    assert.equal(body.expectedVersion, memberVersion);
                    assert.equal(body.expectedClubVersion, clubVersion);
                    role = body.role;
                    memberVersion = role === 'TREASURER' ? v[1] : v[2];
                    clubVersion = memberVersion;
                    return send({
                        clubId: 1,
                        memberId: 2,
                        role,
                        version: memberVersion,
                        clubVersion,
                    });
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
                    onboarding: {
                        version: 1,
                        completedAt: '2026-01-01T00:00:00Z',
                    },
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
                    registrationVersion: registered
                        ? registrationVersion
                        : null,
                    isEligible: true,
                    nextAction: 'VIEW',
                    startTime: '2027-11-15T05:30:00Z',
                    endTime: '2027-11-15T08:30:00Z',
                });
            if (path === '/api/clubs')
                return send([
                    {
                        id: 1,
                        code: 'TEST',
                        name: 'Isolated Club',
                        campusCode: 'HAN',
                        isActive: true,
                    },
                ]);
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
            if (
                path === '/api/clubs/me/memberships' ||
                path === '/api/clubs/1/memberships'
            )
                return send([]);
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
                            id: period,
                            semesterKey: period,
                            code: 'FA26',
                            semesterId: 'FA26',
                            label: 'Fall 2026',
                            isCurrent: true,
                            editable: true,
                        },
                    ],
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
                            canAssignTreasurer:
                                actor === 100 && role === 'MEMBER',
                            canRevokeTreasurer:
                                actor === 100 && role === 'TREASURER',
                        },
                    ],
                });
            if (path === '/api/clubs/1/members')
                return send({
                    items: [],
                    page: 1,
                    pageSize: 10,
                    totalItems: 0,
                    totalPages: 0,
                });
            if (path === '/api/activities/4/resources')
                return send({
                    items: [],
                    availability: 'AVAILABLE',
                    resourceCapabilities: {
                        supportedKinds: [],
                        canManage: false,
                        canUpload: false,
                    },
                });
            return send({
                items: [],
                page: 1,
                totalPages: 0,
                total: 0,
                totalItems: 0,
            });
        });
        await page.goto(base + '/v2/my-clubs/TEST/members?tab=governance', {
            waitUntil: 'domcontentloaded',
        });
        await page
            .getByRole('button', { name: 'Thêm/chuyển người', exact: true })
            .click();
        await page
            .getByRole('dialog')
            .locator('select')
            .first()
            .selectOption('7');
        await page
            .getByLabel('Lý do', { exact: true })
            .fill('Phân công nội dung');
        await page
            .getByRole('button', { name: 'Xác nhận', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Gỡ Thành viên QA', exact: true })
            .waitFor();
        await page
            .getByRole('button', { name: 'Báo cáo BQL', exact: true })
            .click();
        await page
            .getByRole('button', {
                name: 'Kiểm tra và nộp báo cáo',
                exact: true,
            })
            .click();
        assert.match(await page.getByRole('dialog').innerText(), /Thủ quỹ cũ/);
        await page.getByLabel('Lý do', { exact: true }).fill('Nộp bản chụp');
        await page
            .getByRole('button', { name: 'Nộp bản chụp BQL', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Xem bản chụp #1', exact: true })
            .click();
        await page
            .getByRole('dialog')
            .getByText(/Duty Thủ quỹ cũ/)
            .waitFor();
        await page
            .getByRole('dialog')
            .getByRole('button', { name: /Đóng/ })
            .first()
            .click();

        assert.equal(writes, 2);
        actor = 104;
        await page.goto(base + '/v2/my-clubs/TEST/members?tab=governance', {
            waitUntil: 'domcontentloaded',
        });
        await page
            .getByRole('heading', { name: 'Ban quản lý', exact: true })
            .waitFor();
        assert.equal(
            await page
                .getByRole('button', {
                    name: 'Kiểm tra và nộp báo cáo',
                    exact: true,
                })
                .count(),
            0,
        );
        await page.screenshot({
            path:
                'TestResults/registration-roles-online/governance-' +
                width +
                '.png',
            fullPage: true,
        });
        assert.deepEqual(errors, []);
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth + 1,
            ),
            true,
        );
        await page.close();
        console.log('ONLINE_GOVERNANCE_OK ' + width);
    }
} finally {
    await browser.close();
}
