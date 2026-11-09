import assert from 'node:assert/strict';import fs from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.FORMATION_BASE_URL||'https://fptux-clubhub-ui.pages.dev';const browser=await chromium.launch();const version='11111111-1111-4111-8111-111111111111';
try{fs.mkdirSync('TestResults/formation-online',{recursive:true});for(const width of [1440,390]){
 const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block'});page.setDefaultTimeout(45000);const errors=[];page.on('pageerror',e=>errors.push(e.message));let application=null,writes=0;
 await page.addInitScript(()=>localStorage.setItem('fptux:session:v1',JSON.stringify({id:'isolated-formation',accessToken:'intercepted-not-a-real-token'})));
 await page.route('**/*',async route=>{const req=route.request(),path=new URL(req.url()).pathname;if(!path.startsWith('/api/'))return route.continue();
 // Synthetic identity and all mutations are intercepted, never sent to production.
 const send=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(req.method()!=='GET'){assert.equal(path,'/api/clubs/applications');assert.equal(req.method(),'POST');assert.ok(req.headers()['idempotency-key']);writes++;const body=req.postDataJSON();assert.equal(body.code,'FORM26');for(const optional of ['logoUrl','expectedLocation','expectedSchedule','majorEvents','equipmentNeeds','advisorNeeded'])assert.equal(Object.hasOwn(body,optional),false);application={...body,id:1,requesterUserId:100,requesterName:'Requester',contactEmail:'requester@example.test',campusCode:'HCM',status:'Submitted',version};return send(application,201);}
 if(path==='/api/users/me')return send({id:100,fullName:'Requester',email:'requester@example.test',roles:['CLUB_MEMBER'],isActive:true,isLocked:false,campusCode:'HCM'});
 if(path==='/api/users/me/profile')return send({userId:100,version:'isolated-profile',profile:{interests:[]},personal:{},academic:{},editableFields:[],onboarding:{version:1,completedAt:'2026-01-01T00:00:00Z'}});
 if(path==='/api/clubs/applications/me')return send(application?[application]:[]);
 if(path==='/api/clubs'||path==='/api/clubs/me/access'||path==='/api/clubs/me/memberships')return send([]);
 return send({items:[],total:0,page:1,totalPages:0});});
 const open=async()=>{await page.goto(base+'/v2/my-clubs',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Đăng ký mở CLB',exact:true}).click();};
 await open();const dialog=page.getByRole('dialog');assert.equal(await dialog.locator('[name=code]').count(),1);
 const values={name:'Formation Club',code:'form26',purpose:'Learn together',description:'Build together',founderPhone:'0912345678',founderOrganization:'SE',memberOrganization:'SE',mainActivities:'Workshops',activityFrequencyCount:'2'};
 for(const[name,value]of Object.entries(values))await dialog.locator('[name="'+name+'"]').fill(value);for(const check of await dialog.locator('input[type=checkbox]').all())await check.check();await page.getByRole('button',{name:'Gửi đơn thành lập',exact:true}).evaluate(el=>{el.click();el.click()});await dialog.waitFor({state:'hidden'});await page.getByText('Chờ xét duyệt · HCM',{exact:false}).waitFor();assert.equal(writes,1);
 await page.reload();await page.getByText('Chờ xét duyệt · HCM',{exact:false}).waitFor();await page.screenshot({path:'TestResults/formation-online/student-'+width+'.png',fullPage:true});assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await page.close();
}console.log('DEPLOYED_FORMATION_OK: actual production form keeps Viết tắt/code, omits optional fields, duplicate guard and persisted own application after reload at 1440/390. All API traffic isolated.');}finally{await browser.close();}
