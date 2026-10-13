import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import ImageCropModal from './ImageCropModal';
import './ImagePicker.scss';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImage(file) {
    if (!file) return '';
    if (!IMAGE_TYPES.includes(file.type)) return 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.';
    if (file.size > IMAGE_MAX_BYTES) return 'Ảnh phải nhỏ hơn hoặc bằng 5 MB.';
    if (file.size === 0) return 'Ảnh không được để trống.';
    return '';
}

export default function ImagePicker({
    label,
    value,
    file,
    onChange,
    disabled = false,
    hint = '',
    recommendedSize,
    renderPreview,
    compact = false,
    positioning = false,
    previewHandlers,
}) {
    const inputRef = useRef(null);
    const hintId = useId();
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [cropFile, setCropFile] = useState(null);

    useEffect(() => {
        if (!file) {
            setPreview('');
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const selectFile = (next) => {
        if (disabled || !next) return;
        const issue = validateImage(next);
        setError(issue);
        if (!issue) {
            if (recommendedSize) setCropFile(next);
            else onChange(next);
        }
    };

    return (
        <div className="media-image-picker">
            {recommendedSize ? (
                <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={disabled}
                    onChange={(event) => {
                        selectFile(event.target.files?.[0]);
                        event.target.value = '';
                    }}
                />
            ) : (
                <label>
                    <span>{label}</span>
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => {
                            selectFile(event.target.files?.[0]);
                            event.target.value = '';
                        }}
                        disabled={disabled}
                    />
                </label>
            )}
            {recommendedSize ? (
                <div className="media-cover-guide">
                    <button
                        type="button"
                        className={`media-cover-guide-frame is-upload${recommendedSize.width === recommendedSize.height ? ' is-square' : ''}${dragging ? ' is-dragging' : ''}${positioning ? ' is-positioning' : ''}`}
                        style={{ aspectRatio: `${recommendedSize.width} / ${recommendedSize.height}` }}
                        aria-label={
                            positioning
                                ? 'Kéo trên ảnh xem trước để đổi vị trí lớp đang chọn'
                                : `Chọn hoặc đổi ${label.toLowerCase()}`
                        }
                        aria-describedby={hintId}
                        disabled={disabled}
                        onClick={(event) => {
                            if (positioning) event.preventDefault();
                            else inputRef.current?.click();
                        }}
                        onPointerDown={previewHandlers?.onPointerDown}
                        onPointerMove={previewHandlers?.onPointerMove}
                        onPointerUp={previewHandlers?.onPointerUp}
                        onPointerCancel={previewHandlers?.onPointerCancel}
                        onLostPointerCapture={previewHandlers?.onLostPointerCapture}
                        onDragOver={(event) => {
                            event.preventDefault();
                            if (!disabled) setDragging(true);
                        }}
                        onDragLeave={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
                        }}
                        onDrop={(event) => {
                            event.preventDefault();
                            setDragging(false);
                            selectFile(event.dataTransfer.files?.[0]);
                        }}
                    >
                        {renderPreview ? (
                            renderPreview(preview || value)
                        ) : preview || value ? (
                            <img src={preview || value} alt={`Xem trước ${label.toLowerCase()}`} />
                        ) : (
                            <span className="media-upload-empty">
                                <ImagePlus size={28} aria-hidden="true" />
                                <strong>Nhấn để chọn ảnh</strong>
                                <span>hoặc kéo thả ảnh vào khung này</span>
                            </span>
                        )}
                        {(preview || value || renderPreview) && (
                            <span className="media-upload-replace">
                                <ImagePlus size={16} aria-hidden="true" />
                                {positioning ? 'Kéo để đổi vị trí' : 'Chọn ảnh khác'}
                            </span>
                        )}
                    </button>
                    {!compact && (
                        <small>
                            {recommendedSize.width === recommendedSize.height
                                ? 'Khung vuông tỉ lệ 1:1.'
                                : 'Ảnh sẽ được crop theo đúng khung đề xuất trước khi lưu.'}
                        </small>
                    )}
                </div>
            ) : (
                (preview || value) && <img src={preview || value} alt={`Xem trước ${label.toLowerCase()}`} />
            )}
            {file && (
                <button
                    type="button"
                    onClick={() => {
                        onChange(null);
                        setError('');
                    }}
                    disabled={disabled}
                >
                    Bỏ ảnh đã chọn
                </button>
            )}
            {file && !compact && (
                <small className="media-upload-file" title={file.name}>
                    {file.name}
                </small>
            )}
            <small id={hintId}>{hint || 'JPG, PNG hoặc WebP · tối đa 5 MB'}</small>
            {error && <p role="alert">{error}</p>}
            {cropFile && (
                <ImageCropModal
                    file={cropFile}
                    size={recommendedSize}
                    label={label}
                    onClose={() => setCropFile(null)}
                    onApply={(cropped) => {
                        onChange(cropped);
                        setCropFile(null);
                    }}
                />
            )}
        </div>
    );
}
