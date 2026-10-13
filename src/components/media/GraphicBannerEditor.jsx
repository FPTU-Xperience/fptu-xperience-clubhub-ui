import { useId } from 'react';
import GraphicBanner from './GraphicBanner';
import PaletteColorPicker from './PaletteColorPicker';
import { GRADIENT_COLORS } from './color-palette';
import { INITIALS_FONTS } from './initials-design';
import { defaultGraphicBanner, normalizeGraphicBanner, bannerSize } from './graphic-banner';

export default function GraphicBannerEditor({ value, onChange, disabled, tab = 'background', kind = 'club' }) {
    const id = useId();
    const design = normalizeGraphicBanner(value);
    const update = (patch) => onChange({ ...design, ...patch });
    const sliders = (fields, unavailable = false) => (
        <div className="media-banner-sliders">
            {fields.map(([key, label, min, max]) => (
                <label key={key}>
                    <span>
                        {label}
                        <output>
                            {design[key]}
                            {key === 'size' ? 'px' : '%'}
                        </output>
                    </span>
                    <input
                        type="range"
                        min={min}
                        max={max}
                        value={design[key]}
                        disabled={disabled || unavailable}
                        style={{ '--range-progress': `${((design[key] - min) / (max - min)) * 100}%` }}
                        onChange={(event) => update({ [key]: Number(event.target.value) })}
                    />
                </label>
            ))}
        </div>
    );
    const cards = (items, selected, choose) => (
        <div className="media-banner-options" role="group" aria-label={tab === 'shape' ? 'Shape trang trí' : 'Màu nền'}>
            {items.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected === item.id}
                    disabled={disabled}
                    onClick={() => choose(item.id)}
                >
                    <div>
                        <GraphicBanner
                            size={bannerSize(kind)}
                            design={{
                                ...design,
                                ...item.preview,
                                textX: 0,
                                textY: 0,
                                shapeX: 0,
                                shapeY: 0,
                                shapeScale: 100,
                            }}
                        />
                    </div>
                    <strong>{item.label}</strong>
                </button>
            ))}
        </div>
    );
    return (
        <div className={`media-graphic-editor${kind === 'activity' ? ' is-activity-banner' : ''}`}>
            {tab === 'background' && (
                <>
                    <strong>Màu nền</strong>
                    {cards(
                        GRADIENT_COLORS.map((item) => ({ ...item, preview: { background: item.id } })),
                        design.background,
                        (background) => update({ background }),
                    )}
                    <PaletteColorPicker
                        label="Màu nền tùy chọn"
                        value={design.background}
                        onChange={(background) => update({ background })}
                        disabled={disabled}
                    />
                </>
            )}
            {tab === 'shape' && (
                <>
                    <strong>Shape trang trí</strong>
                    {cards(
                        [
                            ['none', 'Không dùng shape'],
                            ['circles', 'Vòng tròn'],
                            ['ribbons', 'Dải chéo'],
                            ['waves', 'Sóng'],
                        ].map(([key, label]) => ({ id: key, label, preview: { decoration: key } })),
                        design.decoration,
                        (decoration) => update({ decoration }),
                    )}
                    {sliders(
                        [
                            ['shapeX', 'Vị trí ngang', -50, 50],
                            ['shapeY', 'Vị trí dọc', -100, 100],
                            ['shapeScale', 'Kích thước', 25, 200],
                        ],
                        design.decoration === 'none',
                    )}
                    <button
                        type="button"
                        className="v2-button"
                        disabled={disabled}
                        onClick={() => update({ shapeX: 0, shapeY: 0, shapeScale: 100 })}
                    >
                        Đặt lại vị trí và kích thước
                    </button>
                </>
            )}
            {tab === 'text' && (
                <>
                    <label className="media-banner-check">
                        <input
                            type="checkbox"
                            checked={design.visible}
                            disabled={disabled}
                            onChange={(event) => update({ visible: event.target.checked })}
                        />
                        Hiển thị chữ trên ảnh bìa
                    </label>
                    {[
                        ['eyebrow', 'Dòng chữ nhỏ'],
                        ['title', 'Tiêu đề'],
                        ['subtitle', 'Dòng chữ nhấn'],
                    ].map(([key, label]) => (
                        <div className="media-banner-text-row" key={key}>
                            <label htmlFor={`${id}-${key}`}>{label}</label>
                            <div>
                                <input
                                    id={`${id}-${key}`}
                                    type="text"
                                    value={design[key]}
                                    maxLength={80}
                                    disabled={disabled || !design.visible}
                                    onChange={(event) => update({ [key]: event.target.value })}
                                />
                                <select
                                    aria-label={`Phông chữ ${label.toLowerCase()}`}
                                    value={design.fonts[key]}
                                    disabled={disabled || !design.visible}
                                    onChange={(event) =>
                                        update({ fonts: { ...design.fonts, [key]: event.target.value } })
                                    }
                                >
                                    {INITIALS_FONTS.map((font) => (
                                        <option key={font.id} value={font.id}>
                                            {font.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                    <PaletteColorPicker
                        label="Màu chữ"
                        value={design.color}
                        onChange={(color) => update({ color })}
                        disabled={disabled || !design.visible}
                    />
                    {sliders(
                        [
                            ['size', 'Cỡ chữ', 24, 64],
                            ['textX', 'Vị trí chữ ngang', -100, 100],
                            ['textY', 'Vị trí chữ dọc', -100, 100],
                        ],
                        !design.visible,
                    )}
                    <button
                        type="button"
                        className="v2-button"
                        disabled={disabled}
                        onClick={() => {
                            const initial = defaultGraphicBanner(kind);
                            update({
                                eyebrow: initial.eyebrow,
                                title: initial.title,
                                subtitle: initial.subtitle,
                                visible: true,
                                fonts: initial.fonts,
                                color: initial.color,
                                size: initial.size,
                                textX: 0,
                                textY: 0,
                            });
                        }}
                    >
                        Khôi phục chữ mặc định
                    </button>
                </>
            )}
        </div>
    );
}
