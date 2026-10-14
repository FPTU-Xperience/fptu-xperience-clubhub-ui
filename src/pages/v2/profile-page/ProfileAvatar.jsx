import { initialsDesignStyle, initialsTextStyle } from '../../../components/media/initials-design';
import { getAvatarFrames, getCoverColors } from './cover-cosmetics';
import { useState, useId } from 'react';
import SvgPaintDefs, { svgPaint } from '../../../components/media/SvgPaintDefs';
import { frameAssetStyle } from './avatar-frame-assets';
import { applySvgPalette, svgPaletteFromColors } from './svg-palette';
import './ProfileAvatar.scss';
import { canSyncPaletteAsset } from './palette-asset';
import { usePaletteAsset } from './use-palette-asset';

export default function ProfileAvatar({
    profile = {},
    imageUrl,
    large = false,
    frame = profile.avatarFrame || 'none',
    frameDesign,
    className = '',
}) {
    const source = frameDesign || getAvatarFrames().find((item) => item.id === frame);
    const colorId = profile.coverPreset === 'custom' ? profile.coverBackgroundColor : profile.coverPreset;
    const colors = getCoverColors().find((item) => item.id === colorId) || getCoverColors()[0];
    const supportsPalette = source?.assetUrl ? canSyncPaletteAsset(source.assetUrl) : !!source?.color;
    const svgPalette =
        profile.avatarFrameUsePalette && supportsPalette ? svgPaletteFromColors(colors) : source?.svgPalette;
    const vectorAsset = usePaletteAsset(source?.assetUrl, !!svgPalette);
    const item = svgPalette
        ? {
              ...source,
              assetUrl: applySvgPalette(vectorAsset, svgPalette),
              recolor: false,
              color: svgPalette.primary,
              accent: svgPalette.secondary,
          }
        : source;
    const paintId = useId().replace(/:/g, '');
    const primaryPaint = svgPaint(item?.color, paintId, 'primary');
    const secondaryPaint = svgPaint(item?.accent, paintId, 'secondary');
    const image = profile.avatarMode === 'default' ? '' : imageUrl || profile.avatarUrl;
    const [failedImage, setFailedImage] = useState(null);
    return (
        <span
            className={`v2-framed-avatar${large ? ' is-large' : ''}${item?.circular ? ' is-circular-frame' : ''} ${className}`}
        >
            {image && failedImage !== image ? (
                <img
                    className="v2-framed-avatar-image"
                    src={image}
                    alt="Ảnh đại diện"
                    onError={() => setFailedImage(image)}
                />
            ) : (
                <span className="v2-framed-avatar-image" style={initialsDesignStyle(profile.avatarDesign)}>
                    <span style={initialsTextStyle(profile.avatarDesign)}>{profile.initials || 'SV'}</span>
                </span>
            )}
            {item?.assetUrl &&
                (item.recolor ? (
                    <span
                        className="v2-avatar-frame-overlay v2-avatar-frame-asset"
                        style={frameAssetStyle(item)}
                        aria-hidden="true"
                    />
                ) : (
                    <img className="v2-avatar-frame-overlay v2-avatar-frame-asset" src={item.assetUrl} alt="" />
                ))}
            {!item?.assetUrl && item?.color && (
                <svg className="v2-avatar-frame-overlay" viewBox="0 0 120 120" aria-hidden="true">
                    <SvgPaintDefs paints={{ primary: item.color, secondary: item.accent }} prefix={paintId} />
                    <circle
                        cx="60"
                        cy="60"
                        r="55"
                        fill="none"
                        stroke={primaryPaint}
                        strokeWidth="6"
                        strokeDasharray={item.pattern === 'pixel' ? '9 4' : undefined}
                    />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={secondaryPaint} strokeWidth="2" />
                    {item.pattern === 'circuit' &&
                        [0, 90, 180, 270].map((angle) => (
                            <g key={angle} transform={`rotate(${angle} 60 60)`}>
                                <path d="M60 3v12h8" fill="none" stroke={secondaryPaint} strokeWidth="3" />
                                <circle cx="68" cy="15" r="3" fill={primaryPaint} />
                            </g>
                        ))}
                    {item.pattern === 'orbit' && (
                        <g fill={secondaryPaint} stroke={primaryPaint} strokeWidth="2">
                            <circle cx="22" cy="20" r="7" />
                            <circle cx="102" cy="91" r="6" />
                        </g>
                    )}
                    {item.pattern === 'pixel' && (
                        <g fill={secondaryPaint} stroke={primaryPaint} strokeWidth="2">
                            <rect x="17" y="13" width="12" height="12" />
                            <rect x="91" y="95" width="12" height="12" />
                        </g>
                    )}
                </svg>
            )}
        </span>
    );
}
