import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.CLUB_TASKS_BASE_URL || 'https://fptux-clubhub-ui.pages.dev';
const id = (n) => '11111111-1111-4111-8111-' + String(n).padStart(12, '0');
const browser = await chromium.launch();
try {
    fs.mkdirSync('TestResults/event-tasks', { recursive: true });
    for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
        page.setDefaultTimeout(30000);
        let actor = 104,
            failStaff = false,
            writes = 0;
        const errors = [],
            staffingReads = [];
        const events = [
            { id: 4, clubId: 1, title: 'Sự kiện có tuyển dụng' },
            { id: 5, clubId: 1, title: 'Sự kiện phân công trực tiếp' },
        ];
        page.on('pageerror', (issue) => errors.push(issue.message));
        await page.addInitScript(() =>
            localStorage.setItem(
                'fptux:session:v1',
                JSON.stringify({ id: 'isolated-event-tasks', accessToken: 'intercepted-test-token' }),
            ),
        );
        await page.route('**/*', async (route) => {
            const request = route.request(),
                url = new URL(request.url()),
                path = url.pathname;
            if (!path.startsWith('/api/')) return route.continue();
            const send = (value, status = 200) =>
                route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
            if (request.method() !== 'GET') {
                writes++;
                throw new Error('Unexpected task write blocked: ' + path);
            }
            if (path === '/api/users/me')
                return send({
                    id: actor,
                    fullName: 'Task member',
                    email: 'tasks@example.test',
                    roles: ['CLUB_MEMBER'],
                    isActive: true,
                    isLocked: false,
                    campusCode: 'HAN',
                });
            if (path === '/api/users/me/profile')
                return send({
                    userId: actor,
                    version: 'fixture',
                    profile: { interests: [] },
                    personal: {},
                    academic: {},
                    editableFields: [],
                    onboarding: { version: 1, completedAt: '2026-01-01T00:00:00Z' },
                });
            if (path === '/api/clubs')
                return send([{ id: 1, code: 'TEST', name: 'Event tasks club', campusCode: 'HAN', isActive: true }]);
            if (path === '/api/clubs/1')
                return send({
                    id: 1,
                    code: 'TEST',
                    name: 'Event tasks club',
                    category: 'TECHNOLOGY',
                    version: id(1),
                    members: [],
                    managers: [],
                    isActive: true,
                });
            if (path === '/api/clubs/me/access')
                return send([{ clubId: 1, clubName: 'Event tasks club', isManager: false, isApprovedMember: true }]);
            if (path === '/api/clubs/me/memberships' || path === '/api/clubs/1/memberships') return send([]);
            if (path === '/api/clubs/1/workspace-semesters')
                return send({
                    items: [
                        {
                            id: id(1),
                            code: 'FA2026',
                            label: 'Fall 2026',
                            semesterId: 'FA2026',
                            isCurrent: true,
                            editable: true,
                            startUtc: '2026-09-01T00:00:00Z',
                            endUtc: '2027-01-01T00:00:00Z',
                        },
                    ],
                });
            if (path === '/api/activities') {
                assert.equal(url.searchParams.get('clubId'), '1');
                return send(events);
            }
            if (path === '/api/clubs/1/activity-recruitments') {
                assert.equal(url.searchParams.get('from'), '2026-09-01T00:00:00Z');
                return send({
                    items: [
                        {
                            id: id(2),
                            activityId: 4,
                            clubId: 1,
                            activityTitle: events[0].title,
                            title: 'Tuyển nhân sự workshop',
                            status: 'OPEN',
                            visibility: 'PRIVATE',
                            canView: true,
                        },
                    ],
                    page: 1,
                    totalItems: 1,
                    totalPages: 1,
                });
            }
            if (/^\/api\/activities\/(4|5)\/staffing$/.test(path)) {
                const activityId = Number(path.split('/')[3]);
                staffingReads.push(activityId);
                if (activityId === 5 && failStaff) return send({ message: 'Temporary staffing failure' }, 503);
                return send({
                    activityId,
                    version: 1,
                    applicationStatus: 'APPROVED',
                    isPublished: true,
                    capabilities: {},
                    actions: [{ id: 10, name: 'Hậu cần', verificationMethod: 'WORK_REVIEW' }],
                    assignments:
                        activityId === 5
                            ? [
                                  {
                                      id: id(3),
                                      userId: 104,
                                      displayName: 'Task member',
                                      actionRuleId: 10,
                                      actionName: 'Hậu cần',
                                      assignmentKind: 'STAFF',
                                      status: 'ASSIGNED',
                                      canSubmit: false,
                                      completions: [],
                                  },
                              ]
                            : [],
                    recruitment:
                        activityId === 4
                            ? {
                                  title: 'Tuyển nhân sự workshop',
                                  status: 'OPEN',
                                  visibility: 'PRIVATE',
                                  eligibility: 'CLUB_MEMBERS',
                                  applicationWorkflow: 'APPROVAL_REQUIRED_V1',
                                  positions: [],
                              }
                            : null,
                });
            }
            return send({ items: [], page: 1, total: 0, totalItems: 0, totalPages: 0 });
        });
        await page.goto(base + '/v2/my-clubs/TEST/quests', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Tất cả (2)', exact: true }).waitFor();
        assert.equal(await page.locator('.v2-club-recruitment-list > button').count(), 2);
        assert.deepEqual([...new Set(staffingReads)].sort(), [4, 5]);
        await page.screenshot({ path: `TestResults/event-tasks/list-${width}.png`, fullPage: true });
        await page.getByRole('button', { name: 'Phân công (1)', exact: true }).click();
        await page.locator('.v2-club-recruitment-list > button').click();
        await page.getByRole('heading', { name: 'Phân công hoạt động', exact: true }).waitFor();
        await page.locator('.v2-activity-staffing').getByText(/Hậu cần/).first().waitFor();
        await page.screenshot({ path: `TestResults/event-tasks/direct-assignment-${width}.png`, fullPage: true });
        await page.getByRole('button', { name: '← Danh sách nhiệm vụ', exact: true }).click();
        await page.getByRole('button', { name: 'Tuyển dụng (1)', exact: true }).click();
        await page.locator('.v2-club-recruitment-list > button').click();
        await page.getByRole('heading', { name: 'Tuyển dụng nhân sự', exact: true }).waitFor();
        actor = 105;
        await page.reload({ waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Tất cả (1)', exact: true }).waitFor();
        assert.equal(await page.getByRole('button', { name: 'Phân công (0)', exact: true }).count(), 1);
        failStaff = true;
        await page.getByRole('button', { name: 'Tải lại nhiệm vụ', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Temporary staffing failure' }).waitFor();
        assert.equal(await page.locator('.v2-club-recruitment-list > button').count(), 1);
        assert.equal(writes, 0);
        assert.deepEqual(errors, []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        console.log(
            'EVENT_TASKS_BROWSER_OK',
            width,
            'event recruitment, direct assignments without notice, source-linked panels, actor/semester scope and partial failure; API traffic isolated',
        );
        await page.close();
    }
} finally {
    await browser.close();
}
