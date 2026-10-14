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
    Pencil,
    Trash2,
    Clock,
    Eye,
    EyeOff,
    Trophy,
    Sparkles,
    Flame,
    ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import ProfileAvatar from '../../profile-page/ProfileAvatar';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import ShapeImage from '../../profile-page/ShapeImage';
import CreateGiftModal from './CreateGiftModal';
import GiftLifecycleModal from './GiftLifecycleModal';
import GiftDetailPanel from './GiftDetailPanel';
import GiftClaimButton from './GiftClaimButton';
import GiftAvailability from './GiftAvailability';
import { giftDescription } from '../../profile-page/gift-presentation';
import { readAutoGiftRules, autoGiftRuleLabel } from '../../profile-page/auto-gift-rules';
import { rewardLifecycle, setRewardLifecycle } from '../../profile-page/reward-lifecycle';
import { physicalGiftPreviews } from '../../workspace-preview-data';
import {
    getCoverColors,
    getClubCoverRewards,
    readCoverInventory,
    redeemCoverReward,
    sampleClubBalance,
} from '../../profile-page/cover-cosmetics';
import { paletteColorCss } from '../../../../components/media/color-palette';
import { buildGiftSections, readGiftPopularity, giftCategory } from '../../profile-page/gift-sections';
import './GiftsTab.scss';
import '../../../../components/v2/activity-card/ActivityCard.scss';
import '../../../../components/v2/common/CountBadge.scss';

