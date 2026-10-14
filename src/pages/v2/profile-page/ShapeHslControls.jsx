import { DEFAULT_SHAPE_HSL } from './cover-design';
import './ShapeHslControls.scss';

export default function ShapeHslControls({ value, onChange, disabled = false }) {
    return (
        <fieldset className="v2-shape-hsl-controls">
            <legend>Màu ảnh shape · HSL</legend>
            {[
                ['hue', 'Sắc độ (H)', -180, 180, '°'],
                ['saturation', 'Độ bão hòa (S)', 0, 200, '%'],
                ['lightness', 'Độ sáng (L)', -100, 100, '%'],
            ].map(([key, label, min, max, unit]) => (
                <label key={key}>
                    <span>
                        {label}
                        <output>
                            {value[key]}
                            {unit}
                        </output>
                    </span>
                    <input
                        type="range"
                        aria-label={label}
                        min={min}
                        max={max}
                        step={1}
                        value={value[key]}
                        disabled={disabled}
                        style={{ '--range-progress': `${((value[key] - min) / (max - min)) * 100}%` }}
                        onChange={(event) => onChange({ ...value, [key]: Number(event.target.value) })}
                    />
                </label>
            ))}
            <button
                type="button"
                className="v2-button"
                disabled={disabled}
                onClick={() => onChange({ ...DEFAULT_SHAPE_HSL })}
            >
                Khôi phục màu gốc
            </button>
        </fieldset>
    );
}
