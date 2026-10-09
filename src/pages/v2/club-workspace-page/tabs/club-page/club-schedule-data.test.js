import assert from 'node:assert/strict';
import test from 'node:test';
import { clampClubTime, displayClubSchedule, formatClubSchedule, parseClubSchedule } from './club-schedule-data.js';

test('semester, weekdays, half-hour times and recurrence survive round-trip', () => {
    const schedule = { year: 2026, term: 'FA', days: ['sat', 'mon'], start: 1080, end: 1230, repeat: true };
    const label = formatClubSchedule(schedule);
    assert.equal(label, 'FA2026 · T2, T7 · 18:00–20:30 · Hằng tuần');
    assert.deepEqual(parseClubSchedule(label), { ...schedule, days: ['mon', 'sat'] });
    const once = { ...schedule, end: 1440, repeat: false };
    assert.equal(parseClubSchedule(formatClubSchedule(once)).end, 1440);
    assert.equal(parseClubSchedule(formatClubSchedule(once)).repeat, false);
});

test('older weekly labels stay readable and editable without rewriting saved data', () => {
    for (const suffix of ['Lặp lại hàng tuần', 'Lặp lại hằng tuần']) {
        const old = `FA2026 · T2 · 18:00–20:00 · ${suffix}`;
        assert.equal(parseClubSchedule(old).repeat, true);
        assert.equal(displayClubSchedule(old), 'FA2026 · T2 · 18:00–20:00 · Hằng tuần');
    }
    assert.equal(displayClubSchedule('Thứ bảy'), 'Thứ bảy');
    assert.equal(displayClubSchedule(null), '');
});

test('range handles snap to half hours and cannot cross or leave the day', () => {
    assert.equal(clampClubTime(1088, 'start', 1080, 1200), 1080);
    assert.equal(clampClubTime(1300, 'start', 1080, 1200), 1170);
    assert.equal(clampClubTime(0, 'end', 1080, 1200), 1110);
    assert.equal(clampClubTime(-30, 'start', 1080, 1200), 0);
    assert.equal(clampClubTime(1800, 'end', 1080, 1200), 1440);
    assert.equal(clampClubTime(NaN, 'start', 1080, 1200), 1080);
});

test('legacy text is not guessed and malformed schedules are rejected', () => {
    assert.equal(parseClubSchedule('Thứ bảy'), null);
    for (const value of ['FA2026 · T2, T2 · 18:00–20:00 · Không lặp lại', 'FA2026 · T8 · 18:00–20:00 · Không lặp lại', 'FA2026 · T2 · 18:15–20:00 · Không lặp lại', 'FA2026 · T2 · 20:00–18:00 · Không lặp lại', 'FA2026 · T2 · 18:00–24:30 · Không lặp lại']) assert.equal(parseClubSchedule(value), null);
    assert.equal(formatClubSchedule({ year: 2026, term: 'FA', days: [], start: 1080, end: 1200, repeat: true }), '');
});
