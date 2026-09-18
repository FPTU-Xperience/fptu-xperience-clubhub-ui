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
        if (!isOpen || !sessionKey) return undefined;
        const request = gateRef.current.next(sessionKey);
        setResult({ status: 'loading', data: [], error: null });
        Promise.resolve()
            .then(() => {
                if (typeof api?.getNotifications !== 'function') {
                    return Promise.reject({ status: 404 });
                }
                return api.getNotifications(false);
            })
            .then((value) => {
                if (!gateRef.current.isCurrent(request, sessionKey)) return;
                const data = selectHeaderNotifications(value);
                setResult({ status: data.length ? 'populated' : 'empty', data, error: null });
            })
            .catch((error) => {
                if (!gateRef.current.isCurrent(request, sessionKey)) return;
                setResult({ status: classifyHeaderNotificationError(error), data: [], error });
            });
        return () => gateRef.current.invalidate();
    }, [api, isOpen, sessionKey, version]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);
    const retry = useCallback(() => setVersion((current) => current + 1), []);
    const unreadCount = useMemo(() => result.data.filter((item) => !item.isRead).length, [result.data]);

    return { ...result, isOpen, open, close, retry, unreadCount };
}
