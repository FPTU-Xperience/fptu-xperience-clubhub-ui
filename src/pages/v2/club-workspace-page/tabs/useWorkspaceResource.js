import { useEffect, useState } from 'react';

export default function useWorkspaceResource(clubId, load) {
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState({ status: 'loading', data: null });
    useEffect(() => {
        let active = true;
        const id = Number(clubId);
        if (!Number.isSafeInteger(id) || id <= 0) {
            setResult({ status: 'unavailable', data: null });
            return undefined;
        }
        setResult({ status: 'loading', data: null });
        Promise.resolve().then(() => load(id)).then(
            (data) => { if (active) setResult({ status: 'ready', data }); },
            (error) => { if (active) setResult({ status: 'error', data: null, error }); },
        );
        return () => { active = false; };
    }, [clubId, load, version]);
    return { ...result, retry: () => setVersion((value) => value + 1) };
}
