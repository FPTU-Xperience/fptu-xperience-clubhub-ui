import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LockKeyhole } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import ProfileCoverArt from './ProfileCoverArt';
import ProfileImagePicker from './ProfileImagePicker';
import PaletteColorPicker from '../../../components/media/PaletteColorPicker';
import { getCoverColors, getCoverShapes, canUseCoverItem, readCoverInventory } from './cover-cosmetics';
import { DEFAULT_COVER_TRANSFORM, DEFAULT_COVER_TEXT, normalizeCoverText, normalizeShapeHsl } from './cover-design';
import ShapeHslControls from './ShapeHslControls';
import { canSyncPaletteAsset, resolvePaletteAsset } from './palette-asset';
import ProfilePaletteSync from './ProfilePaletteSync';
import TextParagraphEditor from '../../../components/media/TextParagraphEditor';
import { coverTextParagraphs } from './cover-design';
import { moveTextParagraph } from '../../../components/media/text-paragraphs';
import './ProfileCoverModal.scss';

export default function ProfileCoverModal({ user, profile, savedImage, onClose, onSave }) {
    const [color, setColor] = useState(
        profile.coverPreset === 'custom' ? profile.coverBackgroundColor || 'default' : profile.coverPreset || 'default',
    );
    const [shape, setShape] = useState(profile.coverShape || 'petals');
    const [backgroundPaint, setBackgroundPaint] = useState(profile.coverBackgroundPaint || '');
    const [mode, setMode] = useState(profile.coverPreset === 'custom' && savedImage ? 'upload' : 'design');
    const [tab, setTab] = useState('background');
    const [selectedParagraphId, setSelectedParagraphId] = useState('title');
    const tabId = useId();
    const drag = useRef(null);
    const [shapeTransform, setShapeTransform] = useState({
        ...DEFAULT_COVER_TRANSFORM,
        ...profile.coverShapeTransform,
    });
    const [coverText, setCoverText] = useState(() => normalizeCoverText(profile.coverText));
    const [shapeHsl, setShapeHsl] = useState(() => normalizeShapeHsl(profile.coverShapeHsl));
    const [shapeUsePalette, setShapeUsePalette] = useState(profile.coverShapeUsePalette || false);
    const [syncing, setSyncing] = useState(false);
    const [syncAsset, setSyncAsset] = useState(null);
    const [file, setFile] = useState(null);
    const [previewImage, setPreviewImage] = useState('');
    const [inventory, setInventory] = useState(() => readCoverInventory(user));
    const [shapes, setShapes] = useState(() => getCoverShapes());
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!file) {
            setPreviewImage('');
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewImage(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    useEffect(() => {
        const refresh = () => {
            setInventory(readCoverInventory(user));
            setShapes(getCoverShapes());
        };
        window.addEventListener('storage', refresh);
        window.addEventListener('clubhub:cover-rewards-updated', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('clubhub:cover-rewards-updated', refresh);
        };
    }, [user]);
    const selectedShape = shapes.find((item) => item.id === shape);
    const canSyncShape = canSyncPaletteAsset(selectedShape?.assetUrl);
    const toggleShapePalette = async (checked) => {
        setShapeUsePalette(checked);
        setError('');
        if (!checked) return;
        const asset = selectedShape?.assetUrl;
        setSyncing(true);
        try {
            const vector = await resolvePaletteAsset(asset);
            setSyncAsset({ asset, vector });
        } catch (issue) {
            setShapeUsePalette(false);
            setError(issue.message || 'Không thể đồng bộ màu shape.');
        } finally {
            setSyncing(false);
        }
    };
    const automaticShape = shape !== 'none' && !selectedShape?.assetUrl;
    const unlocked = canUseCoverItem('color', color, inventory) && canUseCoverItem('shape', shape, inventory);
    const changed =
        backgroundPaint !== (profile.coverBackgroundPaint || '') ||
        (mode === 'upload' ? !!file || profile.coverPreset !== 'custom' : profile.coverPreset !== color) ||
        (profile.coverShape || 'petals') !== shape ||
        (mode === 'upload' && (profile.coverBackgroundColor || 'default') !== color) ||
        JSON.stringify(shapeTransform) !==
            JSON.stringify({ ...DEFAULT_COVER_TRANSFORM, ...profile.coverShapeTransform }) ||
        JSON.stringify(coverText) !== JSON.stringify(normalizeCoverText(profile.coverText)) ||
        JSON.stringify(shapeHsl) !== JSON.stringify(normalizeShapeHsl(profile.coverShapeHsl)) ||
        shapeUsePalette !== (profile.coverShapeUsePalette || false);
    const beginLayerDrag = (event) => {
        if (
            saving ||
            event.button !== 0 ||
            (tab !== 'shape' && tab !== 'text') ||
            (tab === 'shape' && shape === 'none') ||
            (tab === 'text' && !coverText.visible)
        )
            return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const paragraphs = coverTextParagraphs(coverText);
        const paragraphId =
            event.target.closest?.('[data-paragraph-id]')?.getAttribute('data-paragraph-id') ||
            (paragraphs.some((item) => item.id === selectedParagraphId) ? selectedParagraphId : paragraphs[0]?.id);
        if (tab === 'text' && !paragraphId) return;
        if (tab === 'text') setSelectedParagraphId(paragraphId);
        drag.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            bounds,
            layer: tab,
            layout: tab === 'text' ? coverText : shapeTransform,
            paragraphs,
            paragraphId,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const moveLayer = (event) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        if (current.layer === 'text') {
            setCoverText({
                ...current.layout,
                paragraphs: moveTextParagraph(
                    current.paragraphs,
                    current.paragraphId,
                    event.clientX - current.startX,
                    event.clientY - current.startY,
                    current.bounds.width,
                    current.bounds.height,
                ),
            });
            return;
        }
        const update = current.layer === 'text' ? setCoverText : setShapeTransform;
        const xLimit = 100;
        update({
            ...current.layout,
            x: Math.max(
                -xLimit,
                Math.min(
                    xLimit,
                    Math.round(current.layout.x + ((event.clientX - current.startX) / current.bounds.width) * 100),
                ),
            ),
            y: Math.max(
                -100,
                Math.min(
                    100,
                    Math.round(current.layout.y + ((event.clientY - current.startY) / current.bounds.height) * 100),
                ),
            ),
        });
    };
    const renderOptions = (group) => (
        <fieldset key={group.kind}>
            <legend>{group.label}</legend>
            <div
                className="v2-cover-options"
                tabIndex={0}
                role="group"
                aria-label={`${group.label}: 2 hàng, cuộn ngang để xem thêm`}
            >
                {group.items.map((item) => {
                    const owned = canUseCoverItem(group.kind, item.id, inventory);
                    return (
                        <button
                            key={item.id}
                            type="button"
                            aria-pressed={group.selected === item.id}
                            className={!owned ? 'is-locked' : ''}
                            disabled={saving || syncing}
                            onClick={() => group.select(item.id)}
                        >
                            <span className="v2-cover-option-art">
                                <ProfileCoverArt
                                    color={item.colorId || (group.kind === 'color' ? item.id : color)}
                                    shape={item.shapeId || (group.kind === 'shape' ? item.id : shape)}
                                />
                                {!owned && (
                                    <span className="v2-cover-option-lock">
                                        <LockKeyhole size={18} aria-hidden="true" />
                                    </span>
                                )}
                            </span>
                            <strong>
                                {item.label}
                                {group.selected === item.id && <Check size={14} />}
                            </strong>
                            <small>
                                {item.free ? (
                                    'Miễn phí'
                                ) : owned ? (
                                    'Đã sở hữu'
                                ) : (
                                    <>
                                        <LockKeyhole size={12} />{' '}
                                        {item.cost === 0 ? 'Miễn phí · Nhận tại CLB' : `${item.cost} điểm tại CLB`}
                                    </>
                                )}
                            </small>
                            {item.clubName && <small>{item.clubName} · Độc quyền CLB</small>}
                        </button>
                    );
                })}
            </div>
        </fieldset>
    );
    const submit = async (event) => {
        event.preventDefault();
        if (saving || syncing || !changed || !unlocked || (mode === 'upload' && !file && !savedImage)) return;
        setSaving(true);
        setError('');
        try {
            await onSave({
                file: mode === 'upload' ? file : null,
                preset: mode === 'upload' ? 'custom' : color,
                shape,
                shapeTransform,
                shapeHsl,
                shapeUsePalette,
                backgroundColor: color,
                backgroundPaint,
                coverText,
            });
            onClose();
        } catch (issue) {
            setError(issue.message || 'Không thể lưu ảnh bìa.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <V2Modal
            title="Tùy chỉnh ảnh bìa"
            onClose={() => {
                if (!saving && !syncing) onClose();
            }}
            wide
            className="v2-cover-modal"
            footer={
                <>
                    <button type="button" className="v2-button" disabled={saving || syncing} onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form={`${tabId}-form`}
                        className="v2-button v2-button--primary"
                        disabled={
                            saving || syncing || !changed || !unlocked || (mode === 'upload' && !file && !savedImage)
                        }
                    >
                        {saving ? 'Đang lưu…' : 'Lưu ảnh bìa'}
                    </button>
                </>
            }
        >
            <form id={`${tabId}-form`} onSubmit={submit} className="v2-cover-form">
                <div className="v2-cover-editor-heading">
                    <div
                        className={`v2-cover-preview${(tab === 'shape' && shape !== 'none') || (tab === 'text' && coverText.visible) ? ' is-positioning' : ''}`}
                        onPointerDown={beginLayerDrag}
                        onPointerMove={moveLayer}
                        onPointerUp={() => {
                            drag.current = null;
                        }}
                        onPointerCancel={() => {
                            drag.current = null;
                        }}
                        onLostPointerCapture={() => {
                            drag.current = null;
                        }}
                    >
                        <ProfileCoverArt
                            color={color}
                            shape={shape}
                            backgroundPaint={backgroundPaint}
                            imageUrl={mode === 'upload' ? previewImage || savedImage : ''}
                            shapeTransform={shapeTransform}
                            shapeHsl={shapeHsl}
                            shapeUsePalette={shapeUsePalette}
                            shapeAssetUrl={
                                syncAsset && syncAsset.asset === selectedShape?.assetUrl ? syncAsset.vector : ''
                            }
                            coverText={coverText}
                            selectedParagraphId={selectedParagraphId}
                            textInteractive={tab === 'text'}
                        />
                    </div>
                    <p className="v2-cover-preview-note">
                        Xem trước toàn bộ ảnh bìa · Đề xuất 1200 × 300px (4:1) · Cùng bố cục với trang cá nhân.
                    </p>
                    <div className="v2-cover-modes" role="tablist" aria-label="Tùy chỉnh ảnh bìa">
                        {[
                            ['background', 'Nền'],
                            ['shape', 'Shape'],
                            ['text', 'Chữ'],
                        ].map(([id, label], index) => (
                            <button
                                key={id}
                                id={`${tabId}-${id}`}
                                type="button"
                                role="tab"
                                aria-selected={tab === id}
                                aria-controls={`${tabId}-panel-${id}`}
                                tabIndex={tab === id ? 0 : -1}
                                disabled={saving}
                                onClick={() => setTab(id)}
                                onKeyDown={(event) => {
                                    const ids = ['background', 'shape', 'text'];
                                    const next =
                                        event.key === 'ArrowRight'
                                            ? (index + 1) % 3
                                            : event.key === 'ArrowLeft'
                                              ? (index + 2) % 3
                                              : event.key === 'Home'
                                                ? 0
                                                : event.key === 'End'
                                                  ? 2
                                                  : null;
                                    if (next === null) return;
                                    event.preventDefault();
                                    setTab(ids[next]);
                                    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next].focus();
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                {tab === 'shape' && (
                    <ProfilePaletteSync
                        colorId={color}
                        target="shape"
                        automatic={automaticShape}
                        checked={automaticShape || (canSyncShape && shapeUsePalette)}
                        onChange={toggleShapePalette}
                        disabled={saving || syncing || !canSyncShape}
                        reason={
                            syncing
                                ? 'Đang chuẩn bị SVG và đồng bộ màu…'
                                : shape === 'none'
                                  ? 'Chọn stamp trong tab Shape để dùng bộ màu.'
                                  : automaticShape
                                    ? 'Shape có sẵn đã tự động dùng màu chính/phụ từ bộ màu này.'
                                    : !canSyncShape
                                      ? 'Thiết kế này chưa hỗ trợ đồng bộ hai màu.'
                                      : undefined
                        }
                    />
                )}
                <div
                    className="v2-cover-panel"
                    role="tabpanel"
                    id={`${tabId}-panel-${tab}`}
                    aria-labelledby={`${tabId}-${tab}`}
                >
                    {tab === 'background' && (
                        <>
                            <div className="v2-cover-background-mode" aria-label="Loại nền">
                                <button
                                    type="button"
                                    className="v2-button"
                                    aria-pressed={mode === 'design'}
                                    disabled={saving}
                                    onClick={() => setMode('design')}
                                >
                                    Màu nền
                                </button>
                                <button
                                    type="button"
                                    className="v2-button"
                                    aria-pressed={mode === 'upload'}
                                    disabled={saving}
                                    onClick={() => setMode('upload')}
                                >
                                    Ảnh nền
                                </button>
                            </div>
                            {mode === 'design' ? (
                                renderOptions({
                                    kind: 'color',
                                    label: 'Màu nền',
                                    items: getCoverColors(),
                                    selected: backgroundPaint ? '' : color,
                                    select: (next) => {
                                        setColor(next);
                                        setBackgroundPaint('');
                                    },
                                })
                            ) : (
                                <ProfileImagePicker
                                    cover
                                    hidePreview
                                    file={file}
                                    value={savedImage}
                                    onChange={setFile}
                                    disabled={saving}
                                />
                            )}
                            {mode === 'design' && (
                                <PaletteColorPicker
                                    label="Màu nền tùy chọn"
                                    value={
                                        backgroundPaint ||
                                        getCoverColors().find((item) => item.id === color)?.background ||
                                        '#fff1df'
                                    }
                                    disabled={saving}
                                    onChange={(paint) => {
                                        setBackgroundPaint(paint);
                                        setColor('default');
                                    }}
                                />
                            )}
                        </>
                    )}
                    {tab === 'shape' && (
                        <>
                            {renderOptions({
                                kind: 'shape',
                                label: 'Shape trang trí',
                                items: shapes,
                                selected: shape,
                                select: (next) => {
                                    setShape(next);
                                    setShapeTransform({ ...DEFAULT_COVER_TRANSFORM });
                                    setShapeHsl(normalizeShapeHsl(shapes.find((item) => item.id === next)?.hsl));
                                },
                            })}
                            <p className="v2-cover-preview-note">
                                Stamp là lớp ảnh độc lập. Kéo trên ảnh xem trước để di chuyển; dùng thanh điều chỉnh để
                                xoay và scale. Nền không thay đổi khi chỉnh stamp.
                            </p>
                            <div className="v2-cover-controls">
                                {[
                                    ['x', 'Vị trí ngang', -100, 100],
                                    ['y', 'Vị trí dọc', -100, 100],
                                    ['scale', 'Kích thước', 10, 400],
                                    ['rotation', 'Xoay', -180, 180],
                                ].map(([key, label, min, max]) => (
                                    <label key={key}>
                                        <span>
                                            {label}
                                            <output>
                                                {shapeTransform[key]}
                                                {key === 'rotation' ? '°' : '%'}
                                            </output>
                                        </span>
                                        <input
                                            type="range"
                                            aria-label={label}
                                            min={min}
                                            max={max}
                                            step={1}
                                            value={shapeTransform[key]}
                                            style={{
                                                '--range-progress': `${((shapeTransform[key] - min) / (max - min)) * 100}%`,
                                            }}
                                            disabled={saving || shape === 'none'}
                                            onChange={(event) =>
                                                setShapeTransform((value) => ({
                                                    ...value,
                                                    [key]: Number(event.target.value),
                                                }))
                                            }
                                        />
                                    </label>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={saving}
                                onClick={() => setShapeTransform({ ...DEFAULT_COVER_TRANSFORM })}
                            >
                                Đặt lại vị trí, kích thước và góc xoay
                            </button>
                            {shapes.find((item) => item.id === shape)?.assetUrl && (
                                <ShapeHslControls value={shapeHsl} onChange={setShapeHsl} disabled={saving} />
                            )}
                            <p className="v2-cover-preview-note">
                                CLB có thể thêm shape riêng bằng PNG hoặc SVG tối đa 5 MB tại Kho quà.
                            </p>
                        </>
                    )}
                    {tab === 'text' && (
                        <TextParagraphEditor
                            paragraphs={coverTextParagraphs(coverText)}
                            selectedId={selectedParagraphId}
                            onSelect={setSelectedParagraphId}
                            onChange={(paragraphs) => setCoverText((current) => ({ ...current, paragraphs }))}
                            visible={coverText.visible}
                            onVisibleChange={(visible) => setCoverText((current) => ({ ...current, visible }))}
                            disabled={saving}
                            onReset={() => {
                                setCoverText(normalizeCoverText(DEFAULT_COVER_TEXT));
                                setSelectedParagraphId('title');
                            }}
                        />
                    )}
                </div>
                {!unlocked && (
                    <p className="v2-cover-locked" role="status">
                        Bạn có thể xem thử thiết kế này. Đổi màu hoặc shape tại Kho quà của CLB để sử dụng.
                    </p>
                )}
                <Link className="v2-cover-store-link" to="/v2/my-clubs">
                    Mở Kho quà tại CLB của tôi để đổi màu & shape →
                </Link>
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
            </form>
        </V2Modal>
    );
}
