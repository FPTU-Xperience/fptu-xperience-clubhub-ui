import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { emptyAcademicCalendar, readAcademicCalendar, saveAcademicCalendar } from './academic-calendar-data.js';
import { createMockAcademicCalendarRepository } from './academic-calendar-repository.js';
import {
    STUDY_BLOCKS,
    STUDY_DAYS,
    STUDY_SLOTS_10W,
    STUDY_SLOTS_3W,
    STUDY_TERMS,
    bulkImportStudySchedule,
    clearStudySlot,
    defaultStudyPeriod,
    formatStudyDate,
    getCurrentStudyWeek,
    getStudySlot,
    getStudyWeekCount,
    getStudyWeekDates,
    importLegacyStudySchedule,
    readLegacyStudySchedule,
    readStudyPeriod,
    readStudySchedule,
    saveStudySlot,
    studyPeriodKey,
    studyScheduleStorageKey,
    normalizeStudyTemplate,
    toStudyEntryList,
    toStudyEntryMap,
} from './study-schedule-data.js';
import { createMockStudyScheduleRepository } from './study-schedule-repository.js';

const fa10 = { year: 2026, term: 'FA', block: '10W' };
const fa3 = { year: 2026, term: 'FA', block: '3W' };
const sp10 = { year: 2027, term: 'SP', block: '10W' };

function memoryStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
    };
}

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

test('admin calendar controls each block start and preserves weekly student entries', async () => {
    const storage = memoryStorage();
    const student = { id: 17, roles: ['CLUB_MEMBER'] };
    const admin = { id: 18, roles: ['ADMIN'] };
    const repository = createMockAcademicCalendarRepository(storage);
    const calendar = { termStartDate: '2026-05-30', block10StartDate: '2026-06-01', block3StartDate: '2026-08-10' };
    assert.deepEqual(await repository.get(student, fa10), emptyAcademicCalendar);
    await assert.rejects(repository.save(student, fa10, calendar), /không có quyền/);
    assert.throws(() => saveAcademicCalendar(fa10, { ...calendar, block3StartDate: '2026-08-04' }, storage), /Thứ Hai/);
    assert.throws(() => saveAcademicCalendar(fa10, { ...calendar, block3StartDate: '2026-08-03' }, storage), /10 tuần/);
    await repository.save(admin, fa10, calendar);
    assert.deepEqual(readAcademicCalendar(fa3, storage), calendar);
    const last10 = getStudyWeekDates(calendar, '10W', 10);
    const first3 = getStudyWeekDates(calendar, '3W', 1);
    assert.equal(formatStudyDate(last10.days[0]), '03/08');
    assert.equal(formatStudyDate(last10.days[6]), '09/08');
    assert.equal(last10.calendarWeek, 32);
    assert.equal(formatStudyDate(first3.days[0]), '10/08');
    assert.equal(first3.calendarWeek, 33);
    assert.equal(getCurrentStudyWeek(calendar, '3W', new Date(2026, 7, 12)), 1);
    assert.equal(getCurrentStudyWeek(calendar, '10W', new Date(2026, 7, 12)), null);
    const yearBoundary = { ...calendar, block10StartDate: '2020-12-28' };
    assert.deepEqual(
        [getStudyWeekDates(yearBoundary, '10W', 1).calendarWeek, getStudyWeekDates(yearBoundary, '10W', 2).calendarWeek],
        [53, 1],
    );
    saveStudySlot(student, fa10, 1, 'mon', 'slot-1', { subject: 'SWP391' }, storage);
    saveAcademicCalendar(fa10, { ...calendar, block3StartDate: '2026-08-17' }, storage);
    assert.equal(getStudySlot(readStudySchedule(student, fa10, 1, storage), 'mon', 'slot-1').subject, 'SWP391');
    assert.equal(formatStudyDate(getStudyWeekDates(readAcademicCalendar(fa10, storage), '3W', 1).days[0]), '17/08');
});

