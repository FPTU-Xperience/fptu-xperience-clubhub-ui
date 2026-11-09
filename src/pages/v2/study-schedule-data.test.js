import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { emptyAcademicCalendar, validateAcademicCalendar } from './academic-calendar-data.js';
import {
    STUDY_BLOCKS, STUDY_DAYS, STUDY_SLOTS_10W, STUDY_SLOTS_3W, STUDY_TERMS,
    defaultStudyPeriod, formatStudyDate, getCurrentStudyWeek, getStudySlot,
    getStudyWeekCount, getStudyWeekDates, studyPeriodKey, normalizeStudyTemplate,
    toStudyEntryList, toStudyEntryMap,
} from './study-schedule-data.js';

const fa10 = { year: 2026, term: 'FA', block: '10W' };
const fa3 = { year: 2026, term: 'FA', block: '3W' };

test('study terms and blocks use seven days and their own requested time grids', () => {
    assert.deepEqual(
        STUDY_DAYS.map((day) => day.id),
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    );
    assert.deepEqual(
        STUDY_TERMS.map((term) => term.id),
        ['SP', 'SU', 'FA'],
    );
    assert.deepEqual(
        STUDY_BLOCKS.map((block) => block.id),
        ['10W', '3W'],
    );
    assert.deepEqual(
        STUDY_SLOTS_10W.map((slot) => slot.label),
        ['07:00–09:15', '09:30–11:45', '12:30–14:45', '15:00–17:15', '17:30–19:45'],
    );
    assert.deepEqual(
        STUDY_SLOTS_3W.map((slot) => slot.label),
        ['07:00–08:30', '08:45–10:15', '10:30–12:00', '12:30–14:00', '14:15–15:45', '16:00–17:30', '17:45–19:15'],
    );
    assert.deepEqual(defaultStudyPeriod(new Date(2026, 9, 7)), fa10);
    assert.equal(studyPeriodKey(fa3), '2026:FA:3W');
    assert.equal(getStudyWeekCount('10W'), 10);
    assert.equal(getStudyWeekCount('3W'), 3);
});

test('server calendar dates label block-local weeks and ISO year boundaries', () => {
    const calendar = validateAcademicCalendar({ termStartDate: '2026-05-30', block10StartDate: '2026-06-01', block3StartDate: '2026-08-10' });
    assert.throws(() => validateAcademicCalendar({ ...calendar, block3StartDate: '2026-08-04' }), /Thứ Hai/);
    assert.throws(() => validateAcademicCalendar({ ...calendar, block3StartDate: '2026-08-03' }), /10 tuần/);
    assert.throws(() => validateAcademicCalendar({ ...calendar, termStartDate: '2026-02-30' }), /hợp lệ/);
    const last10 = getStudyWeekDates(calendar, '10W', 10);
    const first3 = getStudyWeekDates(calendar, '3W', 1);
    assert.equal(formatStudyDate(last10.days[0]), '03/08');
    assert.equal(formatStudyDate(last10.days[6]), '09/08');
    assert.equal(last10.calendarWeek, 32);
    assert.equal(formatStudyDate(first3.days[0]), '10/08');
    assert.equal(first3.calendarWeek, 33);
    assert.equal(getCurrentStudyWeek(calendar, '3W', new Date(2026, 7, 12)), 1);
    assert.equal(getCurrentStudyWeek(calendar, '10W', new Date(2026, 7, 12)), null);
    const boundary = { ...calendar, block10StartDate: '2020-12-28' };
    assert.deepEqual([getStudyWeekDates(boundary, '10W', 1).calendarWeek, getStudyWeekDates(boundary, '10W', 2).calendarWeek], [53, 1]);
    assert.equal(getStudyWeekDates(emptyAcademicCalendar, '10W', 1), null);
    assert.throws(() => getStudyWeekDates(calendar, '3W', 4), /Tuần/);
});

test('API cell projections validate block slots, duplicates and text without browser storage', () => {
    const list = [{ day: 'tue', slotId: 'slot-7', subject: '  Thiết kế  ', room: '  A101  ' }];
    const entries = toStudyEntryMap(list, '3W');
    assert.deepEqual(getStudySlot(entries, 'tue', 'slot-7'), { subject: 'Thiết kế', room: 'A101' });
    assert.deepEqual(toStudyEntryList(entries, '3W'), [{ day: 'tue', slotId: 'slot-7', subject: 'Thiết kế', room: 'A101' }]);
    assert.throws(() => toStudyEntryMap([...list, ...list], '3W'), /trùng/);
    assert.throws(() => toStudyEntryMap(list, '10W'), /Khung giờ/);
    assert.throws(() => toStudyEntryMap([{ ...list[0], subject: ' ' }], '3W'), /môn học/);
    assert.throws(() => toStudyEntryMap([{ ...list[0], room: 'x'.repeat(81) }], '3W'), /Phòng học/);
    assert.throws(() => studyPeriodKey({ ...fa3, term: 'XX' }), /Học kỳ/);
});

test('weekly bulk templates normalize input and reject duplicate or invalid cells before API writes', () => {
    const template = [{ day: 'mon', slotId: 'slot-1', subject: '  SWP391  ', room: '  AL-R101  ' }, { day: 'wed', slotId: 'slot-3', subject: 'Tiếng Anh', room: '' }];
    assert.deepEqual(normalizeStudyTemplate(template, '10W'), [{ day: 'mon', slotId: 'slot-1', subject: 'SWP391', room: 'AL-R101' }, template[1]]);
    assert.throws(() => normalizeStudyTemplate([...template, ...template], '10W'), /trùng/);
    assert.throws(() => normalizeStudyTemplate([{ ...template[0], slotId: 'slot-7' }], '10W'), /Khung giờ/);
    assert.throws(() => normalizeStudyTemplate([], '3W'), /không hợp lệ/);
});

test('production route and personal navigation own the study schedule without demo state', () => {
    const app = readFileSync(new URL('./V2App.jsx', import.meta.url), 'utf8');
    const rail = readFileSync(new URL('../../components/v2/common/leftrail/LeftRail.jsx', import.meta.url), 'utf8');
    const page = readFileSync(new URL('./personal-pages/StudySchedulePage.jsx', import.meta.url), 'utf8');
    assert.match(app, /path="study-schedule"/);
    assert.match(rail, /'\/v2\/study-schedule', 'Lịch học'/);
    assert.match(page, /PersonalPageHeading/);
    assert.doesNotMatch(page, /DemoContext|\/v2\/demo/);
});
