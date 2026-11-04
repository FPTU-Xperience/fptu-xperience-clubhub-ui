import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
const { chromium } = await import(
    process.env.PLAYWRIGHT_MODULE || 'playwright'
);
const id = (n) => '11111111-1111-4111-8111-' + String(n).padStart(12, '0');
const period = id(1);
const fixture = `import React,{useState} from 'react';import{createRoot}from'react-dom/client';import{MemoryRouter}from'react-router-dom';import Gov from '/src/pages/v2/club-workspace-page/tabs/members/governance/ClubGovernance.jsx';import{WorkspaceSemesterProvider}from'/src/pages/v2/club-workspace-page/WorkspaceSemesterContext.jsx';import '/src/styles/index.scss';import '/src/pages/v2/V2App.scss';const api={request:async(path,options={})=>{const r=await fetch('/__governance'+path,{...options,headers:{...options.headers,'X-Test-Actor':String(window.__actor)}});const v=await r.json();if(!r.ok)throw Object.assign(new Error(v.message),{status:r.status});return v;}};function App(){const[actor,setActor]=useState(100),[readOnly,setReadOnly]=useState(false);window.__actor=actor;window.__TAB_TEST_AUTH__={user:{id:actor},api,refreshClubAccess:async()=>{}};return <MemoryRouter><WorkspaceSemesterProvider value={{semester:{id:'${period}',code:'FA26',label:'Fall 2026'}}}><main style={{padding:16,maxWidth:1100,margin:'auto'}}><button onClick={()=>setActor(200)}>Đổi tài khoản</button><button onClick={()=>setReadOnly(true)}>Chế độ quan sát</button><Gov clubId={1} readOnly={readOnly}/></main></WorkspaceSemesterProvider></MemoryRouter>}createRoot(document.getElementById('root')).render(<App/>);`;
const server = await createServer({
    server: { host: '127.0.0.1', port: 4189, strictPort: true },
    plugins: [
        {
            name: 'governance-fixture',
            enforce: 'pre',
            resolveId(name) {
                if (name === '/__gov.jsx') return '/__gov-virtual.jsx';
            },
            load(name) {
                if (name === '/__gov-virtual.jsx') return fixture;
                if (
                    name
                        .replaceAll('\\', '/')
                        .endsWith('/context/AuthContext.jsx')
                )
                    return 'export const useAuth=()=>window.__TAB_TEST_AUTH__;';
            },
            configureServer(vite) {
                vite.middlewares.use(async (req, res, next) => {
                    if (req.url !== '/__gov') return next();
                    res.setHeader('Content-Type', 'text/html');
                    res.end(
                        await vite.transformIndexHtml(
                            '/__gov',
                            '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/__gov.jsx"></script></html>',
                        ),
                    );
                });
            },
        },
    ],
});
let browser;
try {
    await server.listen();
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/governance', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({
            viewport: { width, height: 1000 },
        });
        page.setDefaultTimeout(15000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
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
        await page.route('**/__governance/**', async (route) => {
            const req = route.request(),
                url = new URL(req.url()),
                path = url.pathname.replace('/__governance', ''),
                actor = Number(req.headers()['x-test-actor']);
            const ok = (value, status = 200) =>
                route.fulfill({
                    status,
                    contentType: 'application/json',
                    body: JSON.stringify(value),
                });
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
                        owners: [{ userId: 100, displayName: 'Chủ nhiệm QA' }],
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
            throw new Error('Unexpected API ' + path);
        });
        await page.goto('http://127.0.0.1:4189/__gov');
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
        await page
            .getByRole('button', { name: 'Đổi tài khoản', exact: true })
            .click();
        await page
            .getByRole('button', { name: 'Tải lại BQL', exact: true })
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
            path: `TestResults/governance/readonly-${width}.png`,
            fullPage: true,
        });
        assert.equal(
            await page.evaluate(
                () => document.documentElement.scrollWidth > innerWidth + 1,
            ),
            false,
        );
        assert.deepEqual(errors, []);
        await page.close();
        console.log(
            `Governance ${width}: assignment, immutable report preview, legacy duty and actor boundary passed`,
        );
    }
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    await browser?.close();
    await Promise.race([
        server.close(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
}
