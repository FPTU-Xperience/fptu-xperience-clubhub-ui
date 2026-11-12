import { createContext, useCallback, useContext, useEffect, useRef } from 'react';

export const DiscoveryCaptureContext = createContext(null);

export function observeDiscoveryView(element, report, { viewSeconds = 5, visiblePercent = 50 } = {}) {
    if (typeof IntersectionObserver === 'undefined') return () => {};
    const threshold = visiblePercent / 100;
    let visible = false;
    let recorded = false;
    let timer;
    const reset = () => {
        clearTimeout(timer);
        if (!visible || recorded || document.visibilityState !== 'visible' || !document.hasFocus()) return;
        timer = setTimeout(() => {
            if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
            recorded = true;
            report();
        }, viewSeconds * 1000);
    };
    const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= threshold;
        if (!visible) recorded = false;
        reset();
    }, { threshold });
    observer.observe(element);
    window.addEventListener('scroll', reset, { capture: true, passive: true });
    window.addEventListener('resize', reset);
    window.addEventListener('blur', reset);
    window.addEventListener('focus', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
        clearTimeout(timer);
        observer.disconnect();
        window.removeEventListener('scroll', reset, true);
        window.removeEventListener('resize', reset);
        window.removeEventListener('blur', reset);
        window.removeEventListener('focus', reset);
        document.removeEventListener('visibilitychange', reset);
    };
}

export function useDiscoveryInteraction(api, entityKind, id, tagged) {
    const capture = useContext(DiscoveryCaptureContext);
    const settings = capture?.settings;
    const refresh = capture?.refresh;
    const ref = useRef(null);
    const entityId = Number(id);
    const enabled = tagged && Number.isSafeInteger(entityId) && entityId > 0 &&
        typeof api?.recordDiscoveryInteraction === 'function';
    const record = useCallback((action) => {
        if (!enabled || !(action === 'click' ? settings?.clickEnabled : settings?.viewEnabled)) return;
        const event = { eventId: crypto.randomUUID(), entityKind, entityId, action, captureVersion: settings.version };
        void api.recordDiscoveryInteraction(event).catch((error) => {
            if (error?.status === 409) return refresh?.();
            if (error?.status >= 500) return api.recordDiscoveryInteraction(event).catch(() => {});
        });
    }, [api, enabled, entityKind, entityId, settings, refresh]);
    useEffect(() => {
        if (enabled && settings?.viewEnabled && ref.current)
            return observeDiscoveryView(ref.current, () => record('view'), settings);
    }, [enabled, record, settings]);
    return { ref, record };
}
