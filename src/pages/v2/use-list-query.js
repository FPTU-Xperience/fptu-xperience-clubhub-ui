import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// Keep list position and its filters together across refresh and browser Back.
export function useListQuery(defaults) {
    const [params, setParams] = useSearchParams();
    const pending = useRef(params);
    pending.current = params;
    const values = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => {
        const raw = params.get(key);
        const value = typeof fallback === 'number'
            ? (/^[1-9]\d*$/.test(raw || '') && Number.isSafeInteger(Number(raw)) ? Number(raw) : fallback)
            : typeof fallback === 'boolean' ? raw === 'true' : raw ?? fallback;
        return [key, value];
    }));
    const set = (key, value) => {
        const next = new URLSearchParams(pending.current);
        const changes = typeof key === 'string'
            ? { [key]: typeof value === 'function' ? value(values[key]) : value }
            : key;
        for (const [name, nextValue] of Object.entries(changes)) next.set(name, String(nextValue));
        if (key !== 'page') next.set('page', '1');
        pending.current = next;
        setParams(next, { replace: key !== 'page' });
    };
    return [values, set];
}
