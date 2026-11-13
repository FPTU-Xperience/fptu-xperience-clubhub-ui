import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const base = process.env.DISCOVERY_SMOKE_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE });
const version = '11111111-1111-4111-8111-111111111111';
const custom = (label) => ({
    id: `custom:${createHash('sha256').update(label.toUpperCase()).digest('hex')}`, label, kind: 'custom',
});
const category = (code, label) => ({ id: `activity-category:${code}`, label, kind: 'category' });
const tag = custom('Thiết kế robot');
const experience = { id: 'experience:Research', label: 'Nghiên cứu', kind: 'experience' };
const workshop = category('workshop', 'Workshop');
const competition = category('competition', 'Cuộc thi');
const technology = { id: 'club-category:technology', label: 'Công nghệ', kind: 'category' };
const club = { id: 1, code: 'TEST', name: 'CLB kiểm thử', campusCode: 'HAN', category: 'TECHNOLOGY',
    isActive: true, isRecruiting: true, discoveryTags: [tag, experience, technology] };
const untaggedClub = { ...club, id: 2, code: 'OTHER', name: 'CLB đối chứng', category: 'SPORTS',
    isRecruiting: false, discoveryTags: [] };
const activity = { id: 4, clubId: 1, clubCode: 'TEST', clubName: club.name, title: 'Workshop lắp ráp robot',
    description: 'Lắp ráp robot dò đường theo nhóm và thử nghiệm với cảm biến.', location: 'Phòng Lab IoT',
    status: 'UPCOMING', isInternal: false, isEligible: true, canRegister: false,
    startTime: new Date(Date.now() + 86_400_000).toISOString(), endTime: new Date(Date.now() + 90_000_000).toISOString(),
    discoveryTags: [workshop, tag, experience, custom('Làm việc nhóm')] };
const other = { ...activity, id: 5, title: 'Cuộc thi lập trình cuối tuần',
    description: 'Giải bài toán thuật toán theo đội.', location: 'Phòng máy 302',
    discoveryTags: [competition, custom('Thuật toán'), custom('Lập trình theo đội')] };
const activities = [activity, other,
    { ...activity, id: 6, title: 'Hội thảo thiết kế sản phẩm số',
        description: 'Tìm hiểu cách phỏng vấn người dùng và kiểm chứng ý tưởng.', location: 'Hội trường A',
        discoveryTags: [category('talk', 'Hội thảo'), custom('UX Research'), custom('Thiết kế sản phẩm')] },
    { ...activity, id: 7, title: 'Chủ nhật xanh tại campus',
        description: 'Thu gom, phân loại rác và chăm sóc khuôn viên.', location: 'Sân trung tâm',
        discoveryTags: [category('volunteering', 'Tình nguyện'), custom('Tái chế'), custom('Môi trường')] },
];
const events = [];
let clubApplication;
const previewClubs = [
    club, untaggedClub,
    ...[
        'Robot FPTU', 'Lập trình ứng dụng', 'Thiết kế số', 'Nhiếp ảnh', 'Tiếng Anh', 'Tranh biện',
        'Khởi nghiệp', 'Khoa học dữ liệu', 'Bóng rổ', 'Cầu lông', 'Âm nhạc', 'Kịch nghệ',
        'Truyền thông', 'Sách và Sáng tác', 'Tình nguyện', 'Môi trường', 'Văn hóa Nhật Bản', 'Cờ vua',
    ].map((name, index) => ({
        ...club, id: 100 + index, code: `PREVIEW${index + 1}`, name: `CLB ${name}`,
        discoveryTags: [],
    })),
];
const previewActivities = [
    ...activities,
    { ...activity, id: 8, title: 'Giao lưu nhiếp ảnh campus', description: 'Thực hành chụp chân dung ngoài trời.',
        location: 'Sân trung tâm', discoveryTags: [category('networking', 'Giao lưu'), custom('Nhiếp ảnh')] },
    { ...activity, id: 9, title: 'Giải cầu lông sinh viên', description: 'Thi đấu đôi theo vòng bảng.',
        location: 'Nhà đa năng', discoveryTags: [category('sports', 'Thể thao'), custom('Cầu lông')] },
];
let clubDirectory = [club, untaggedClub];
let activityFeed = activities;
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
        if (path === '/api/clubs/applications' && request.method() === 'POST') {
            clubApplication = { ...request.postDataJSON(), id: 11, requesterUserId: 901, status: 'Submitted', version };
            return ok(clubApplication);
        }
        if (request.method() !== 'GET') return route.abort();
        if (path === '/api/v2/recommendations/interaction-settings')
            return ok({ clickEnabled: true, viewEnabled: true, viewSeconds: 2, visiblePercent: 75, version });
        if (path === '/api/v2/recommendations/activities')
            return ok({ available: true, items: [
                { rank: 1, activity: { ...other, id: 999, title: 'Hoạt động ngoài feed' } },
                { rank: 2, activity: other },
            ] });
        if (path === '/api/v2/recommendations/clubs')
            return ok({ available: true, items: [
                { rank: 1, club: { clubId: 999 } },
                { rank: 2, club: { clubId: untaggedClub.id } },
            ] });
        if (path === '/api/users/me')
            return ok({ id: 901, fullName: 'QA Discovery', email: 'qa@example.test', roles: ['CLUB_MEMBER'], isActive: true, campusCode: 'HAN' });
        if (path === '/api/users/me/profile')
            return ok({ userId: 901, version: 'qa', profile: { interests: [] }, personal: {}, academic: {},
                editableFields: [], onboarding: { version: 1, completedAt: '2026-01-01T00:00:00Z' } });
        if (path === '/api/clubs') return ok(clubDirectory);
        const clubDetail = clubDirectory.find(({ id }) => path === `/api/clubs/${id}`);
        if (clubDetail) return ok(clubDetail);
        if (path === '/api/clubs/me/access' || path === '/api/clubs/me/memberships') return ok([]);
        if (path === '/api/clubs/applications/me') return ok(clubApplication ? [clubApplication] : []);
        if (path === '/api/v2/activities/feed') return ok({ items: activityFeed, page: 1, totalPages: 1, scopeVersion: 'qa' });
        const detail = activityFeed.find(({ id }) => path === `/api/v2/activities/${id}`);
        if (detail) return ok(detail);
        if (/^\/api\/activities\/\d+\/resources$/.test(path)) return ok({ items: [], availability: 'AVAILABLE' });
        return ok({ items: [], page: 1, totalPages: 0 });
    });
    await checkDiscovery(page, errors);
} finally {
    await browser.close();
}

