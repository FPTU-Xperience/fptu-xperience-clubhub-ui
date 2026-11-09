import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGuideSteps } from '../../components/guided-help/guide-model.js';
import { clubGuidePlan, onboardingGuidePlan } from '../../components/guided-help/guide-plans.js';

test('tour skips missing and hidden targets without mutating its reusable plan', () => {
    const hidden = { visible: false },
        shown = { visible: true };
    const plan = [
        { popover: { title: 'Intro' } },
        { element: '.target', popover: { title: 'Field' } },
        { element: '.missing' },
    ];
    const steps = resolveGuideSteps(
        plan,
        (selector) => (selector === '.target' ? [hidden, shown] : []),
        (item) => item.visible,
    );
    assert.equal(steps.length, 2);
    assert.equal(steps[1].element, shown);
    assert.equal(plan[1].element, '.target');
    assert.equal(
        resolveGuideSteps(
            plan,
            () => [],
            () => true,
        ).length,
        1,
    );
});

test('onboarding plans follow the current step and never execute form actions', () => {
    const profile = onboardingGuidePlan(2);
    const interests = onboardingGuidePlan(3);
    assert.ok(profile.some((item) => item.element === '.v2-onboarding-section:first-of-type'));
    assert.ok(!interests.some((item) => item.element === '.v2-onboarding-section:first-of-type'));
    assert.ok(interests.some((item) => item.element === '.v2-access-interest-grid'));
    for (const item of [...profile, ...interests])
        assert.deepEqual(Object.keys(item).sort(), item.element ? ['element', 'popover'] : ['popover']);
});

test('page tours describe the current route rather than navigating to another one', () => {
    assert.equal(clubGuidePlan('/v2/activities')[0].popover.title, 'Khám phá hoạt động');
    assert.equal(clubGuidePlan('/v2/my-clubs/tech')[0].popover.title, 'Không gian câu lạc bộ');
    assert.equal(clubGuidePlan('/v2/my-clubs/tech/reports/create')[0].popover.title, 'Báo cáo câu lạc bộ');
    assert.equal(clubGuidePlan('/v2/profile')[0].popover.title, 'Hồ sơ của bạn');
});