test('manual schedule isolates user, year, term and block while allowing a cell to be cleared', () => {
    const storage = memoryStorage();
    const first = { id: 17, email: 'first@fpt.edu.vn' };
    const second = { id: 18 };
    assert.equal(studyScheduleStorageKey(null), null);
    assert.equal(studyScheduleStorageKey(first), 'clubhub:v2:study-schedule:17');

    saveStudySlot(first, fa10, 1, 'mon', 'slot-1', { subject: '  SWP391  ', room: '  AL-R101  ' }, storage);
    saveStudySlot(first, fa10, 10, 'mon', 'slot-1', { subject: 'Ôn tập' }, storage);
    saveStudySlot(first, fa3, 3, 'mon', 'slot-1', { subject: '  Tiếng Anh  ' }, storage);
    saveStudySlot(first, sp10, 1, 'sun', 'slot-5', { subject: 'Lập trình' }, storage);
    assert.deepEqual(getStudySlot(readStudySchedule(first, fa10, 1, storage), 'mon', 'slot-1'), {
        subject: 'SWP391',
        room: 'AL-R101',
    });
    assert.equal(getStudySlot(readStudySchedule(first, fa10, 10, storage), 'mon', 'slot-1').subject, 'Ôn tập');
    assert.deepEqual(readStudySchedule(first, fa10, 2, storage), {});
    assert.equal(getStudySlot(readStudySchedule(first, fa3, 3, storage), 'mon', 'slot-1').subject, 'Tiếng Anh');
    assert.equal(getStudySlot(readStudySchedule(first, sp10, 1, storage), 'sun', 'slot-5').subject, 'Lập trình');
    assert.deepEqual(readStudySchedule(second, fa10, 1, storage), {});

    clearStudySlot(first, fa10, 1, 'mon', 'slot-1', storage);
    assert.deepEqual(readStudySchedule(first, fa10, 1, storage), {});
    assert.equal(getStudySlot(readStudySchedule(first, fa10, 10, storage), 'mon', 'slot-1').subject, 'Ôn tập');
});

test('block-specific slots and invalid data cannot overwrite a saved schedule', () => {
    const storage = memoryStorage();
    const user = { id: 'student-1' };
    saveStudySlot(user, fa3, 3, 'tue', 'slot-7', { subject: 'Thiết kế' }, storage);
    assert.throws(() => saveStudySlot(user, fa10, 1, 'tue', 'slot-7', { subject: 'A' }, storage));
    assert.throws(() => saveStudySlot(user, fa3, 4, 'tue', 'slot-2', { subject: 'A' }, storage));
    assert.throws(() => saveStudySlot(user, fa3, 3, 'bad-day', 'slot-2', { subject: 'A' }, storage));
    assert.throws(() => saveStudySlot(user, fa3, 3, 'tue', 'slot-7', { subject: '  ' }, storage));
    assert.throws(() => saveStudySlot(user, { ...fa3, term: 'XX' }, 1, 'tue', 'slot-1', { subject: 'A' }, storage));
    assert.equal(getStudySlot(readStudySchedule(user, fa3, 3, storage), 'tue', 'slot-7').subject, 'Thiết kế');
    const list = toStudyEntryList(readStudySchedule(user, fa3, 3, storage), '3W');
    assert.deepEqual(toStudyEntryMap(list, '3W'), { 'tue:slot-7': { subject: 'Thiết kế', room: '' } });
    assert.throws(() => toStudyEntryMap([list[0], list[0]], '3W'), /trùng/);
    assert.throws(() => toStudyEntryMap(list, '10W'), /Khung giờ/);

    storage.setItem(studyScheduleStorageKey(user), '{bad json');
    assert.deepEqual(readStudySchedule(user, fa3, 3, storage), {});
});

test('old unassigned cells remain available for explicit import into an empty 10W period', () => {
    const storage = memoryStorage();
    const user = { id: 17 };
    storage.setItem(
        studyScheduleStorageKey(user),
        JSON.stringify({
            version: 1,
            entries: { 'mon:slot-1': { subject: 'Lịch cũ', room: 'AL-R101' } },
        }),
    );
    assert.deepEqual(readStudySchedule(user, fa10, 1, storage), {});
    assert.equal(getStudySlot(readLegacyStudySchedule(user, storage), 'mon', 'slot-1').subject, 'Lịch cũ');
    saveStudySlot(user, fa3, 1, 'wed', 'slot-7', { subject: 'Môn mới' }, storage);
    assert.equal(getStudySlot(readLegacyStudySchedule(user, storage), 'mon', 'slot-1').subject, 'Lịch cũ');
    assert.throws(() => importLegacyStudySchedule(user, fa3, storage), /10W/);
    saveStudySlot(user, fa10, 10, 'fri', 'slot-2', { subject: 'Không ghi đè' }, storage);
    assert.throws(() => importLegacyStudySchedule(user, fa10, storage), /đã có lịch/);
    clearStudySlot(user, fa10, 10, 'fri', 'slot-2', storage);
    importLegacyStudySchedule(user, fa10, storage);
    assert.deepEqual(readLegacyStudySchedule(user, storage), {});
    assert.equal(getStudySlot(readStudySchedule(user, fa10, 1, storage), 'mon', 'slot-1').subject, 'Lịch cũ');
    assert.equal(getStudySlot(readStudySchedule(user, fa10, 10, storage), 'mon', 'slot-1').subject, 'Lịch cũ');
    assert.equal(getStudySlot(readStudySchedule(user, fa3, 1, storage), 'wed', 'slot-7').subject, 'Môn mới');
});

