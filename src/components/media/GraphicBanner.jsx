import { useId } from 'react';
import TextParagraphLayers from './TextParagraphLayers';
import { graphicTextParagraphs } from './graphic-banner';
import { bannerPaint, BANNER_PATHS, normalizeGraphicBanner, CLUB_BANNER_SIZE, bannerLayout } from './graphic-banner';
import { paletteColorCss } from './color-palette';
import './GraphicBanner.scss';

export default function GraphicBanner({
    design,
    label = 'Banner graphic',
    size = CLUB_BANNER_SIZE,
    preserveAspectRatio = 'xMinYMid meet',
    selectedParagraphId,
    textInteractive = false,
}) {
    const id = useId().replace(/:/g, '');
    const value = normalizeGraphicBanner(design);
    const layout = bannerLayout(size);
    const background = bannerPaint(value.background, size),
        ink = bannerPaint(value.color, size);
    return (
        <svg
            className="media-graphic-banner"
            viewBox={`0 0 ${size.width} ${size.height}`}
            preserveAspectRatio={preserveAspectRatio}
            style={{ background: paletteColorCss(value.background) }}
            role="img"
            aria-label={label}
        >
            <defs>
                {[
                    ['background', background],
                    ['ink', ink],
                ]
                    .filter(([, paint]) => paint.colors)
                    .map(([key, paint]) => (
                        <linearGradient
                            key={key}
                            id={`${id}-${key}`}
                            gradientUnits="userSpaceOnUse"
                            x1={paint.x1}
                            y1={paint.y1}
                            x2={paint.x2}
                            y2={paint.y2}
                        >
                            {paint.stops.map((stop, index) => (
                                <stop key={index} offset={`${stop.position}%`} stopColor={stop.color} />
                            ))}
                        </linearGradient>
                    ))}
            </defs>
            <rect width={size.width} height={size.height} fill={background.color || `url(#${id}-background)`} />
            <g
                data-layer="shape"
                transform={`translate(${value.shapeX * layout.xStep} ${value.shapeY * layout.yStep}) translate(${layout.cx} ${layout.cy}) scale(${(value.shapeScale / 100) * layout.shapeScale}) translate(-600 -150)`}
            >
                {value.decoration === 'circles' && (
                    <g fill="white">
                        <circle cx="960" cy="30" r="196" opacity=".07" />
                        <circle cx="1020" cy="90" r="257" opacity=".04" />
                    </g>
                )}
                {BANNER_PATHS[value.decoration] && (
                    <g fill="white" opacity=".09">
                        {BANNER_PATHS[value.decoration].map((d) => (
                            <path key={d} d={d} />
                        ))}
                    </g>
                )}
            </g>
            {value.visible && (
                <TextParagraphLayers
                    paragraphs={graphicTextParagraphs(value, size)}
                    width={size.width}
                    height={size.height}
                    inheritedColor={ink.color || `url(#${id}-ink)`}
                    selectedId={selectedParagraphId}
                    interactive={textInteractive}
                />
            )}
        </svg>
    );
}
