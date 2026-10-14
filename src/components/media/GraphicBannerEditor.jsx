import { useId } from 'react';
import GraphicBanner from './GraphicBanner';
import PaletteColorPicker from './PaletteColorPicker';
import { GRADIENT_COLORS } from './color-palette';
import TextParagraphEditor from './TextParagraphEditor';
import { graphicTextParagraphs } from './graphic-banner';
import { defaultGraphicBanner, normalizeGraphicBanner, bannerSize } from './graphic-banner';

export default function GraphicBannerEditor({
    value,
    onChange,
    disabled,
    tab = 'background',
    kind = 'club',
    selectedParagraphId,
    onSelectParagraph,
}) {
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
                <TextParagraphEditor
                    paragraphs={graphicTextParagraphs(design, bannerSize(kind))}
                    selectedId={selectedParagraphId}
                    onSelect={onSelectParagraph}
                    onChange={(paragraphs) => update({ paragraphs })}
                    visible={design.visible}
                    onVisibleChange={(visible) => update({ visible })}
                    disabled={disabled}
                    advanced
                    onReset={() => {
                        update({
                            paragraphs: graphicTextParagraphs(defaultGraphicBanner(kind), bannerSize(kind)),
                            visible: true,
                        });
                        onSelectParagraph('title');
                    }}
                />
            )}
        </div>
    );
}
