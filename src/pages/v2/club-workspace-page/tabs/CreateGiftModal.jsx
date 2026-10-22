import { useEffect, useId, useState } from 'react';
import { Package, ScanFace, Shapes, Palette, Upload, Coins } from 'lucide-react';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import ProfileAvatar from '../../profile-page/ProfileAvatar';
import ImageCropModal from '../../../../components/media/ImageCropModal';
import ShapeImage from '../../profile-page/ShapeImage';
import ShapeHslControls from '../../profile-page/ShapeHslControls';
import PaletteColorPicker from '../../../../components/media/PaletteColorPicker';
import { paletteColorCss } from '../../../../components/media/color-palette';
import { DEFAULT_SHAPE_HSL } from '../../profile-page/cover-design';
import SvgPaletteControls from '../../profile-page/SvgPaletteControls';
import { getCoverColors } from '../../profile-page/cover-cosmetics';
import { isSvgAsset, svgPaletteFromColors } from '../../profile-page/svg-palette';
import { publishClubShape } from '../../profile-page/cover-cosmetics';
import { publishClubGift } from '../../profile-page/club-gifts';
import { setRewardLifecycle, setRewardWindow, normalizeRewardWindow } from '../../profile-page/reward-lifecycle';
import AutoGiftRuleEditor from './AutoGiftRuleEditor';
import { readAutoGiftRules, saveAutoGiftRules, normalizeAutoGiftRules } from '../../profile-page/auto-gift-rules';
import {
    readCosmeticDesignFile,
    MAX_COSMETIC_FILE_BYTES,
    ensureVectorCosmeticAsset,
} from '../../profile-page/avatar-frame-assets';
import './CreateGiftModal.scss';

const types = [
    { id: 'physical', label: 'Hiện vật', icon: Package, hint: 'Quà tặng và vật phẩm của CLB' },
    { id: 'frame', label: 'Khung avatar', icon: ScanFace, hint: 'Khung ảnh đại diện độc quyền' },
    { id: 'shape', label: 'Shape', icon: Shapes, hint: 'Shape cho ảnh bìa' },
    { id: 'color', label: 'Bộ màu', icon: Palette, hint: 'Bảng màu độc quyền' },
];
const colorFields = [
    ['background', 'Màu nền'],
    ['secondary', 'Màu phụ'],
    ['accent', 'Màu nhấn'],
    ['ink', 'Màu chữ'],
];

