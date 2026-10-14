import { useEffect, useRef, useState } from 'react';
import V2Modal from '../v2/common/modal/V2Modal';
import { imageCropRect, moveImageCrop } from './image-crop';
import { isSvgAsset, cropSvgAsset } from '../../pages/v2/profile-page/svg-palette';
import './ImageCropModal.scss';

export default function ImageCropModal({ file, size, label, sourceUrl, circular = false, onClose, onApply }) {
    const minZoom = circular ? 0.5 : 1;
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
        const url = sourceUrl || URL.createObjectURL(file),
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
            if (!sourceUrl) URL.revokeObjectURL(url);
        };
    }, [file, sourceUrl]);
    const rect =
        source &&
        imageCropRect(source.width, source.height, size.width, size.height, zoom, position.x, position.y, minZoom);
    const apply = async () => {
        if (!source || saving || lock.current) return;
        lock.current = true;
        setSaving(true);
        setError('');
        try {
            if (circular && isSvgAsset(source.url)) {
                const blob = cropSvgAsset(source.url, rect, size);
                if (blob.size > 5 * 1024 * 1024) throw new Error('SVG sau crop vượt quá 5 MB.');
                if (alive.current)
                    await onApply(
                        new File([blob], `${file.name.replace(/\.[^.]+$/, '')}-cropped.svg`, { type: blob.type }),
                    );
                return;
            }
            const canvas = document.createElement('canvas');
            canvas.width = size.width;
            canvas.height = size.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Không thể crop ảnh.');
            if (circular) {
                context.beginPath();
                context.arc(size.width / 2, size.height / 2, Math.min(size.width, size.height) / 2, 0, Math.PI * 2);
                context.clip();
            }
            context.drawImage(source.image, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height);
            const mime = circular
                ? 'image/png'
                : file.type === 'image/jpeg'
                  ? 'image/jpeg'
                  : file.type === 'image/webp'
                    ? 'image/webp'
                    : 'image/png';
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92));
            if (!blob) throw new Error('Không thể tạo ảnh đã crop.');
            if (blob.size > 5 * 1024 * 1024) throw new Error('Ảnh sau crop vượt quá 5 MB.');
            const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
            if (alive.current)
                await onApply(
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
            title={circular ? 'Cắt khung avatar' : `Crop ${label.toLowerCase()}`}
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
                    {circular
                        ? 'Kéo ảnh trong khung tròn, phóng to hoặc thu nhỏ để chọn vùng giữ lại. Phần ngoài vòng tròn sẽ được bỏ. Kết quả: '
                        : 'Kéo ảnh để chọn vùng giữ lại. Ảnh sau crop: '}
                    <strong>
                        {size.width} × {size.height}px
                    </strong>
                    .
                </p>
                <div
                    className={`image-crop-preview${size.width === size.height ? ' is-square' : ''}${circular ? ' is-circular' : ''}`}
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
                        const free = axis === 'x' ? source.width - rect.width : source.height - rect.height;
                        const change = (['ArrowLeft', 'ArrowUp'].includes(event.key) ? 5 : -5) * (free < 0 ? -1 : 1);
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
                        min={minZoom}
                        max="3"
                        step="0.01"
                        value={zoom}
                        disabled={saving || !source}
                        style={{ '--range-progress': `${((zoom - minZoom) / (3 - minZoom)) * 100}%` }}
                        onChange={(event) => {
                            drag.current = null;
                            setZoom(Number(event.target.value));
                        }}
                    />
                </label>
                {circular && (
                    <div className="image-crop-zoom-actions">
                        <button
                            type="button"
                            className="v2-button"
                            disabled={saving || !source || zoom <= minZoom}
                            onClick={() => {
                                drag.current = null;
                                setZoom((value) => Math.max(minZoom, Math.round((value - 0.1) * 100) / 100));
                            }}
                        >
                            − Thu nhỏ
                        </button>
                        <button
                            type="button"
                            className="v2-button"
                            disabled={saving || !source || zoom >= 3}
                            onClick={() => {
                                drag.current = null;
                                setZoom((value) => Math.min(3, Math.round((value + 0.1) * 100) / 100));
                            }}
                        >
                            + Phóng to
                        </button>
                    </div>
                )}
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
