import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicTour } from '../../components/guided-help/public-tour.js';
import { publicGuidePlan } from '../../components/guided-help/public-guide-plan.js';
import { isGuideTargetPainted, isGuideTargetVisible } from '../../components/guided-help/guide-model.js';

function fixture(waitForTarget = async () => true) {
    let route = '/v2/profile?tab=settings';
    let config,
        shown = [],
        visits = [],
        stopped = [];
    let live = false;
    const tour = createPublicTour({
        plan: [
            { path: route, popover: { title: 'Intro' } },
            { path: '/v2/clubs', element: '.clubs' },
            { path: '/v2/activities', element: '.activities' },
        ],
        driver: (options) => {
            config = options;
            return {
                isActive: () => live,
                drive: (index) => {
                    live = true;
                    shown.push(index);
                },
                moveTo: (index) => shown.push(index),
                destroy: () => {
                    live = false;
                },
                getState: () => ({}),
            };
        },
        readRoute: () => route,
        navigate: (path, options) => {
            route = path;
            visits.push({ path, ...options });
        },
        findTarget: () => ({}),
        waitForTarget,
        onStop: (restore) => stopped.push(restore),
    });
    return { tour, config, shown, visits, stopped, route: () => route };
}

test('Driver aria-hidden background does not make future painted tour targets disappear', () => {
    const target = {
        getClientRects: () => [{}],
        closest: () => ({}),
        ownerDocument: { defaultView: { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) } },
    };
    assert.equal(isGuideTargetVisible(target), false);
    assert.equal(isGuideTargetPainted(target), true);
    assert.equal(isGuideTargetPainted({ ...target, getClientRects: () => [] }), false);
});

test('next and previous navigate across pages and closing restores the exact origin without filling history', async () => {
    const f = fixture();
    await f.tour.start();
    assert.deepEqual(f.shown, [0]);
    assert.equal(f.visits.length, 0);
    await f.config.onPrevClick();
    assert.deepEqual(f.stopped, []);
    await f.config.onNextClick();
    assert.equal(f.route(), '/v2/clubs');
    await f.config.onNextClick();
    assert.equal(f.route(), '/v2/activities');
    await f.config.onPrevClick();
    assert.equal(f.route(), '/v2/clubs');
    f.config.onDestroyStarted();
    assert.equal(f.route(), '/v2/profile?tab=settings');
    assert.ok(f.visits.every((item) => item.replace));
    assert.deepEqual(f.stopped, [true]);
});

test('missing targets are skipped and stale waits cannot move the tour after closing', async () => {
    const f = fixture(async ({ selector }) => selector !== '.clubs');
    await f.tour.start();
    await f.config.onNextClick();
    assert.deepEqual(f.shown, [0, 2]);
    let complete;
    const pending = fixture(
        () =>
            new Promise((resolve) => {
                complete = resolve;
            }),
    );
    const start = pending.tour.start();
    pending.tour.stop(false);
    complete(true);
    await start;
    assert.equal(pending.shown.length, 0);
    assert.deepEqual(pending.stopped, [false]);
});

test('manual navigation cancels without redirecting the user back', async () => {
    const f = fixture();
    await f.tour.start();
    f.tour.routeChanged('/v2/personal-experience');
    await f.config.onNextClick();
    assert.equal(f.visits.length, 0);
    assert.deepEqual(f.stopped, [false]);
});

test('closing during cross-page loading prevents stale advancement and restores origin', async () => {
    let complete;
    const f = fixture(({ selector }) =>
        selector
            ? new Promise((resolve) => {
                  complete = resolve;
              })
            : Promise.resolve(true),
    );
    await f.tour.start();
    const pending = f.config.onNextClick();
    await f.config.onNextClick();
    assert.equal(f.visits.length, 1);
    f.tour.stop();
    complete(true);
    await pending;
    assert.deepEqual(f.shown, [0]);
    assert.equal(f.route(), '/v2/profile?tab=settings');
});

test('finishing the final tour step restores origin and leaves business actions disabled', async () => {
    const f = fixture();
    await f.tour.start();
    await f.config.onNextClick();
    await f.config.onNextClick();
    f.config.onDoneClick();
    assert.equal(f.route(), '/v2/profile?tab=settings');
    assert.equal(f.config.disableActiveInteraction, true);
    assert.deepEqual(f.stopped, [true]);
});

test('public plan covers main student tabs while staff only see applicable navigation', () => {
    const studentPaths = new Set(publicGuidePlan('/v2').map((item) => item.path));
    for (const path of [
        '/v2',
        '/v2/clubs',
        '/v2/activities',
        '/v2/my-clubs',
        '/v2/my-schedule',
        '/v2/study-schedule',
        '/v2/personal-experience',
        '/v2/profile',
    ])
        assert.ok(studentPaths.has(path));
    assert.ok(!publicGuidePlan('/v2', false).some((item) => item.path === '/v2/my-clubs'));
});
