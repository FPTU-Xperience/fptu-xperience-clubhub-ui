import { readAcademicCalendar, saveAcademicCalendar } from './academic-calendar-data.js';
import { studyScheduleStorageKey } from './study-schedule-data.js';

const CALENDAR_ADMIN_ROLES = new Set(['ADMIN', 'SYSTEM_ADMIN', 'STUDENT_AFFAIRS_ADMIN']);

export function createMockAcademicCalendarRepository(storageOverride) {
    const requireStorage = (user) => {
        if (!studyScheduleStorageKey(user)) throw new Error('Cần đăng nhập để xem lịch học kỳ.');
        let storage;
        try {
            storage = storageOverride ?? globalThis.localStorage;
        } catch {
            storage = null;
        }
        if (!storage?.getItem || !storage?.setItem) throw new Error('Bộ nhớ lịch học kỳ tạm thời hiện chưa khả dụng.');
        return storage;
    };

    return {
        async get(user, period) {
            return readAcademicCalendar(period, requireStorage(user));
        },
        async save(user, period, calendar) {
            if (!user?.roles?.some((role) => CALENDAR_ADMIN_ROLES.has(role))) {
                throw new Error('Bạn không có quyền cấu hình lịch học kỳ.');
            }
            return saveAcademicCalendar(period, calendar, requireStorage(user));
        },
    };
}

export const academicCalendarRepository = createMockAcademicCalendarRepository();
