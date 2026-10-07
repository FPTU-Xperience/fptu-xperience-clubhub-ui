import { readAcademicCalendar } from './academic-calendar-data.js';
import {
    bulkImportStudySchedule,
    clearStudySlot,
    getStudySlot,
    importLegacyStudySchedule,
    readLegacyStudySchedule,
    readStudyPeriod,
    saveStudySlot,
    studyScheduleStorageKey,
    toStudyEntryList,
} from './study-schedule-data.js';

// Temporary self-scoped repository. Keep the method and DTO shapes when switching to the BE API.
export function createMockStudyScheduleRepository(storageOverride) {
    const requireAccount = (user) => {
        if (!studyScheduleStorageKey(user)) throw new Error('Không thể tải lịch học khi chưa có tài khoản.');
        let storage;
        try {
            storage = storageOverride ?? globalThis.localStorage;
        } catch {
            storage = null;
        }
        if (!storage?.getItem || !storage?.setItem) throw new Error('Bộ nhớ lịch học tạm thời hiện chưa khả dụng.');
        return storage;
    };

    return {
        async get(user, period) {
            const storage = requireAccount(user);
            return { ...period, calendar: readAcademicCalendar(period, storage), entries: readStudyPeriod(user, period, storage) };
        },
        async putSlot(user, period, week, day, slotId, value) {
            const storage = requireAccount(user);
            const entries = saveStudySlot(user, period, week, day, slotId, value, storage);
            return { week, day, slotId, ...getStudySlot(entries, day, slotId) };
        },
        async deleteSlot(user, period, week, day, slotId) {
            const storage = requireAccount(user);
            clearStudySlot(user, period, week, day, slotId, storage);
        },
        async bulkImport(user, period, entries, mode) {
            const storage = requireAccount(user);
            return bulkImportStudySchedule(user, period, entries, mode, storage);
        },
        async getLegacy(user) {
            const storage = requireAccount(user);
            return { entries: toStudyEntryList(readLegacyStudySchedule(user, storage), '10W') };
        },
        async importLegacy(user, period) {
            const storage = requireAccount(user);
            return { ...period, entries: importLegacyStudySchedule(user, period, storage) };
        },
    };
}

export const studyScheduleRepository = createMockStudyScheduleRepository();
