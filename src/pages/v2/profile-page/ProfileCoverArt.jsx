import { COVER_COLORS, getCoverShapes } from './cover-cosmetics';
import { DEFAULT_COVER_TRANSFORM, DEFAULT_COVER_TEXT } from './cover-design';
import './ProfileCoverArt.scss';

export default function ProfileCoverArt({
    color = 'default',
    shape = 'petals',
    imageUrl = '',
    shapeAssetUrl = '',
    shapeTransform = DEFAULT_COVER_TRANSFORM,
    coverText = DEFAULT_COVER_TEXT,
}) {
    const palette = COVER_COLORS.find((item) => item.id === color) || COVER_COLORS[0];
    const asset = shapeAssetUrl || getCoverShapes().find((item) => item.id === shape)?.assetUrl;
    const layout = { ...DEFAULT_COVER_TRANSFORM, ...shapeTransform };
    const text = { ...DEFAULT_COVER_TEXT, ...coverText };
    const ink = text.color || palette.ink;
    return (
        <svg
            className="v2-profile-cover-canvas"
            viewBox="0 0 1400 270"
            role="img"
            aria-label="Ảnh bìa cá nhân"
            data-color={color}
            data-shape={shape}
        >
            <rect width="1400" height="270" fill={palette.background} />
            {imageUrl && <image href={imageUrl} width="1400" height="270" preserveAspectRatio="xMidYMid slice" />}
            <>
                <g
                    data-layer="shape"
                    fill={palette.secondary}
                    transform={`translate(${layout.x * 14} ${layout.y * 2.7}) translate(700 135) scale(${layout.scale / 100}) translate(-700 -135)`}
                >
                    {asset && <image href={asset} width="1400" height="270" preserveAspectRatio="xMidYMid meet" />}
                    {shape === 'petals' && (
                        <>
                            <rect x="740" y="75" width="220" height="360" rx="110" transform="rotate(-30 850 200)" />
                            <rect x="910" y="10" width="220" height="360" rx="110" transform="rotate(10 1020 130)" />
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
                {text.visible && (
                    <g data-layer="text" fill={ink} transform={`translate(${text.x * 14} ${text.y * 2.7})`}>
                        <text x="45" y="48" fontSize="11" letterSpacing="3">
                            {text.eyebrow}
                        </text>
                        <text x="45" y="117" fontSize={text.size} fontWeight="700" letterSpacing="-1">
                            {text.title}
                        </text>
                        <text x="45" y="166" fontSize={text.size} fontFamily="Georgia, serif" fontStyle="italic">
                            {text.subtitle}
                        </text>
                    </g>
                )}
                <g transform="translate(1330 76) rotate(15)" fill={palette.ink}>
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
