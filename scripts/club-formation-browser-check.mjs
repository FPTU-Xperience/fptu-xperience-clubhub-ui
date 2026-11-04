import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'vite';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = `import React,{useState} from 'react';import {createRoot} from 'react-dom/client';import {MemoryRouter} from 'react-router-dom';
import Form from '/src/pages/v2/my-clubs-page/ClubRegistrationModal.jsx';import Applications from '/src/pages/v2/my-clubs-page/MyClubFormationApplications.jsx';import ClubPage from '/src/pages/v2/club-workspace-page/tabs/ClubPageTab.jsx';import '/src/styles/index.scss';import '/src/pages/v2/V2App.scss';
const user={id:100,name:'Requester',email:'requester@example.test',campusCode:'HCM'};
const request=async(path,options={})=>{const r=await fetch('/__formation'+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});const body=await r.json();if(!r.ok)throw Object.assign(new Error(body.message),{status:r.status});return body;};
const api={request,getMyClubApplications:()=>request('/api/clubs/applications/me'),createClubApplication:(body,key)=>request('/api/clubs/applications',{method:'POST',body:JSON.stringify(body),headers:{'Idempotency-Key':key}}),updateClubApplication:(id,body,key)=>request('/api/clubs/applications/'+id,{method:'PUT',body:JSON.stringify(body),headers:{'Idempotency-Key':key}}),getClub:id=>request('/api/clubs/'+id),updateClubPublicProfile:(id,body)=>request('/api/clubs/'+id+'/public-profile',{method:'PATCH',body:JSON.stringify(body)})};window.__TAB_TEST_AUTH__={user,api};
function App(){const[open,setOpen]=useState(false),[application,setApplication]=useState(null),[revision,setRevision]=useState(0),[workspace,setWorkspace]=useState(false);return <MemoryRouter><main style={{padding:16,maxWidth:1100,margin:'auto'}}><button onClick={()=>{setApplication(null);setOpen(true)}}>Mở form thành lập</button><button onClick={()=>setWorkspace(true)}>Mở workspace đã duyệt</button>{open&&<Form key={application?.id||'new'} api={api} user={user} application={application} onClose={()=>setOpen(false)} onCreated={()=>{setOpen(false);setRevision(x=>x+1)}}/>}<Applications api={api} userId={100} revision={revision} onRevise={row=>{setApplication(row);setOpen(true)}}/>{workspace&&<ClubPage manager workspace={{clubId:1,name:'Formation Club'}}/>}</main></MemoryRouter>}createRoot(document.getElementById('root')).render(<App/>);`;
const server = await createServer({
    server: { host: '127.0.0.1', port: 4185, strictPort: true },
    plugins: [
        {
            name: 'formation-fixture',
            enforce: 'pre',
            resolveId(id) {
                if (id === '/__formation.jsx') return '/__formation-virtual.jsx';
            },
            load(id) {
                if (id === '/__formation-virtual.jsx') return fixture;
                const path = id.replaceAll('\\', '/');
                if (path.endsWith('/context/AuthContext.jsx'))
                    return 'export const useAuth=()=>window.__TAB_TEST_AUTH__;export const AuthProvider=({children})=>children;';
            },
            configureServer(vite) {
                vite.middlewares.use(async (req, res, next) => {
                    if (req.url === '/__formation-qa') {
                        res.setHeader('Content-Type', 'text/html');
                        res.end(
                            await vite.transformIndexHtml(
                                '/__formation-qa',
                                '<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module" src="/__formation.jsx"></script></html>',
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
const versions = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
];
let browser;
try {
    await server.listen();
    browser = await chromium.launch();
    fs.mkdirSync('TestResults/formation', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 } });
        page.setDefaultTimeout(25000);
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        let application = null,
            submits = 0,
            updates = 0,
            patches = 0,
            firstKey,
            firstBody;
        const club = {
            id: 1,
            code: 'FORM26',
            name: 'Formation Club',
            category: 'TECHNOLOGY',
            description: 'Build together',
            contactEmail: 'requester@example.test',
            contactPhone: '0912345678',
            version: versions[0],
            advisorNeeded: false,
            expectedLocation: '',
            majorEvents: '',
            equipmentNeeds: '',
        };
        await page.route('**/__formation/**', async (route) => {
            const req = route.request(),
                path = new URL(req.url()).pathname.replace('/__formation', '');
            const send = (body, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
            if (req.method() === 'GET') {
                if (path === '/api/clubs/applications/me') return send(application ? [application] : []);
                if (path === '/api/clubs/1') return send(club);
                if (path === '/api/clubs/categories') return send([{ code: 'TECHNOLOGY', name: 'Công nghệ' }]);
                throw new Error('Unexpected read ' + path);
            }
            const body = req.postDataJSON();
            if (path === '/api/clubs/applications' || path === '/api/clubs/applications/1') {
                assert.ok(req.headers()['idempotency-key']);
                assert.equal(body.code, 'FORM26');
                for (const key of [
                    'logoUrl',
                    'expectedLocation',
                    'expectedSchedule',
                    'majorEvents',
                    'equipmentNeeds',
                    'advisorNeeded',
                ])
                    assert.equal(Object.hasOwn(body, key), false);
                if (req.method() === 'POST') {
                    submits++;
                    if (submits === 1) {
                        firstKey = req.headers()['idempotency-key'];
                        firstBody = body;
                        return send({ message: 'Retry after temporary outage' }, 503);
                    }
                    assert.equal(req.headers()['idempotency-key'], firstKey);
                    assert.deepEqual(body, firstBody);
                } else {
                    updates++;
                    assert.equal(body.expectedVersion, versions[1]);
                }
                application = {
                    ...body,
                    id: 1,
                    requesterUserId: 100,
                    requesterName: 'Requester',
                    contactEmail: 'requester@example.test',
                    contactPhone: body.founderPhone,
                    campusCode: 'HCM',
                    status: 'Submitted',
                    version: updates ? versions[2] : versions[0],
                };
                return send(application, req.method() === 'POST' ? 201 : 200);
            }
            if (path === '/api/clubs/1/public-profile') {
                patches++;
                assert.equal(body.expectedVersion, club.version);
                assert.equal(body.expectedLocation, 'Campus Hall');
                assert.equal(body.majorEvents, 'Annual festival');
                assert.equal(body.equipmentNeeds, 'Microphones');
                assert.equal(body.advisorNeeded, true);
                Object.assign(club, body, { version: versions[2] });
                delete club.expectedVersion;
                return send(club);
            }
            throw new Error('Unexpected mutation ' + path);
        });
        await page.goto('http://127.0.0.1:4185/__formation-qa', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Mở form thành lập', exact: true }).click();
        const dialog = page.getByRole('dialog');
        for (const name of [
            'logoUrl',
            'expectedLocation',
            'expectedSchedule',
            'majorEvents',
            'equipmentNeeds',
            'advisorNeeded',
        ])
            assert.equal(await dialog.locator('[name="' + name + '"]').count(), 0);
        const values = {
            name: 'Formation Club',
            code: 'form26',
            purpose: 'Learn together',
            description: 'Build together',
            founderPhone: '0912345678',
            founderOrganization: 'SE',
            memberOrganization: 'SE',
            mainActivities: 'Workshops',
            activityFrequencyCount: '2',
        };
        for (const [name, value] of Object.entries(values)) await dialog.locator('[name="' + name + '"]').fill(value);
        await dialog.locator('[name="category"]').selectOption('TECHNOLOGY');
        for (const check of await dialog.locator('input[type=checkbox]').all()) await check.check();
        await page.getByRole('button', { name: 'Gửi đơn thành lập', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'temporary outage' }).waitFor();
        await page.getByRole('button', { name: 'Gửi đơn thành lập', exact: true }).evaluate((el) => {
            el.click();
            el.click();
        });
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        assert.equal(submits, 2);
        await page.getByText('Chờ xét duyệt · HCM', { exact: false }).waitFor();
        await page.reload();
        await page.getByText('Chờ xét duyệt · HCM', { exact: false }).waitFor();
        application.status = 'NeedsRevision';
        application.version = versions[1];
        application.reviewNote = 'Clarify activities';
        await page.getByRole('button', { name: 'Tải lại đơn thành lập', exact: true }).click();
        await page.getByRole('button', { name: 'Bổ sung và gửi lại', exact: true }).click();
        assert.equal(await page.locator('[name="code"]').inputValue(), 'FORM26');
        await page.locator('[name="mainActivities"]').fill('Workshops and mentoring');
        for (const check of await dialog.locator('input[type=checkbox]').all()) await check.check();
        await page.getByRole('button', { name: 'Gửi đơn thành lập', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(updates, 1);
        application.status = 'Approved';
        application.approvedManagerName = 'Selected President';
        await page.getByRole('button', { name: 'Tải lại đơn thành lập', exact: true }).click();
        await page.getByRole('link', { name: 'Vào Club Workspace', exact: true }).waitFor();
        await page.getByRole('button', { name: 'Mở workspace đã duyệt', exact: true }).click();
        await page.getByRole('button', { name: 'Chỉnh sửa thông tin CLB', exact: true }).click();
        await page.getByRole('tab', { name: 'Thông tin bổ sung', exact: true }).click();
        for (const [label, value] of [
            ['Địa điểm sinh hoạt', 'Campus Hall'],
            ['Sự kiện lớn dự kiến', 'Annual festival'],
            ['Thiết bị cần thiết', 'Microphones'],
        ])
            await page.getByLabel(label, { exact: true }).fill(value);
        await page.getByLabel('Nhu cầu cố vấn', { exact: true }).selectOption('true');
        await page.getByRole('button', { name: 'Xem trước', exact: true }).click();
        await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
        await page.getByText('Đã cập nhật thông tin trang CLB.', { exact: true }).waitFor();
        assert.equal(patches, 1);
        await page.reload();
        await page.getByRole('button', { name: 'Mở workspace đã duyệt', exact: true }).click();
        await page.getByText('Thiết bị: Microphones', { exact: true }).waitFor();
        await page.screenshot({ path: 'TestResults/formation/workspace-' + width + '.png', fullPage: true });
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        await page.close();
    }
    console.log(
        'FORMATION_BROWSER_OK: required fields plus Viết tắt, no optional submission, retry key/duplicate guard, persisted queue/revision/resubmit, approved workspace supplemental persistence at 1440/390. API isolated.',
    );
} finally {
    await browser?.close();
    await server.close();
}
