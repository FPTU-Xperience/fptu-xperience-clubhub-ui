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
