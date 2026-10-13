export const PUBLIC_MEDIA_EVENT = 'clubhub:public-media-saved';
export const PUBLIC_MEDIA_SIGNAL_KEY = 'clubhub:v2:public-media-revision';

export function publishPublicMediaSaved(kind, id, target = globalThis.window) {
    if (!target || !['club', 'activity'].includes(kind) || id === undefined || id === null || id === '') return;
    const signal = { kind, id: String(id), revision: `${Date.now()}-${Math.random()}` };
    target.dispatchEvent(new CustomEvent(PUBLIC_MEDIA_EVENT, { detail: signal }));
    try {
        target.localStorage.setItem(PUBLIC_MEDIA_SIGNAL_KEY, JSON.stringify(signal));
    } catch {
        /* Same-tab updates still work without storage. */
    }
}
export function subscribePublicMediaSaved(kind, listener, target = globalThis.window) {
    if (!target) return () => {};
    const receive = (signal) => {
        if (signal?.kind === kind && typeof signal.id === 'string') listener(signal);
    };
    const saved = (event) => receive(event.detail);
    const storage = (event) => {
        if (event.key !== PUBLIC_MEDIA_SIGNAL_KEY || !event.newValue) return;
        try {
            receive(JSON.parse(event.newValue));
        } catch {
            /* Ignore malformed invalidation signals. */
        }
    };
    target.addEventListener(PUBLIC_MEDIA_EVENT, saved);
    target.addEventListener('storage', storage);
    return () => {
        target.removeEventListener(PUBLIC_MEDIA_EVENT, saved);
        target.removeEventListener('storage', storage);
    };
}
