import test from 'node:test';
import assert from 'node:assert/strict';
import {
    PUBLIC_MEDIA_EVENT,
    PUBLIC_MEDIA_SIGNAL_KEY,
    publishPublicMediaSaved,
    subscribePublicMediaSaved,
} from '../../services/public-media-sync.js';
import { mapClubDirectoryEntry } from './discover-data.js';
import { mapMyClubSelection } from './my-clubs-data.js';
import { selectionFromClubAccess } from '../../services/my-clubs-adapter.js';

test('club cards retain both saved public cover and logo URLs through mapping and membership adaptation', () => {
    const raw = {
        id: 7,
        code: 'C7',
        name: 'Club',
        logoUrl: 'https://cdn.example.com/logo.png',
        coverImageUrl: 'https://cdn.example.com/cover.png',
    };
    const publicClub = mapClubDirectoryEntry(raw);
    assert.equal(publicClub.coverImageUrl, raw.coverImageUrl);
    assert.equal(publicClub.logoUrl, raw.logoUrl);
    const selected = selectionFromClubAccess([{ clubId: 7, isManager: true }], [raw]);
    const [myClub] = mapMyClubSelection(selected);
    assert.equal(myClub.coverImageUrl, raw.coverImageUrl);
    assert.equal(myClub.logoUrl, raw.logoUrl);
});
test('successful-save signals refresh matching entity kinds in the same tab and across storage events', () => {
    const target = new EventTarget();
    const stored = new Map();
    target.localStorage = { setItem: (key, value) => stored.set(key, value) };
    const received = [],
        activities = [];
    const stop = subscribePublicMediaSaved('club', (signal) => received.push(signal), target);
    const stopActivities = subscribePublicMediaSaved('activity', (signal) => activities.push(signal), target);
    publishPublicMediaSaved('club', 7, target);
    assert.equal(received[0].id, '7');
    assert.equal(activities.length, 0);
    const signal = JSON.parse(stored.get(PUBLIC_MEDIA_SIGNAL_KEY));
    assert.deepEqual(Object.keys(signal).sort(), ['id', 'kind', 'revision']);
    const event = new Event('storage');
    Object.assign(event, { key: PUBLIC_MEDIA_SIGNAL_KEY, newValue: JSON.stringify({ kind: 'activity', id: '11' }) });
    target.dispatchEvent(event);
    assert.equal(activities[0].id, '11');
    stop();
    stopActivities();
    publishPublicMediaSaved('club', 7, target);
    assert.equal(received.length, 1);
    assert.equal(PUBLIC_MEDIA_EVENT, 'clubhub:public-media-saved');
});
