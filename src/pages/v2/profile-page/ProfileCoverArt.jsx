import { useId } from 'react';
import { getGradient } from '../../../components/media/color-palette';
import { COVER_COLORS, getCoverShapes } from './cover-cosmetics';
import { COVER_FONTS, DEFAULT_COVER_TRANSFORM, DEFAULT_COVER_TEXT, PROFILE_COVER_SIZE } from './cover-design';
import './ProfileCoverArt.scss';

export default function ProfileCoverArt({
    color = 'default',
    shape = 'petals',
    imageUrl = '',
    backgroundPaint = '',
    shapeAssetUrl = '',
    shapeTransform = DEFAULT_COVER_TRANSFORM,
    coverText = DEFAULT_COVER_TEXT,
}) {
    const palette = COVER_COLORS.find((item) => item.id === color) || COVER_COLORS[0];
    const id = useId().replace(/:/g, '');
    const asset = shapeAssetUrl || getCoverShapes().find((item) => item.id === shape)?.assetUrl;
    const layout = { ...DEFAULT_COVER_TRANSFORM, ...shapeTransform };
    const text = { ...DEFAULT_COVER_TEXT, ...coverText };
    const backgroundGradient = getGradient(backgroundPaint);
    const inkGradient = getGradient(text.color);
    const ink = inkGradient ? `url(#${id}-ink)` : text.color || palette.ink;
    const fontFamily = (field) => {
        const id = coverText?.fonts?.[field] ?? coverText?.font ?? 'default';
        if (id === 'default' && field === 'subtitle') return 'Georgia, serif';
        return (COVER_FONTS.find((font) => font.id === id) || COVER_FONTS[0]).family;
    };
    return (
        <svg
            className="v2-profile-cover-canvas"
            viewBox={`0 0 ${PROFILE_COVER_SIZE.width} ${PROFILE_COVER_SIZE.height}`}
            role="img"
            aria-label="Ảnh bìa cá nhân"
            data-color={color}
            data-shape={shape}
        >
            <defs>
                {[
                    ['background', backgroundGradient],
                    ['ink', inkGradient],
                ]
                    .filter(([, gradient]) => gradient)
                    .map(([key, gradient]) => (
                        <linearGradient key={key} id={`${id}-${key}`} x1="0" y1="0" x2="1" y2="1">
                            {gradient.colors.map((paint, index) => (
                                <stop
                                    key={index}
                                    offset={`${(index / (gradient.colors.length - 1)) * 100}%`}
                                    stopColor={paint}
                                />
                            ))}
                        </linearGradient>
                    ))}
            </defs>
            <rect
                width={PROFILE_COVER_SIZE.width}
                height={PROFILE_COVER_SIZE.height}
                fill={backgroundGradient ? `url(#${id}-background)` : backgroundPaint || palette.background}
            />
            {imageUrl && (
                <image
                    href={imageUrl}
                    width={PROFILE_COVER_SIZE.width}
                    height={PROFILE_COVER_SIZE.height}
                    preserveAspectRatio="xMidYMid slice"
                />
            )}
            <>
                <g
                    data-layer="shape"
                    fill={palette.secondary}
                    transform={`translate(${layout.x * 12} ${layout.y * 3}) translate(600 150) scale(${layout.scale / 100}) translate(-600 -150)`}
                >
                    {asset && (
                        <image
                            href={asset}
                            width={PROFILE_COVER_SIZE.width}
                            height={PROFILE_COVER_SIZE.height}
                            preserveAspectRatio="xMidYMid meet"
                        />
                    )}
                    {/* Fit the original 1400 × 270 preset paths uniformly into the 1200 × 300 canvas. */}
                    <g transform="translate(0 34.285714) scale(0.857142857)">
                        {shape === 'petals' && (
                            <>
                                <rect
                                    x="740"
                                    y="75"
                                    width="220"
                                    height="360"
                                    rx="110"
                                    transform="rotate(-30 850 200)"
                                />
                                <rect
                                    x="910"
                                    y="10"
                                    width="220"
                                    height="360"
                                    rx="110"
                                    transform="rotate(10 1020 130)"
                                />
                                <rect
                                    x="1090"
                                    y="115"
                                    width="220"
                                    height="360"
                                    rx="110"
                                    transform="rotate(45 1200 240)"
                                    fill={palette.accent}
                                />
                            </>
                        )}
                        {shape === 'ribbons' && (
                            <>
                                <path d="M850 0h220L900 270H680z" />
                                <path d="M1090 0h180l-170 270H920z" fill={palette.accent} />
                                <path d="M1350 0h150l-170 270h-150z" />
                            </>
                        )}
                        {shape === 'circles' && (
                            <>
                                <circle cx="1010" cy="140" r="180" />
                                <circle cx="1240" cy="240" r="140" fill={palette.accent} />
                                <circle cx="740" cy="225" r="70" />
                                <circle cx="1240" cy="20" r="45" fill={palette.accent} />
                            </>
                        )}
                        {shape === 'orbits' && (
                            <g fill="none" stroke={palette.accent} strokeWidth="24">
                                <ellipse cx="1100" cy="230" rx="310" ry="105" transform="rotate(-35 1100 230)" />
                                <ellipse cx="1100" cy="230" rx="230" ry="75" transform="rotate(-35 1100 230)" />
                                <circle cx="1100" cy="230" r="65" fill={palette.secondary} />
                            </g>
                        )}
                        {shape === 'waves' && (
                            <>
                                <path d="M660 270C800 30 890 40 1040 150S1260 250 1400 60v210z" />
                                <path d="M800 270c140-190 230-150 340-50s180 40 260-50v100z" fill={palette.accent} />
                            </>
                        )}
                    </g>
                </g>
                {text.visible && (
                    <g data-layer="text" fill={ink} transform={`translate(${text.x * 12} ${text.y * 3})`}>
                        <text x="40" y="75" fontSize="11" letterSpacing="3" fontFamily={fontFamily('eyebrow')}>
                            {text.eyebrow}
                        </text>
                        <text
                            x="40"
                            y="136"
                            fontSize={text.size}
                            fontWeight="700"
                            letterSpacing="-1"
                            fontFamily={fontFamily('title')}
                        >
                            {text.title}
                        </text>
                        <text
                            x="40"
                            y="185"
                            fontSize={text.size}
                            fontFamily={fontFamily('subtitle')}
                            fontStyle="italic"
                        >
                            {text.subtitle}
                        </text>
                    </g>
                )}
                <g transform="translate(1140 99.428571) scale(0.857142857) rotate(15)" fill={palette.ink}>
                    <circle r="44" fill="none" stroke={palette.accent} />
                    <text textAnchor="middle" y="-3" fontSize="10" letterSpacing="2">
                        FPTU
                    </text>
                    <text textAnchor="middle" y="13" fontSize="10" letterSpacing="1">
                        XPERIENCE
                    </text>
                </g>
            </>
        </svg>
    );
}
