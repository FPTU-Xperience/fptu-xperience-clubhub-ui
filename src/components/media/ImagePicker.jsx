import { useEffect, useState } from 'react';
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

export default function ImagePicker({ label, value, file, onChange, disabled = false, hint = '' }) {
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!file) {
            setPreview('');
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const select = (event) => {
        const next = event.target.files?.[0] || null;
        const issue = validateImage(next);
        setError(issue);
        onChange(issue ? null : next);
        event.target.value = '';
    };

    return (
        <div className="media-image-picker">
            <label>
                <span>{label}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={select} disabled={disabled} />
            </label>
            {(preview || value) && <img src={preview || value} alt={`Xem trước ${label.toLowerCase()}`} />}
            {file && <button type="button" onClick={() => onChange(null)} disabled={disabled}>Bỏ ảnh đã chọn</button>}
            <small>{hint || 'JPG, PNG hoặc WebP · tối đa 5 MB'}</small>
            {error && <p role="alert">{error}</p>}
        </div>
    );
}
