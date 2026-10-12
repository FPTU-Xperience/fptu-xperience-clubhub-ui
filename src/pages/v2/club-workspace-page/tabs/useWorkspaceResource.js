import { useEffect, useState } from 'react';

export default function useWorkspaceResource(clubId, load, scopeKey = 'global') {
    const resourceKey = `${clubId}:${scopeKey}`;
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ resourceKey, status: 'loading', data: null });
    useEffect(() => {
        let active = true;
        const id = Number(clubId);
        if (!Number.isSafeInteger(id) || id <= 0) {
            setResult({ resourceKey, status: 'unavailable', data: null });
            return undefined;
        }
        setResult({ resourceKey, status: 'loading', data: null });
        Promise.resolve().then(() => load(id)).then(
            (data) => { if (active) setResult({ resourceKey, status: 'ready', data }); },
            (error) => { if (active) setResult({ resourceKey, status: 'error', data: null, error }); },
        );
        return () => { active = false; };
    }, [clubId, load, version, resourceKey]);
    const current = result.resourceKey === resourceKey ? result : { resourceKey, status: 'loading', data: null };
    return { ...current, retry: () => setVersion((value) => value + 1) };
}
