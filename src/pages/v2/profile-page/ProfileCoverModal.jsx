import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LockKeyhole } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import ProfileCoverArt from './ProfileCoverArt';
import ProfileImagePicker from './ProfileImagePicker';
import { COVER_COLORS, getCoverShapes, canUseCoverItem, readCoverInventory } from './cover-cosmetics';
import { DEFAULT_COVER_TRANSFORM, DEFAULT_COVER_TEXT } from './cover-design';
import './ProfileCoverModal.scss';

export default function ProfileCoverModal({ user, profile, savedImage, onClose, onSave }) {
    const [color, setColor] = useState(
        profile.coverPreset === 'custom' ? profile.coverBackgroundColor || 'default' : profile.coverPreset || 'default',
    );
    const [shape, setShape] = useState(profile.coverShape || 'petals');
    const [mode, setMode] = useState(profile.coverPreset === 'custom' && savedImage ? 'upload' : 'design');
    const [tab, setTab] = useState('background');
    const tabId = useId();
    const drag = useRef(null);
    const [shapeTransform, setShapeTransform] = useState({
        ...DEFAULT_COVER_TRANSFORM,
        ...profile.coverShapeTransform,
    });
    const [coverText, setCoverText] = useState({ ...DEFAULT_COVER_TEXT, ...profile.coverText });
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
    const unlocked = canUseCoverItem('color', color, inventory) && canUseCoverItem('shape', shape, inventory);
    const changed =
        (mode === 'upload' ? !!file || profile.coverPreset !== 'custom' : profile.coverPreset !== color) ||
        (profile.coverShape || 'petals') !== shape ||
        (mode === 'upload' && (profile.coverBackgroundColor || 'default') !== color) ||
        JSON.stringify(shapeTransform) !==
            JSON.stringify({ ...DEFAULT_COVER_TRANSFORM, ...profile.coverShapeTransform }) ||
        JSON.stringify(coverText) !== JSON.stringify({ ...DEFAULT_COVER_TEXT, ...profile.coverText });
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
        drag.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            bounds,
            layer: tab,
            layout: tab === 'text' ? coverText : shapeTransform,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };
    const moveLayer = (event) => {
        const current = drag.current;
        if (!current || current.pointerId !== event.pointerId) return;
        const update = current.layer === 'text' ? setCoverText : setShapeTransform;
        const xLimit = current.layer === 'text' ? 100 : 50;
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
                            disabled={saving}
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
                                        <LockKeyhole size={12} /> {item.cost} điểm tại CLB
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
        if (saving || !changed || !unlocked || (mode === 'upload' && !file && !savedImage)) return;
        setSaving(true);
        setError('');
        try {
            await onSave({
                file: mode === 'upload' ? file : null,
                preset: mode === 'upload' ? 'custom' : color,
                shape,
                shapeTransform,
                backgroundColor: color,
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
                if (!saving) onClose();
            }}
            wide
            className="v2-cover-modal"
        >
            <form onSubmit={submit} className="v2-cover-form">
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
                            imageUrl={mode === 'upload' ? previewImage || savedImage : ''}
                            shapeTransform={shapeTransform}
                            coverText={coverText}
                        />
                    </div>
                    <p className="v2-cover-preview-note">Xem trước toàn bộ ảnh bìa · Cùng bố cục với trang cá nhân.</p>
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
                                    items: COVER_COLORS,
                                    selected: color,
                                    select: setColor,
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
                        </>
                    )}
                    {tab === 'shape' && (
                        <>
                            {renderOptions({
                                kind: 'shape',
                                label: 'Shape trang trí',
                                items: shapes,
                                selected: shape,
                                select: setShape,
                            })}
                            <p className="v2-cover-preview-note">
                                Shape nằm đè lên nền. Kéo trực tiếp trên ảnh xem trước hoặc dùng thanh điều chỉnh bên
                                dưới.
                            </p>
                            <div className="v2-cover-controls">
                                {[
                                    ['x', 'Vị trí ngang', -50, 50],
                                    ['y', 'Vị trí dọc', -100, 100],
                                    ['scale', 'Kích thước', 25, 200],
                                ].map(([key, label, min, max]) => (
                                    <label key={key}>
                                        <span>
                                            {label}
                                            <output>{shapeTransform[key]}%</output>
                                        </span>
                                        <input
                                            type="range"
                                            aria-label={label}
                                            min={min}
                                            max={max}
                                            step={1}
                                            value={shapeTransform[key]}
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
                                Đặt lại vị trí và kích thước
                            </button>
                            <p className="v2-cover-preview-note">
                                CLB có thể thêm shape riêng bằng PNG nền trong suốt tại Kho quà.
                            </p>
                        </>
                    )}
                    {tab === 'text' && (
                        <div className="v2-cover-text-controls">
                            <p className="v2-cover-preview-note">
                                Kéo phần chữ trên ảnh xem trước để đổi vị trí, hoặc dùng thanh điều chỉnh bên dưới.
                            </p>
                            {[
                                ['x', 'Vị trí chữ ngang'],
                                ['y', 'Vị trí chữ dọc'],
                            ].map(([axis, label]) => (
                                <label key={axis}>
                                    {label}: {coverText[axis]}%
                                    <input
                                        type="range"
                                        aria-label={label}
                                        min={-100}
                                        max={100}
                                        step={1}
                                        value={coverText[axis]}
                                        disabled={saving || !coverText.visible}
                                        onChange={(event) =>
                                            setCoverText((value) => ({ ...value, [axis]: Number(event.target.value) }))
                                        }
                                    />
                                </label>
                            ))}

                            <label className="v2-cover-check">
                                <input
                                    type="checkbox"
                                    checked={coverText.visible}
                                    disabled={saving}
                                    onChange={(event) =>
                                        setCoverText((value) => ({ ...value, visible: event.target.checked }))
                                    }
                                />{' '}
                                Hiển thị chữ trên ảnh bìa
                            </label>
                            {[
                                ['eyebrow', 'Dòng chữ nhỏ', 80],
                                ['title', 'Tiêu đề', 60],
                                ['subtitle', 'Dòng chữ nhấn', 60],
                            ].map(([key, label, limit]) => (
                                <label key={key}>
                                    {label}
                                    <input
                                        type="text"
                                        maxLength={limit}
                                        value={coverText[key]}
                                        disabled={saving || !coverText.visible}
                                        onChange={(event) =>
                                            setCoverText((value) => ({ ...value, [key]: event.target.value }))
                                        }
                                    />
                                </label>
                            ))}
                            <label className="v2-cover-check">
                                <input
                                    type="checkbox"
                                    checked={!coverText.color}
                                    disabled={saving || !coverText.visible}
                                    onChange={(event) =>
                                        setCoverText((value) => ({
                                            ...value,
                                            color: event.target.checked
                                                ? ''
                                                : COVER_COLORS.find((item) => item.id === color).ink,
                                        }))
                                    }
                                />{' '}
                                Dùng màu chữ theo bảng màu
                            </label>
                            {coverText.color && (
                                <label>
                                    Màu chữ
                                    <input
                                        type="color"
                                        value={coverText.color}
                                        disabled={saving || !coverText.visible}
                                        onChange={(event) =>
                                            setCoverText((value) => ({ ...value, color: event.target.value }))
                                        }
                                    />
                                </label>
                            )}
                            <label>
                                Cỡ chữ: {coverText.size}px
                                <input
                                    type="range"
                                    min={24}
                                    max={240}
                                    value={coverText.size}
                                    disabled={saving || !coverText.visible}
                                    onChange={(event) =>
                                        setCoverText((value) => ({ ...value, size: Number(event.target.value) }))
                                    }
                                />
                            </label>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={saving}
                                onClick={() => setCoverText({ ...DEFAULT_COVER_TEXT })}
                            >
                                Khôi phục chữ mặc định
                            </button>
                        </div>
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
                <p className="v2-cover-preview-note">
                    Thiết kế và quyền sở hữu đang lưu tạm theo tài khoản trên thiết bị này.
                </p>
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
                <footer>
                    <button type="button" className="v2-button" disabled={saving} onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="v2-button v2-button--primary"
                        disabled={saving || !changed || !unlocked || (mode === 'upload' && !file && !savedImage)}
                    >
                        {saving ? 'Đang lưu…' : 'Lưu ảnh bìa'}
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
