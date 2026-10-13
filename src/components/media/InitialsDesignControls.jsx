import { INITIALS_FONTS } from './initials-design';
import PaletteColorPicker from './PaletteColorPicker';
import './InitialsDesignControls.scss';

export default function InitialsDesignControls({ value, onChange, disabled }) {
    return (
        <div className="media-initials-controls">
            <PaletteColorPicker
                label="Màu nền"
                value={value.background}
                disabled={disabled}
                onChange={(background) => onChange({ ...value, background })}
            />
            <PaletteColorPicker
                label="Màu chữ"
                value={value.color}
                disabled={disabled}
                onChange={(color) => onChange({ ...value, color })}
            />
            <label className="media-initials-font">
                Phông chữ
                <select
                    value={value.font}
                    disabled={disabled}
                    onChange={(event) => onChange({ ...value, font: event.target.value })}
                >
                    {INITIALS_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                            {font.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
