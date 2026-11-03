import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
const browser = await chromium.launch();
fs.mkdirSync('TestResults/deployed-registration', { recursive: true });
try {
  for (const internal of [false, true]) for (const canRegister of [true, false]) for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
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
      if (url.pathname === '/api/v2/activities/4') return ok({id:4,clubId:1,clubCode:'TEST',clubName:'Isolated Test Club',title:'Software Engineering Weekly Lab',description:'Isolated API fixture',status:'LIVE',isInternal:internal,canRegister,isEligible:true,nextAction:canRegister?'REGISTER':'VIEW',startTime:'2026-09-15T05:30:00Z',endTime:'2026-12-15T08:30:00Z'});
      if (url.pathname === '/api/activities/4/resources') return ok({items:[],availability:'AVAILABLE',resourceCapabilities:{supportedKinds:[],canManage:false,canUpload:false}});
      if (url.pathname === '/api/clubs') return ok([{id:1,code:'TEST',name:'Isolated Test Club',campusCode:'HAN',isActive:true}]);
      if (url.pathname === '/api/clubs/me/access') return ok([]);
      if (url.pathname === '/api/clubs/me/memberships') return ok([]);
      if (url.pathname === '/api/activities/4/participants' && request.method()==='POST') {
        submitted++; return ok({success:true});
      }
      if (request.method()!=='GET') return route.abort();
      return ok({items:[],total:0,page:1,totalPages:0});
    });
    await page.goto('https://fptux-clubhub-ui.pages.dev/v2/activities/4');
    const heading = page.locator('.v2-activity-profile-identity h1');
    try {
      await heading.waitFor({timeout:25000});
      assert.equal(await heading.textContent(),'Software Engineering Weekly Lab');
      const button=page.locator('.v2-activity-profile-actions').getByRole('button',{name:'Đăng ký tham gia',exact:true});
      assert.equal(await button.count(),1);
      assert.equal(await button.isVisible(),true);
      assert.equal(await button.isEnabled(),canRegister);
      await button.scrollIntoViewIfNeeded();
      if(canRegister) {
        await button.evaluate(el=>el.click());
        await page.getByText('Máy chủ đã xác nhận đăng ký tham gia.',{exact:true}).waitFor();
        assert.equal(submitted,1);
      }
      await page.screenshot({path:'TestResults/deployed-registration/'+internal+'-'+canRegister+'-'+width+'.png',fullPage:true});
      console.log('DEPLOYED_ACTIVITY_CTA_OK',JSON.stringify({path:'/v2/activities/4',internal,canRegister,width,submitted}));
    } catch(error) {
      console.error('INTERCEPTED_API_PATHS',JSON.stringify(apiPaths));
      console.error('VISIBLE_PAGE_TEXT',(await page.locator('body').innerText()).slice(0,3500));
      throw error;
    } finally { await page.close(); }
  }
} finally {await browser.close();}
