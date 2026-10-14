import { getGradient, customGradientColor, paletteColorCss } from './color-palette';
import { useEffect, useState } from 'react';

function StopPosition({ value, min, max, label, onChange }) {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);
    return (
        <input
            type="number"
            aria-label={label}
            min={min}
            max={max}
            step={1}
            value={draft}
            onChange={(event) => {
                setDraft(event.target.value);
                const next = Number(event.target.value);
                if (event.target.value !== '' && Number.isFinite(next) && next >= min && next <= max) onChange(next);
            }}
            onBlur={() => {
                const next = Math.max(min, Math.min(max, Number(draft || value)));
                setDraft(String(next));
                onChange(next);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    event.currentTarget.blur();
                }
            }}
        />
    );
}

export default function GradientEditor({ value, onChange }) {
    const gradient = getGradient(value);
    if (!gradient) return null;
    const update = (angle, stops) => onChange(customGradientColor(angle, stops));
    return (
        <div className="media-gradient-editor">
            <div className="media-gradient-preview" style={{ background: paletteColorCss(value) }} />
            <label className="media-gradient-angle">
                <span>
                    Góc gradient <output>{gradient.angle}°</output>
                </span>
                <input
                    type="range"
                    aria-label="Góc gradient"
                    min={0}
                    max={360}
                    step={1}
                    value={gradient.angle}
                    onChange={(event) => update(Number(event.target.value), gradient.stops)}
                />
            </label>
            <div className="media-gradient-stops-heading">
                <strong>Điểm dừng màu</strong>
                <small>{gradient.stops.length}/8</small>
            </div>
            {gradient.stops.map((stop, index) => (
                <div className="media-gradient-stop" key={index}>
                    <label>
                        <span className="media-palette-sr-only">Màu điểm dừng {index + 1}</span>
                        <input
                            type="color"
                            value={stop.color}
                            onChange={(event) =>
                                update(
                                    gradient.angle,
                                    gradient.stops.map((current, i) =>
                                        i === index ? { ...current, color: event.target.value } : current,
                                    ),
                                )
                            }
                        />
                    </label>
                    <span>{stop.color.toUpperCase()}</span>
                    <label className="media-gradient-stop-position">
                        <span className="media-palette-sr-only">Vị trí điểm dừng {index + 1}</span>
                        <StopPosition
                            min={index ? gradient.stops[index - 1].position : 0}
                            max={gradient.stops[index + 1]?.position ?? 100}
                            value={stop.position}
                            label={`Vị trí điểm dừng ${index + 1}`}
                            onChange={(position) => {
                                update(
                                    gradient.angle,
                                    gradient.stops.map((current, i) =>
                                        i === index ? { ...current, position } : current,
                                    ),
                                );
                            }}
                        />
                        <span>%</span>
                    </label>
                    <button
                        type="button"
                        aria-label={`Xóa điểm dừng ${index + 1}`}
                        disabled={gradient.stops.length <= 2}
                        onClick={() =>
                            update(
                                gradient.angle,
                                gradient.stops.filter((_, i) => i !== index),
                            )
                        }
                    >
                        ×
                    </button>
                </div>
            ))}
            <button
                type="button"
                className="media-gradient-add"
                disabled={gradient.stops.length >= 8}
                onClick={() => {
                    const gaps = gradient.stops
                        .slice(1)
                        .map((stop, index) => ({ index, length: stop.position - gradient.stops[index].position }));
                    const gap = gaps.sort((a, b) => b.length - a.length)[0];
                    const left = gradient.stops[gap.index],
                        right = gradient.stops[gap.index + 1];
                    const stops = [...gradient.stops];
                    stops.splice(gap.index + 1, 0, {
                        color: left.color,
                        position: Math.round((left.position + right.position) / 2),
                    });
                    update(gradient.angle, stops);
                }}
            >
                + Thêm điểm dừng
            </button>
        </div>
    );
}
