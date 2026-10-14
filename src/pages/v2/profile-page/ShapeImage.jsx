import { useId } from 'react';
import { normalizeShapeHsl, SHAPE_STAMP_SIZE } from './cover-design';
import { applySvgPalette } from './svg-palette';
import { usePaletteAsset } from './use-palette-asset';

// A self-contained SVG viewport keeps image adjustments confined to the stamp.
export default function ShapeImage({
    assetUrl,
    hsl,
    svgPalette,
    x = 0,
    y = 0,
    size = SHAPE_STAMP_SIZE,
    label = 'Shape độc lập',
}) {
    const id = `shape-${useId().replace(/:/g, '')}`;
    const vectorAsset = usePaletteAsset(assetUrl, !!svgPalette);
    const settings = normalizeShapeHsl(hsl);
    const lightness = settings.lightness / 100;
    return (
        <svg
            x={x}
            y={y}
            width={size}
            height={size}
            viewBox="0 0 240 240"
            role="img"
            aria-label={label}
            className="v2-shape-image"
        >
            <defs>
                <filter id={id} colorInterpolationFilters="sRGB">
                    <feColorMatrix type="hueRotate" values={settings.hue} />
                    <feColorMatrix type="saturate" values={settings.saturation / 100} />
                    <feComponentTransfer>
                        {['R', 'G', 'B'].map((channel) => {
                            const Tag = `feFunc${channel}`;
                            return (
                                <Tag
                                    key={channel}
                                    type="linear"
                                    slope={1 - Math.abs(lightness)}
                                    intercept={Math.max(0, lightness)}
                                />
                            );
                        })}
                    </feComponentTransfer>
                </filter>
            </defs>
            <image
                href={applySvgPalette(vectorAsset, svgPalette)}
                width="240"
                height="240"
                preserveAspectRatio="xMidYMid meet"
                filter={`url(#${id})`}
            />
        </svg>
    );
}
