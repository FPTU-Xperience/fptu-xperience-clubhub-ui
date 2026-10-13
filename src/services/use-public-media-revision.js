import { useEffect, useState } from 'react';
import { subscribePublicMediaSaved } from './public-media-sync.js';

export function usePublicMediaRevision(kind) {
    const [revision, setRevision] = useState(0);
    useEffect(() => subscribePublicMediaSaved(kind, () => setRevision((value) => value + 1)), [kind]);
    return revision;
}
