import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const base = process.env.ACTIVITY_PREVIEW === 'true' ? 'http://127.0.0.1:4175' : 'https://fptux-clubhub-ui.pages.dev';
const server = process.env.ACTIVITY_PREVIEW === 'true' ? spawn('node', ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], {stdio: 'inherit'}) : null;
if (server) for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
}
const browser = await chromium.launch();
fs.mkdirSync('TestResults/deployed-registration', { recursive: true });
try {
  for (const internal of [false, true]) for (const canRegister of [true, false]) for (const width of [1440, 1024, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
    page.on('pageerror', error => console.error('BROWSER_ERROR', error.message));
    page.on('requestfailed', request => console.error('NETWORK_ERROR', request.url(), request.failure()?.errorText));
    page.on('response', response => { if(response.status()>=400) console.error('HTTP_ERROR',response.status(),response.url()); });
    let submitted = 0;
    const apiPaths = [];
    await page.addInitScript(() => {
      localStorage.setItem('fptux:session:v1', JSON.stringify({id:'isolated-browser-test',accessToken:'intercepted-not-a-real-token'}));
    });
    await page.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) return route.continue();
      apiPaths.push(url.pathname);
      const ok = body => route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(body) });
      // Every API request is intercepted: no test identity or write reaches production.
      if (url.pathname === '/api/users/me') return ok({id:999999,fullName:'Isolated UI reviewer',email:'reviewer@example.test',roles:['CLUB_MEMBER'],isActive:true,isLocked:false,campusCode:'HAN'});
      if (url.pathname === '/api/users/me/profile') return ok({userId:999999,version:'test',profile:{interests:[]},personal:{},academic:{},editableFields:[],onboarding:{version:1,completedAt:'2026-01-01T00:00:00Z'}});
      if (url.pathname === '/api/v2/activities/4') return ok({id:4,clubId:1,clubCode:'TEST',clubName:'Isolated Test Club',title:'Software Engineering Weekly Lab',description:'Isolated API fixture',status:'LIVE',isInternal:internal,isRegistered:submitted>0,canRegister:canRegister && submitted===0,isEligible:true,nextAction:canRegister?'REGISTER':'VIEW',startTime:'2026-09-15T05:30:00Z',endTime:'2026-12-15T08:30:00Z'});
      if (url.pathname === '/api/activities/4/resources') return ok({items:[],availability:'AVAILABLE',resourceCapabilities:{supportedKinds:[],canManage:false,canUpload:false}});
      if (url.pathname === '/api/clubs') return ok([{id:1,code:'TEST',name:'Isolated Test Club',campusCode:'HAN',isActive:true}]);
      if (url.pathname === '/api/clubs/me/access') return ok(internal ? [{clubId:1,isApprovedMember:true}] : []);
      if (url.pathname === '/api/clubs/me/memberships') return ok(internal ? [{clubId:1,status:'Approved'}] : []);
      if (url.pathname === '/api/activities/4/participants' && request.method()==='POST') {
        submitted++; return ok({success:true});
      }
      const schedule = {activityId:4,clubId:1,clubName:'Isolated Test Club',title:'Software Engineering Weekly Lab',activityStatus:'Scheduled',sessionId:null,startTime:'2026-09-15T05:30:00Z',endTime:'2026-12-15T08:30:00Z',location:'DE-301'};
      if (url.pathname === '/api/users/me/activity-history') return ok({items:submitted ? [schedule] : [],page:1,totalPages:submitted ? 1 : 0});
      if (url.pathname === '/api/v2/activities/feed') return ok({items:[{...schedule,id:4,status:'LIVE',isInternal:internal,canRegister:true}],page:1,totalPages:1,scopeVersion:'test'});
      if (request.method()!=='GET') return route.abort();
      return ok({items:[],total:0,page:1,totalPages:0});
    });
    await page.goto(base + '/v2/activities/4');
    const heading = page.locator('.v2-activity-profile-identity h1');
    try {
      await heading.waitFor({timeout:25000});
      assert.equal(await heading.textContent(),'Software Engineering Weekly Lab');
      const button=page.locator('.v2-activity-profile-registration').getByRole('button',{name:'Đăng ký tham gia',exact:true});
      assert.equal(await button.count(),1);
      assert.equal(await button.isVisible(),true);
      assert.equal(await button.isEnabled(),canRegister);
      if (internal) await page.locator('.v2-activity-profile-actions').getByRole('link', {name:'Đến không gian CLB',exact:true}).waitFor();
      const layout = await page.locator('.v2-activity-profile').evaluate(el => {
        const box = selector => el.querySelector(selector).getBoundingClientRect();
        const title = box('h1'), facts = box('.v2-activity-profile-quick-facts'), registration = box('.v2-activity-profile-registration');
        const nav = el.querySelector('.v2-activity-profile-identity .v2-club-navigation-links');
        const links = nav.getBoundingClientRect();
        return {registrationBelow:registration.top>=facts.bottom, navigationAbove:links.bottom<=registration.top,
          besideTitle:links.left>=title.right-1, titleTop:title.top, titleBottom:title.bottom,
          linksTop:links.top, linksBottom:links.bottom, overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.equal(layout.registrationBelow,true);
      assert.equal(layout.navigationAbove,true,'Club navigation stays in identity header above registration');
      assert.equal(layout.overflow,false);
      if(width>900) {
        assert.equal(layout.besideTitle,true,'Club links retain their old position beside the title');
        assert.ok(layout.linksTop<=layout.titleBottom && layout.linksBottom>=layout.titleTop,'Navigation aligns with title');
      }
      await button.scrollIntoViewIfNeeded();
      if(canRegister) {
        await button.evaluate(el=>el.click());
        await page.getByRole('button',{name:'Đã đăng ký',exact:true}).waitFor();
        assert.equal(await page.getByText('Máy chủ đã xác nhận đăng ký tham gia.',{exact:true}).count(),0);
        await page.reload();
        await page.getByRole('button',{name:'Đã đăng ký',exact:true}).waitFor();
        assert.equal(await page.getByText('Hiện chưa thể đăng ký hoạt động này.',{exact:true}).count(),0);
        assert.equal(submitted,1);
      }
      const spacing = await page.locator('.v2-activity-profile').evaluate(el => {
        const box = selector => el.querySelector(selector).getBoundingClientRect();
        const facts = box('.v2-activity-profile-quick-facts');
        const registration = box('.v2-activity-profile-registration');
        const tabs = box('.v2-activity-profile-tabs');
        return { before:registration.top-facts.bottom, after:tabs.top-registration.bottom };
      });
      for (const [side, gap] of Object.entries(spacing))
        assert.ok(gap >= 8 && gap <= 16, side + ' registration spacing must be compact: ' + gap);
      console.log('ACTIVITY_SPACING_OK',JSON.stringify({width,internal,canRegister,...spacing}));
      await page.screenshot({path:'TestResults/deployed-registration/'+internal+'-'+canRegister+'-'+width+'.png',fullPage:true});
      await page.goto(base + '/v2/my-schedule');
      if(canRegister) await page.getByText('Software Engineering Weekly Lab',{exact:true}).waitFor();
      else await page.getByText('Lịch trình đang trống',{exact:true}).waitFor();
      await page.goto(base + '/v2/activities');
      await page.locator('.v2-event-grid').waitFor();
      assert.equal(await page.getByRole('button',{name:'Đăng ký tham gia',exact:true}).count(),0,'Activity list has detail links only');
      console.log('DEPLOYED_ACTIVITY_CTA_OK',JSON.stringify({path:'/v2/activities/4',internal,canRegister,width,submitted}));
    } catch(error) {
      console.error('INTERCEPTED_API_PATHS',JSON.stringify(apiPaths));
      console.error('VISIBLE_PAGE_TEXT',(await page.locator('body').innerText()).slice(0,3500));
      throw error;
    } finally { await page.close(); }
  }
} finally {await browser.close(); server?.kill();}
