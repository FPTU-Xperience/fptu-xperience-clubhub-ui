import { createContext, useContext, useEffect, useState } from 'react';
import { useMyClubSelection } from './my-clubs-data';

const PinnedClubsContext = createContext(null);

export function readPinnedClubIds(storage, key) {
    try {
        const ids = JSON.parse(storage?.getItem(key) || '[]');
        return Array.isArray(ids) ? [...new Set(ids.filter((id) => typeof id === 'string' && id))] : [];
    } catch {
        return [];
    }
}

export function PinnedClubsProvider({ api, accountKey, children }) {
    const selection = useMyClubSelection(api, accountKey);
    const storageKey = `clubhub:v2:pinned-clubs:${encodeURIComponent(accountKey)}`;
    const [ids, setIds] = useState(() => {
        try {
            return readPinnedClubIds(window.localStorage, storageKey);
        } catch {
            return [];
        }
    });
    useEffect(() => {
        const sync = (event) => {
            if (event.key === storageKey || event.key === null) {
                try {
                    setIds(readPinnedClubIds(window.localStorage, storageKey));
                } catch {
                    setIds([]);
                }
            }
        };
        window.addEventListener('storage', sync);
        return () => window.removeEventListener('storage', sync);
    }, [storageKey]);
    const togglePin = (clubId) => {
        if (!selection.data.some((club) => club.clubId === clubId)) return;
        const next = ids.includes(clubId) ? ids.filter((id) => id !== clubId) : [...ids, clubId];
        setIds(next);
        try {
            window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
            /* Keep pins for this session. */
        }
    };
    const pinnedClubs = ids.map((id) => selection.data.find((club) => club.clubId === id)).filter(Boolean);
    return (
        <PinnedClubsContext.Provider value={{ selection, pinnedClubs, togglePin }}>
            {children}
        </PinnedClubsContext.Provider>
    );
}

export function usePinnedClubs() {
    return useContext(PinnedClubsContext);
}
