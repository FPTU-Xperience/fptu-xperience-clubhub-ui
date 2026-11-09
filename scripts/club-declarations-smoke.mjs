// Browser-only fixtures: exercises the real page and ApiService without creating live records.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
const directory = path.join(os.tmpdir(), 'clubhub-club-declarations-qa');
await fs.mkdir(directory, { recursive: true });
const entry = `import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import{ClubWorkspaceView}from'/src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx';import{ThemeProvider}from'/src/context/ThemeContext.jsx';import api from '/src/services/api.js';import '/src/styles/index.scss';import '/src/pages/v2/V2App.scss';
const mode=new URLSearchParams(location.search).get('qa');history.replaceState(null,'','/v2/my-clubs/C7/student-declarations'+location.search);window.__calls=[];localStorage.setItem('accessToken','fixture');
const user={id:1,name:'BQL kiểm thử',roles:['STUDENT']};const workspace={clubId:'7',clubCode:'C7',name:'CLB Công nghệ',role:['member','delegated','vice'].includes(mode)?'MEMBER':'MANAGER',semesters:[{id:'FALL2026',code:'FALL2026',reportPeriod:'FALL2026',label:'Fall 2026',isCurrent:true}],...(mode==='vice'?{displayRole:'VICE_PRESIDENT'}:{}),...(mode==='delegated'?{studentDeclarationPermissions:['club.declarations.process']}:{})};window.__clubAuth={user,api,logout:()=>{},clubAccess:[{clubId:7,isManager:mode!=='member'}]};
const current={id:'11111111-1111-1111-1111-111111111111',clubId:7,userId:8,title:'Giải lập trình sinh viên',status:'SUBMITTED',semesterId:'FALL2026',occurredAt:'2026-10-20T00:00:00Z',evidenceRefs:['eeeeeeee-1111-2222-3333-444444444444'],message:'Bảng kết quả và giấy chứng nhận',version:'11111111-1111-1111-1111-111111111111'};
const legacy={id:'22222222-2222-2222-2222-222222222222',clubId:7,studentId:9,studentName:'Lê Bình',studentEmail:'binh@example.test',title:'Chứng chỉ học thuật',status:'Approved',startDate:'2026-09-10',evidenceUrl:'https://example.test/proof',rawPoints:5};
window.fetch=async(url,options={})=>{const parsed=new URL(url,location.origin),p=parsed.pathname;window.__calls.push({path:p,query:parsed.search,method:options.method||'GET'});const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'Content-Type':'application/json'}});
if(p==='/api/v1/student-affairs/declarations/')return mode==='denied'?json({message:'Forbidden'},403):mode==='error'?json({message:'Lỗi nguồn trải nghiệm'},503):json({items:mode==='empty'?[]:[{...current,id:'99999999-1111-2222-3333-444444444444',clubId:8,title:'Không được lộ CLB khác'},current,legacy],totalItems:mode==='empty'?0:3});
if(p==='/api/v1/declarations/'+current.id)return json({contribution:mode==='mismatch'?{...current,clubId:8}:current,decisions:[]});
if(p.includes('/api/contributions/evidence/'))return new Response('%PDF-1.4 fixture',{headers:{'Content-Type':'application/pdf'}});
return json([]);};
const h=React.createElement;createRoot(document.getElementById('root')).render(h(ThemeProvider,null,h(BrowserRouter,null,h('div',{className:'v2-app v2-app--workspace'},h(ClubWorkspaceView,{api,viewer:user,sessionKey:'1',result:{status:'populated',clubId:'7',workspace,data:[workspace]}})))));`;
const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/__personal-entry.js"></script></body></html>';
const server = await createServer({
    server: { host: '127.0.0.1', port: 5194, strictPort: true, open: false },
    plugins: [
        {
            name: 'personal-fixture',
            enforce: 'pre',
            resolveId(id) {
                if (id === '/__personal-entry.js') return '\0personal-entry.js';
            },
            load(id) {
                if (id.replaceAll('\\', '/').endsWith('/src/context/AuthContext.jsx'))
                    return 'export const useAuth=()=>window.__clubAuth;export const AuthProvider=({children})=>children;';
                if (id === '\0personal-entry.js') return entry;
            },
            configureServer(vite) {
                vite.middlewares.use(async (req, res, next) => {
                    if (req.url?.startsWith('/__personal-entry.js')) {
                        res.setHeader('Content-Type', 'application/javascript');
                        res.end((await vite.transformRequest('/__personal-entry.js'))?.code);
                        return;
                    }
                    if (!req.url?.startsWith('/__personal?')) return next();
                    res.setHeader('Content-Type', 'text/html');
                    res.end(await vite.transformIndexHtml('/__personal', html));
                });
            },
        },
    ],
});
let chrome, ws;
try {
    await server.listen();
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'clubhub-declarations-chrome-'));
    chrome = spawn(
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        [
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            `--user-data-dir=${profile}`,
            '--remote-debugging-port=9345',
            'about:blank',
        ],
        { stdio: 'ignore', windowsHide: true },
    );
    let targets;
    for (let n = 0; n < 100; n++) {
        try {
            targets = await (await fetch('http://127.0.0.1:9345/json')).json();
            break;
        } catch {
            await new Promise((r) => setTimeout(r, 100));
        }
    }
    ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let sequence = 0;
    const pending = new Map(),
        errors = [];
    ws.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.id) {
            const p = pending.get(data.id);
            pending.delete(data.id);
            data.error ? p.reject(data.error) : p.resolve(data.result);
        } else if (data.method === 'Runtime.exceptionThrown')
            errors.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text);
    });
    const call = (method, params = {}) =>
        new Promise((resolve, reject) => {
            const id = ++sequence;
            pending.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    const evaluate = async (expression) => {
        const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (result.exceptionDetails)
            throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result?.value;
    };
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (expression) => {
        for (let n = 0; n < 100; n++) {
            if (await evaluate(expression)) return;
            await delay(100);
        }
        throw Error('Timed out: ' + expression + '\n' + (await evaluate('document.body.textContent')));
    };
    const click = async (label) => {
        await evaluate(
            `(()=>{const e=[...document.querySelectorAll('main button')].find(e=>e.textContent.trim()===${JSON.stringify(label)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(label)});e.click()})()`,
        );
        await delay(100);
    };
    const fill = async (label, value) => {
        await evaluate(
            `(()=>{const e=[...document.querySelectorAll('main label')].find(e=>e.querySelector('span')?.textContent===${JSON.stringify(label)})?.querySelector('input,textarea,select');if(!e)throw Error('Missing field '+${JSON.stringify(label)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`,
        );
        await delay(60);
    };
    const expect = async (value) =>
        assert.ok((await evaluate('document.querySelector("main").textContent')).includes(value), value);
    const shot = async (name) => {
        const r = await call('Page.captureScreenshot', { format: 'png' });
        await fs.writeFile(path.join(directory, name + '.png'), Buffer.from(r.data, 'base64'));
    };
    const open = async (mode = 'normal') => {
        errors.length = 0;
        await call('Page.navigate', { url: `http://127.0.0.1:5194/__personal?qa=${mode}` });
        await waitFor(`!!document.querySelector('.v2-workspace-main')`);
        await delay(400);
    };
    const choose = async (label, value) => {
        await evaluate(
            `(()=>{const e=[...document.querySelectorAll('main label')].find(e=>e.textContent.startsWith(${JSON.stringify(label)})).querySelector('select,input');const proto=e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`,
        );
        await delay(100);
    };
    const responsive = async (name) => {
        for (const width of [1440, 768, 414, 375, 320]) {
            await call('Emulation.setDeviceMetricsOverride', {
                width,
                height: 1000,
                deviceScaleFactor: 1,
                mobile: false,
            });
            await delay(100);
            assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `${name} overflow ${width}`);
            if ([1440, 375].includes(width)) await shot(`${name}-${width}`);
        }
    };
    await call('Runtime.enable');
    await call('Page.enable');
    await call('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
    });
    await open();
    await expect('Giải lập trình sinh viên');
    await expect('Chứng chỉ học thuật');
    assert.equal(await evaluate(`!!document.querySelector('aside a[href$="/student-declarations"]')`), true);
    assert.equal(
        await evaluate(`document.querySelector('main').textContent.includes('Không được lộ CLB khác')`),
        false,
    );
    await responsive('club-declarations-list');
    await click('Phân quyền');
    await waitFor(`!!document.querySelector('.club-declaration-permissions')`);
    assert.equal(
        await evaluate(`document.querySelectorAll('.club-declaration-permissions input:checked:disabled').length`),
        2,
    );
    await evaluate(`document.querySelector('input[aria-label="Thư ký: Xử lý trải nghiệm tự khai trong CLB"]').click()`);
    await delay(80);
    assert.equal(
        await evaluate(
            `document.querySelector('input[aria-label="Thư ký: Xử lý trải nghiệm tự khai trong CLB"]').checked`,
        ),
        true,
    );
    await evaluate(`document.querySelector('input[aria-label="Thư ký: Xử lý trải nghiệm tự khai trong CLB"]').click()`);
    await delay(80);
    assert.equal(
        await evaluate(
            `document.querySelector('input[aria-label="Thư ký: Xử lý trải nghiệm tự khai trong CLB"]').checked`,
        ),
        false,
    );
    assert.ok(
        await evaluate(
            `[...document.querySelectorAll('[role="dialog"] button')].find(e=>e.textContent==='Lưu phân quyền').disabled`,
        ),
    );
    await responsive('club-declarations-permissions');
    await evaluate(`document.querySelector('[aria-label="Đóng hộp thoại"]').click()`);
    await delay(80);
    await choose('Tìm sinh viên / trải nghiệm', 'Lê Bình');
    await expect('Chứng chỉ học thuật');
    assert.equal(await evaluate(`document.querySelector('main tbody').textContent.includes('Giải lập trình')`), false);
    await choose('Tìm sinh viên / trải nghiệm', '');
    await choose('Phạm vi học kỳ', 'workspace');
    await expect('Giải lập trình sinh viên');
    assert.equal(await evaluate(`document.querySelector('main tbody').textContent.includes('Chứng chỉ')`), false);
    await choose('Phạm vi học kỳ', 'all');
    await click('Xem chi tiết');
    await waitFor(`!!document.querySelector('[role="dialog"] .club-student-declaration-detail')`);
    await responsive('club-declarations-detail');
    assert.ok(
        await evaluate(
            `[...document.querySelectorAll('[role="dialog"] button')].find(e=>e.textContent==='Duyệt tại CLB').disabled`,
        ),
    );
    assert.ok(
        await evaluate(
            `[...document.querySelectorAll('[role="dialog"] button')].find(e=>e.textContent==='Chuyển lên CTSV').disabled`,
        ),
    );
    await evaluate(
        `[...document.querySelectorAll('[role="dialog"] button')].find(e=>e.textContent.trim()==='Tải minh chứng 1').click()`,
    );
    await delay(100);
    assert.ok(await evaluate(`window.__calls.some(c=>c.path.includes('/api/contributions/evidence/'))`));
    await evaluate(`document.querySelector('[aria-label="Đóng hộp thoại"]').click()`);
    await delay(100);
    assert.equal(await evaluate(`window.__calls.some(c=>c.method!=='GET')`), false);
    assert.deepEqual(errors, []);
    await open('member');
    await expect('Chỉ BQL');
    assert.equal(await evaluate(`window.__calls.some(c=>c.path.includes('student-affairs/declarations'))`), false);
    assert.equal(await evaluate(`!!document.querySelector('aside a[href$="/student-declarations"]')`), false);
    await open('vice');
    await expect('Giải lập trình sinh viên');
    await expect('Phân quyền');
    await expect('Chủ tịch và Phó chủ tịch mặc định đầy đủ quyền');
    await open('delegated');
    await expect('Giải lập trình sinh viên');
    assert.equal(await evaluate(`!!document.querySelector('aside a[href$="/student-declarations"]')`), true);
    assert.equal(
        await evaluate(`[...document.querySelectorAll('main button')].some(e=>e.textContent==='Phân quyền')`),
        false,
    );
    await open('denied');
    await expect('Chưa được cấp quyền');
    assert.equal(await evaluate(`!!document.querySelector('.club-student-declaration-empty')`), false);
    await open('error');
    await expect('Lỗi nguồn trải nghiệm');
    await open('empty');
    await expect('Chưa có trải nghiệm tự khai phù hợp');
    await open('mismatch');
    await click('Xem chi tiết');
    await waitFor(`document.querySelector('[role="dialog"]').textContent.includes('không thuộc CLB')`);
    assert.equal(await evaluate(`!!document.querySelector('[role="dialog"] .club-student-declaration-detail')`), false);
    assert.deepEqual(errors, []);
    console.log(
        'PASS club workspace navigation, scoped declaration list/detail/evidence, search, semester, member/delegated guards, denial/error/empty, 320–1440 geometry; no writes',
    );
    console.log('Screenshots: ' + directory);
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    ws?.close();
    chrome?.kill();
    await Promise.race([server.close(), new Promise((r) => setTimeout(r, 3000))]);
}