async function checkDiscovery(page, errors) {
    await page.goto(`${base}/v2/activities?tag=${encodeURIComponent(workshop.id)}`, { waitUntil: 'domcontentloaded' });
    const categories = page.getByRole('combobox', { name: 'Thể loại hoạt động' });
    const tagFilter = page.getByRole('combobox', { name: 'Tag', exact: true });
    await page.getByRole('heading', { name: activity.title }).waitFor();
    assert.equal(await categories.inputValue(), 'workshop');
    assert.equal(await tagFilter.getByRole('option', { name: workshop.label }).count(), 0);
    await categories.selectOption('ALL');
    await page.getByRole('heading', { name: other.title }).waitFor();
    await categories.selectOption('workshop');
    await page.getByRole('heading', { name: other.title }).waitFor({ state: 'detached' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: activity.title }).waitFor();
    assert.equal(await categories.inputValue(), 'workshop');
    await categories.selectOption('ALL');
    await page.getByRole('heading', { name: other.title }).waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('thiết kế robot');
    await page.getByRole('heading', { name: other.title }).waitFor({ state: 'detached' });
    await page.getByRole('heading', { name: activity.title }).waitFor();
    await page.getByRole('textbox', { name: 'Tìm kiếm' }).fill('');
    await tagFilter.selectOption(tag.id);
    await page.getByRole('heading', { name: other.title }).waitFor({ state: 'detached' });
    await categories.selectOption('competition');
    await page.getByRole('heading', { name: 'Không tìm thấy hoạt động' }).waitFor();
    await page.getByRole('button', { name: `Bỏ bộ lọc ${competition.label}` }).click();
    await page.getByRole('heading', { name: activity.title }).waitFor();
    assert.equal(await tagFilter.inputValue(), tag.id);
    await page.getByRole('button', { name: 'Xóa tất cả bộ lọc' }).click();
    await page.getByRole('heading', { name: other.title }).waitFor();
    assert.deepEqual(await page.locator('.v2-event-grid h3').allTextContents(),
        [other, ...activities.filter((item) => item.id !== other.id)].map(({ title }) => title));
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
    const tagSection = page.getByRole('region', { name: 'Tag', exact: true });
    for (const { label } of activity.discoveryTags)
        await tagSection.getByText(label, { exact: true }).waitFor();
    const click = events.find((event) => event.action === 'click');
    assert.ok(click?.eventId);
    assert.equal(click.entityId, 4);
    assert.equal(click.captureVersion, version);
    await page.goto(`${base}/v2/clubs?tag=${encodeURIComponent(technology.id)}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: club.name }).waitFor();
    const clubCategories = page.getByRole('combobox', { name: 'Lĩnh vực CLB' });
    assert.equal(await clubCategories.inputValue(), technology.label);
    assert.equal(await tagFilter.getByRole('option', { name: technology.label }).count(), 0);
    await clubCategories.selectOption('ALL');
    await page.getByRole('heading', { name: 'CLB đối chứng' }).waitFor();
    await page.getByRole('checkbox', { name: 'Đang tuyển thành viên' }).check();
    await tagFilter.selectOption(tag.id);
    await page.getByRole('heading', { name: 'CLB đối chứng' }).waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Bỏ bộ lọc Đang tuyển thành viên' }).click();
    assert.equal(await page.getByRole('checkbox', { name: 'Đang tuyển thành viên' }).isChecked(), false);
    assert.equal(await tagFilter.inputValue(), tag.id);
    await page.getByRole('button', { name: 'Xóa tất cả bộ lọc' }).click();
    await page.getByRole('heading', { name: 'CLB đối chứng' }).waitFor();
    await page.getByRole('heading', { name: club.name }).waitFor();
    assert.deepEqual(await page.locator('.v2-club-grid h3').allTextContents(), [untaggedClub.name, club.name]);
    await page.getByRole('link', { name: `Khám phá ${club.name}` }).click();
    for (const { label } of club.discoveryTags)
        await tagSection.getByText(label, { exact: true }).waitFor();
    await page.goto(`${base}/v2/clubs/${untaggedClub.code}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: untaggedClub.name }).waitFor();
    assert.equal(await tagSection.count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    const headingStyles = [];
    for (const path of ['clubs', 'activities']) {
        await page.goto(`${base}/v2/${path}`, { waitUntil: 'domcontentloaded' });
        await tagFilter.waitFor();
        const toolbar = await page.locator('.v2-directory-toolbar').boundingBox();
        assert.ok(toolbar.x >= 0 && toolbar.x + toolbar.width <= 390);
        await tagFilter.selectOption(tag.id);
        await page.getByRole('button', { name: `Bỏ bộ lọc ${tag.label}` }).waitFor();
        assert.deepEqual(await page.locator('.v2-directory-toolbar').boundingBox(), toolbar);
        assert.equal(await page.locator('.v2-directory-toolbar').evaluate((element) =>
            element.scrollWidth <= element.clientWidth), true);
        headingStyles.push(await page.locator('.v2-page-heading-title').evaluate((element) => {
            const { fontSize, fontWeight, lineHeight, marginBlock, letterSpacing } = getComputedStyle(element);
            return { fontSize, fontWeight, lineHeight, marginBlock, letterSpacing };
        }));
    }
    assert.deepEqual(...headingStyles);
    await page.goto(`${base}/v2/my-clubs`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Đăng ký mở CLB' }).click();
    const dialog = page.getByRole('dialog');
    const values = {
        name: 'CLB Robot', code: 'ROBOT', purpose: 'Học lắp ráp robot', description: 'Thử nghiệm robot theo nhóm',
        founderPhone: '0912345678', founderOrganization: 'SE', memberOrganization: 'SE',
        mainActivities: 'Workshop', activityFrequencyCount: '2',
    };
    for (const [name, value] of Object.entries(values)) await dialog.locator(`[name="${name}"]`).fill(value);
    await dialog.locator('[name="category"]').selectOption('TECHNOLOGY');
    await dialog.getByRole('textbox', { name: 'Tag tự nhập' }).fill('Robot, Thiết kế 3D');
    await dialog.getByText('Thiết kế 3D', { exact: true }).waitFor();
    for (const check of await dialog.locator('input[type=checkbox]').all()) await check.check();
    await dialog.getByRole('button', { name: 'Gửi đơn thành lập' }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.deepEqual(clubApplication.tagSelection.custom, ['Robot', 'Thiết kế 3D']);
    await checkDiscoveryPreview(page);
    assert.deepEqual(errors, []);
    console.log('DISCOVERY_TAGS_BROWSER_OK: ClubHub filters, search, detail tags, and versioned click/view on the served build.');
}

async function checkDiscoveryPreview(page) {
    clubDirectory = previewClubs;
    activityFeed = [
        ...previewActivities,
        { ...activity, id: 100, title: 'Hoạt động sắp tới bổ sung' },
        { ...activity, id: 200, title: 'Hoạt động đang diễn ra', status: 'LIVE' },
    ];
    await page.goto(`${base}/v2`, { waitUntil: 'domcontentloaded' });
    const activityCards = page.locator('.v2-recommended-activities .v2-event-grid h3');
    await activityCards.first().filter({ hasText: other.title }).waitFor();
    assert.equal(await activityCards.count(), 6);
    assert.equal(await activityCards.filter({ hasText: 'Hoạt động đang diễn ra' }).count(), 0);

    const clubCards = page.locator('#club-directory .v2-club-grid h3');
    await clubCards.first().filter({ hasText: untaggedClub.name }).waitFor();
    const visibleClubs = await clubCards.allTextContents();
    for (const pageNumber of [2, 3]) {
        await page.getByRole('button', { name: `Trang ${pageNumber}`, exact: true }).click();
        visibleClubs.push(...await clubCards.allTextContents());
    }
    assert.equal(visibleClubs.length, 18);
    assert.equal(new Set(visibleClubs).size, 18);
    assert.equal(await page.getByRole('button', { name: 'Trang 4', exact: true }).count(), 0);
}
