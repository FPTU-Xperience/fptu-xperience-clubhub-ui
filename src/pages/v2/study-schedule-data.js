export const STUDY_SCHEDULE_VERSION = 3;

export const STUDY_DAYS = Object.freeze([
    { id: 'mon', label: 'Thứ Hai', shortLabel: 'T2' },
    { id: 'tue', label: 'Thứ Ba', shortLabel: 'T3' },
    { id: 'wed', label: 'Thứ Tư', shortLabel: 'T4' },
    { id: 'thu', label: 'Thứ Năm', shortLabel: 'T5' },
    { id: 'fri', label: 'Thứ Sáu', shortLabel: 'T6' },
    { id: 'sat', label: 'Thứ Bảy', shortLabel: 'T7' },
    { id: 'sun', label: 'Chủ Nhật', shortLabel: 'CN' },
]);

export const STUDY_TERMS = Object.freeze([
    { id: 'SP', label: 'Spring (SP)' },
    { id: 'SU', label: 'Summer (SU)' },
    { id: 'FA', label: 'Fall (FA)' },
]);

export const STUDY_BLOCKS = Object.freeze([
    { id: '10W', label: 'Block 10W', weekCount: 10 },
    { id: '3W', label: 'Block 3W', weekCount: 3 },
]);

export const STUDY_SLOTS_10W = Object.freeze([
    { id: 'slot-1', label: '07:00–09:15' },
    { id: 'slot-2', label: '09:30–11:45' },
    { id: 'slot-3', label: '12:30–14:45' },
    { id: 'slot-4', label: '15:00–17:15' },
    { id: 'slot-5', label: '17:30–19:45' },
]);

export const STUDY_SLOTS_3W = Object.freeze([
    { id: 'slot-1', label: '07:00–08:30' },
    { id: 'slot-2', label: '08:45–10:15' },
    { id: 'slot-3', label: '10:30–12:00' },
    { id: 'slot-4', label: '12:30–14:00' },
    { id: 'slot-5', label: '14:15–15:45' },
    { id: 'slot-6', label: '16:00–17:30' },
    { id: 'slot-7', label: '17:45–19:15' },
]);

// Keep the previous constant name for 10W callers and legacy local records.
export const STUDY_SLOTS = STUDY_SLOTS_10W;

const validDays = new Set(STUDY_DAYS.map((day) => day.id));
const validTerms = new Set(STUDY_TERMS.map((term) => term.id));
const validBlocks = new Set(STUDY_BLOCKS.map((block) => block.id));
const slotKey = (day, slotId) => `${day}:${slotId}`;

export function getStudySlots(block) {
    if (block === '10W') return STUDY_SLOTS_10W;
    if (block === '3W') return STUDY_SLOTS_3W;
    throw new Error('Block học không hợp lệ.');
}

export function getStudyWeekCount(block) {
    const value = STUDY_BLOCKS.find((item) => item.id === block);
    if (!value) throw new Error('Block học không hợp lệ.');
    return value.weekCount;
}

export function defaultStudyPeriod(date = new Date()) {
    const month = date.getMonth();
    return { year: date.getFullYear(), term: month < 4 ? 'SP' : month < 8 ? 'SU' : 'FA', block: '10W' };
}

export function formatStudyTerm({ year, term }) {
    return `${term}${String(year).slice(-2)}`;
}

export function studyScheduleStorageKey(user) {
    const identity = user?.id ?? user?.email;
    return identity === undefined || identity === null || identity === ''
        ? null
        : `clubhub:v2:study-schedule:${String(identity)}`;
}

export function studyPeriodKey(period) {
    const { year, term, block } = period || {};
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !validTerms.has(term) || !validBlocks.has(block)) {
        throw new Error('Học kỳ hoặc block học không hợp lệ.');
    }
    return `${year}:${term}:${block}`;
}