const categories = [
    { id: 'physical', label: 'Hiện vật', icon: Package, description: 'Quà tặng hữu hình mang dấu ấn của CLB.' },
    { id: 'frame', label: 'Khung avatar', icon: ScanFace, description: 'Thêm điểm nhấn cho ảnh đại diện của bạn.' },
    {
        id: 'shape',
        label: 'Shape cover',
        icon: Shapes,
        description: 'Trang trí ảnh bìa bằng các thiết kế riêng của CLB.',
    },
    { id: 'color', label: 'Bộ màu', icon: Palette, description: 'Chọn bảng màu thể hiện phong cách cá nhân.' },
];
const categoryOf = giftCategory;
const sectionDefinitions = [
    { id: 'recent', label: 'Vừa thêm', icon: Sparkles, description: '6 quà mới nhất được thêm trong 30 ngày qua.' },
    {
        id: 'hot',
        label: 'Quà hot',
        icon: Flame,
        description: 'Quà CLB đánh dấu nổi bật hoặc có lượt đổi trên thiết bị này.',
    },
    ...categories,
];
const defaultExpanded = () => ({ recent: true, hot: true });
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
                <ShapeImage
                    assetUrl={reward.assetUrl}
                    hsl={reward.hsl}
                    svgPalette={reward.svgPalette}
                    size={160}
                    label={reward.label}
                />
            </div>
        );
    const palette = getCoverColors().find((item) => item.id === (reward.colorId || reward.id));
    return (
        <div className="v2-gift-cover-preview">
            <ProfileCoverArt
                color={reward.colorId || (reward.kind === 'color' ? reward.id : 'horizon')}
                shape={reward.shapeId || (reward.kind === 'color' ? 'petals' : 'none')}
                shapeAssetUrl={reward.assetUrl || ''}
            />
            {categoryOf(reward) === 'color' && palette && (
                <div className="v2-gift-swatches" aria-label="Các màu trong bộ">
                    {['background', 'secondary', 'accent', 'ink'].map((key) => (
                        <span key={key} style={{ background: paletteColorCss(palette[key]) }} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function GiftsTab({ workspace, manager = false, dashboard }) {
    const { user } = useAuth();
    const clubId = workspace?.clubId;
    const clubCode = workspace?.clubCode || workspace?.name || workspace?.clubName || '';
    const [inventory, setInventory] = useState(() => readCoverInventory(user));
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [lifecycleAction, setLifecycleAction] = useState(null);
    const [detailKey, setDetailKey] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [now, setNow] = useState(Date.now());
    const [createKind, setCreateKind] = useState('physical');
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('default');
    const [rewards, setRewards] = useState(() => getClubCoverRewards(clubId, undefined, clubCode));
    useEffect(() => {
        setInventory(readCoverInventory(user));
        setNotice('');
        setError('');
        setUploadOpen(false);
        setEditing(null);
        setLifecycleAction(null);
        setDetailKey(null);
        setStatusFilter('all');
        setCreateKind('physical');
        setExpanded(defaultExpanded());
        setQuery('');
        setSort('default');
        setRewards(getClubCoverRewards(clubId, undefined, clubCode));
        const refresh = () => {
            setNow(Date.now());
            setInventory(readCoverInventory(user));
            setRewards(getClubCoverRewards(clubId, undefined, clubCode));
        };
        window.addEventListener('storage', refresh);
        window.addEventListener('clubhub:cover-rewards-updated', refresh);
        window.addEventListener('focus', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('clubhub:cover-rewards-updated', refresh);
            window.removeEventListener('focus', refresh);
        };
    }, [user, clubId, clubCode]);
    const redeem = (reward) => {
        setError('');
        setNotice('');
        try {
            setInventory(redeemCoverReward(user, clubId, reward.key, undefined, clubCode));
            setNotice(
                reward.cost === 0
                    ? `Đã nhận ${reward.label} miễn phí. Số dư điểm không thay đổi.`
                    : `Đã đổi ${reward.label} bằng điểm mẫu. Bạn có thể sử dụng trong phần tùy chỉnh ảnh cá nhân.`,
            );
        } catch (issue) {
            setError(issue.message);
        }
    };
    const balance = sampleClubBalance(inventory, clubId);
    const allCatalog = [...physicalGiftPreviews, ...rewards].map((reward) => ({
        ...reward,
        ...rewardLifecycle(clubId, reward.key, undefined, now),
    }));
    const nextPublication = Math.min(...allCatalog.map((reward) => reward.nextChangeAt).filter(Number.isFinite));
    useEffect(() => {
        if (!Number.isFinite(nextPublication)) return;
        const timer = window.setTimeout(
            () => setNow(Date.now()),
            Math.max(0, Math.min(2147483647, nextPublication - Date.now())),
        );
        return () => window.clearTimeout(timer);
    }, [nextPublication, now]);
    const catalog = allCatalog.filter(
        (reward) => reward.status !== 'deleted' && (manager || reward.status === 'published'),
    );
    const detailedReward = catalog.find((reward) => reward.key === detailKey);
    useEffect(() => {
        if (detailKey && (!detailedReward || manager)) setDetailKey(null);
    }, [detailKey, detailedReward?.key, manager]);
    const statusLabels = {
        published: 'Đã publish',
        draft: 'Chưa publish',
        scheduled: 'Hẹn giờ',
        expired: 'Đã đóng đổi',
    };
    const changeStatus = (reward, status) => {
        try {
            setRewardLifecycle(clubId, reward.key, status);
            setError('');
            setNotice(`${reward.label}: ${status === 'published' ? 'đã publish' : 'đã unpublish'}.`);
        } catch (issue) {
            setError(issue.message);
        }
    };
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    const visible = catalog.filter(
        (reward) =>
            (!manager || statusFilter === 'all' || reward.status === statusFilter) &&
            reward.label.toLocaleLowerCase('vi').includes(normalizedQuery),
    );
    if (sort !== 'default') visible.sort((a, b) => (sort === 'ascending' ? a.cost - b.cost : b.cost - a.cost));
    const sections = buildGiftSections(visible, readGiftPopularity(clubId), now);
    useEffect(() => {
        if (query.trim() || statusFilter !== 'all')
            setExpanded(Object.fromEntries(sectionDefinitions.map((section) => [section.id, true])));
    }, [query, statusFilter]);
    return (
        <WorkspaceTabLayout
            title="Kho quà"
            description="Biến những đóng góp của bạn thành quà tặng và phong cách riêng."
            preview
            action={
                manager && user ? (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        onClick={() => {
                            setCreateKind('physical');
                            setUploadOpen(true);
                        }}
                    >
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
                            initialKind={createKind}
                            gift={editing}
                            activities={dashboard?.data?.activities || []}
                            onClose={() => {
                                setUploadOpen(false);
                                setEditing(null);
                            }}
                            onPublished={(gift) => {
                                setUploadOpen(false);
                                setEditing(null);
                                setRewards(getClubCoverRewards(clubId, undefined, clubCode));
                                setExpanded((current) => ({ ...current, recent: true, [gift.kind]: true }));
                                setQuery('');
                                setStatusFilter('all');
                                setNotice(`Đã lưu ${gift.label} vào Kho quà trên thiết bị này.`);
                            }}
                        />
                    )}
                    {lifecycleAction && manager && user && (
                        <GiftLifecycleModal
                            clubId={clubId}
                            reward={lifecycleAction.reward}
                            action={lifecycleAction.action}
                            onClose={() => setLifecycleAction(null)}
                            onSaved={() => {
                                setLifecycleAction(null);
                                setNotice('Đã cập nhật quà trên thiết bị này.');
                            }}
                        />
                    )}
                    {!manager && detailedReward && (
                        <GiftDetailPanel
                            reward={detailedReward}
                            category={categories.find((item) => item.id === categoryOf(detailedReward))?.label}
                            preview={<GiftPreview reward={detailedReward} />}
                            owned={inventory.owned.includes(detailedReward.key)}
                            balance={balance}
                            user={user}
                            clubId={clubId}
                            onClaim={redeem}
                            onClose={() => setDetailKey(null)}
                            notice={notice}
                            error={error}
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
                    {notice && !detailKey && (
                        <p className="v2-gift-notice" role="status">
                            {notice}
                        </p>
                    )}
                    {error && !detailKey && (
                        <p className="v2-profile-form-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="v2-gift-toolbar">
                        <div>
                            <h2>
                                Khám phá quà <span>{visible.length}</span>
                            </h2>
                            <p>Mở từng mục để xem quà theo loại.</p>
                        </div>
                        <div className="v2-gift-controls">
                            {manager && (
                                <select
                                    aria-label="Trạng thái quà"
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                >
                                    <option value="all">Mọi trạng thái</option>
                                    <option value="published">Đã publish</option>
                                    <option value="draft">Bản nháp / Unpublish</option>
                                    <option value="scheduled">Hẹn giờ</option>
                                    <option value="expired">Đã đóng đổi</option>
                                </select>
                            )}
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
                    <div className="v2-gift-section-tools">
                        <button
                            type="button"
                            className="v2-button"
                            onClick={() =>
                                setExpanded(Object.fromEntries(sectionDefinitions.map((section) => [section.id, true])))
                            }
                        >
                            Mở tất cả
                        </button>
                        <button type="button" className="v2-button" onClick={() => setExpanded({})}>
                            Thu gọn tất cả
                        </button>
                    </div>
                    {sections.map((section) => {
                        const definition = sectionDefinitions.find((item) => item.id === section.id),
                            Icon = definition.icon;
                        return (
                            <details
                                key={section.id}
                                className="v2-gift-section"
                                open={!!expanded[section.id]}
                                onToggle={(event) => {
                                    const open = event.currentTarget.open;
                                    setExpanded((current) =>
                                        !!current[section.id] === open ? current : { ...current, [section.id]: open },
                                    );
                                }}
                            >
                                <summary>
                                    <span className={`v2-gift-section-icon is-${section.id}`}>
                                        <Icon size={20} />
                                    </span>
                                    <span>
                                        <strong>{definition.label}</strong>
                                        <small>{definition.description}</small>
                                    </span>
                                    <span className="v2-count-badge">{section.items.length}</span>
                                    <ChevronDown size={18} className="v2-gift-section-chevron" />
                                </summary>
                                {expanded[section.id] && (
                                    <div className="v2-gift-section-content">
                                        {manager && user && categories.some((item) => item.id === section.id) && (
                                            <div className="v2-gift-section-add">
                                                <button
                                                    type="button"
                                                    className="v2-button"
                                                    onClick={() => {
                                                        setCreateKind(section.id);
                                                        setUploadOpen(true);
                                                    }}
                                                >
                                                    + Thêm {definition.label.toLocaleLowerCase('vi')}
                                                </button>
                                            </div>
                                        )}
                                        <div className="v2-cover-gifts-grid">
                                            {section.items.map((reward) => {
                                                const activeRules = manager ? readAutoGiftRules(clubId, reward.key).filter((rule) => rule.enabled) : [];
                                                const owned = inventory.owned.includes(reward.key);
                                                const physical = reward.kind === 'physical';
                                                const categoryLabel = categories.find(
                                                    (item) => item.id === categoryOf(reward),
                                                )?.label;
                                                return (
                                                    <article
                                                        className={`v2-gift-card${manager ? '' : ' is-member'}`}
                                                        key={reward.key}
                                                    >
                                                        <div className="v2-gift-preview">
                                                            <GiftPreview reward={reward} />
                                                            {manager && (
                                                                <span
                                                                    className={`v2-event-status v2-gift-status is-${reward.status === 'published' ? 'live' : reward.status === 'scheduled' ? 'upcoming' : 'completed'}`}
                                                                >
                                                                    {statusLabels[reward.status]}
                                                                </span>
                                                            )}
                                                            {manager && user && (
                                                                <button
                                                                    type="button"
                                                                    className="v2-gift-edit"
                                                                    aria-label={`Sửa ${reward.label}`}
                                                                    disabled={!reward.id?.startsWith('club-')}
                                                                    title={
                                                                        reward.id?.startsWith('club-')
                                                                            ? 'Sửa quà'
                                                                            : 'Quà mẫu có thiết kế cố định'
                                                                    }
                                                                    onClick={() => {
                                                                        setEditing(reward);
                                                                        setUploadOpen(true);
                                                                    }}
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                            )}
                                                            {!manager && (
                                                                <button
                                                                    type="button"
                                                                    className="v2-gift-edit v2-gift-open-detail"
                                                                    aria-label={`Xem chi tiết ${reward.label}`}
                                                                    title="Xem chi tiết quà"
                                                                    onClick={() => {
                                                                        setDetailKey(reward.key);
                                                                        setNotice('');
                                                                        setError('');
                                                                    }}
                                                                >
                                                                    <ArrowUpRight size={17} />
                                                                </button>
                                                            )}
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
                                                            {manager && !!activeRules.length && (
                                                                <div className="v2-gift-auto-summary">
                                                                    <strong>
                                                                        <Trophy size={14} /> Tự tặng khi kết thúc
                                                                    </strong>
                                                                    {activeRules.slice(0, 2).map((rule) => (
                                                                        <p key={rule.id}>{autoGiftRuleLabel(rule)}</p>
                                                                    ))}
                                                                    {activeRules.length > 2 && (
                                                                        <small>
                                                                            +{activeRules.length - 2} điều kiện khác
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {manager && reward.publishAt && (
                                                                <p className="v2-gift-schedule">
                                                                    <Clock size={14} />{' '}
                                                                    {new Date(reward.publishAt).toLocaleString('vi-VN')}
                                                                    {reward.unpublishAt && (
                                                                        <>
                                                                            {' '}
                                                                            →{' '}
                                                                            {new Date(
                                                                                reward.unpublishAt,
                                                                            ).toLocaleString('vi-VN')}
                                                                        </>
                                                                    )}
                                                                </p>
                                                            )}
                                                            {!manager && <GiftAvailability reward={reward} />}
                                                            <p className="v2-gift-description">
                                                                {giftDescription(reward)}
                                                            </p>
                                                            <div className="v2-gift-card-footer">
                                                                <strong>
                                                                    <Coins size={16} />
                                                                    {reward.cost === 0 ? (
                                                                        'Miễn phí'
                                                                    ) : (
                                                                        <>
                                                                            {reward.cost.toLocaleString('vi-VN')}{' '}
                                                                            <small>điểm mẫu</small>
                                                                        </>
                                                                    )}
                                                                </strong>
                                                                <GiftClaimButton
                                                                    reward={reward}
                                                                    owned={owned}
                                                                    balance={balance}
                                                                    user={user}
                                                                    clubId={clubId}
                                                                    onClaim={redeem}
                                                                />
                                                            </div>
                                                            {manager && user && (
                                                                <div
                                                                    className="v2-gift-manager-actions"
                                                                    aria-label={`Quản lý ${reward.label}`}
                                                                >
                                                                    <div
                                                                        className="v2-gift-publish-group"
                                                                        role="group"
                                                                        aria-label="Xuất bản và lịch mở đổi"
                                                                    >
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                changeStatus(
                                                                                    reward,
                                                                                    reward.status === 'published'
                                                                                        ? 'draft'
                                                                                        : 'published',
                                                                                )
                                                                            }
                                                                        >
                                                                            {reward.status === 'published' ? (
                                                                                <EyeOff size={14} />
                                                                            ) : (
                                                                                <Eye size={14} />
                                                                            )}
                                                                            {reward.status === 'published'
                                                                                ? 'Unpublish'
                                                                                : 'Publish'}
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            aria-label={`Thiết lập lịch mở đổi ${reward.label}`}
                                                                            title="Lịch mở đổi"
                                                                            onClick={() =>
                                                                                setLifecycleAction({
                                                                                    reward,
                                                                                    action: 'scheduled',
                                                                                })
                                                                            }
                                                                        >
                                                                            <Clock size={16} />
                                                                        </button>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="is-danger"
                                                                        onClick={() =>
                                                                            setLifecycleAction({
                                                                                reward,
                                                                                action: 'deleted',
                                                                            })
                                                                        }
                                                                    >
                                                                        <Trash2 size={14} /> Xóa
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                        {!section.items.length && (
                                            <p className="v2-gift-section-empty">
                                                {section.id === 'hot'
                                                    ? 'Chưa có quà nổi bật hoặc lượt đổi trên thiết bị. Quản lý có thể đánh dấu Quà hot trong phần sửa quà.'
                                                    : section.id === 'recent'
                                                      ? 'Chưa có quà được thêm trong 30 ngày qua.'
                                                      : 'Chưa có quà phù hợp trong mục này.'}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </details>
                        );
                    })}
                    {!visible.length && (
                        <div className="v2-gift-empty">
                            <Gift size={36} strokeWidth={1.3} />
                            <h3>{query.trim() ? 'Chưa tìm thấy món quà phù hợp' : 'Chưa có quà phù hợp'}</h3>
                            <p>
                                {query.trim()
                                    ? 'Thử tên khác hoặc chọn một loại quà khác.'
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
