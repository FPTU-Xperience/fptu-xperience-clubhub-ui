import { useId, useState } from 'react';
import { Package, ScanFace, Shapes, Palette, Gift, Upload, Coins } from 'lucide-react';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import ProfileAvatar from '../../profile-page/ProfileAvatar';
import ShapeImage from '../../profile-page/ShapeImage';
import { creditNumber } from '../../../../services/club-credit';
import './CreateGiftModal.scss';

const types = [
    ['PHYSICAL', 'Hiện vật', Package, 'Chưa mở đổi hiện vật'],
    ['FRAME', 'Khung avatar', ScanFace, 'Khung ảnh đại diện độc quyền'],
    ['SHAPE', 'Badge', Shapes, 'Badge cho ảnh bìa'],
    ['COLOR', 'Bộ màu', Palette, 'Bảng màu độc quyền'],
    ['BUNDLE', 'Bộ màu + Badge', Gift, 'Kết hợp vật phẩm của CLB'],
];
export default function ServerGiftEditor({
    editing,
    label,
    setLabel,
    description,
    setDescription,
    kind,
    setKind,
    price,
    setPrice,
    palette,
    setPalette,
    assetUrl,
    upload,
    grants,
    colorId,
    setColorId,
    shapeId,
    setShapeId,
}) {
    const formId = useId(),
        [paidPrice, setPaidPrice] = useState(price > 0 ? price : 100);
    const selected = types.find(([id]) => id === kind),
        Icon = selected[2];
    const bundleColor = grants.find((grant) => grant.cosmeticId === colorId),
        bundleShape = grants.find((grant) => grant.cosmeticId === shapeId);
    return (
        <>
            <fieldset className="v2-create-gift-types">
                <legend>Loại quà</legend>
                <div>
                    {types.map(([id, title, TypeIcon, hint]) => (
                        <label key={id} className={kind === id ? 'is-selected' : ''}>
                            <input
                                type="radio"
                                name={`${formId}-kind`}
                                value={id}
                                checked={kind === id}
                                disabled={!!editing || id === 'PHYSICAL'}
                                onChange={() => setKind(id)}
                            />
                            <TypeIcon size={22} />
                            <strong>{title}</strong>
                            <small>{hint}</small>
                        </label>
                    ))}
                </div>
            </fieldset>
            <div className="v2-create-gift-columns">
                <div className="v2-create-gift-fields">
                    <label>
                        Tên quà
                        <input
                            required
                            maxLength={80}
                            value={label}
                            placeholder={`Nhập tên ${selected[1].toLocaleLowerCase('vi')}`}
                            onChange={(event) => setLabel(event.target.value)}
                        />
                    </label>
                    <label>
                        Mô tả
                        <textarea
                            maxLength={2000}
                            rows={3}
                            value={description}
                            placeholder="Điều gì làm món quà này đặc biệt?"
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </label>
                    <div className="v2-create-gift-price-field">
                        <label htmlFor={`${formId}-price`}>Giá credit</label>
                        <div className={`v2-gift-price-control${Number(price) === 0 ? ' is-free' : ''}`}>
                            <input
                                id={`${formId}-price`}
                                type="number"
                                required
                                min="0"
                                max="100000"
                                step="1"
                                value={price}
                                onChange={(event) => {
                                    setPrice(event.target.value);
                                    if (Number(event.target.value) > 0) setPaidPrice(event.target.value);
                                }}
                            />
                            <span className="v2-gift-price-unit">credit</span>
                            <label className="v2-gift-free-toggle">
                                <input
                                    type="checkbox"
                                    checked={Number(price) === 0}
                                    onChange={(event) => setPrice(event.target.checked ? 0 : paidPrice)}
                                />
                                Miễn phí
                            </label>
                        </div>
                    </div>
                    {kind === 'COLOR' &&
                        Object.entries({
                            background: 'Màu nền',
                            secondary: 'Màu phụ',
                            accent: 'Màu nhấn',
                            ink: 'Màu chữ',
                        }).map(([key, name]) => (
                            <label key={key}>
                                {name}
                                <input
                                    type="color"
                                    value={palette[key]}
                                    onChange={(event) =>
                                        setPalette((value) => ({ ...value, [key]: event.target.value }))
                                    }
                                />
                            </label>
                        ))}
                    {['SHAPE', 'FRAME'].includes(kind) && (
                        <div className="v2-create-gift-upload">
                            <label>
                                <Upload size={24} />
                                <strong>Ảnh quà PNG, JPEG hoặc WebP</strong>
                                <small>Chọn ảnh thiết kế của CLB để tải lên</small>
                                <input
                                    aria-label="Ảnh quà PNG, JPEG hoặc WebP"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(event) => upload(event.target.files?.[0])}
                                />
                            </label>
                        </div>
                    )}
                    {kind === 'BUNDLE' &&
                        [
                            ['COLOR', colorId, setColorId, 'Bộ màu trong combo'],
                            ['SHAPE', shapeId, setShapeId, 'Badge trong bộ quà'],
                        ].map(([type, value, setValue, name]) => (
                            <label key={type}>
                                {name}
                                <select required value={value} onChange={(event) => setValue(event.target.value)}>
                                    <option value="">Chọn vật phẩm của CLB</option>
                                    {grants
                                        .filter((grant) => grant.kind === type)
                                        .map((grant) => (
                                            <option key={grant.cosmeticId} value={grant.cosmeticId}>
                                                {grant.label}
                                            </option>
                                        ))}
                                </select>
                            </label>
                        ))}
                </div>
                <aside className="v2-create-gift-preview">
                    <span>XEM TRƯỚC</span>
                    <div className={`v2-create-gift-art is-${kind.toLowerCase()}`}>
                        {kind === 'COLOR' ? (
                            <ProfileCoverArt colorPalette={palette} shape="petals" />
                        ) : kind === 'BUNDLE' && bundleColor ? (
                            <ProfileCoverArt
                                colorPalette={bundleColor.definition}
                                shape={bundleShape ? 'none' : 'petals'}
                                shapeAssetUrl={bundleShape?.definition.assetUrl || ''}
                            />
                        ) : kind === 'FRAME' && assetUrl ? (
                            <ProfileAvatar profile={{ initials: 'SV' }} frameDesign={{ assetUrl }} large />
                        ) : kind === 'SHAPE' && assetUrl ? (
                            <ShapeImage assetUrl={assetUrl} size={152} />
                        ) : (
                            <Icon size={60} strokeWidth={1.2} />
                        )}
                    </div>
                    {kind === 'COLOR' && (
                        <div className="v2-create-gift-swatches">
                            {Object.entries(palette).map(([key, color]) => (
                                <span key={key} style={{ background: color }} />
                            ))}
                        </div>
                    )}
                    <small>{selected[1]}</small>
                    <h3>{label.trim() || 'Tên món quà'}</h3>
                    <p>{description || selected[3]}</p>
                    <strong className="v2-create-gift-price">
                        <Coins size={16} />
                        {Number(price) === 0 ? 'Miễn phí' : creditNumber(Number(price)) + ' credit'}
                    </strong>
                </aside>
            </div>
            <p className="v2-create-gift-note">
                Lưu bản nháp trước khi mở hoặc lên lịch đổi quà. Hiện vật, điều kiện tự tặng và đánh dấu Quà hot chưa có
                chức năng lưu trên máy chủ.
            </p>
        </>
    );
}
