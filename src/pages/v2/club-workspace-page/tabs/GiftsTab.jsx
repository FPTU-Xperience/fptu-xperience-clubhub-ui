import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Gift,
    Package,
    ScanFace,
    Shapes,
    Palette,
    Search,
    Coins,
    Check,
    Shirt,
    ShoppingBag,
    Sticker,
    ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import ProfileAvatar from '../../profile-page/ProfileAvatar';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import ShapeImage from '../../profile-page/ShapeImage';
import CreateGiftModal from './CreateGiftModal';
import { physicalGiftPreviews } from '../../workspace-preview-data';
import {
    getCoverColors,
    getClubCoverRewards,
    readCoverInventory,
    redeemCoverReward,
    sampleClubBalance,
} from '../../profile-page/cover-cosmetics';
import './GiftsTab.scss';

const categories = [
    { id: 'all', label: 'Tất cả', icon: Gift, description: 'Những món quà dành cho hành trình đóng góp của bạn.' },
    { id: 'physical', label: 'Hiện vật', icon: Package, description: 'Quà tặng hữu hình mang dấu ấn của CLB.' },
    { id: 'frame', label: 'Khung avatar', icon: ScanFace, description: 'Thêm điểm nhấn cho ảnh đại diện của bạn.' },
    {
        id: 'shape',
        label: 'Shape',
        icon: Shapes,
        description: 'Các thiết kế riêng của CLB để trang trí ảnh bìa.',
    },
    { id: 'color', label: 'Bộ màu', icon: Palette, description: 'Chọn bảng màu thể hiện phong cách cá nhân.' },
];
const categoryOf = (reward) => (reward.kind === 'combo' ? 'color' : reward.kind);
const physicalIcons = { shirt: Shirt, stickers: Sticker, bag: ShoppingBag };

