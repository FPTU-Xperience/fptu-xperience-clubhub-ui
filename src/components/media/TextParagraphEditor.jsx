import { useId, useEffect, useState } from 'react';
import PaletteColorPicker from './PaletteColorPicker';
import { createTextParagraph, PARAGRAPH_FONTS, MAX_TEXT_PARAGRAPHS } from './text-paragraphs';
import './TextParagraphEditor.scss';
function ParagraphSize({ value, onChange, disabled }) {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => setDraft(String(value)), [value]);
    return (
        <input
            type="number"
            aria-label="Cỡ chữ đoạn đang chọn"
            min={8}
            max={240}
            step={1}
            value={draft}
            disabled={disabled}
            onChange={(event) => {
                setDraft(event.target.value);
                const next = Number(event.target.value);
                if (event.target.value && next >= 8 && next <= 240) onChange(next);
            }}
            onBlur={() => {
                const next = Math.max(8, Math.min(240, Number(draft || value)));
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

export default function TextParagraphEditor({
    paragraphs,
    selectedId,
    onSelect,
    onChange,
    visible,
    onVisibleChange,
    disabled = false,
    advanced = false,
    onReset,
}) {
    const id = useId();
    const selected = paragraphs.find((paragraph) => paragraph.id === selectedId) || paragraphs[0];
    const update = (patch) =>
        onChange(
            paragraphs.map((paragraph) => (paragraph.id === selected.id ? { ...paragraph, ...patch } : paragraph)),
        );
    return (
        <div className="media-text-paragraph-editor">
            <label className="media-paragraph-visible">
                <input
                    type="checkbox"
                    checked={visible}
                    disabled={disabled}
                    onChange={(event) => onVisibleChange(event.target.checked)}
                />{' '}
                Hiển thị chữ trên ảnh bìa
            </label>
            <div className="media-paragraph-list" aria-label="Các đoạn chữ">
                {paragraphs.map((paragraph, index) => (
                    <button
                        type="button"
                        key={paragraph.id}
                        aria-pressed={selected?.id === paragraph.id}
                        disabled={disabled}
                        onClick={() => onSelect(paragraph.id)}
                    >
                        {index + 1}. {paragraph.text.split('\n')[0] || 'Đoạn chữ trống'}
                    </button>
                ))}
            </div>
            <button
                type="button"
                className="v2-button"
                disabled={disabled || paragraphs.length >= MAX_TEXT_PARAGRAPHS}
                onClick={() => {
                    const paragraph = createTextParagraph();
                    onChange([...paragraphs, paragraph]);
                    onSelect(paragraph.id);
                }}
            >
                + Thêm đoạn chữ
            </button>
            {selected && (
                <>
                    <label htmlFor={`${id}-content`}>
                        Nội dung đoạn chữ
                        <textarea
                            id={`${id}-content`}
                            rows={3}
                            maxLength={1000}
                            value={selected.text}
                            disabled={disabled || !visible}
                            onChange={(event) => update({ text: event.target.value })}
                        />
                    </label>
                    <div className="media-paragraph-font-row">
                        <label>
                            Phông chữ
                            <select
                                value={selected.font}
                                disabled={disabled || !visible}
                                onChange={(event) => update({ font: event.target.value })}
                            >
                                {PARAGRAPH_FONTS.map((font) => (
                                    <option key={font.id} value={font.id}>
                                        {font.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Cỡ chữ (px)
                            <ParagraphSize
                                key={selected.id}
                                value={selected.size}
                                disabled={disabled || !visible}
                                onChange={(size) => update({ size })}
                            />
                        </label>
                    </div>
                    <div className="media-paragraph-style-row">
                        <label>
                            <input
                                type="checkbox"
                                checked={selected.bold}
                                disabled={disabled || !visible}
                                onChange={(event) => update({ bold: event.target.checked })}
                            />{' '}
                            In đậm
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={selected.italic}
                                disabled={disabled || !visible}
                                onChange={(event) => update({ italic: event.target.checked })}
                            />{' '}
                            In nghiêng
                        </label>
                    </div>
                    <label className="media-paragraph-visible">
                        <input
                            type="checkbox"
                            checked={!selected.color}
                            disabled={disabled || !visible}
                            onChange={(event) => update({ color: event.target.checked ? '' : '#ffffff' })}
                        />{' '}
                        Dùng màu chữ của bộ màu
                    </label>
                    {selected.color && (
                        <PaletteColorPicker
                            label="Màu đoạn chữ"
                            value={selected.color}
                            disabled={disabled || !visible}
                            advanced={advanced}
                            onChange={(color) => update({ color })}
                        />
                    )}
                    <p>
                        Kéo từng đoạn chữ trên ảnh xem trước để đặt vị trí. Xuống dòng trong ô nội dung để tạo paragraph
                        nhiều dòng.
                    </p>
                    {['x', 'y'].map((axis) => (
                        <label key={axis}>
                            <span>
                                Vị trí {axis === 'x' ? 'ngang' : 'dọc'} <output>{Math.round(selected[axis])}%</output>
                            </span>
                            <input
                                type="range"
                                min={-200}
                                max={200}
                                step={1}
                                value={selected[axis]}
                                disabled={disabled || !visible}
                                onChange={(event) => update({ [axis]: Number(event.target.value) })}
                            />
                        </label>
                    ))}
                    <button
                        type="button"
                        className="v2-button"
                        disabled={disabled}
                        onClick={() => {
                            const next = paragraphs.filter((paragraph) => paragraph.id !== selected.id);
                            onChange(next);
                            onSelect(next[0]?.id || '');
                        }}
                    >
                        Xóa đoạn chữ đang chọn
                    </button>
                </>
            )}
            <button type="button" className="v2-button" disabled={disabled} onClick={onReset}>
                Khôi phục chữ mặc định
            </button>
        </div>
    );
}
