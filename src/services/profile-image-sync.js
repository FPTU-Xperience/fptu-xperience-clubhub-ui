export const PROFILE_IMAGE_EVENT = 'clubhub:profile-image-saved';
export const PROFILE_IMAGE_SIGNAL_KEY = 'clubhub:v2:profile-image-revision';

export function publishProfileImageSaved(account, kind, source, target = globalThis.window) {
    const signal = { account, kind, source, revision: `${Date.now()}-${Math.random()}` };
    target?.dispatchEvent(new CustomEvent(PROFILE_IMAGE_EVENT, { detail: signal }));
    try { target?.localStorage.setItem(PROFILE_IMAGE_SIGNAL_KEY, JSON.stringify(signal)); } catch { /* Same-tab sync remains available. */ }
}

export function subscribeProfileImageSaved(account, listener, target = globalThis.window) {
    if (!target) return () => {};
    const receive = (signal) => {
        if (signal?.account === account && ['avatar', 'cover'].includes(signal.kind)) listener(signal);
    };
    const saved = (event) => receive(event.detail);
    const stored = (event) => {
        if (event.key !== PROFILE_IMAGE_SIGNAL_KEY || !event.newValue) return;
        try { receive(JSON.parse(event.newValue)); } catch { /* Ignore invalid signals. */ }
    };
    target.addEventListener(PROFILE_IMAGE_EVENT, saved);
    target.addEventListener('storage', stored);
    return () => { target.removeEventListener(PROFILE_IMAGE_EVENT, saved); target.removeEventListener('storage', stored); };
}
