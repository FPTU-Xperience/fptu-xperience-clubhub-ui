import { getCoverColors } from './cover-cosmetics';
import { svgPaletteFromColors } from './svg-palette';
import './ShapeHslControls.scss';
import PaletteColorPicker from '../../../components/media/PaletteColorPicker';
import { paletteColorCss } from '../../../components/media/color-palette';

export default function SvgPaletteControls({ enabled, onToggle, colorId, onColorChange, value, onChange }) {
    const colors = getCoverColors();
    const palette = colors.find((item) => item.id === colorId) || colors[0];
    return (
        <div className="v2-svg-palette-controls">
            <label className="v2-create-frame-color">
                <span>
                    <input type="checkbox" checked={enabled} onChange={(event) => onToggle(event.target.checked)} />{' '}
                    Dùng màu từ bộ màu
                </span>
            </label>
            {enabled && (
                <>
                    <label>
                        Bộ màu
                        <select value={palette.id} onChange={(event) => onColorChange(event.target.value)}>
                            {colors.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="v2-svg-palette-swatches">
                        {Object.entries(value || svgPaletteFromColors(palette)).map(([key, color]) => (
                            <span key={key}>
                                <i style={{ background: paletteColorCss(color) }} />
                                {key === 'primary' ? 'Màu chính' : 'Màu phụ'}
                            </span>
                        ))}
                    </div>
                    {onChange &&
                        ['primary', 'secondary'].map((key) => (
                            <PaletteColorPicker
                                key={key}
                                label={key === 'primary' ? 'Màu chính của SVG' : 'Màu phụ của SVG'}
                                value={(value || svgPaletteFromColors(palette))[key]}
                                advanced
                                onChange={(paint) =>
                                    onChange({ ...(value || svgPaletteFromColors(palette)), [key]: paint })
                                }
                            />
                        ))}
                    <small>
                        SVG dùng var(--primary) / var(--secondary) sẽ tự điền đúng màu. Với SVG thường, hai màu vẽ đầu
                        tiên lần lượt là chính/phụ; các màu còn lại giữ nguyên. PNG được chuyển SVG có các vùng tối/sáng
                        gắn sẵn vào màu chính/phụ.
                    </small>
                </>
            )}
        </div>
    );
}
