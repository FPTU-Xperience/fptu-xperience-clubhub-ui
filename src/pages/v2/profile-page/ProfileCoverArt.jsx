import { useId } from 'react';
import SvgPaintDefs, { svgPaint } from '../../../components/media/SvgPaintDefs';
import { getCoverColors, getCoverShapes } from './cover-cosmetics';
import { DEFAULT_COVER_TRANSFORM, DEFAULT_COVER_TEXT, PROFILE_COVER_SIZE, shapeStampTransform } from './cover-design';
import ShapeImage from './ShapeImage';
import TextParagraphLayers from '../../../components/media/TextParagraphLayers';
import { coverTextParagraphs } from './cover-design';
import { svgPaletteFromColors } from './svg-palette';
import './ProfileCoverArt.scss';

export default function ProfileCoverArt({
    color = 'default',
    colorPalette,
    shape = 'petals',
    imageUrl = '',
    backgroundPaint = '',
    shapeAssetUrl = '',
    shapeTransform = DEFAULT_COVER_TRANSFORM,
    shapeHsl,
    shapeUsePalette = false,
    selectedParagraphId,
    textInteractive = false,
    coverText = DEFAULT_COVER_TEXT,
}) {
    const palette = colorPalette || getCoverColors().find((item) => item.id === color) || getCoverColors()[0];
    const id = useId().replace(/:/g, '');
    const shapeItem = getCoverShapes().find((item) => item.id === shape);
    const asset = shapeAssetUrl || shapeItem?.assetUrl;
    const layout = { ...DEFAULT_COVER_TRANSFORM, ...shapeTransform };
    const text = { ...DEFAULT_COVER_TEXT, ...coverText };
    const background = backgroundPaint || palette.background;
    const ink = svgPaint(text.color || palette.ink, id, 'ink');
    const secondary = svgPaint(palette.secondary, id, 'secondary');
    const accent = svgPaint(palette.accent, id, 'accent');
    return (
        <svg
            className="v2-profile-cover-canvas"
            viewBox={`0 0 ${PROFILE_COVER_SIZE.width} ${PROFILE_COVER_SIZE.height}`}
            role="img"
            aria-label="Ảnh bìa cá nhân"
            data-color={color}
            data-shape={shape}
        >
            <SvgPaintDefs paints={{ background }} prefix={id} width={1200} height={300} userSpace />
            <SvgPaintDefs
                paints={{ ink: text.color || palette.ink, badge: palette.accent, badgeInk: palette.ink }}
                prefix={id}
            />
            <rect
                width={PROFILE_COVER_SIZE.width}
                height={PROFILE_COVER_SIZE.height}
                fill={svgPaint(background, id, 'background')}
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
                <g data-layer="shape" fill={secondary} transform={shapeStampTransform(layout)}>
                    {asset && (
                        <ShapeImage
                            assetUrl={asset}
                            hsl={shapeHsl || shapeItem?.hsl}
                            svgPalette={shapeUsePalette ? svgPaletteFromColors(palette) : shapeItem?.svgPalette}
                            x={-120}
                            y={-120}
                        />
                    )}
                    <svg x="-120" y="-120" width="240" height="240" viewBox="650 -70 850 560" overflow="visible">
                        <SvgPaintDefs
                            paints={{ secondary: palette.secondary, accent: palette.accent }}
                            prefix={id}
                            width={850}
                            height={560}
                            x={650}
                            y={-70}
                            userSpace
                        />
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
                                    fill={accent}
                                />
                            </>
                        )}
                        {shape === 'ribbons' && (
                            <>
                                <path d="M850 0h220L900 270H680z" />
                                <path d="M1090 0h180l-170 270H920z" fill={accent} />
                                <path d="M1350 0h150l-170 270h-150z" />
                            </>
                        )}
                        {shape === 'circles' && (
                            <>
                                <circle cx="1010" cy="140" r="180" />
                                <circle cx="1240" cy="240" r="140" fill={accent} />
                                <circle cx="740" cy="225" r="70" />
                                <circle cx="1240" cy="20" r="45" fill={accent} />
                            </>
                        )}
                        {shape === 'orbits' && (
                            <g fill="none" stroke={accent} strokeWidth="24">
                                <ellipse cx="1100" cy="230" rx="310" ry="105" transform="rotate(-35 1100 230)" />
                                <ellipse cx="1100" cy="230" rx="230" ry="75" transform="rotate(-35 1100 230)" />
                                <circle cx="1100" cy="230" r="65" fill={secondary} />
                            </g>
                        )}
                        {shape === 'waves' && (
                            <>
                                <path d="M660 270C800 30 890 40 1040 150S1260 250 1400 60v210z" />
                                <path d="M800 270c140-190 230-150 340-50s180 40 260-50v100z" fill={accent} />
                            </>
                        )}
                    </svg>
                </g>
                {text.visible && (
                    <TextParagraphLayers
                        paragraphs={coverTextParagraphs(text)}
                        width={1200}
                        height={300}
                        inheritedColor={ink}
                        selectedId={selectedParagraphId}
                        interactive={textInteractive}
                    />
                )}
                <g
                    transform="translate(1140 99.428571) scale(0.857142857) rotate(15)"
                    fill={svgPaint(palette.ink, id, 'badgeInk')}
                >
                    <circle r="44" fill="none" stroke={svgPaint(palette.accent, id, 'badge')} />
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