function GiftPreview({ reward }) {
    if (reward.kind === 'physical') {
        if (reward.assetUrl) return <img className="v2-gift-physical-image" src={reward.assetUrl} alt={reward.label} />;
        const Icon = physicalIcons[reward.illustration] || Package;
        return (
            <div className={`v2-gift-physical-art is-${reward.illustration}`}>
                <span>CLUB COLLECTION</span>
                <Icon size={76} strokeWidth={1.25} />
                <small>Quà minh họa</small>
            </div>
        );
    }
    if (reward.kind === 'frame') {
        return (
            <div className="v2-gift-frame-preview">
                <ProfileAvatar profile={{ initials: 'SV' }} frame={reward.id} large />
            </div>
        );
    }
    if (reward.kind === 'shape')
        return (
            <div className="v2-shape-stamp-preview">
                <ShapeImage assetUrl={reward.assetUrl} hsl={reward.hsl} size={160} label={reward.label} />
            </div>
        );
    const palette = getCoverColors().find((item) => item.id === (reward.colorId || reward.id));
    return (
        <div className="v2-gift-cover-preview">
            <ProfileCoverArt
                color={reward.colorId || (reward.kind === 'color' ? reward.id : 'horizon')}
                shape={reward.shapeId || (reward.kind === 'shape' ? reward.id : 'none')}
                shapeAssetUrl={reward.assetUrl || ''}
            />
            {categoryOf(reward) === 'color' && palette && (
                <div className="v2-gift-swatches" aria-label="Các màu trong bộ">
                    {['background', 'secondary', 'accent', 'ink'].map((key) => (
                        <span key={key} style={{ backgroundColor: palette[key] }} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function GiftsTab({ workspace, manager = false }) {
    const { user } = useAuth();
    const clubId = workspace?.clubId;
    const clubCode = workspace?.clubCode || workspace?.name || workspace?.clubName || '';
    const [inventory, setInventory] = useState(() => readCoverInventory(user));
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [category, setCategory] = useState('all');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('default');
    const [rewards, setRewards] = useState(() => getClubCoverRewards(clubId, undefined, clubCode));
    useEffect(() => {
        setInventory(readCoverInventory(user));
        setNotice('');
        setError('');
        setUploadOpen(false);
        setCategory('all');
        setQuery('');
        setSort('default');
        setRewards(getClubCoverRewards(clubId, undefined, clubCode));
        const refresh = () => {
            setInventory(readCoverInventory(user));
            setRewards(getClubCoverRewards(clubId, undefined, clubCode));
        };
        window.addEventListener('storage', refresh);
        window.addEventListener('clubhub:cover-rewards-updated', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('clubhub:cover-rewards-updated', refresh);
        };
    }, [user, clubId, clubCode]);
    const redeem = (reward) => {
        setError('');
        setNotice('');
        try {
            setInventory(redeemCoverReward(user, clubId, reward.key, undefined, clubCode));
            setNotice(`Đã đổi ${reward.label} bằng điểm mẫu. Bạn có thể sử dụng trong phần tùy chỉnh ảnh cá nhân.`);
        } catch (issue) {
            setError(issue.message);
        }
    };
    const balance = sampleClubBalance(inventory, clubId);
    const catalog = [...physicalGiftPreviews, ...rewards];
    const selected = categories.find((item) => item.id === category);
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    const visible = catalog.filter(
        (reward) =>
            (category === 'all' || categoryOf(reward) === category) &&
            reward.label.toLocaleLowerCase('vi').includes(normalizedQuery),
    );
    if (sort !== 'default') visible.sort((a, b) => (sort === 'ascending' ? a.cost - b.cost : b.cost - a.cost));
    return (
        <WorkspaceTabLayout
            title="Kho quà"
            description="Biến những đóng góp của bạn thành quà tặng và phong cách riêng."
            preview
            action={
                manager && user ? (
                    <button type="button" className="v2-button v2-button--primary" onClick={() => setUploadOpen(true)}>
                        <Gift size={16} /> Tạo quà
                    </button>
                ) : undefined
            }
        >
            {() => (
                <div className="v2-cover-gifts">
                    {uploadOpen && manager && user && (
                        <CreateGiftModal
                            workspace={workspace}
                            initialKind={category === 'all' ? 'physical' : category}
                            onClose={() => setUploadOpen(false)}
                            onPublished={(gift) => {
                                setUploadOpen(false);
                                setRewards(getClubCoverRewards(clubId, undefined, clubCode));
                                setCategory(gift.kind);
                                setQuery('');
                                setNotice(`Đã thêm ${gift.label} vào Kho quà trên thiết bị này.`);
                            }}
                        />
                    )}
                    <div className="v2-cover-gifts-balance">
                        <div className="v2-gift-wallet">
                            <span className="v2-gift-wallet-icon">
                                <Coins size={24} />
                            </span>
                            <div>
                                <small>ĐIỂM MẪU CỦA BẠN</small>
                                <strong>
                                    {balance.toLocaleString('vi-VN')} <span>điểm</span>
                                </strong>
                            </div>
                        </div>
                        <p>
                            Bắt đầu với 200 điểm mẫu tại mỗi CLB. Quà và số dư lưu trên thiết bị; chưa sử dụng điểm
                            thật.
                        </p>
                        <Link to="/v2/profile">
                            Tùy chỉnh cá nhân <ArrowUpRight size={16} />
                        </Link>
                    </div>
                    <nav className="v2-gift-categories" aria-label="Loại quà">
                        {categories.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                aria-pressed={category === id}
                                className={category === id ? 'is-active' : ''}
                                onClick={() => setCategory(id)}
                            >
                                <Icon size={18} />
                                <span>{label}</span>
                                <small>
                                    {catalog.filter((reward) => id === 'all' || categoryOf(reward) === id).length}
                                </small>
                            </button>
                        ))}
                    </nav>
                    {notice && (
                        <p className="v2-gift-notice" role="status">
                            {notice}
                        </p>
                    )}
                    {error && (
                        <p className="v2-profile-form-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="v2-gift-toolbar">
                        <div>
                            <h2>
                                {selected.label} <span>{visible.length}</span>
                            </h2>
                            <p>{selected.description}</p>
                        </div>
                        <div className="v2-gift-controls">
                            <label className="v2-gift-search">
                                <Search size={17} />
                                <input
                                    type="search"
                                    aria-label="Tìm quà"
                                    placeholder="Tìm món quà bạn thích…"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                />
                            </label>
                            <select
                                aria-label="Sắp xếp quà"
                                value={sort}
                                onChange={(event) => setSort(event.target.value)}
                            >
                                <option value="default">Mặc định</option>
                                <option value="ascending">Điểm: thấp đến cao</option>
                                <option value="descending">Điểm: cao đến thấp</option>
                            </select>
                        </div>
                    </div>
                    <div className="v2-cover-gifts-grid">
                        {visible.map((reward) => {
                            const owned = inventory.owned.includes(reward.key);
                            const physical = reward.kind === 'physical';
                            const categoryLabel = categories.find((item) => item.id === categoryOf(reward))?.label;
                            return (
                                <article className="v2-gift-card" key={reward.key}>
                                    <div className="v2-gift-preview">
                                        <GiftPreview reward={reward} />
                                        {owned && (
                                            <span className="v2-gift-owned">
                                                <Check size={12} /> Đã sở hữu
                                            </span>
                                        )}
                                    </div>
                                    <div className="v2-gift-card-body">
                                        <div className="v2-gift-card-meta">
                                            <span>{categoryLabel}</span>
                                            {physical && <small>Còn {reward.stock} · Mẫu</small>}
                                        </div>
                                        <h3>{reward.label}</h3>
                                        <p className="v2-gift-description">
                                            {reward.description ||
                                                (reward.kind === 'combo'
                                                    ? 'Bộ màu kèm shape cover đồng bộ.'
                                                    : reward.kind === 'frame'
                                                      ? 'Sử dụng trong tùy chỉnh ảnh đại diện.'
                                                      : 'Thiết kế riêng của CLB cho ảnh bìa cá nhân.')}
                                        </p>
                                        <div className="v2-gift-card-footer">
                                            <strong>
                                                <Coins size={16} />
                                                {reward.cost.toLocaleString('vi-VN')} <small>điểm mẫu</small>
                                            </strong>
                                            <button
                                                type="button"
                                                className="v2-button v2-button--primary"
                                                disabled={
                                                    physical || !user || !clubId || owned || balance < reward.cost
                                                }
                                                onClick={() => redeem(reward)}
                                            >
                                                {physical
                                                    ? 'Chưa mở đổi'
                                                    : owned
                                                      ? 'Đã sở hữu'
                                                      : balance < reward.cost
                                                        ? 'Chưa đủ điểm'
                                                        : 'Đổi quà'}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    {!visible.length && (
                        <div className="v2-gift-empty">
                            <selected.icon size={36} strokeWidth={1.3} />
                            <h3>
                                {query.trim()
                                    ? 'Chưa tìm thấy món quà phù hợp'
                                    : `Chưa có quà thuộc loại ${selected.label.toLocaleLowerCase('vi')}`}
                            </h3>
                            <p>
                                {query.trim()
                                    ? 'Thử tên khác hoặc chọn một loại quà khác.'
                                    : category === 'shape'
                                      ? 'Shape chung vẫn miễn phí trong tùy chỉnh ảnh bìa. Shape riêng của CLB sẽ xuất hiện tại đây.'
                                      : 'Danh sách quà của CLB sẽ xuất hiện tại đây khi được bổ sung.'}
                            </p>
                            {query.trim() && (
                                <button type="button" className="v2-button" onClick={() => setQuery('')}>
                                    Xóa tìm kiếm
                                </button>
                            )}
                        </div>
                    )}
                    {visible.some((reward) => reward.kind === 'physical') && (
                        <p className="v2-gift-footnote">
                            Hiện vật và số lượng đang là dữ liệu minh họa. Chức năng đổi và nhận hiện vật chưa được mở.
                        </p>
                    )}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