test('version-2 repeating block schedules remain present in every week after upgrade', () => {
    const storage = memoryStorage();
    const user = { id: 27 };
    storage.setItem(
        studyScheduleStorageKey(user),
        JSON.stringify({
            version: 2,
            schedules: { '2026:FA:3W': { 'thu:slot-7': { subject: 'Seminar', room: '' } } },
            legacyEntries: null,
        }),
    );
    assert.equal(readStudyPeriod(user, fa3, storage).length, 3);
    saveStudySlot(user, fa3, 2, 'thu', 'slot-7', { subject: 'Tuần hai' }, storage);
    assert.equal(getStudySlot(readStudySchedule(user, fa3, 1, storage), 'thu', 'slot-7').subject, 'Seminar');
    assert.equal(getStudySlot(readStudySchedule(user, fa3, 2, storage), 'thu', 'slot-7').subject, 'Tuần hai');
    assert.equal(getStudySlot(readStudySchedule(user, fa3, 3, storage), 'thu', 'slot-7').subject, 'Seminar');
});

test('temporary repository returns period-scoped DTOs and isolates accounts', async () => {
    const storage = memoryStorage();
    const repository = createMockStudyScheduleRepository(storage);
    const first = { id: 17 };
    const second = { id: 18 };
    assert.deepEqual(await repository.get(first, fa10), { ...fa10, calendar: emptyAcademicCalendar, entries: [] });
    const calendar = { termStartDate: '2026-05-30', block10StartDate: '2026-06-01', block3StartDate: '2026-08-10' };
    saveAcademicCalendar(fa10, calendar, storage);
    const saved = await repository.putSlot(first, fa10, 10, 'sun', 'slot-5', { subject: '  Thiết kế  ' });
    assert.deepEqual(saved, { week: 10, day: 'sun', slotId: 'slot-5', subject: 'Thiết kế', room: '' });
    assert.deepEqual(await repository.get(first, fa10), { ...fa10, calendar, entries: [saved] });
    assert.deepEqual(await repository.get(first, fa3), { ...fa3, calendar, entries: [] });
    assert.deepEqual(await repository.get(second, fa10), { ...fa10, calendar, entries: [] });
    await repository.deleteSlot(first, fa10, 10, 'sun', 'slot-5');
    assert.deepEqual(await repository.get(first, fa10), { ...fa10, calendar, entries: [] });
    await assert.rejects(repository.get(null, fa10), /tài khoản/);
    await assert.rejects(createMockStudyScheduleRepository({}).get(first, fa10), /Bộ nhớ/);
});

test('bulk import fills every week, validates the template and handles conflicts atomically', () => {
    const storage = memoryStorage();
    const user = { id: 17 };
    const template = [
        { day: 'mon', slotId: 'slot-1', subject: '  SWP391  ', room: '  AL-R101  ' },
        { day: 'wed', slotId: 'slot-3', subject: 'Tiếng Anh', room: '' },
    ];
    assert.deepEqual(normalizeStudyTemplate(template, '10W'), [
        { day: 'mon', slotId: 'slot-1', subject: 'SWP391', room: 'AL-R101' },
        { day: 'wed', slotId: 'slot-3', subject: 'Tiếng Anh', room: '' },
    ]);
    assert.throws(() => normalizeStudyTemplate([...template, ...template], '10W'), /trùng/);
    assert.throws(() => normalizeStudyTemplate([{ ...template[0], slotId: 'slot-7' }], '10W'), /Khung giờ/);
    saveStudySlot(user, fa10, 3, 'mon', 'slot-1', { subject: 'Môn cũ' }, storage);
    const skipped = bulkImportStudySchedule(user, fa10, template, 'skip', storage);
    assert.deepEqual([skipped.imported, skipped.skipped, skipped.replaced], [19, 1, 0]);
    assert.equal(getStudySlot(readStudySchedule(user, fa10, 3, storage), 'mon', 'slot-1').subject, 'Môn cũ');
    assert.equal(getStudySlot(readStudySchedule(user, fa10, 10, storage), 'mon', 'slot-1').subject, 'SWP391');
    assert.equal(getStudySlot(readStudySchedule(user, fa10, 10, storage), 'wed', 'slot-3').subject, 'Tiếng Anh');
    const replaced = bulkImportStudySchedule(user, fa10, template, 'replace', storage);
    assert.deepEqual([replaced.imported, replaced.skipped, replaced.replaced], [0, 0, 20]);
    assert.equal(getStudySlot(readStudySchedule(user, fa10, 3, storage), 'mon', 'slot-1').subject, 'SWP391');
    assert.throws(() => bulkImportStudySchedule(user, fa10, [...template, ...template], 'replace', storage), /trùng/);
    assert.equal(readStudyPeriod(user, fa10, storage).length, 20);
    const threeWeek = bulkImportStudySchedule(
        user,
        fa3,
        [{ day: 'sun', slotId: 'slot-7', subject: 'Tiếng Anh' }],
        'skip',
        storage,
    );
    assert.equal(threeWeek.imported, 3);
    assert.equal(getStudySlot(readStudySchedule(user, fa3, 3, storage), 'sun', 'slot-7').subject, 'Tiếng Anh');
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
