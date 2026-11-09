import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudyScheduleApi } from './schedule-api.js';

const user = { id: 100 };
const period = { year: 2026, term: 'FA', block: '10W' };
const snapshot = (version) => ({ version, calendarVersion: 'calendar-v1', entries: [] });
const slot = { subject: 'SWP391', room: '101' };

test('schedule writes require a fresh read after a conflict or uncertain network outcome', async () => {
    let fail = false;
    const requests = [];
    const api = createStudyScheduleApi({
        request: async (path, options) => {
            requests.push({ path, options });
            if (options && fail) throw Object.assign(new Error('lost response'), { status: 409 });
            return snapshot('v1');
        },
    });
    await assert.rejects(api.putSlot(user, period, 1, 'mon', 'slot-1', slot));
    await api.get(user, period);
    fail = true;
    await assert.rejects(api.putSlot(user, period, 1, 'mon', 'slot-1', slot));
    fail = false;
    await assert.rejects(api.putSlot(user, period, 1, 'mon', 'slot-1', slot));
    await api.get(user, period);
    await api.putSlot(user, period, 1, 'mon', 'slot-1', slot);
    assert.equal(JSON.parse(requests.at(-1).options.body).expectedCalendarVersion, 'calendar-v1');
    await assert.rejects(api.putSlot({ id: 101 }, period, 1, 'mon', 'slot-1', slot));
    await assert.rejects(api.putSlot(user, { ...period, block: '3W' }, 1, 'mon', 'slot-1', slot));
});

test('an older read cannot replace the version of a newer schedule response', async () => {
    const pending = [];
    let wire;
    const api = createStudyScheduleApi({
        request: (path, options) => {
            if (options) {
                wire = JSON.parse(options.body);
                return Promise.resolve(snapshot('v3'));
            }
            return new Promise((resolve) => pending.push(resolve));
        },
    });
    const first = api.get(user, period);
    const second = api.get(user, period);
    pending[1](snapshot('v2'));
    await second;
    pending[0](snapshot('v1'));
    await first;
    await api.putSlot(user, period, 1, 'mon', 'slot-1', slot);
    assert.equal(wire.expectedVersion, 'v2');
});

test('delete reads the new block version before allowing another edit', async () => {
    let version = 'v1';
    let wire;
    const api = createStudyScheduleApi({
        request: async (path, options) => {
            if (options?.method === 'DELETE') {
                assert.match(path, /expectedVersion=v1/);
                version = 'v2';
                return null;
            }
            if (options) wire = JSON.parse(options.body);
            return snapshot(version);
        },
    });
    await api.get(user, period);
    await api.deleteSlot(user, period, 1, 'mon', 'slot-1');
    await api.putSlot(user, period, 1, 'mon', 'slot-1', slot);
    assert.equal(wire.expectedVersion, 'v2');
});
