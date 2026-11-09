import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);
const MAX_HEADER_NOTIFICATIONS = 6;

export function mapHeaderNotification(raw = {}) {
    const id = firstDefined(raw.id, raw.notificationId);
    if (id === undefined || id === null || id === '') return null;
    return {
        id: String(id),
        title: String(firstDefined(raw.title, raw.subject, 'Cập nhật mới')),
        message: String(firstDefined(raw.message, raw.content, '')),
        createdAt: String(firstDefined(raw.createdAtUtc, raw.createdAt, raw.createdOn, '')),
        isRead: Boolean(firstDefined(raw.isRead, false)),
    };
}

export function unwrapHeaderNotifications(value) {
    if (Array.isArray(value)) return value;
    return [value?.items, value?.content, value?.data].find(Array.isArray) || [];
}

export function selectHeaderNotifications(value) {
    return unwrapHeaderNotifications(value)
        .map(mapHeaderNotification)
        .filter(Boolean)
        .sort((left, right) => {
            const leftTime = Date.parse(left.createdAt);
            const rightTime = Date.parse(right.createdAt);
            if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return 0;
            return rightTime - leftTime;
        })
        .slice(0, MAX_HEADER_NOTIFICATIONS);
}

export function classifyHeaderNotificationError(error) {
    if (error?.status === 401) return 'unauthorized';
    if (error?.status === 403) return 'forbidden';
    if (error?.status === 404) return 'unavailable';
    return 'error';
}

export function createHeaderRequestGate() {
    let current = 0;
    return {
        next(sessionKey) {
            current += 1;
            return { id: current, sessionKey };
        },
        isCurrent(request, sessionKey) {
            return request?.id === current && request?.sessionKey === sessionKey;
        },
        invalidate() {
            current += 1;
        },
    };
}

// Share an in-flight preload across StrictMode and rail remounts. Cache only briefly.
const notificationRequests = new WeakMap();
export function loadHeaderNotifications(api, sessionKey, refresh = false) {
    if (typeof api?.getNotifications !== 'function') return Promise.reject({ status: 404 });
    let cache = notificationRequests.get(api);
    if (!cache) { cache = new Map(); notificationRequests.set(api, cache); }
    const existing = cache.get(sessionKey);
    if (existing && (!refresh || existing.pending) && (existing.pending || Date.now() - existing.createdAt < 30000)) return existing.promise;
    const entry = { pending: true, createdAt: Date.now() };
    entry.promise = Promise.resolve().then(() => api.getNotifications(false)).finally(() => { entry.pending = false; });
    cache.set(sessionKey, entry);
    entry.promise.catch(() => { if (cache.get(sessionKey) === entry) cache.delete(sessionKey); });
    return entry.promise;
}

export function useHeaderNotifications(api, sessionKey) {
    const gateRef = useRef(null);
    if (!gateRef.current) gateRef.current = createHeaderRequestGate();
    const [isOpen, setIsOpen] = useState(false);
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'idle', data: [], error: null });

    useEffect(() => {
        gateRef.current.invalidate();
        setIsOpen(false);
        setResult({ status: 'idle', data: [], error: null });
    }, [sessionKey]);

    useEffect(() => {
        if (!sessionKey) return undefined;
        const request = gateRef.current.next(sessionKey);
        setResult({ sessionKey, status: 'loading', data: [], error: null });
        Promise.resolve()
            .then(() => {
                return loadHeaderNotifications(api, sessionKey, version > 0);
            })
            .then((value) => {
                if (!gateRef.current.isCurrent(request, sessionKey)) return;
                const data = selectHeaderNotifications(value);
                setResult({ sessionKey, status: data.length ? 'populated' : 'empty', data, error: null });
            })
            .catch((error) => {
                if (!gateRef.current.isCurrent(request, sessionKey)) return;
                setResult({ sessionKey, status: classifyHeaderNotificationError(error), data: [], error });
            });
        return () => gateRef.current.invalidate();
    }, [api, sessionKey, version]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const retry = useCallback(() => setVersion((current) => current + 1), []);
    const current = result.sessionKey === sessionKey ? result : { status: sessionKey ? 'loading' : 'unauthorized', data: [], error: null };
    const unreadCount = current.data.filter((item) => !item.isRead).length;

    return { ...current, isOpen, open, close, retry, unreadCount };
}
