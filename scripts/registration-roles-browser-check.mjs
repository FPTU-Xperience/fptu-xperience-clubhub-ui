import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = `import React,{useState,useEffect} from 'react';import{createRoot}from'react-dom/client';import Actions from '/src/components/v2/activity-detail/StudentActivityActions.jsx';import Roles from '/src/pages/v2/club-workspace-page/tabs/members/ClubRoleManagement.jsx';import '/src/styles/index.scss';import '/src/pages/v2/V2App.scss';
const api={request:async(path,options={})=>{const r=await fetch('/__roles'+path,{...options,headers:{...options.headers,'X-Test-Actor':String(window.__qaActor)}});const value=await r.json();if(!r.ok)throw Object.assign(new Error(value.message),{status:r.status});return value;}};
function App(){const[actor,setActor]=useState(104),[data,setData]=useState(null),[revision,setRevision]=useState(0),[schedule,setSchedule]=useState(0);window.__qaActor=actor;window.__TAB_TEST_AUTH__={user:{id:actor},api,refreshClubAccess:async()=>{window.__ROLE_REFRESHES__=(window.__ROLE_REFRESHES__||0)+1;}};useEffect(()=>{let active=true;setData(null);Promise.all([api.request('/activity'),api.request('/schedule')]).then(([a,s])=>{if(active){setData(a);setSchedule(s.total)}});return()=>{active=false}},[actor,revision]);return <main style={{padding:16,maxWidth:1100,margin:'auto'}}><button onClick={()=>setActor(100)}>Vai chủ nhiệm</button><button onClick={()=>setActor(104)}>Vai thành viên</button><button onClick={()=>setActor(105)}>Đổi tài khoản</button><p>Số sự kiện đã đăng ký: {schedule}</p>{data&&<Actions key={"activity:"+actor} api={api} activity={data} onChanged={()=>setRevision(x=>x+1)}/>}<Roles key={"roles:"+actor} clubId={1}/></main>}createRoot(document.getElementById('root')).render(<App/>);`;
const server = await createServer({
    server: { host: '127.0.0.1', port: 4187, strictPort: true },
    plugins: [
        {
            name: 'registration-role-fixture',
            enforce: 'pre',
            resolveId(id) {
                if (id === '/__qa.jsx') return '/__qa-virtual.jsx';
            },
            load(id) {
                if (id === '/__qa-virtual.jsx') return fixture;
                if (id.replaceAll('\\', '/').endsWith('/context/AuthContext.jsx'))
                    return 'export const useAuth=()=>window.__TAB_TEST_AUTH__;';
            },
            configureServer(vite) {
                vite.middlewares.use(async (req, res, next) => {
                    if (req.url === '/__qa') {
                        res.setHeader('Content-Type', 'text/html');
                        res.end(
                            await vite.transformIndexHtml(
                                '/__qa',
                                '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/__qa.jsx"></script></html>',
                            ),
                        );
                        return;
                    }
                    next();
                });
            },
        },
    ],
});
const v = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
];
let browser;
try {
    await server.listen();
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/registration-roles', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        page.setDefaultTimeout(25000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        let registered = true,
            registrationVersion = v[0],
            clubVersion = v[0],
            memberVersion = v[0],
            role = 'MEMBER',
            cancelWrites = 0,
            registerWrites = 0,
            roleWrites = 0,
            firstCancelKey,
            conflict = true,
            slow = false,
            completedSlow = false;
        await page.route('**/__roles/**', async (route) => {
            const req = route.request(),
                url = new URL(req.url()),
                path = url.pathname.replace('/__roles', ''),
                actor = Number(req.headers()['x-test-actor']);
            const send = (body, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (req.method() === 'GET') {
                if (path === '/activity')
                    return send({
                        id: 1,
                        title: 'Sự kiện kiểm thử',
                        version: v[0],
                        isRegistered: actor === 104 && registered,
                        canRegister: actor === 104 && !registered,
                        canCancelRegistration: actor === 104 && registered,
                        registrationVersion: actor === 104 && registered ? registrationVersion : null,
                    });
                if (path === '/schedule') return send({ total: actor === 104 && registered ? 1 : 0 });
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
                throw new Error('Unexpected read ' + path);
            }
            assert.ok(req.headers()['idempotency-key']);
            const body = req.postDataJSON();
            if (path.endsWith('/registration/cancel')) {
                cancelWrites++;
                assert.equal(body.expectedVersion, registrationVersion);
                if (cancelWrites === 1) {
                    firstCancelKey = req.headers()['idempotency-key'];
                    return send({ message: 'Temporary cancellation failure' }, 503);
                }
                if (cancelWrites === 2) assert.equal(req.headers()['idempotency-key'], firstCancelKey);
                if (slow) {
                    await new Promise((r) => setTimeout(r, 400));
                    completedSlow = true;
                }
                registered = false;
                registrationVersion = v[1];
                return send({ activityId: 1, userId: actor, isRegistered: false, registrationVersion });
            }
            if (path.endsWith('/participants')) {
                registerWrites++;
                registered = true;
                registrationVersion = v[2];
                return send({ success: true });
            }
            if (path === '/api/clubs/1/roles/2') {
                roleWrites++;
                assert.equal(actor, 100);
                assert.equal(body.expectedVersion, memberVersion);
                assert.equal(body.expectedClubVersion, clubVersion);
                assert.ok(body.reason);
                if (conflict) {
                    conflict = false;
                    clubVersion = v[1];
                    return send({ message: 'Reload roles' }, 409);
                }
                role = body.role;
                memberVersion = role === 'TREASURER' ? v[2] : v[3];
                clubVersion = role === 'TREASURER' ? v[2] : v[3];
                return send({ clubId: 1, memberId: 2, role, version: memberVersion, clubVersion });
            }
            throw new Error('Unexpected mutation ' + path);
        });
        await page.goto('http://127.0.0.1:4187/__qa', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Đã đăng ký', exact: true }).click();
        await page.getByRole('button', { name: 'Giữ đăng ký', exact: true }).click();
        assert.equal(cancelWrites, 0);
        await page.getByRole('button', { name: 'Đã đăng ký', exact: true }).click();
        await page.getByRole('button', { name: 'Xác nhận hủy đăng ký', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Temporary cancellation failure' }).waitFor();
        assert.equal(registered, true);
        await page.getByRole('button', { name: 'Xác nhận hủy đăng ký', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.getByText('Số sự kiện đã đăng ký: 0', { exact: true }).waitFor();
        assert.equal(cancelWrites, 2);
        await page.reload();
        await page.getByRole('button', { name: 'Đăng ký tham gia', exact: true }).click();
        await page.getByRole('button', { name: 'Đã đăng ký', exact: true }).waitFor();
        assert.equal(registerWrites, 1);
        assert.equal(await page.getByRole('button', { name: 'Gán thủ quỹ · Student A', exact: true }).count(), 0);
        await page.getByRole('button', { name: 'Vai chủ nhiệm', exact: true }).click();
        await page.getByRole('button', { name: 'Gán thủ quỹ · Student A', exact: true }).click();
        await page.getByLabel('Lý do thay đổi vai trò', { exact: true }).fill('Assigned finance responsibility');
        await page.getByRole('button', { name: 'Xác nhận vai trò', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'đã thay đổi' }).waitFor();
        await page.getByRole('button', { name: 'Tải lại dữ liệu vai trò', exact: true }).click();
        await page.getByRole('button', { name: 'Gán thủ quỹ · Student A', exact: true }).click();
        await page.getByLabel('Lý do thay đổi vai trò', { exact: true }).fill('Assigned finance responsibility');
        await page.getByRole('button', { name: 'Xác nhận vai trò', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByRole('button', { name: 'Thu hồi thủ quỹ · Student A', exact: true }).waitFor();
        assert.equal(roleWrites, 2);
        assert.equal(await page.getByRole('button', { name: /thủ quỹ · Owner/ }).count(), 0);
        await page.getByRole('button', { name: 'Thu hồi thủ quỹ · Student A', exact: true }).click();
        await page.getByLabel('Lý do thay đổi vai trò', { exact: true }).fill('Revoked finance responsibility');
        await page.getByRole('button', { name: 'Xác nhận vai trò', exact: true }).click();
        await page.getByRole('button', { name: 'Gán thủ quỹ · Student A', exact: true }).waitFor();
        assert.equal(roleWrites, 3);
        assert.equal(await page.evaluate(() => window.__ROLE_REFRESHES__), 2);
        await page.screenshot({ path: 'TestResults/registration-roles/roles-' + width + '.png', fullPage: true });
        await page.getByRole('button', { name: 'Vai thành viên', exact: true }).click();
        await page.getByRole('button', { name: 'Đã đăng ký', exact: true }).click();
        slow = true;
        await page.getByRole('button', { name: 'Xác nhận hủy đăng ký', exact: true }).click();
        await page.getByRole('button', { name: 'Đổi tài khoản', exact: true }).evaluate((el) => el.click());
        await page.waitForTimeout(500);
        assert.equal(completedSlow, true);
        assert.equal(await page.getByText('Đã hủy đăng ký sự kiện.', { exact: true }).count(), 0);
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.close();
    }
    console.log(
        'REGISTRATION_ROLES_BROWSER_OK: confirmation keep/failure/retry/duplicate guard/reload/register again/stale account; scoped read-only role list, assign/revoke, conflict reload, owner protection and access refresh at 1440/390. API isolated.',
    );
} finally {
    await browser?.close();
    await server.close();
}
