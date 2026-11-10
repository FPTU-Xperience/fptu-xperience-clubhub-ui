import { useEffect, useState } from 'react';
import {
    Gift,
    Package,
    ScanFace,
    Shapes,
    Palette,
    Search,
    Coins,
    Check,
    ArrowUpRight,
    Pencil,
    Clock,
    Sparkles,
    Flame,
    ChevronDown,
} from 'lucide-react';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import ProfileAvatar from '../../profile-page/ProfileAvatar';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import ShapeImage from '../../profile-page/ShapeImage';
import { creditNumber, rewardTime } from '../../../../services/club-credit';
import './GiftsTab.scss';
import './GiftDetailPanel.scss';
import '../../../../components/v2/activity-card/ActivityCard.scss';
import '../../../../components/v2/common/CountBadge.scss';

const categories = [
    { id: 'physical', label: 'Hiện vật', icon: Package, description: 'Quà tặng hữu hình mang dấu ấn của CLB.' },
    { id: 'FRAME', label: 'Khung avatar', icon: ScanFace, description: 'Thêm điểm nhấn cho ảnh đại diện của bạn.' },
    {
        id: 'SHAPE',
        label: 'Badge ảnh bìa',
        icon: Shapes,
        description: 'Trang trí ảnh bìa bằng các thiết kế riêng của CLB.',
    },
    { id: 'COLOR', label: 'Bộ màu', icon: Palette, description: 'Chọn bảng màu thể hiện phong cách cá nhân.' },
];
const definitions = [
    { id: 'recent', label: 'Vừa thêm', icon: Sparkles, description: '6 quà mới nhất được thêm trong 30 ngày qua.' },
    { id: 'hot', label: 'Quà hot', icon: Flame, description: 'Quà nổi bật của CLB.' },
    ...categories,
];
const statusName = {
    DRAFT: 'Bản nháp',
    SCHEDULED: 'Chưa mở đổi',
    OPEN: 'Đang mở đổi',
    EXPIRED: 'Đã hết thời gian đổi',
    RETIRED: 'Đã ngừng đổi',
};
const category = (row) => (row.kind === 'BUNDLE' ? 'COLOR' : row.kind);

