import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const base = process.env.DISCOVERY_SMOKE_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const version = '11111111-1111-4111-8111-111111111111';
const tag = { id: `custom:${'a'.repeat(64)}`, label: 'Thiết kế robot', kind: 'custom' };
const workshop = { id: 'activity-category:workshop', label: 'Workshop', kind: 'category' };
const competition = { id: 'activity-category:competition', label: 'Cuộc thi', kind: 'category' };
const club = { id: 1, code: 'TEST', name: 'CLB kiểm thử', campusCode: 'HAN', category: 'TECHNOLOGY',
    isActive: true, isRecruiting: true, discoveryTags: [tag] };
const activity = { id: 4, clubId: 1, clubCode: 'TEST', clubName: club.name, title: 'Buổi kiểm thử',
    description: 'Dữ liệu kiểm thử', status: 'UPCOMING', isInternal: false, isEligible: true, canRegister: false,
    startTime: new Date(Date.now() + 86_400_000).toISOString(), endTime: new Date(Date.now() + 90_000_000).toISOString(),
    discoveryTags: [tag, workshop] };
const other = { ...activity, id: 5, title: 'Buổi đối chứng', discoveryTags: [competition] };
const events = [];
try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('fptux:session:v1',
        JSON.stringify({ id: 'discovery-smoke', accessToken: 'intercepted-not-a-real-token' })));
    await page.route('**/*', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        if (!path.startsWith('/api/')) return route.continue();
        const ok = (json) => route.fulfill({ status: 200, json });
        if (path === '/api/v2/recommendations/interactions' && request.method() === 'POST') {
            events.push(request.postDataJSON());
            return route.fulfill({ status: 204 });
        }
        if (request.method() !== 'GET') return route.abort();
        if (path === '/api/v2/recommendations/interaction-settings')
            return ok({ clickEnabled: true, viewEnabled: true, viewSeconds: 2, visiblePercent: 75, version });
        if (path === '/api/users/me')
            return ok({ id: 901, fullName: 'QA Discovery', email: 'qa@example.test', roles: ['CLUB_MEMBER'], isActive: true, campusCode: 'HAN' });
        if (path === '/api/users/me/profile')
            return ok({ userId: 901, version: 'qa', profile: { interests: [] }, personal: {}, academic: {},
                editableFields: [], onboarding: { version: 1, completedAt: '2026-01-01T00:00:00Z' } });
        if (path === '/api/clubs') return ok([club, { ...club, id: 2, code: 'OTHER', name: 'CLB đối chứng', discoveryTags: [] }]);
        if (path === '/api/clubs/1') return ok(club);
        if (path === '/api/clubs/me/access' || path === '/api/clubs/me/memberships') return ok([]);
        if (path === '/api/v2/activities/feed') return ok({ items: [activity, other], page: 1, totalPages: 1, scopeVersion: 'qa' });
        if (path === '/api/v2/activities/4') return ok(activity);
        if (path === '/api/activities/4/resources') return ok({ items: [], availability: 'AVAILABLE' });
        return ok({ items: [], page: 1, totalPages: 0 });
    });
    await page.goto(`${base}/v2/activities`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: other.title }).waitFor();
    const categories = page.getByRole('group', { name: 'Thể loại hoạt động' });
    await categories.getByRole('button', { name: workshop.label }).click();
    await page.getByRole('heading', { name: other.title }).waitFor({ state: 'detached' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: activity.title }).waitFor();
    assert.equal(await categories.getByRole('button', { name: workshop.label }).getAttribute('aria-pressed'), 'true');
    await categories.getByRole('button', { name: 'Tất cả', exact: true }).click();
    await page.getByRole('heading', { name: other.title }).waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('thiết kế robot');
    await page.getByRole('heading', { name: other.title }).waitFor({ state: 'detached' });
    await page.getByRole('heading', { name: activity.title }).waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('');
    await page.getByLabel('Lọc theo tag').selectOption(tag.id);
    await page.getByRole('heading', { name: other.title }).waitFor({ state: 'detached' });
    await categories.getByRole('button', { name: competition.label }).click();
    await page.getByRole('heading', { name: 'Không tìm thấy hoạt động' }).waitFor();
    await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
    await page.getByRole('heading', { name: other.title }).waitFor();
    const open = page.getByRole('button', { name: `Chi tiết ${activity.title}` });
    await open.scrollIntoViewIfNeeded();
    await page.bringToFront();
    await page.evaluate(() => window.dispatchEvent(new Event('scroll')));
    const before = events.filter((event) => event.action === 'view').length;
    if (before === 0) {
        await page.waitForTimeout(500);
        assert.equal(events.filter((event) => event.action === 'view').length, 0);
        const deadline = Date.now() + 6_000;
        while (!events.some((event) => event.action === 'view') && Date.now() < deadline)
            await page.waitForTimeout(100);
    }
    assert.equal(events.filter((event) => event.action === 'view' && event.entityId === 4).length, 1);
    await open.click();
    await page.getByRole('heading', { name: activity.title }).waitFor();
    const click = events.find((event) => event.action === 'click');
    assert.ok(click?.eventId);
    assert.equal(click.entityId, 4);
    assert.equal(click.captureVersion, version);
    await page.goto(`${base}/v2/clubs`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'CLB đối chứng' }).waitFor();
    await page.getByLabel('Lọc theo tag').selectOption(tag.id);
    await page.getByRole('heading', { name: 'CLB đối chứng' }).waitFor({ state: 'detached' });
    await page.getByRole('heading', { name: club.name }).waitFor();
    assert.deepEqual(errors, []);
    console.log('DISCOVERY_TAGS_BROWSER_OK: ClubHub category and tag filters, search, and versioned click/view on the served build.');
} finally {
    await browser.close();
}
