import { useEffect, useRef, useState } from 'react';
import V2Modal from '../v2/common/modal/V2Modal';
import { imageCropRect, moveImageCrop } from './image-crop';
import './ImageCropModal.scss';

export default function ImageCropModal({ file, size, label, onClose, onApply }) {
    const [source, setSource] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const drag = useRef(null),
        lock = useRef(false),
        alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        const url = URL.createObjectURL(file),
            image = new Image();
        let active = true;
        image.onload = () => {
            if (active) setSource({ url, image, width: image.naturalWidth, height: image.naturalHeight });
        };
        image.onerror = () => {
            if (active) setError('Không thể đọc ảnh. Vui lòng chọn ảnh khác.');
        };
        image.src = url;
        return () => {
            active = false;
            alive.current = false;
            URL.revokeObjectURL(url);
        };
    }, [file]);
    const rect =
        source && imageCropRect(source.width, source.height, size.width, size.height, zoom, position.x, position.y);
    const apply = async () => {
        if (!source || saving || lock.current) return;
        lock.current = true;
        setSaving(true);
        setError('');
        try {
            const canvas = document.createElement('canvas');
            canvas.width = size.width;
            canvas.height = size.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Không thể crop ảnh.');
            context.drawImage(source.image, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height);
            const mime =
                file.type === 'image/jpeg' ? 'image/jpeg' : file.type === 'image/webp' ? 'image/webp' : 'image/png';
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
            if (!blob) throw new Error('Không thể tạo ảnh đã crop.');
            if (blob.size > 5 * 1024 * 1024) throw new Error('Ảnh sau crop vượt quá 5 MB.');
            const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
            if (alive.current)
                onApply(
                    new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-cropped.${extension}`, { type: blob.type }),
                );
        } catch (issue) {
            if (alive.current) setError(issue.message || 'Không thể crop ảnh.');
        } finally {
            lock.current = false;
            if (alive.current) setSaving(false);
        }
    };
    return (
        <V2Modal
            title={`Crop ${label.toLowerCase()}`}
            className="image-crop-modal"
            wide={size.width / size.height > 2}
            onClose={() => {
                if (!saving) onClose();
            }}
            footer={
                <>
                    <button type="button" className="v2-button" onClick={onClose} disabled={saving}>
                        Hủy
                    </button>
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={saving || !source}
                        onClick={apply}
                    >
                        {saving ? 'Đang crop…' : 'Áp dụng crop'}
                    </button>
                </>
            }
        >
            <div className="image-crop-editor">
                <p>
                    Kéo ảnh để chọn vùng giữ lại. Ảnh sau crop:{' '}
                    <strong>
                        {size.width} × {size.height}px
                    </strong>
                    .
                </p>
                <div
                    className={`image-crop-preview${size.width === size.height ? ' is-square' : ''}`}
                    style={{ aspectRatio: `${size.width} / ${size.height}` }}
                    tabIndex={0}
                    role="group"
                    aria-label="Vùng crop ảnh, kéo hoặc dùng phím mũi tên để di chuyển"
                    onPointerDown={(event) => {
                        if (!source || saving || event.button !== 0) return;
                        event.preventDefault();
                        const bounds = event.currentTarget.getBoundingClientRect();
                        drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, bounds, rect };
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }}
                    onPointerMove={(event) => {
                        const current = drag.current;
                        if (!current || current.pointerId !== event.pointerId) return;
                        setPosition(
                            moveImageCrop(
                                current.rect,
                                source.width,
                                source.height,
                                current.bounds.width,
                                current.bounds.height,
                                event.clientX - current.x,
                                event.clientY - current.y,
                            ),
                        );
                    }}
                    onPointerUp={() => {
                        drag.current = null;
                    }}
                    onPointerCancel={() => {
                        drag.current = null;
                    }}
                    onLostPointerCapture={() => {
                        drag.current = null;
                    }}
                    onKeyDown={(event) => {
                        if (
                            saving ||
                            !source ||
                            !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
                        )
                            return;
                        event.preventDefault();
                        const axis = ['ArrowLeft', 'ArrowRight'].includes(event.key) ? 'x' : 'y';
                        const change = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? 5 : -5;
                        setPosition((value) => ({
                            ...value,
                            [axis]: Math.max(0, Math.min(100, value[axis] + change)),
                        }));
                    }}
                >
                    {source ? (
                        <img
                            src={source.url}
                            alt="Xem trước vùng ảnh được giữ lại"
                            draggable={false}
                            style={{
                                width: `${(source.width / rect.width) * 100}%`,
                                height: `${(source.height / rect.height) * 100}%`,
                                left: `${(-rect.x / rect.width) * 100}%`,
                                top: `${(-rect.y / rect.height) * 100}%`,
                            }}
                        />
                    ) : (
                        <span>Đang đọc ảnh…</span>
                    )}
                    <span className="image-crop-grid" aria-hidden="true" />
                </div>
                <label>
                    Phóng to: {Math.round(zoom * 100)}%
                    <input
                        aria-label="Phóng to ảnh crop"
                        type="range"
                        min="1"
                        max="3"
                        step="0.01"
                        value={zoom}
                        disabled={saving || !source}
                        style={{ '--range-progress': `${((zoom - 1) / 2) * 100}%` }}
                        onChange={(event) => {
                            drag.current = null;
                            setZoom(Number(event.target.value));
                        }}
                    />
                </label>
                <button
                    type="button"
                    className="v2-button"
                    disabled={saving || !source}
                    onClick={() => {
                        setZoom(1);
                        setPosition({ x: 50, y: 50 });
                    }}
                >
                    Căn giữa và đặt lại
                </button>
                {error && (
                    <p className="image-crop-error" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </V2Modal>
    );
}
