import { createAcademicCalendarApi } from '../../services/schedule-api.js';
export const academicCalendarRepository = createAcademicCalendarApi({
    request: (...args) => import('../../services/api.js').then(({ default: api }) => api.request(...args)),
});
