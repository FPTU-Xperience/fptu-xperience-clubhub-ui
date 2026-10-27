import { createStudyScheduleApi } from '../../services/schedule-api.js';
export const studyScheduleRepository = createStudyScheduleApi({
    request: (...args) => import('../../services/api.js').then(({ default: api }) => api.request(...args)),
});
