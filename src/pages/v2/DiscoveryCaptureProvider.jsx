import { useCallback, useEffect, useRef, useState } from 'react';
import { DiscoveryCaptureContext } from '../../services/discovery-interactions.js';

export default function DiscoveryCaptureProvider({ api, enabled, children }) {
    const [settings, setSettings] = useState(null);
    const refresh = useRef(null);
    const requestRefresh = useCallback(() => refresh.current?.(), []);

    useEffect(() => {
        if (!enabled) return undefined;
        let active = true;
        let pending = false;
        const load = async () => {
            if (pending || document.visibilityState === 'hidden') return;
            pending = true;
            try {
                const value = await api.request('/api/v2/recommendations/interaction-settings');
                if (active && typeof value?.version === 'string'
                    && typeof value.clickEnabled === 'boolean' && typeof value.viewEnabled === 'boolean'
                    && Number.isInteger(value.viewSeconds) && value.viewSeconds >= 1 && value.viewSeconds <= 30
                    && Number.isInteger(value.visiblePercent) && value.visiblePercent >= 10 && value.visiblePercent <= 100) {
                    setSettings((current) => current?.version === value.version ? current : value);
                }
            } catch {
                // Discovery remains available while the policy endpoint is unavailable.
            } finally {
                pending = false;
            }
        };
        refresh.current = load;
        void load();
        const timer = window.setInterval(load, 60_000);
        document.addEventListener('visibilitychange', load);
        return () => {
            active = false;
            refresh.current = null;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', load);
        };
    }, [api, enabled]);

    return (
        <DiscoveryCaptureContext.Provider value={{ settings: enabled ? settings : null, refresh: requestRefresh }}>
            {children}
        </DiscoveryCaptureContext.Provider>
    );
}
