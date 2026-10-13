import { createContext, useContext, useSyncExternalStore } from 'react';

const EntityMediaContext = createContext(null);
const noSubscription = () => () => {};
const emptySnapshot = () => 0;

export function EntityMediaProvider({ api, children }) {
    return <EntityMediaContext.Provider value={api?.media || null}>{children}</EntityMediaContext.Provider>;
}

export function useEntityMedia(kind, entity, { preview = false } = {}) {
    const source = useContext(EntityMediaContext);
    useSyncExternalStore(source?.subscribe || noSubscription, source?.snapshot || emptySnapshot, emptySnapshot);
    return preview ? entity : source?.select(kind, entity) || entity;
}