function parseMonday(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value || date.getUTCDay() !== 1
        ? null
        : date;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

export function getStudyWeekDates(calendar, block, week) {
    const monday = parseMonday(block === '3W' ? calendar?.block3StartDate : calendar?.block10StartDate);
    if (!monday) return null;
    requireWeek(block, week);
    const firstDay = addDays(monday, (week - 1) * 7);
    const days = STUDY_DAYS.map((_, index) => addDays(firstDay, index));
    const thursday = addDays(firstDay, 3);
    const isoYear = thursday.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
    const firstMonday = addDays(firstThursday, -((firstThursday.getUTCDay() + 6) % 7));
    const calendarWeek = Math.floor((firstDay - firstMonday) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return { days, calendarWeek, calendarYear: isoYear };
}

export function getCurrentStudyWeek(calendar, block, today = new Date()) {
    const monday = parseMonday(block === '3W' ? calendar?.block3StartDate : calendar?.block10StartDate);
    if (!monday) return null;
    const current = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const offset = Math.floor((current - monday) / (7 * 24 * 60 * 60 * 1000));
    const week = offset + 1;
    return week >= 1 && week <= getStudyWeekCount(block) ? week : null;
}

export function formatStudyDate(date) {
    return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function requireSlot(block, day, slotId) {
    if (!validDays.has(day) || !getStudySlots(block).some((slot) => slot.id === slotId)) {
        throw new Error('Khung giờ học không hợp lệ.');
    }
}

function requireWeek(block, week) {
    if (!Number.isInteger(week) || week < 1 || week > getStudyWeekCount(block)) {
        throw new Error('Tuần học không hợp lệ.');
    }
}

function normalizeEntry(value) {
    const subject = String(value?.subject ?? '').trim();
    const room = String(value?.room ?? '').trim();
    if (!subject || subject.length > 120) throw new Error('Tên môn học phải có từ 1 đến 120 ký tự.');
    if (room.length > 80) throw new Error('Phòng học tối đa 80 ký tự.');
    return { subject, room };
}

function normalizeStoredEntries(value, block) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const entries = {};
    for (const day of STUDY_DAYS) {
        for (const slot of getStudySlots(block)) {
            const key = slotKey(day.id, slot.id);
            if (!value[key]) continue;
            try {
                entries[key] = normalizeEntry(value[key]);
            } catch {
                // Skip a damaged cell without hiding the rest of the schedule.
            }
        }
    }
    return entries;
}

function readRecord(user, storage) {
    const key = studyScheduleStorageKey(user);
    const empty = { schedules: {}, legacyEntries: null };
    if (!key || !storage) return empty;
    try {
        const record = JSON.parse(storage.getItem(key));
        if (
            record?.version === STUDY_SCHEDULE_VERSION &&
            record.schedules &&
            typeof record.schedules === 'object' &&
            !Array.isArray(record.schedules)
        ) {
            return { schedules: record.schedules, legacyEntries: record.legacyEntries ?? null };
        }
        if (
            record?.version === 2 &&
            record.schedules &&
            typeof record.schedules === 'object' &&
            !Array.isArray(record.schedules)
        ) {
            const schedules = {};
            for (const [periodKey, oldEntries] of Object.entries(record.schedules)) {
                const block = periodKey.split(':')[2];
                if (!validBlocks.has(block)) continue;
                const entries = normalizeStoredEntries(oldEntries, block);
                schedules[periodKey] = Object.fromEntries(
                    Array.from({ length: getStudyWeekCount(block) }, (_, index) => [String(index + 1), { ...entries }]),
                );
            }
            return { schedules, legacyEntries: record.legacyEntries ?? null };
        }
        if (record?.version === 1) {
            return { schedules: {}, legacyEntries: normalizeStoredEntries(record.entries, '10W') };
        }
    } catch {
        // A corrupt local record behaves like an empty schedule.
    }
    return empty;
}

export function readStudySchedule(user, period, week, storage = globalThis.localStorage) {
    const key = studyPeriodKey(period);
    requireWeek(period.block, week);
    return normalizeStoredEntries(readRecord(user, storage).schedules[key]?.[week], period.block);
}

export function readStudyPeriod(user, period, storage = globalThis.localStorage) {
    studyPeriodKey(period);
    return Array.from({ length: getStudyWeekCount(period.block) }, (_, index) => {
        const week = index + 1;
        return toStudyEntryList(readStudySchedule(user, period, week, storage), period.block).map((entry) => ({
            week,
            ...entry,
        }));
    }).flat();
}

export function readLegacyStudySchedule(user, storage = globalThis.localStorage) {
    return normalizeStoredEntries(readRecord(user, storage).legacyEntries, '10W');
}

function writeRecord(user, record, storage) {
    const key = studyScheduleStorageKey(user);
    if (!key || !storage) throw new Error('Không thể lưu lịch học khi chưa có tài khoản.');
    storage.setItem(key, JSON.stringify({ version: STUDY_SCHEDULE_VERSION, ...record }));
}

export function saveStudySlot(user, period, week, day, slotId, value, storage = globalThis.localStorage) {
    const key = studyPeriodKey(period);
    requireWeek(period.block, week);
    requireSlot(period.block, day, slotId);
    const entry = normalizeEntry(value);
    const record = readRecord(user, storage);
    const weeks = record.schedules[key] || {};
    const entries = { ...normalizeStoredEntries(weeks[week], period.block), [slotKey(day, slotId)]: entry };
    writeRecord(user, { ...record, schedules: { ...record.schedules, [key]: { ...weeks, [week]: entries } } }, storage);
    return entries;
}

export function clearStudySlot(user, period, week, day, slotId, storage = globalThis.localStorage) {
    const key = studyPeriodKey(period);
    requireWeek(period.block, week);
    requireSlot(period.block, day, slotId);
    const record = readRecord(user, storage);
    const weeks = record.schedules[key] || {};
    const entries = { ...normalizeStoredEntries(weeks[week], period.block) };
    delete entries[slotKey(day, slotId)];
    writeRecord(user, { ...record, schedules: { ...record.schedules, [key]: { ...weeks, [week]: entries } } }, storage);
    return entries;
}

export function importLegacyStudySchedule(user, period, storage = globalThis.localStorage) {
    if (period?.block !== '10W') throw new Error('Lịch cũ chỉ dùng khung giờ của block 10W.');
    const key = studyPeriodKey(period);
    const record = readRecord(user, storage);
    const legacyEntries = normalizeStoredEntries(record.legacyEntries, '10W');
    if (!Object.keys(legacyEntries).length) throw new Error('Không có lịch cũ để chuyển.');
    if (
        Array.from({ length: 10 }, (_, index) => index + 1).some(
            (week) => Object.keys(normalizeStoredEntries(record.schedules[key]?.[week], '10W')).length,
        )
    ) {
        throw new Error('Học kỳ và block này đã có lịch. Hãy chọn một kỳ trống.');
    }
    const weeks = Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [String(index + 1), { ...legacyEntries }]),
    );
    writeRecord(user, { ...record, schedules: { ...record.schedules, [key]: weeks }, legacyEntries: null }, storage);
    return readStudyPeriod(user, period, storage);
}

