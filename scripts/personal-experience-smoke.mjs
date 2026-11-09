// Browser-only fixtures: exercises the real page and ApiService without creating live records.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
const directory = path.join(os.tmpdir(), 'clubhub-personal-experience-qa');
await fs.mkdir(directory, { recursive: true });
await fs.writeFile(path.join(directory, 'certificate.pdf'), '%PDF-1.4\ncontrolled evidence fixture');
const entry = `import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter}from'react-router-dom';import Page from '/src/pages/v2/personal-experience/PersonalExperiencePage.jsx';import Rail from '/src/components/v2/common/leftrail/LeftRail.jsx';import{ThemeProvider}from'/src/context/ThemeContext.jsx';import api from '/src/services/api.js';import '/src/styles/index.scss';import '/src/pages/v2/V2App.scss';
const mode=new URLSearchParams(location.search).get('qa');history.replaceState(null,'','/v2/personal-experience'+location.search);window.__calls=[];localStorage.setItem('accessToken','test-token');
const user={id:1,name:'Nguyễn An',email:'an@example.test',roles:['STUDENT']};
const initial={id:'12345678-1234-1234-1234-123456789abc',userId:1,title:'Chứng chỉ tiếng Anh quốc tế',status:'APPROVED',sourceType:'EXTERNAL',isAuthoritative:true,rawPoints:14,semesterId:'FALL2026',occurredAt:'2026-10-10T00:00:00Z',version:'12345678-1234-1234-1234-123456789abc',evidenceRefs:['eeeeeeee-1111-2222-3333-444444444444']};window.__rows=mode==='empty'?[]:[initial];
window.fetch=async(url,options={})=>{const pathname=new URL(url,location.origin).pathname;const body=options.body;window.__calls.push({pathname,method:options.method||'GET',key:options.headers?.['Idempotency-Key'],body:typeof body==='string'?JSON.parse(body):body instanceof FormData?{fileName:body.get('file')?.name}:null});const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
if(pathname.endsWith('/experience-summary'))return mode==='summary-error'?json({message:'Báo cáo tổng hợp chưa sẵn sàng'},503):json({userId:1,semesterId:'FALL2026',recognizedContributionCount:1,rawExperiencePoints:14});
if(pathname==='/api/users/me/contributions')return mode==='list-error'?json({message:'Lỗi danh sách trải nghiệm'},503):json({items:window.__rows,page:1,pageSize:20,total:window.__rows.length,totalPages:window.__rows.length?1:0});
if(pathname==='/api/contributions/evidence')return json({evidenceId:'eeeeeeee-1111-2222-3333-444444444444'});
if(pathname==='/api/v1/declarations/'){if(window.__failSubmit)return json({message:'Lỗi gửi trải nghiệm kiểm thử'},503);const data=JSON.parse(body);const row={...initial,id:'aaaaaaaa-1111-2222-3333-444444444444',title:data.title,status:'SUBMITTED',message:data.evidenceDescription,rawPoints:0,evidenceRefs:data.evidenceRefs};window.__rows.unshift(row);return json(row,201);}
if(pathname.startsWith('/api/contributions/')&&!pathname.includes('evidence')){const id=pathname.split('/').pop();const row=window.__rows.find(r=>r.id===id);return row?json({contribution:row,decisions:[]}):json({message:'Không tìm thấy trải nghiệm'},404);}
if(pathname.includes('/evidence/')&&pathname.endsWith('/download'))return new Response('%PDF-1.4 fixture',{headers:{'Content-Type':'application/pdf'}});
return json([]);};
const h=React.createElement;createRoot(document.getElementById('root')).render(h(ThemeProvider,null,h(BrowserRouter,null,h('div',{className:'v2-app'},h(Rail,{user,api,onLogout:()=>{}}),h('main',{className:'v2-main'},h(Page,{api,user,clubAccess:[{clubId:7,clubName:'CLB Công nghệ'}]}))))));`;
const html =
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/__personal-entry.js"></script></body></html>';
const server = await createServer({
    server: { host: '127.0.0.1', port: 5193, strictPort: true, open: false },
    plugins: [
        {
            name: 'personal-fixture',
            enforce: 'pre',
            resolveId(id) {
                if (id === '/__personal-entry.js') return '\0personal-entry.js';
            },
            load(id) {
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
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'clubhub-personal-chrome-'));
    chrome = spawn(
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        [
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            `--user-data-dir=${profile}`,
            '--remote-debugging-port=9344',
            'about:blank',
        ],
        { stdio: 'ignore', windowsHide: true },
    );
    let targets;
    for (let n = 0; n < 100; n++) {
        try {
            targets = await (await fetch('http://127.0.0.1:9344/json')).json();
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
        await call('Page.navigate', { url: `http://127.0.0.1:5193/__personal?qa=${mode}` });
        await waitFor(
            `!!document.querySelector('main h1') && !document.querySelector('[role="status"]')?.textContent.includes('Đang tải')`,
        );
        await delay(300);
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
            if (name === 'personal-experience-club-reference')
                await evaluate(
                    `[...document.querySelectorAll('main h2')].find(e=>e.textContent==='Tham chiếu từ CLB').closest('section').scrollIntoView({block:'start'})`,
                );
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
    await expect('Chứng chỉ tiếng Anh quốc tế');
    assert.equal(
        await evaluate(
            `document.querySelector('#v2-left-rail-personal-nav a[href="/v2/personal-experience"]').textContent.trim()`,
        ),
        'Trải nghiệm cá nhân',
    );
    await responsive('personal-experience-list');
    await click('Tạo trải nghiệm tự khai');
    await expect('Minh chứng bắt buộc');
    assert.equal(
        await evaluate(
            `[...document.querySelectorAll('main button')].find(e=>e.textContent.includes('Gửi trải nghiệm xét duyệt')).disabled`,
        ),
        true,
    );
    await fill('Tên trải nghiệm *', 'Đạt giải thi lập trình bên ngoài');
    await fill('Đơn vị tổ chức / cấp chứng nhận *', 'Đơn vị tổ chức bên ngoài');
    await fill('Ngày đạt được / hoàn thành *', '2026-10-15');
    await fill('Kết quả đạt được & mô tả minh chứng *', 'Giấy chứng nhận có tên, ngày và kết quả đạt giải.');
    const doc = await call('DOM.getDocument');
    const node = await call('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type="file"]' });
    await call('DOM.setFileInputFiles', { nodeId: node.nodeId, files: [path.join(directory, 'certificate.pdf')] });
    await delay(100);
    await evaluate(`document.querySelector('input[name="referenceMode"]:not(:checked)').click()`);
    await delay(100);
    await fill('CLB tham chiếu', '7');
    await expect('chưa được máy chủ hỗ trợ');
    assert.equal(
        await evaluate(
            `[...document.querySelectorAll('main button')].find(e=>e.textContent.includes('Gửi trải nghiệm xét duyệt')).disabled`,
        ),
        true,
    );
    await responsive('personal-experience-club-reference');
    await evaluate(`document.querySelector('input[name="referenceMode"]:not(:checked)').click()`);
    await delay(100);
    await evaluate('window.__failSubmit=true');
    await click('Gửi trải nghiệm xét duyệt');
    await expect('Lỗi gửi trải nghiệm kiểm thử');
    assert.equal(await evaluate(`window.__calls.filter(c=>c.pathname==='/api/contributions/evidence').length`), 1);
    await evaluate('window.__failSubmit=false');
    await click('Gửi trải nghiệm xét duyệt');
    await waitFor(`document.querySelector('main').textContent.includes('Đã gửi trải nghiệm cùng minh chứng')`);
    await expect('Chưa ghi nhận');
    assert.equal(await evaluate(`window.__calls.filter(c=>c.pathname==='/api/contributions/evidence').length`), 1);
    assert.equal(
        await evaluate(
            `(()=>{const calls=window.__calls.filter(c=>c.pathname==='/api/v1/declarations/');return calls.length===2&&calls[0].key===calls[1].key&&calls[1].body.clubId===null&&calls[1].body.evidenceRefs.length===1&&!('rawPoints' in calls[1].body)})()`,
        ),
        true,
    );
    await responsive('personal-experience-submitted');
    assert.deepEqual(errors, []);
    await open('list-error');
    await expect('Lỗi danh sách trải nghiệm');
    assert.equal(await evaluate(`!!document.querySelector('.personal-experience-empty')`), false);
    await open('summary-error');
    await expect('Báo cáo tổng hợp chưa sẵn sàng');
    await expect('Chứng chỉ tiếng Anh quốc tế');
    await open('empty');
    await expect('Chưa có trải nghiệm phù hợp');
    assert.deepEqual(errors, []);
    console.log(
        'PASS personal navigation, real API adapter paths, private evidence, required files, club-reference boundary, receipt retry, detail, independent report errors, empty and responsive 320–1440',
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
