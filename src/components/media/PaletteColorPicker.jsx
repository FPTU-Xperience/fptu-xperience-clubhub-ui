import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { BASIC_COLORS, GRADIENT_COLORS, getGradient, paletteColorCss } from './color-palette';
import './PaletteColorPicker.scss';

export default function PaletteColorPicker({ label, value, onChange, disabled }) {
    const id = useId();
    const trigger = useRef(null);
    const popup = useRef(null);
    const [position, setPosition] = useState(null);
    const close = () => {
        setPosition(null);
        trigger.current?.focus();
    };
    useEffect(() => {
        if (!position) return;
        popup.current?.querySelector('button')?.focus();
        const outside = (event) => {
            if (!popup.current?.contains(event.target) && !trigger.current?.contains(event.target)) setPosition(null);
        };
        const scroll = (event) => {
            if (!popup.current?.contains(event.target)) setPosition(null);
        };
        document.addEventListener('pointerdown', outside);
        window.addEventListener('scroll', scroll, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('pointerdown', outside);
            window.removeEventListener('scroll', scroll, true);
            window.removeEventListener('resize', close);
        };
    }, [position]);
    const choose = (color) => {
        onChange(color);
        close();
    };
    return (
        <div className="media-palette-field">
            <span id={`${id}-label`}>{label}</span>
            <button
                ref={trigger}
                type="button"
                className="media-palette-trigger"
                aria-labelledby={`${id}-label`}
                aria-haspopup="dialog"
                aria-expanded={!!position}
                aria-controls={position ? id : undefined}
                disabled={disabled}
                onClick={() => {
                    if (position) {
                        close();
                        return;
                    }
                    const rect = trigger.current.getBoundingClientRect();
                    const width = Math.min(320, window.innerWidth - 24);
                    setPosition({
                        width,
                        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
                        top: rect.bottom + 310 < window.innerHeight ? rect.bottom + 8 : Math.max(12, rect.top - 310),
                    });
                }}
            >
                <span className="media-palette-preview" style={{ background: paletteColorCss(value) }} />
                <ChevronDown size={16} aria-hidden="true" />
            </button>
            {position && (
                <div
                    ref={popup}
                    id={id}
                    role="dialog"
                    aria-label={`Chọn ${label.toLowerCase()}`}
                    className="media-palette-popup"
                    style={position}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                            event.stopPropagation();
                            close();
                        }
                    }}
                >
                    <div className="media-palette-heading">
                        <strong>{label}</strong>
                        <button type="button" aria-label="Đóng bảng màu" onClick={close}>
                            <X size={16} />
                        </button>
                    </div>
                    <strong className="media-palette-section-title">Màu cơ bản</strong>
                    <div className="media-palette-swatches">
                        {BASIC_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                aria-label={`Màu ${color}`}
                                aria-pressed={value.toLowerCase() === color}
                                title={color}
                                style={{ background: color }}
                                onClick={() => choose(color)}
                            >
                                {value.toLowerCase() === color && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                    <strong className="media-palette-section-title">Gradient</strong>
                    <div className="media-palette-swatches">
                        {GRADIENT_COLORS.map((color) => (
                            <button
                                key={color.id}
                                type="button"
                                aria-label={color.label}
                                aria-pressed={value === color.id}
                                title={color.label}
                                style={{ background: paletteColorCss(color.id) }}
                                onClick={() => choose(color.id)}
                            >
                                {value === color.id && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                    <label className="media-palette-custom">
                        Màu tùy chọn
                        <input
                            type="color"
                            value={getGradient(value)?.colors[0] || value}
                            onChange={(event) => onChange(event.target.value)}
                            disabled={disabled}
                        />
                    </label>
                </div>
            )}
        </div>
    );
}
