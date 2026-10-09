import { STUDY_DAYS, STUDY_TERMS, defaultStudyPeriod } from '../../../study-schedule-data.js';

export { STUDY_DAYS as CLUB_DAYS, STUDY_TERMS as CLUB_TERMS };
export const SCHEDULE_STEP = 30;
export const DAY_MINUTES = 24 * 60;

export function formatClubTime(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function clampClubTime(value, handle, start, end) {
    const rounded = Math.round(Number(value) / SCHEDULE_STEP) * SCHEDULE_STEP;
    if (!Number.isFinite(rounded)) return handle === 'start' ? start : end;
    return handle === 'start'
        ? Math.max(0, Math.min(end - SCHEDULE_STEP, rounded))
        : Math.min(DAY_MINUTES, Math.max(start + SCHEDULE_STEP, rounded));
}

export function defaultClubSchedule() {
    const { year, term } = defaultStudyPeriod();
    return { year, term, days: [], start: 18 * 60, end: 20 * 60, repeat: true };
}

export function formatClubSchedule(schedule) {
    const days = STUDY_DAYS.filter((day) => schedule.days.includes(day.id)).map((day) => day.shortLabel);
    if (!days.length) return '';
    return `${schedule.term}${schedule.year} · ${days.join(', ')} · ${formatClubTime(schedule.start)}–${formatClubTime(schedule.end)} · ${schedule.repeat ? 'Hằng tuần' : 'Không lặp lại'}`;
}

export function displayClubSchedule(value) {
    return (value || '').replace(/Lặp lại h[àằ]ng tuần/g, 'Hằng tuần');
}

export function parseClubSchedule(value) {
    const match = /^(SP|SU|FA)(\d{4}) · (.+) · (\d{2}:\d{2})–(\d{2}:\d{2}) · (Hằng tuần|Lặp lại h[àằ]ng tuần|Không lặp lại)$/.exec(
        value || '',
    );
    if (!match) return null;
    const labels = match[3].split(', ');
    const days = labels.map((label) => STUDY_DAYS.find((day) => day.shortLabel === label)?.id);
    const toMinutes = (time) => {
        const [hour, minute] = time.split(':').map(Number);
        return hour <= 24 && (minute === 0 || minute === 30) && (hour !== 24 || minute === 0)
            ? hour * 60 + minute
            : NaN;
    };
    const start = toMinutes(match[4]);
    const end = toMinutes(match[5]);
    const year = Number(match[2]);
    if (
        days.some((day) => !day) ||
        new Set(days).size !== days.length ||
        year < 2000 ||
        year > 2100 ||
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end - start < SCHEDULE_STEP
    )
        return null;
    return { term: match[1], year, days, start, end, repeat: match[6] !== 'Không lặp lại' };
}
