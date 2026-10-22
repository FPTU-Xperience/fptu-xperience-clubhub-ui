// Controlled browser fixtures only. Never imported by the production application.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const directory = process.env.REPORT_XP_QA_DIR || path.join(os.tmpdir(), 'clubhub-report-xp-qa');
await fs.mkdir(directory, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script type="module" src="/__xp-entry.jsx"></script></body></html>`;
const entry = `import React from 'react';import{createRoot}from'react-dom/client';import{BrowserRouter,Routes,Route}from'react-router-dom';
import Editor from '/src/pages/v2/report-detail-page/ReportEditorPage.jsx';import '/src/styles/index.scss';import '/src/pages/v2/V2App.scss';import '/src/pages/v2/club-workspace-page/ClubWorkspacePage.scss';
const mode=new URLSearchParams(location.search).get('qa');
window.__calls=[];window.__auth={user:{id:1,fullName:'Chủ nhiệm kiểm thử'},clubAccess:[{clubId:7,clubName:'CLB kiểm thử',isManager:true}]};
const rows=[{sourceId:'completion-1',activityId:42,activityName:'Ngày hội kỹ năng',studentCode:'SE001',fullName:'Nguyễn An',actionId:3,actionTitle:'Hỗ trợ tổ chức',quantity:2,points:5,rawPoints:10,evidence:'Biên bản xác minh hai lượt'},{sourceId:'completion-2',activityId:42,activityName:'Ngày hội kỹ năng',studentCode:'SE002',fullName:'Trần Bình',actionId:4,actionTitle:'Tham gia chuyên đề',quantity:1,points:3,rawPoints:3,evidence:'Minh chứng hoàn thành'}];
const snapshot={clubId:7,period:'FALL2026',reportType:'CLUB_ACTIVITY',activityId:42,reportId:null,version:1,sourceVersion:2,budgetRaw:50,capabilities:{canEdit:true},rows,changes:[]};
const api={getReportingDeadlines:async()=>[],getActivity:async()=>({id:42,clubId:7,title:'Ngày hội kỹ năng',startTimeUtc:'2026-10-20T03:00:00Z',description:'Nội dung hoạt động',participantCount:2}),createReport:async(body)=>{window.__calls.push(['create',body]);return{id:99}},updateReport:async(id,body)=>{window.__calls.push(['update',body]);return{id}},submitReport:async(id)=>{window.__calls.push(['submit',id]);return{id}}};
if(mode!=='missing'){api.getReportXpDraft=async(scope)=>{window.__calls.push(['xpRead',scope]);if(mode==='load-error')throw Error('Lỗi nguồn Xperience Point kiểm thử');return structuredClone(snapshot)};api.saveReportXpDraft=async(id,body)=>{window.__calls.push(['xpSave',id,body]);if(window.__failXpSave)throw Error('Lỗi lưu Xperience Point kiểm thử');return{...structuredClone(snapshot),reportId:id,version:2,changes:body.changes.map((change,i)=>{const source=snapshot.rows.find(r=>r.sourceId===change.sourceId);return{...change,id:'stored-'+i,actor:'Server reviewer',studentCode:source.studentCode,actionId:source.actionId,actionTitle:source.actionTitle,before:{...change.before,rawPoints:change.before.quantity*source.points},after:{...change.after,rawPoints:change.after.quantity*source.points}}}),rows:snapshot.rows.map(row=>{const edit=body.rows.find(r=>r.sourceId===row.sourceId);return{...row,...edit,rawPoints:edit.quantity*row.points}})}};}
const h=React.createElement;createRoot(document.getElementById('root')).render(h(BrowserRouter,null,h('div',{className:'v2-app v2-app--workspace'},h('div',{className:'v2-production-workspace',style:{display:'block',padding:20}},h(Routes,null,h(Route,{path:'/__xp',element:h(Editor,{api,workspace:{clubId:7,name:'CLB kiểm thử'},base:'/v2/my-clubs/7',semester:{code:'FALL2026'}})}),h(Route,{path:'*',element:h('p',{id:'saved'},'Đã mở báo cáo đã lưu')}))))));`;
const server = await createServer({
    server: { host: '127.0.0.1', port: 5192, strictPort: true, open: false },
    plugins: [
        {
            name: 'report-xp-fixture',
            enforce: 'pre',
            load(id) {
                if (id.replaceAll('\\', '/').endsWith('/src/context/AuthContext.jsx'))
                    return 'export const useAuth=()=>window.__auth;export const AuthProvider=({children})=>children;';
            },
            configureServer(vite) {
                vite.middlewares.use(async (req, res, next) => {
                    if (req.url?.startsWith('/__xp-entry.jsx')) {
                        res.setHeader('Content-Type', 'application/javascript');
                        res.end(await vite.transformRequest('/__xp-entry.jsx').then((r) => r?.code));
                        return;
                    }
                    if (!req.url?.startsWith('/__xp?')) return next();
                    res.setHeader('Content-Type', 'text/html');
                    res.end(await vite.transformIndexHtml('/__xp', html));
                });
            },
            resolveId(id) {
                if (id === '/__xp-entry.jsx') return '\0report-xp-entry.jsx';
            },
            transform(code, id) {
                if (id === '\0report-xp-entry.jsx') return null;
            },
        },
        {
            name: 'report-xp-entry.jsx',
            load(id) {
                if (id === '\0report-xp-entry.jsx') return entry;
            },
        },
    ],
});
let chrome, ws;
try {
    await server.listen();
    const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'clubhub-xp-chrome-'));
    chrome = spawn(
        process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
        [
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            `--user-data-dir=${profile}`,
            '--remote-debugging-port=9343',
            'about:blank',
        ],
        { stdio: 'ignore', windowsHide: true },
    );
    let targets;
    for (let n = 0; n < 100; n++) {
        try {
            targets = await (await fetch('http://127.0.0.1:9343/json')).json();
            break;
        } catch {
            await new Promise((r) => setTimeout(r, 100));
        }
    }
    assert.ok(targets);
    ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    let id = 0;
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
            const next = ++id;
            pending.set(next, { resolve, reject });
            ws.send(JSON.stringify({ id: next, method, params }));
        });
    const evaluate = async (expression) => {
        const r = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
        if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
        return r.result?.value;
    };
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const waitFor = async (expression) => {
        for (let n = 0; n < 100; n++) {
            if (await evaluate(expression)) return;
            await delay(100);
        }
        throw Error('Timed out: ' + expression);
    };
    const click = async (label) => {
        await evaluate(
            `(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()===${JSON.stringify(label)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(label)});e.click()})()`,
        );
        await delay(80);
    };
    const text = () => evaluate('document.body.textContent');
    const expect = async (value) => assert.ok((await text()).includes(value), value);
    const fill = async (label, value) => {
        await evaluate(
            `(()=>{const e=document.querySelector('[aria-label='+${JSON.stringify(JSON.stringify(label))}+']');if(!e)throw Error('Missing input');const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,${JSON.stringify(String(value))});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`,
        );
        await delay(60);
    };
    const shot = async (name) => {
        const r = await call('Page.captureScreenshot', { format: 'png' });
        await fs.writeFile(path.join(directory, name + '.png'), Buffer.from(r.data, 'base64'));
    };
    const open = async (mode = 'supported', template = 'club-activity') => {
        errors.length = 0;
        await call('Page.navigate', {
            url: `http://127.0.0.1:5192/__xp?template=${template}&clubId=7&activityId=42&period=FALL2026&qa=${mode}`,
        });
        await waitFor(`document.querySelectorAll('.v2-report-editor-steps button').length===5`);
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
    assert.equal(
        await evaluate(`document.querySelectorAll('.v2-report-editor-steps button')[3].textContent.trim()`),
        '4Báo cáo Xperience Point',
    );
    await shot('clubhub-report-five-steps');
    await click('4Báo cáo Xperience Point');
    await click('Tự điền từ minh chứng');
    await expect('13');
    await click('Chỉnh sửa');
    await fill('Số lượt tính Xperience Point', 1);
    await fill('Lý do chỉnh sửa Xperience Point', 'Chỉ xác minh một lượt tham gia');
    await shot('clubhub-xp-edit');
    await click('Áp dụng vào bản nháp');
    await expect('8');
    await click('Tự điền từ minh chứng');
    await expect('8');
    await click('Theo sinh viên');
    await expect('SE001');
    await click('Theo action');
    await expect('Hỗ trợ tổ chức');
    await click('Lịch sử thay đổi');
    await expect('Chỉ xác minh một lượt tham gia');
    await fill('Lọc sinh viên Xperience Point', 'SE001');
    await expect('Đang xem 1 dòng · 5 điểm thô đề xuất');
    for (const width of [1440, 768, 414, 375, 320]) {
        await call('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
        await delay(100);
        assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `overflow ${width}`);
        if ([1440, 375].includes(width)) await shot('clubhub-xp-history-' + width);
    }
    await click('5Xem trước & nộp');
    await expect('Có chỉnh sửa đang chờ lưu');
    await click('4Báo cáo Xperience Point');
    await expect('8');
    await click('5Xem trước & nộp');
    await evaluate('window.__failXpSave=true');
    await click('Lưu và nộp');
    await expect('Lỗi lưu Xperience Point kiểm thử');
    assert.equal(await evaluate(`window.__calls.filter(c=>c[0]==='submit').length`), 0);
    await evaluate('window.__failXpSave=false');
    await click('Lưu và nộp');
    await waitFor(`!!document.querySelector('#saved')`);
    assert.equal(await evaluate(`window.__calls.filter(c=>c[0]==='create').length`), 1);
    assert.equal(await evaluate(`window.__calls.filter(c=>c[0]==='submit').length`), 1);
    assert.equal(await evaluate(`'xpReport' in window.__calls.find(c=>c[0]==='create')[1]`), false);
    assert.equal(await evaluate(`window.__calls.filter(c=>c[0]==='xpSave').at(-1)[2].rows[0].quantity`), 1);
    assert.deepEqual(errors, []);
    await open('missing');
    await click('4Báo cáo Xperience Point');
    await expect('Chưa kết nối dữ liệu báo cáo Xperience Point');
    assert.equal(
        await evaluate(
            `[...document.querySelectorAll('button')].find(e=>e.textContent.includes('Tự điền từ minh chứng')).disabled`,
        ),
        true,
    );
    await shot('clubhub-xp-unavailable');
    await click('Tiếp tục');
    await expect('chưa gửi hoặc cộng Xperience Point');
    await open('load-error');
    await click('4Báo cáo Xperience Point');
    await click('Tự điền từ minh chứng');
    await expect('Lỗi nguồn Xperience Point kiểm thử');
    assert.equal(await evaluate(`document.querySelectorAll('.v2-report-xp tbody tr').length`), 0);
    await open('missing', 'term-start');
    await click('4Báo cáo Xperience Point');
    await expect('chưa quyết toán Xperience Point');
    assert.deepEqual(errors, []);
    console.log(
        'PASS five stages, Xperience Point autofill/edit/history/filter/preview, preserved edits, guarded save/retry, missing/error sources, planning template, 320–1440 geometry',
    );
    console.log('Screenshots: ' + directory);
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    ws?.close();
    chrome?.kill();
    await Promise.race([server.close(), new Promise((resolve) => setTimeout(resolve, 3000))]);
}
