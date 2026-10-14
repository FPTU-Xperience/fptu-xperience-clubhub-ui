import { useId, useRef, useState } from 'react';
import V2Modal from '../v2/common/modal/V2Modal';
import MediaEditorTabs from './MediaEditorTabs';
import ImagePicker from './ImagePicker';
import GraphicBanner from './GraphicBanner';
import GraphicBannerEditor from './GraphicBannerEditor';
import {
    createGraphicBannerFile,
    defaultGraphicBanner,
    readGraphicBanner,
    saveGraphicBanner,
    moveBannerLayer,
    bannerSize,
    graphicTextParagraphs,
} from './graphic-banner';
import { moveTextParagraph } from './text-paragraphs';
import './CoverImageModal.scss';

export default function CoverImageModal({
    kind,
    identity,
    storageKey,
    title,
    value,
    file,
    onChange,
    saving,
    error,
    onClose,
    onSave,
}) {
    const id = useId();
    const size = bannerSize(kind);
    const [cached] = useState(() => readGraphicBanner(storageKey, value));
    const [tab, setTab] = useState('background');
    const [selectedParagraphId, setSelectedParagraphId] = useState('title');
    const [mode, setMode] = useState(cached || !value ? 'graphic' : 'image');
    const [design, setDesign] = useState(() => cached || defaultGraphicBanner(kind, identity));
    const [generating, setGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const lock = useRef(false);
    const drag = useRef(null);
    const busy = saving || generating;
    const positioning =
        mode === 'graphic' &&
        !busy &&
        ((tab === 'shape' && design.decoration !== 'none') || (tab === 'text' && design.visible));
    const finishDrag = () => {
        drag.current = null;
    };
    const previewHandlers = {
        onPointerDown: (event) => {
            if (!positioning || event.button !== 0) return;
            const matrix = event.currentTarget.querySelector('svg')?.getScreenCTM();
            if (!matrix) return;
            event.preventDefault();
            const inverse = matrix.inverse();
            const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
            const paragraphs = graphicTextParagraphs(design, size);
            const paragraphId =
                event.target.closest?.('[data-paragraph-id]')?.getAttribute('data-paragraph-id') ||
                (paragraphs.some((item) => item.id === selectedParagraphId) ? selectedParagraphId : paragraphs[0]?.id);
            if (tab === 'text' && !paragraphId) return;
            if (tab === 'text') setSelectedParagraphId(paragraphId);
            drag.current = { pointerId: event.pointerId, inverse, point, layer: tab, design, paragraphs, paragraphId };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        onPointerMove: (event) => {
            const current = drag.current;
            if (!current || current.pointerId !== event.pointerId) return;
            const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(current.inverse);
            if (current.layer === 'text') {
                setDesign({
                    ...current.design,
                    paragraphs: moveTextParagraph(
                        current.paragraphs,
                        current.paragraphId,
                        point.x - current.point.x,
                        point.y - current.point.y,
                        size.width,
                        size.height,
                    ),
                });
                return;
            }
            setDesign(
                moveBannerLayer(
                    current.design,
                    current.layer,
                    point.x - current.point.x,
                    point.y - current.point.y,
                    size,
                ),
            );
        },
        onPointerUp: finishDrag,
        onPointerCancel: finishDrag,
        onLostPointerCapture: finishDrag,
    };
    const submit = async (event) => {
        event.preventDefault();
        if (busy || lock.current || (mode === 'image' && !file)) return;
        lock.current = true;
        setGenerating(true);
        setGenerationError('');
        try {
            const selected = mode === 'graphic' ? await createGraphicBannerFile(design, size) : file;
            const imageUrl = await onSave(event, selected);
            if (imageUrl && mode === 'graphic') saveGraphicBanner(storageKey, imageUrl, design);
        } catch (issue) {
            setGenerationError(issue.message || 'Không thể tạo banner.');
        } finally {
            lock.current = false;
            setGenerating(false);
        }
    };
    return (
        <V2Modal
            title={title}
            onClose={() => {
                if (!busy) onClose();
            }}
            wide
            className={`media-cover-modal${kind === 'activity' ? ' is-activity-banner' : ''}`}
            footer={
                <>
                    <button type="button" className="v2-button" onClick={onClose} disabled={busy}>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form={`${id}-form`}
                        className="v2-button v2-button--primary"
                        disabled={busy || (mode === 'image' && !file)}
                    >
                        {busy ? 'Đang tạo và lưu…' : 'Lưu ảnh bìa'}
                    </button>
                </>
            }
        >
            <form id={`${id}-form`} className="media-cover-modal-form" onSubmit={submit} aria-busy={busy}>
                <div className="media-cover-editor-heading">
                    <ImagePicker
                        label="Ảnh bìa"
                        value={value}
                        file={file}
                        onChange={(next) => {
                            onChange(next);
                            if (next) setMode('image');
                        }}
                        disabled={busy}
                        positioning={positioning}
                        previewHandlers={previewHandlers}
                        recommendedSize={size}
                        renderPreview={(image) =>
                            mode === 'image' && image ? (
                                <img src={image} alt="Xem trước ảnh bìa" />
                            ) : (
                                <GraphicBanner
                                    design={design}
                                    size={size}
                                    selectedParagraphId={selectedParagraphId}
                                    textInteractive={tab === 'text'}
                                />
                            )
                        }
                        hint={
                            positioning
                                ? 'Kéo trực tiếp trên preview hoặc dùng thanh điều chỉnh để đổi vị trí.'
                                : `Xem trước toàn bộ ảnh bìa · Đề xuất ${size.width} × ${size.height}px (${kind === 'activity' ? '12:5' : '4:1'})`
                        }
                        compact
                    />
                    <MediaEditorTabs
                        id={id}
                        items={[
                            ['background', 'Nền'],
                            ['shape', 'Shape'],
                            ['text', 'Chữ'],
                        ]}
                        value={tab}
                        onChange={(next) => {
                            finishDrag();
                            setTab(next);
                        }}
                        disabled={busy}
                        label={title}
                    />
                </div>
                <div
                    className="media-cover-editor-panel"
                    role="tabpanel"
                    id={`${id}-panel-${tab}`}
                    aria-labelledby={`${id}-${tab}`}
                >
                    {tab === 'background' && (
                        <div className="media-cover-background-mode" aria-label="Loại nền">
                            <button
                                type="button"
                                className="v2-button"
                                aria-pressed={mode === 'graphic'}
                                disabled={busy}
                                onClick={() => setMode('graphic')}
                            >
                                Màu nền
                            </button>
                            <button
                                type="button"
                                className="v2-button"
                                aria-pressed={mode === 'image'}
                                disabled={busy}
                                onClick={() => setMode('image')}
                            >
                                Ảnh nền
                            </button>
                        </div>
                    )}
                    {mode === 'graphic' ? (
                        <GraphicBannerEditor
                            selectedParagraphId={selectedParagraphId}
                            onSelectParagraph={setSelectedParagraphId}
                            value={design}
                            onChange={setDesign}
                            disabled={busy}
                            tab={tab}
                            kind={kind}
                        />
                    ) : (
                        <div className="media-cover-image-note">
                            <p>
                                {tab === 'background'
                                    ? 'Nhấn hoặc kéo thả ảnh vào khung xem trước để chọn ảnh nền. JPG, PNG, WebP · tối đa 5 MB.'
                                    : 'Chuyển sang màu nền để tùy chỉnh shape và chữ của graphic banner.'}
                            </p>
                            {tab !== 'background' && (
                                <button
                                    type="button"
                                    className="v2-button"
                                    disabled={busy}
                                    onClick={() => setMode('graphic')}
                                >
                                    Dùng màu nền
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {(error || generationError) && (
                    <p className="media-cover-modal-error" role="alert">
                        {error || generationError}
                    </p>
                )}
            </form>
        </V2Modal>
    );
}
