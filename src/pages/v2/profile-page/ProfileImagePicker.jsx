import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { validateImage } from '../../../components/media/ImagePicker';

export default function ProfileImagePicker({ cover, file, value, initials, preset, onChange, disabled }) {
    const inputRef = useRef(null);
    const hintId = useId();
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [dragging, setDragging] = useState(false);

    useEffect(() => {
        if (!file) {
            setPreview('');
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const select = (next) => {
        if (disabled || !next) return;
        const issue = validateImage(next);
        setError(issue);
        if (!issue) onChange(next);
    };
    const image = preview || value;

    return <section className={`v2-profile-image-picker${cover ? ' is-cover' : ' is-avatar'}`}>
        <div className="v2-profile-image-preview-heading"><strong>Xem trước</strong><span>{file ? 'Ảnh vừa chọn' : 'Ảnh sẽ hiển thị'}</span></div>
        <div className={`v2-profile-image-preview is-${preset || 'default'}`}>
            {image ? <img src={image} alt={cover ? 'Xem trước ảnh bìa' : 'Xem trước ảnh đại diện'} /> : cover ? <div className="v2-profile-image-preview-decoration" aria-hidden="true"><span /><span /><span /></div> : <span className="v2-profile-image-initials">{initials}</span>}
            {cover && <span className="v2-profile-image-preview-tag">Ảnh bìa của bạn</span>}
        </div>
        <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => { select(event.target.files?.[0]); event.target.value = ''; }} />
        <button type="button" className={`v2-profile-image-dropzone${dragging ? ' is-dragging' : ''}`} disabled={disabled} aria-describedby={hintId}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false); }}
            onDrop={(event) => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files?.[0]); }}>
            <span className="v2-profile-image-upload-icon"><Upload size={22} aria-hidden="true" /></span>
            <strong>{file ? 'Chọn ảnh khác' : 'Nhấn để chọn ảnh hoặc kéo thả vào đây'}</strong>
            <span id={hintId}>JPG, PNG hoặc WebP · Tối đa 5 MB</span>
            <span className="v2-profile-image-browse"><ImagePlus size={16} aria-hidden="true" />{cover ? 'Chọn ảnh bìa' : 'Chọn ảnh đại diện'}</span>
        </button>
        {file && <div className="v2-profile-image-file"><ImagePlus size={18} aria-hidden="true" /><div><strong title={file.name}>{file.name}</strong><span>{(file.size / (1024 * 1024)).toFixed(2)} MB · Sẵn sàng lưu</span></div><button type="button" aria-label="Bỏ ảnh đã chọn" disabled={disabled} onClick={() => { onChange(null); setError(''); }}><X size={17} /></button></div>}
        {error && <p className="v2-profile-form-error" role="alert">{error}</p>}
    </section>;
}
