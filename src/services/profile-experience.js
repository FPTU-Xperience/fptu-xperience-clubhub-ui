import { useEffect, useState } from 'react';
import { createPersonalExperienceClient } from '../pages/v2/personal-experience/personal-experience-data.js';

export const CORE_PILLARS = ['Academic', 'Research', 'Global', 'CultureSports', 'Community', 'Entrepreneurship'];
export function profileRadarValues(value, userId) {
    if (
        String(value?.studentId) !== String(userId) ||
        value.isAuthoritative !== true ||
        !Array.isArray(value.radarAxes)
    )
        throw new Error('Chưa có radar chính thức cho tài khoản này.');
    return CORE_PILLARS.map((pillar) => {
        const row = value.radarAxes.find((axis) => axis.pillar === pillar);
        if (!Number.isFinite(row?.saturatedScore) || row.saturatedScore < 0 || row.saturatedScore > 100)
            throw new Error('Dữ liệu radar chưa đầy đủ sáu trụ cột.');
        return row.saturatedScore;
    });
}
export function useProfileExperience(api, userId, sessionKey) {
    const scope = `${userId}:${sessionKey}`;
    const [state, setState] = useState({});
    useEffect(() => {
        let active = true;
        setState({ scope, loading: true });
        Promise.allSettled([
            createPersonalExperienceClient(api, userId).summary(),
            api
                .request('/api/v1/declarations/me/radar?scope=PERIOD')
                .then((value) => ({ value, axes: profileRadarValues(value, userId) })),
        ]).then(([summary, radar]) => {
            if (active)
                setState({
                    scope,
                    loading: false,
                    summary: summary.status === 'fulfilled' ? summary.value : null,
                    error: summary.status === 'rejected' ? summary.reason.message : '',
                    radar: radar.status === 'fulfilled' ? radar.value : null,
                    radarError: radar.status === 'rejected' ? radar.reason.message : '',
                });
        });
        return () => {
            active = false;
        };
    }, [api, userId, sessionKey]);
    return state.scope === scope ? state : { loading: true };
}
