import { getCoverColors } from './cover-cosmetics';
import { paletteColorCss } from '../../../components/media/color-palette';
import './ProfilePaletteSync.scss';

export default function ProfilePaletteSync({
    colorId,
    checked,
    onChange,
    disabled,
    reason,
    target,
    automatic = false,
}) {
    const palette = getCoverColors().find((item) => item.id === colorId) || getCoverColors()[0];
    return (
        <section className="v2-profile-palette-sync" aria-label={`Đồng bộ bộ màu cho ${target}`}>
            <div className="v2-profile-palette-sync-heading">
                <strong>Đồng bộ với bộ màu</strong>
                <small>{palette.label}</small>
            </div>
            {automatic ? (
                <p role="status">Đang tự đồng bộ màu chính và màu phụ cho {target}.</p>
            ) : (
                <label>
                    <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={(event) => onChange(event.target.checked)}
                    />
                    <span>Dùng màu chính và màu phụ cho {target}</span>
                </label>
            )}
            <div className="v2-profile-palette-sync-colors">
                <span>
                    <i style={{ background: paletteColorCss(palette.accent) }} />
                    Màu chính
                </span>
                <span>
                    <i style={{ background: paletteColorCss(palette.secondary) }} />
                    Màu phụ
                </span>
            </div>
            <p>{reason || 'Đổi bộ màu trong tab Nền của ảnh bìa; màu đồng bộ sẽ cập nhật theo bộ màu đó.'}</p>
        </section>
    );
}
