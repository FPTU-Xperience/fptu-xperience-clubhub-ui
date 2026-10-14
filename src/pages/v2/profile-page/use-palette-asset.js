import { useEffect, useState } from 'react';
import { canSyncPaletteAsset, resolvePaletteAsset } from './palette-asset';
import { isSvgAsset } from './svg-palette';
export function usePaletteAsset(asset, enabled) {
    const [result, setResult] = useState({ asset: null, vector: null });
    useEffect(() => {
        if (!enabled || !canSyncPaletteAsset(asset) || isSvgAsset(asset)) return;
        let active = true;
        resolvePaletteAsset(asset)
            .then((vector) => {
                if (active) setResult({ asset, vector });
            })
            .catch(() => {
                if (active) setResult({ asset, vector: null });
            });
        return () => {
            active = false;
        };
    }, [asset, enabled]);
    return enabled && result.asset === asset && result.vector ? result.vector : asset;
}
