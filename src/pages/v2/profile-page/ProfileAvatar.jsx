import { initialsDesignStyle, initialsTextStyle } from '../../../components/media/initials-design';
import { AVATAR_FRAMES } from './avatar-frames';
import { useState } from 'react';
import './ProfileAvatar.scss';

export default function ProfileAvatar({
    profile = {},
    imageUrl,
    large = false,
    frame = profile.avatarFrame || 'none',
    className = '',
}) {
    const item = AVATAR_FRAMES.find((item) => item.id === frame);
    const image = profile.avatarMode === 'default' ? '' : imageUrl || profile.avatarUrl;
    const [failedImage, setFailedImage] = useState(null);
    return (
        <span className={`v2-framed-avatar${large ? ' is-large' : ''} ${className}`}>
            {image && failedImage !== image ? (
                <img className="v2-framed-avatar-image" src={image} alt="Ảnh đại diện" onError={() => setFailedImage(image)} />
            ) : (
                <span className="v2-framed-avatar-image" style={initialsDesignStyle(profile.avatarDesign)}>
                    <span style={initialsTextStyle(profile.avatarDesign)}>{profile.initials || 'SV'}</span>
                </span>
            )}
            {item?.color && (
                <svg className="v2-avatar-frame-overlay" viewBox="0 0 120 120" aria-hidden="true">
                    <circle
                        cx="60"
                        cy="60"
                        r="55"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="6"
                        strokeDasharray={item.pattern === 'pixel' ? '9 4' : undefined}
                    />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={item.accent} strokeWidth="2" />
                    {item.pattern === 'circuit' &&
                        [0, 90, 180, 270].map((angle) => (
                            <g key={angle} transform={`rotate(${angle} 60 60)`}>
                                <path d="M60 3v12h8" fill="none" stroke={item.accent} strokeWidth="3" />
                                <circle cx="68" cy="15" r="3" fill={item.color} />
                            </g>
                        ))}
                    {item.pattern === 'orbit' && (
                        <g fill={item.accent} stroke={item.color} strokeWidth="2">
                            <circle cx="22" cy="20" r="7" />
                            <circle cx="102" cy="91" r="6" />
                        </g>
                    )}
                    {item.pattern === 'pixel' && (
                        <g fill={item.accent} stroke={item.color} strokeWidth="2">
                            <rect x="17" y="13" width="12" height="12" />
                            <rect x="91" y="95" width="12" height="12" />
                        </g>
                    )}
                </svg>
            )}
        </span>
    );
}