export function ServerGiftPreview({ reward }) {
    const palette = reward.grants.find((grant) => grant.kind === 'COLOR');
    const shape = reward.grants.find((grant) => grant.kind === 'SHAPE');
    const frame = reward.grants.find((grant) => grant.kind === 'FRAME');
    if (frame)
        return (
            <div className="v2-gift-frame-preview">
                <ProfileAvatar
                    profile={{ initials: 'SV' }}
                    frameDesign={{ ...frame.definition, id: frame.cosmeticId }}
                    large
                />
            </div>
        );
    if (!palette && shape)
        return (
            <div className="v2-shape-stamp-preview">
                <ShapeImage assetUrl={shape.definition.assetUrl} size={160} label={shape.label} />
            </div>
        );
    return (
        <div className="v2-gift-cover-preview">
            <ProfileCoverArt
                colorPalette={palette?.definition}
                shape={shape ? 'none' : 'petals'}
                shapeAssetUrl={shape?.definition.assetUrl || ''}
            />
            {palette && (
                <>
                    <div className="v2-gift-swatches" aria-label="Các màu trong bộ">
                        {Object.entries(palette.definition).map(([key, value]) => (
                            <span key={key} style={{ background: value }} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

export default function GiftCatalogView({
    catalog,
    wallet,
    inventory,
    user,
    manager,
    readOnly,
    busy,
    identity,
    onAction,
}) {
    const [query, setQuery] = useState(''),
        [sort, setSort] = useState('default'),
        [status, setStatus] = useState('all');
    const [expanded, setExpanded] = useState({ recent: true, hot: true }),
        [detail, setDetail] = useState(null);
    useEffect(() => {
        setQuery('');
        setSort('default');
        setStatus('all');
        setDetail(null);
        setExpanded({ recent: true, hot: true });
    }, [identity]);
    useEffect(() => {
        if (query.trim() || status !== 'all')
            setExpanded(Object.fromEntries(definitions.map((section) => [section.id, true])));
    }, [query, status]);
    const owned = new Set(inventory?.map((item) => item.cosmetic.cosmeticId) || []);
    const visible = catalog.items.filter(
        (row) =>
            row.label.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')) &&
            (status === 'all' || row.availability === status),
    );
    if (sort !== 'default') visible.sort((a, b) => (sort === 'ascending' ? a.price - b.price : b.price - a.price));
    const recent = visible
        .filter((row) => {
            const date = Date.parse(row.createdAt);
            return date <= Date.now() && date >= Date.now() - 30 * 86400000;
        })
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 6);
    const sections = definitions.map((section) => ({
        ...section,
        items:
            section.id === 'recent'
                ? recent
                : section.id === 'hot'
                  ? []
                  : visible.filter((row) => category(row) === section.id),
    }));
    const activeDetail = catalog.items.find((row) => row.id === detail);
    const claim = (row) => {
        const hasAll = !!inventory && row.grants.every((grant) => owned.has(grant.cosmeticId));
        const label = hasAll
            ? 'Đã sở hữu'
            : row.availability !== 'OPEN'
              ? statusName[row.availability]
              : !user
                ? 'Đăng nhập để đổi'
                : !catalog.capabilities.canRedeem
                  ? 'Chưa đủ điều kiện đổi quà'
                  : !wallet || !inventory
                    ? 'Chưa xác nhận số dư/quyền sở hữu'
                    : wallet.balance < 0
                      ? 'Ví đang có khoản âm'
                      : wallet.balance < row.price
                        ? 'Chưa đủ credit'
                        : row.price === 0
                          ? 'Nhận miễn phí'
                          : 'Đổi quà';
        const allowed =
            !readOnly &&
            catalog.capabilities.canRedeem &&
            !!user &&
            !!wallet &&
            !!inventory &&
            row.availability === 'OPEN' &&
            wallet.balance >= row.price &&
            wallet.balance >= 0 &&
            !hasAll;
        return (
            !readOnly && (
                <button
                    type="button"
                    className="v2-button v2-button--primary"
                    disabled={!allowed || busy}
                    onClick={() => {
                        setDetail(null);
                        onAction('redeem', row);
                    }}
                >
                    {label}
                </button>
            )
        );
    };
    return (
        <>
            {!readOnly && user && (
                <div className="v2-cover-gifts-balance">
                    <div className="v2-gift-wallet">
                        <span className="v2-gift-wallet-icon">
                            <Coins size={24} />
                        </span>
                        <div>
                            <small>CREDIT CỦA BẠN TẠI CLB</small>
                            <strong>
                                {wallet ? creditNumber(wallet.balance) : '—'} <span>credit</span>
                            </strong>
                        </div>
                    </div>
                    <p>
                        Credit được tích lũy từ XP đã xác minh tại CLB này. Đổi quà không làm giảm XP và điểm thành
                        tích.
                    </p>
                    <a href="./points">
                        Điểm & thành tích <ArrowUpRight size={16} />
                    </a>
                </div>
            )}
            {!readOnly && wallet?.hasDebt && (
                <p role="alert">
                    Credit đã dùng vượt phần XP còn được xác nhận. Ví giữ khoản âm và tạm chặn đổi quà đến khi bù đủ.
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
                    {(manager || readOnly) && (
                        <select
                            aria-label="Trạng thái quà"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="all">Mọi trạng thái</option>
                            {Object.entries(statusName).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
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
                    <select aria-label="Sắp xếp quà" value={sort} onChange={(event) => setSort(event.target.value)}>
                        <option value="default">Mặc định</option>
                        <option value="ascending">Credit: thấp đến cao</option>
                        <option value="descending">Credit: cao đến thấp</option>
                    </select>
                </div>
            </div>
            <div className="v2-gift-section-tools">
                <button
                    type="button"
                    className="v2-button"
                    onClick={() => setExpanded(Object.fromEntries(definitions.map((section) => [section.id, true])))}
                >
                    Mở tất cả
                </button>
                <button type="button" className="v2-button" onClick={() => setExpanded({})}>
                    Thu gọn tất cả
                </button>
            </div>
            {sections.map((section) => {
                const Icon = section.icon;
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
                            <span className={`v2-gift-section-icon is-${section.id.toLowerCase()}`}>
                                <Icon size={20} />
                            </span>
                            <span>
                                <strong>{section.label}</strong>
                                <small>{section.description}</small>
                            </span>
                            <span className="v2-count-badge">{section.items.length}</span>
                            <ChevronDown size={18} className="v2-gift-section-chevron" />
                        </summary>
                        {expanded[section.id] && (
                            <div className="v2-gift-section-content">
                                {manager &&
                                    categories.some((item) => item.id === section.id) &&
                                    section.id !== 'physical' && (
                                        <div className="v2-gift-section-add">
                                            <button
                                                className="v2-button"
                                                type="button"
                                                onClick={() => onAction('create', null, section.id)}
                                            >
                                                + Thêm {section.label.toLocaleLowerCase('vi')}
                                            </button>
                                        </div>
                                    )}
                                <div className="v2-cover-gifts-grid">
                                    {section.items.map((row) => (
                                        <article key={row.id} className={`v2-gift-card${manager ? '' : ' is-member'}`}>
                                            <div className="v2-gift-preview">
                                                <ServerGiftPreview reward={row} />
                                                {(manager || readOnly) && (
                                                    <span
                                                        className={`v2-event-status v2-gift-status is-${row.availability === 'OPEN' ? 'live' : 'completed'}`}
                                                    >
                                                        {statusName[row.availability]}
                                                    </span>
                                                )}
                                                {manager && row.status === 'DRAFT' && (
                                                    <button
                                                        type="button"
                                                        className="v2-gift-edit"
                                                        aria-label={`Sửa ${row.label}`}
                                                        disabled={busy}
                                                        onClick={() => onAction('edit', row)}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {!manager && (
                                                    <button
                                                        type="button"
                                                        className="v2-gift-edit v2-gift-open-detail"
                                                        aria-label={`Xem chi tiết ${row.label}`}
                                                        onClick={() => setDetail(row.id)}
                                                    >
                                                        <ArrowUpRight size={17} />
                                                    </button>
                                                )}
                                                {!readOnly &&
                                                    inventory &&
                                                    row.grants.every((grant) => owned.has(grant.cosmeticId)) && (
                                                        <span className="v2-gift-owned">
                                                            <Check size={12} /> Đã sở hữu
                                                        </span>
                                                    )}
                                            </div>
                                            <div className="v2-gift-card-body">
                                                <div className="v2-gift-card-meta">
                                                    <span>
                                                        {row.kind === 'BUNDLE'
                                                            ? 'Bộ màu + Badge'
                                                            : categories.find((item) => item.id === row.kind)?.label}
                                                    </span>
                                                </div>
                                                <h3>{row.label}</h3>
                                                <p className="v2-gift-description">{row.description}</p>
                                                <p className="v2-gift-schedule">
                                                    <Clock size={14} /> Mở: {rewardTime(row.opensAt)} · Đóng:{' '}
                                                    {rewardTime(row.closesAt)}
                                                </p>
                                                <div className="v2-gift-card-footer">
                                                    <strong>
                                                        <Coins size={16} />
                                                        {row.price === 0 ? (
                                                            'Miễn phí'
                                                        ) : (
                                                            <>
                                                                {creditNumber(row.price)} <small>credit</small>
                                                            </>
                                                        )}
                                                    </strong>
                                                    {claim(row)}
                                                </div>
                                                {manager && (
                                                    <div
                                                        className="v2-gift-manager-actions"
                                                        aria-label={`Quản lý ${row.label}`}
                                                    >
                                                        {row.status === 'DRAFT' && (
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                onClick={() => onAction('publish', row)}
                                                            >
                                                                Mở/lên lịch đổi
                                                            </button>
                                                        )}
                                                        {row.status !== 'RETIRED' && (
                                                            <button
                                                                type="button"
                                                                className="is-danger"
                                                                disabled={busy}
                                                                onClick={() => onAction('retire', row)}
                                                            >
                                                                Ngừng đổi
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                                {!section.items.length && (
                                    <p className="v2-gift-section-empty">
                                        {section.id === 'physical'
                                            ? 'Chưa mở đổi và bàn giao hiện vật.'
                                            : section.id === 'hot'
                                              ? 'Chưa có dữ liệu quà nổi bật của CLB.'
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
                    <h3>{query.trim() ? 'Chưa tìm thấy món quà phù hợp' : 'CLB chưa có phần quà phù hợp'}</h3>
                    {query.trim() && (
                        <button type="button" className="v2-button" onClick={() => setQuery('')}>
                            Xóa tìm kiếm
                        </button>
                    )}
                </div>
            )}
            {activeDetail && (
                <V2Modal
                    title="Chi tiết quà"
                    className="v2-gift-detail-panel"
                    onClose={() => setDetail(null)}
                    footer={
                        <>
                            <strong className="v2-gift-detail-price">
                                <Coins size={17} />
                                {creditNumber(activeDetail.price)} credit
                            </strong>
                            {claim(activeDetail)}
                        </>
                    }
                >
                    <div className="v2-gift-preview">
                        <ServerGiftPreview reward={activeDetail} />
                    </div>
                    <p className="v2-gift-detail-category">
                        {categories.find((item) => item.id === category(activeDetail))?.label}
                    </p>
                    <h3>{activeDetail.label}</h3>
                    <p className="v2-gift-detail-description">{activeDetail.description}</p>
                    <section className="v2-gift-detail-info">
                        <h4>Thời gian mở đổi</h4>
                        <p>{statusName[activeDetail.availability]}</p>
                        <p>Mở: {rewardTime(activeDetail.opensAt)}</p>
                        <p>Đóng: {rewardTime(activeDetail.closesAt)}</p>
                    </section>
                    <section className="v2-gift-detail-info">
                        <h4>Thông tin đổi quà</h4>
                        {!readOnly && (
                            <p>Số dư của bạn: {wallet ? creditNumber(wallet.balance) + ' credit' : 'Chưa xác nhận'}.</p>
                        )}
                        <p>Sau khi nhận, quà có thể dùng trong phần tùy chỉnh profile cá nhân.</p>
                    </section>
                </V2Modal>
            )}
        </>
    );
}