export function normalizeStudyTemplate(entries, block) {
    if (
        !Array.isArray(entries) ||
        !entries.length ||
        entries.length > STUDY_DAYS.length * getStudySlots(block).length
    ) {
        throw new Error('Dữ liệu nhập hàng loạt không hợp lệ.');
    }
    const seen = new Set();
    return entries.map((item) => {
        requireSlot(block, item?.day, item?.slotId);
        const id = slotKey(item.day, item.slotId);
        if (seen.has(id)) throw new Error('Dữ liệu nhập có ô lịch trùng nhau.');
        seen.add(id);
        return { day: item.day, slotId: item.slotId, ...normalizeEntry(item) };
    });
}

export function bulkImportStudySchedule(user, period, entries, mode = 'skip', storage = globalThis.localStorage) {
    const key = studyPeriodKey(period);
    if (!['skip', 'replace'].includes(mode)) throw new Error('Cách xử lý ô trùng không hợp lệ.');
    const normalized = normalizeStudyTemplate(entries, period.block);
    const record = readRecord(user, storage);
    const weeks = { ...record.schedules[key] };
    let imported = 0;
    let skipped = 0;
    let replaced = 0;
    for (let week = 1; week <= getStudyWeekCount(period.block); week += 1) {
        const current = { ...normalizeStoredEntries(weeks[week], period.block) };
        for (const item of normalized) {
            const cell = slotKey(item.day, item.slotId);
            if (current[cell] && mode === 'skip') {
                skipped += 1;
                continue;
            }
            if (current[cell]) replaced += 1;
            else imported += 1;
            current[cell] = { subject: item.subject, room: item.room };
        }
        weeks[week] = current;
    }
    writeRecord(user, { ...record, schedules: { ...record.schedules, [key]: weeks } }, storage);
    return { imported, skipped, replaced, entries: readStudyPeriod(user, period, storage) };
}

export function getStudySlot(entries, day, slotId) {
    return entries?.[slotKey(day, slotId)] || null;
}

export function toStudyEntryList(entries, block) {
    return STUDY_DAYS.flatMap((day) =>
        getStudySlots(block).flatMap((slot) => {
            const entry = getStudySlot(entries, day.id, slot.id);
            return entry ? [{ day: day.id, slotId: slot.id, ...normalizeEntry(entry) }] : [];
        }),
    );
}

export function toStudyEntryMap(list, block) {
    if (!Array.isArray(list) || list.length > STUDY_DAYS.length * getStudySlots(block).length) {
        throw new Error('Dữ liệu lịch học không hợp lệ.');
    }
    const entries = {};
    for (const item of list) {
        requireSlot(block, item?.day, item?.slotId);
        const key = slotKey(item.day, item.slotId);
        if (entries[key]) throw new Error('Lịch học có khung giờ bị trùng.');
        entries[key] = normalizeEntry(item);
    }
    return entries;
}