export default function CreateGiftModal({
    workspace,
    initialKind = 'physical',
    gift: editing,
    activities = [],
    onClose,
    onPublished,
}) {
    const formId = useId();
    const [kind, setKind] = useState(editing?.kind || initialKind);
    const [label, setLabel] = useState(editing?.label || '');
    const [description, setDescription] = useState(editing?.description || '');
    const [cost, setCost] = useState(String(editing?.cost ?? 100));
    const [freeGift, setFreeGift] = useState(editing?.cost === 0);
    const [paidCost, setPaidCost] = useState(String(editing?.cost > 0 ? editing.cost : 100));
    const [stock, setStock] = useState(String(editing?.stock ?? 10));
    const [hot, setHot] = useState(editing?.hot === true);
    const [recolorFrame, setRecolorFrame] = useState(editing?.recolor || false);
    const [shapeHsl, setShapeHsl] = useState(editing?.hsl || { ...DEFAULT_SHAPE_HSL });
    const [useSvgPalette, setUseSvgPalette] = useState(!!editing?.svgPalette);
    const [svgColorId, setSvgColorId] = useState('default');
    const [svgPaletteOverride, setSvgPaletteOverride] = useState(editing?.svgPalette || null);
    const svgColors = getCoverColors().find((item) => item.id === svgColorId) || getCoverColors()[0];
    const svgPalette = useSvgPalette ? svgPaletteOverride || svgPaletteFromColors(svgColors) : null;
    const [colors, setColors] = useState({
        background: editing?.background || '#fff1df',
        secondary: editing?.secondary || '#fed7aa',
        accent: editing?.kind === 'frame' ? editing.color : editing?.accent || '#fb923c',
        ink: editing?.ink || '#9a3412',
    });
    const [file, setFile] = useState(null);
    const [assetUrl, setAssetUrl] = useState('');
    const [frameSource, setFrameSource] = useState('');
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSaving, setCropSaving] = useState(false);
    const [reading, setReading] = useState(false);
    const [vectorSaving, setVectorSaving] = useState(false);
    const [error, setError] = useState('');
    const [publication, setPublication] = useState('draft');
    const [publishAt, setPublishAt] = useState('');
    const [unpublishAt, setUnpublishAt] = useState('');
    const [autoRules, setAutoRules] = useState(() =>
        editing ? readAutoGiftRules(workspace?.clubId, editing.key) : [],
    );
    const selected = types.find((type) => type.id === kind);
    useEffect(() => {
        setAssetUrl('');
        setFrameSource('');
        setCropOpen(false);
        setReading(!!file);
        if (!file) {
            setAssetUrl(editing?.assetUrl || '');
            return;
        }
        let active = true;
        const reader = new FileReader();
        reader.onload = () => {
            if (active) {
                setAssetUrl(String(reader.result));
                setReading(false);
            }
        };
        reader.onerror = () => {
            if (active) {
                setError('Không thể đọc ảnh. Vui lòng chọn lại.');
                setReading(false);
            }
        };
        const validate = async () => {
            let bitmap;
            try {
                if (kind === 'frame' || kind === 'shape') {
                    const next = await readCosmeticDesignFile(file);
                    if (active) {
                        if (file.type === 'image/png') {
                            setUseSvgPalette(true);
                            setRecolorFrame(false);
                        }
                        if (kind === 'frame') {
                            setFrameSource(next);
                            setCropOpen(true);
                        } else setAssetUrl(next);
                        setReading(false);
                    }
                    return;
                }
                bitmap = await createImageBitmap(file);
                if (!active) return;
                if (bitmap.width > 4096 || bitmap.height > 4096) throw new Error('Ảnh tối đa 4096 × 4096 pixel.');
                reader.readAsDataURL(file);
            } catch (issue) {
                if (active) {
                    setError(issue.message || 'Không thể đọc ảnh.');
                    setReading(false);
                }
            } finally {
                bitmap?.close();
            }
        };
        validate();
        return () => {
            active = false;
            reader.onload = null;
            reader.onerror = null;
            if (reader.readyState === 1) reader.abort();
        };
    }, [file, kind]);
    const changeKind = (next) => {
        setKind(next);
        setFile(null);
        setAssetUrl('');
        setFrameSource('');
        setCropOpen(false);
        setError('');
    };
    const chooseFile = (event) => {
        const next = event.target.files?.[0];
        event.target.value = '';
        setFile(null);
        setAssetUrl('');
        setFrameSource('');
        setCropOpen(false);
        setError('');
        if (!next) return;
        const design = kind === 'shape' || kind === 'frame';
        const accepted = design ? ['image/png', 'image/svg+xml'] : ['image/png', 'image/jpeg', 'image/webp'];
        const svgWithoutMime = design && !next.type && /\.svg$/i.test(next.name);
        const maxBytes = design ? MAX_COSMETIC_FILE_BYTES : 1024 * 1024;
        if ((!accepted.includes(next.type) && !svgWithoutMime) || next.size > maxBytes) {
            setError(design ? 'Chọn ảnh PNG hoặc SVG tối đa 5 MB.' : 'Chọn ảnh PNG/JPG/WebP tối đa 1 MB.');
            return;
        }
        setFile(next);
    };
    const submit = async (event) => {
        event.preventDefault();
        setError('');
        if (vectorSaving || reading || cropSaving || cropOpen || (file && !assetUrl)) return;
        setVectorSaving(true);
        try {
            const savedAsset = ['shape', 'frame'].includes(kind) ? await ensureVectorCosmeticAsset(assetUrl) : assetUrl;
            const validatedRules = normalizeAutoGiftRules(autoRules);
            const base = {
                id: editing?.id,
                clubId: workspace?.clubId,
                clubName: workspace?.name || workspace?.clubName || workspace?.clubCode,
                label,
                cost: Number(cost),
                hot,
            };
            if (!editing && publication === 'scheduled') normalizeRewardWindow(publishAt, unpublishAt);
            const gift =
                kind === 'shape'
                    ? publishClubShape({
                          ...base,
                          assetUrl: savedAsset,
                          hsl: shapeHsl,
                          svgPalette: isSvgAsset(savedAsset) ? svgPalette : null,
                      })
                    : publishClubGift({
                          ...base,
                          kind,
                          description,
                          stock: Number(stock),
                          assetUrl: savedAsset,
                          recolor: recolorFrame,
                          circular: kind === 'frame',
                          svgPalette: isSvgAsset(savedAsset) ? svgPalette : null,
                          color: colors.accent,
                          accent: kind === 'frame' ? colors.secondary : colors.accent,
                          background: colors.background,
                          secondary: colors.secondary,
                          ink: colors.ink,
                      });
            if (!editing) {
                if (publication === 'scheduled') setRewardWindow(workspace.clubId, gift.key, publishAt, unpublishAt);
                else setRewardLifecycle(workspace.clubId, gift.key, publication);
            }
            saveAutoGiftRules(workspace.clubId, gift.key, validatedRules);
            onPublished(gift);
        } catch (issue) {
            setError(
                issue.name === 'QuotaExceededError' ? 'Bộ nhớ thiết bị đã đầy. Hãy dùng ảnh nhỏ hơn.' : issue.message,
            );
        } finally {
            setVectorSaving(false);
        }
    };
    const frameDesign = {
        color: assetUrl ? colors.accent : undefined,
        assetUrl,
        recolor: recolorFrame,
        circular: true,
        svgPalette: isSvgAsset(assetUrl) ? svgPalette : null,
    };
    const disabled =
        !workspace?.clubId ||
        !label.trim() ||
        reading ||
        vectorSaving ||
        cropSaving ||
        cropOpen ||
        (file && !assetUrl) ||
        (['shape', 'frame'].includes(kind) && !assetUrl);
    return (
        <V2Modal
            title={editing ? 'Sửa quà' : 'Tạo quà mới'}
            wide
            className="v2-create-gift-modal"
            onClose={() => {
                if (!vectorSaving) onClose();
            }}
            footer={
                <>
                    <button type="button" className="v2-button" onClick={onClose} disabled={vectorSaving}>
                        Hủy
                    </button>
                    <button type="submit" form={formId} className="v2-button v2-button--primary" disabled={!!disabled}>
                        {vectorSaving
                            ? 'Đang lưu SVG…'
                            : editing
                              ? 'Lưu thay đổi'
                              : publication === 'draft'
                                ? 'Lưu nháp'
                                : publication === 'scheduled'
                                  ? 'Lưu lịch publish'
                                  : 'Tạo và publish'}
                    </button>
                </>
            }
        >
            <form id={formId} className="v2-create-gift-form" onSubmit={submit}>
                {cropOpen && kind === 'frame' && file && frameSource && (
                    <ImageCropModal
                        file={file}
                        sourceUrl={frameSource}
                        size={{ width: 512, height: 512 }}
                        label="Khung avatar"
                        circular
                        onClose={() => setCropOpen(false)}
                        onApply={async (cropped) => {
                            setCropSaving(true);
                            try {
                                setAssetUrl(await readCosmeticDesignFile(cropped));
                                setCropOpen(false);
                                setError('');
                            } catch (issue) {
                                setError(issue.message);
                                setCropOpen(false);
                            } finally {
                                setCropSaving(false);
                            }
                        }}
                    />
                )}
                <fieldset className="v2-create-gift-types">
                    <legend>Loại quà</legend>
                    <div>
                        {types.map(({ id, label: title, icon: Icon, hint }) => (
                            <label key={id} className={kind === id ? 'is-selected' : ''}>
                                <input
                                    type="radio"
                                    name={`${formId}-kind`}
                                    value={id}
                                    checked={kind === id}
                                    disabled={!!editing}
                                    onChange={() => changeKind(id)}
                                />
                                <Icon size={22} />
                                <strong>{title}</strong>
                                <small>{hint}</small>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <div className="v2-create-gift-columns">
                    <div className="v2-create-gift-fields">
                        <label>
                            Tên quà{' '}
                            <input
                                value={label}
                                onChange={(event) => setLabel(event.target.value)}
                                maxLength={80}
                                placeholder={`Nhập tên ${selected.label.toLocaleLowerCase('vi')}`}
                                required
                            />
                        </label>
                        {kind !== 'shape' && (
                            <label>
                                Mô tả{' '}
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    maxLength={300}
                                    rows={2}
                                    placeholder="Điều gì làm món quà này đặc biệt?"
                                />
                            </label>
                        )}
                        <div className="v2-create-gift-row">
                            <div className="v2-create-gift-price-field">
                                <label htmlFor={`${formId}-cost`}>Điểm cần đổi</label>
                                <div className={`v2-gift-price-control${freeGift ? ' is-free' : ''}`}>
                                    <input
                                        id={`${formId}-cost`}
                                        type="number"
                                        min={1}
                                        max={100000}
                                        step={1}
                                        value={cost}
                                        disabled={freeGift}
                                        onChange={(event) => setCost(event.target.value)}
                                        required
                                    />
                                    <span className="v2-gift-price-unit">Xperience Point</span>
                                    <label className="v2-gift-free-toggle">
                                        <input
                                            type="checkbox"
                                            checked={freeGift}
                                            onChange={(event) => {
                                                const checked = event.target.checked;
                                                setFreeGift(checked);
                                                if (checked) {
                                                    setPaidCost(Number(cost) > 0 ? cost : '100');
                                                    setCost('0');
                                                } else setCost(paidCost);
                                            }}
                                        />
                                        <span>Miễn phí</span>
                                    </label>
                                </div>
                            </div>
                            {kind === 'physical' && (
                                <label>
                                    Số lượng{' '}
                                    <input
                                        type="number"
                                        min={1}
                                        max={100000}
                                        step={1}
                                        value={stock}
                                        onChange={(event) => setStock(event.target.value)}
                                        required
                                    />
                                </label>
                            )}
                        </div>
                        {kind === 'frame' && (
                            <div className="v2-create-frame-color">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={recolorFrame}
                                        onChange={(event) => setRecolorFrame(event.target.checked)}
                                        disabled={useSvgPalette && isSvgAsset(assetUrl)}
                                    />{' '}
                                    Đổi màu khung
                                </label>
                                <small>
                                    {recolorFrame
                                        ? 'Toàn bộ nét vẽ được đổi sang màu bạn chọn; độ trong suốt được giữ nguyên.'
                                        : 'Giữ màu gốc của file PNG hoặc SVG.'}
                                </small>
                            </div>
                        )}
                        {['shape', 'frame'].includes(kind) && isSvgAsset(assetUrl) && (
                            <SvgPaletteControls
                                enabled={useSvgPalette}
                                onToggle={(enabled) => {
                                    setUseSvgPalette(enabled);
                                    if (enabled) setRecolorFrame(false);
                                }}
                                colorId={svgColorId}
                                onColorChange={(id) => {
                                    setSvgColorId(id);
                                    setSvgPaletteOverride(null);
                                }}
                                value={svgPalette}
                                onChange={setSvgPaletteOverride}
                            />
                        )}
                        {(kind === 'color' || (kind === 'frame' && recolorFrame)) && (
                            <fieldset className="v2-create-gift-colors">
                                <legend>{kind === 'color' ? 'Bảng màu' : 'Màu khung'}</legend>
                                <div>
                                    {(kind === 'color' ? colorFields : [['accent', 'Màu chính']]).map(
                                        ([key, title]) => (
                                            <PaletteColorPicker
                                                key={key}
                                                label={title}
                                                value={colors[key]}
                                                advanced
                                                onChange={(paint) =>
                                                    setColors((current) => ({ ...current, [key]: paint }))
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            </fieldset>
                        )}
                        {['physical', 'shape', 'frame'].includes(kind) && (
                            <div className="v2-create-gift-upload">
                                <label>
                                    <Upload size={22} />
                                    <strong>
                                        {reading
                                            ? 'Đang xử lý và chuyển SVG…'
                                            : file?.name ||
                                              (kind === 'shape'
                                                  ? 'Tải ảnh shape'
                                                  : kind === 'frame'
                                                    ? 'Tải thiết kế khung avatar'
                                                    : 'Thêm ảnh hiện vật')}
                                    </strong>
                                    <small>
                                        {kind === 'shape'
                                            ? 'PNG hoặc SVG · Bắt buộc'
                                            : kind === 'frame'
                                              ? 'PNG hoặc SVG · Bắt buộc'
                                              : 'PNG, JPG, WebP · Không bắt buộc'}
                                    </small>
                                    <input
                                        type="file"
                                        accept={
                                            kind === 'shape' || kind === 'frame'
                                                ? 'image/png,image/svg+xml,.svg'
                                                : 'image/png,image/jpeg,image/webp'
                                        }
                                        onChange={chooseFile}
                                    />
                                </label>
                                <small>
                                    Tối đa {kind === 'physical' ? '1' : '5'} MB · 4096 × 4096 pixel
                                    {kind === 'frame' && ' · Nên dùng ảnh vuông.'}
                                </small>
                                {['shape', 'frame'].includes(kind) && (
                                    <p>
                                        PNG được chuyển thành SVG vector trước khi lưu (tối đa 512 px, 8 màu). Các vùng
                                        tối/sáng dùng màu chính/phụ của bộ màu. Hãy kiểm tra preview; ảnh nhiều chi tiết
                                        có thể được giản lược.
                                    </p>
                                )}
                                {file && (
                                    <button
                                        type="button"
                                        className="v2-button"
                                        onClick={() => {
                                            setFile(null);
                                            setAssetUrl('');
                                            setFrameSource('');
                                            setCropOpen(false);
                                            setError('');
                                        }}
                                    >
                                        Xóa ảnh
                                    </button>
                                )}
                                {kind === 'frame' && frameSource && (
                                    <button
                                        type="button"
                                        className="v2-button"
                                        disabled={cropSaving}
                                        onClick={() => setCropOpen(true)}
                                    >
                                        Zoom và cắt khung tròn
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <aside className="v2-create-gift-preview">
                        <span>XEM TRƯỚC</span>
                        <div className={`v2-create-gift-art is-${kind}`}>
                            {kind === 'physical' &&
                                (assetUrl ? (
                                    <img src={assetUrl} alt="Ảnh hiện vật xem trước" />
                                ) : (
                                    <Package size={68} strokeWidth={1.2} />
                                ))}
                            {kind === 'frame' && (
                                <ProfileAvatar profile={{ initials: 'SV' }} frameDesign={frameDesign} large />
                            )}
                            {kind === 'shape' && (
                                <div className="v2-shape-stamp-preview">
                                    {assetUrl ? (
                                        <ShapeImage
                                            assetUrl={assetUrl}
                                            hsl={shapeHsl}
                                            svgPalette={isSvgAsset(assetUrl) ? svgPalette : null}
                                            size={152}
                                        />
                                    ) : (
                                        <Shapes size={60} strokeWidth={1.2} />
                                    )}
                                </div>
                            )}
                            {kind === 'color' && <ProfileCoverArt colorPalette={colors} shape="petals" />}
                        </div>
                        {kind === 'color' && (
                            <div className="v2-create-gift-swatches">
                                {colorFields.map(([key]) => (
                                    <span key={key} style={{ background: paletteColorCss(colors[key]) }} />
                                ))}
                            </div>
                        )}
                        {kind === 'shape' && assetUrl && (
                            <ShapeHslControls value={shapeHsl} onChange={setShapeHsl} disabled={reading} />
                        )}
                        <small>{selected.label}</small>
                        <h3>{label.trim() || 'Tên món quà'}</h3>
                        <p>{kind === 'shape' ? selected.hint : description || selected.hint}</p>
                        <strong className="v2-create-gift-price">
                            <Coins size={16} />
                            {Number(cost || 0) === 0 ? 'Miễn phí' : `${Number(cost).toLocaleString('vi-VN')} điểm mẫu`}
                        </strong>
                        {kind === 'physical' && <small>Số lượng: {stock || 0} · Chưa mở đổi hiện vật</small>}
                    </aside>
                </div>
                <AutoGiftRuleEditor rules={autoRules} onChange={setAutoRules} activities={activities} />
                <label className="v2-gift-featured-toggle">
                    <input type="checkbox" checked={hot} onChange={(event) => setHot(event.target.checked)} /> Đánh dấu
                    nổi bật trong Quà hot
                </label>
                {!editing && (
                    <fieldset className="v2-create-gift-publication">
                        <legend>Xuất bản quà</legend>
                        <p>Lưu nháp để chuẩn bị quà trước khi mở đổi. Lịch publish hiện lưu trên thiết bị này.</p>
                        <label>
                            Trạng thái
                            <select value={publication} onChange={(event) => setPublication(event.target.value)}>
                                <option value="draft">Lưu nháp</option>
                                <option value="published">Publish ngay</option>
                                <option value="scheduled">Đặt lịch mở đổi</option>
                            </select>
                        </label>
                        {publication === 'scheduled' && (
                            <div className="v2-gift-window-fields">
                                <label>
                                    Mở đổi từ (giờ địa phương)
                                    <input
                                        type="datetime-local"
                                        value={publishAt}
                                        onChange={(event) => setPublishAt(event.target.value)}
                                        required
                                    />
                                </label>
                                <label>
                                    Đóng đổi lúc (giờ địa phương)
                                    <input
                                        type="datetime-local"
                                        value={unpublishAt}
                                        onChange={(event) => setUnpublishAt(event.target.value)}
                                        required
                                    />
                                </label>
                            </div>
                        )}
                    </fieldset>
                )}
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
                <p className="v2-create-gift-note">
                    Quà được thêm vào kho của CLB trên thiết bị này để thử nghiệm. Điểm và số lượng chưa đồng bộ với hệ
                    thống.
                </p>
            </form>
        </V2Modal>
    );
}
