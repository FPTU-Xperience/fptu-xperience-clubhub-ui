import test from 'node:test';
import assert from 'node:assert/strict';
import { filterActivityFeed } from './activity-data.js';
import { filterClubDirectory } from './discover-data.js';
import { observeDiscoveryView } from '../../services/discovery-interactions.js';
import { tagDraft, tagSelectionPayload } from '../../services/discovery-tags.js';

test('tag search and filtering compose with existing catalog filters', () => {
    const tagged = { name: 'Club', title: 'Activity', status: 'UPCOMING', category: 'Học thuật',
        discoveryTags: [{ id: 'experience:Research', label: 'Nghiên cứu' }] };
    const untagged = { ...tagged, discoveryTags: [] };
    assert.deepEqual(filterClubDirectory([tagged, untagged], { query: 'NGHIÊN CỨU', category: 'Học thuật' }), [tagged]);
    assert.deepEqual(filterActivityFeed([tagged, untagged], '', 'UPCOMING', 'experience:Research'), [tagged]);
    assert.deepEqual(filterActivityFeed([tagged], 'nghiên cứu', 'LIVE', 'experience:Research'), []);
    const selection = { experience: ['RealWorldWork'], activityCategory: 'workshop', custom: ['C#', 'Thiết kế API'] };
    assert.deepEqual(tagSelectionPayload(tagDraft(selection)), selection);
    assert.throws(() => tagSelectionPayload({ ...tagDraft(), customText: 'AI, ai' }), /khác nhau/);
});

test('a view needs the configured continuous visibility after scrolling stops', (context) => {
    context.mock.timers.enable({ apis: ['setTimeout'] });
    const original = { window: globalThis.window, document: globalThis.document, observer: globalThis.IntersectionObserver };
    let intersect;
    globalThis.window = new EventTarget();
    globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible', hasFocus: () => true });
    globalThis.IntersectionObserver = class {
        constructor(callback) { intersect = (ratio) => callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]); }
        observe() {}
        disconnect() {}
    };
    let views = 0;
    const dispose = observeDiscoveryView({}, () => views++, { viewSeconds: 7, visiblePercent: 75 });
    try {
        intersect(0.6);
        context.mock.timers.tick(7000);
        assert.equal(views, 0);
        intersect(0.8);
        context.mock.timers.tick(4000);
        window.dispatchEvent(new Event('scroll'));
        context.mock.timers.tick(6999);
        assert.equal(views, 0);
        context.mock.timers.tick(1);
        assert.equal(views, 1);
        window.dispatchEvent(new Event('scroll'));
        context.mock.timers.tick(7000);
        assert.equal(views, 1);
        intersect(0);
        intersect(0.8);
        document.visibilityState = 'hidden';
        document.dispatchEvent(new Event('visibilitychange'));
        context.mock.timers.tick(7000);
        assert.equal(views, 1);
        document.visibilityState = 'visible';
        document.dispatchEvent(new Event('visibilitychange'));
        context.mock.timers.tick(7000);
        assert.equal(views, 2);
    } finally {
        dispose();
        globalThis.window = original.window;
        globalThis.document = original.document;
        globalThis.IntersectionObserver = original.observer;
    }
});
