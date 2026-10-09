export const COVER_COLORS = [
    {
        id: 'default',
        label: 'Cam trải nghiệm',
        free: true,
        background: '#fff1df',
        secondary: '#fed7aa',
        accent: '#fb923c',
        ink: '#9a3412',
    },
    {
        id: 'sunset',
        label: 'Hoàng hôn',
        free: true,
        background: '#ffe5dc',
        secondary: '#ffbdac',
        accent: '#ed795f',
        ink: '#943721',
    },
    {
        id: 'horizon',
        label: 'Bầu trời',
        free: true,
        background: '#dceffc',
        secondary: '#fed7aa',
        accent: '#fb923c',
        ink: '#9a3412',
    },
    {
        id: 'forest',
        label: 'Rừng xanh',
        free: true,
        background: '#e0f3e9',
        secondary: '#a9dbc3',
        accent: '#369b74',
        ink: '#185640',
    },
    {
        id: 'violet',
        label: 'Tím sáng tạo',
        free: true,
        background: '#ede8ff',
        secondary: '#c7b8f1',
        accent: '#9473dd',
        ink: '#513389',
    },
    {
        id: 'fpt-dev-midnight',
        label: 'FPT Dev · Circuit Green',
        cost: 120,
        clubName: 'FPT Dev',
        background: '#0b1711',
        secondary: '#174b31',
        accent: '#58e58e',
        ink: '#e6ffef',
    },
    {
        id: 'fpt-dev-mint',
        label: 'FPT Dev · Terminal',
        cost: 160,
        clubName: 'FPT Dev',
        background: '#080e0b',
        secondary: '#143824',
        accent: '#45f089',
        ink: '#d6ffe5',
    },
    {
        id: 'fpt-dev-neon',
        label: 'FPT Dev · Pixel Hacker',
        cost: 200,
        clubName: 'FPT Dev',
        background: '#111810',
        secondary: '#294c24',
        accent: '#a5f36c',
        ink: '#edffe2',
    },
];
export const COVER_SHAPES = [
    { id: 'none', label: 'Không dùng shape', free: true },
    { id: 'petals', label: 'Cánh hoa', free: true },
    { id: 'ribbons', label: 'Dải chéo', free: true },
    { id: 'circles', label: 'Bong bóng', free: true },
    { id: 'orbits', label: 'Quỹ đạo', free: true },
    { id: 'waves', label: 'Sóng', free: true },
];
const assetBase = import.meta.env?.BASE_URL || '/';
export const FPT_DEV_COMBOS = [
    {
        id: 'fpt-dev-circuit',
        key: 'combo:fpt-dev-circuit',
        kind: 'combo',
        label: 'Circuit Green',
        cost: 120,
        clubCode: 'FPT-DEV',
        clubName: 'FPT Dev',
        colorId: 'fpt-dev-midnight',
        shapeId: 'fpt-dev-circuit',
        assetUrl: `${assetBase}assets/profile-covers/fpt-dev-circuit.svg`,
    },
    {
        id: 'fpt-dev-terminal',
        key: 'combo:fpt-dev-terminal',
        kind: 'combo',
        label: 'Terminal Developer </>',
        cost: 160,
        clubCode: 'FPT-DEV',
        clubName: 'FPT Dev',
        colorId: 'fpt-dev-mint',
        shapeId: 'fpt-dev-terminal',
        assetUrl: `${assetBase}assets/profile-covers/fpt-dev-terminal.svg`,
    },
    {
        id: 'fpt-dev-pixel',
        key: 'combo:fpt-dev-pixel',
        kind: 'combo',
        label: 'Pixel Hacker',
        cost: 200,
        clubCode: 'FPT-DEV',
        clubName: 'FPT Dev',
        colorId: 'fpt-dev-neon',
        shapeId: 'fpt-dev-pixel',
        assetUrl: `${assetBase}assets/profile-covers/fpt-dev-pixel.svg`,
    },
];
const CLUB_SHAPES_KEY = 'clubhub:v2:club-cover-shapes:1';
export function readClubShapes(storage = globalThis.localStorage) {
    try {
        const values = JSON.parse(storage?.getItem(CLUB_SHAPES_KEY) || '[]');
        return Array.isArray(values)
            ? values.filter(
                  (item) =>
                      item.kind === 'shape' &&
                      item.clubId &&
                      item.id?.startsWith('club-') &&
                      Number.isSafeInteger(item.cost) &&
                      item.cost > 0 &&
                      /^(https:\/\/|data:image\/(png|webp);base64,)/.test(item.assetUrl || ''),
              )
            : [];
    } catch {
        return [];
    }
}
export function getCoverShapes(storage = globalThis.localStorage) {
    return [
        ...COVER_SHAPES,
        ...FPT_DEV_COMBOS.map((combo) => ({ ...combo, id: combo.shapeId, kind: 'shape' })),
        ...readClubShapes(storage),
    ];
}
export function getClubCoverRewards(clubId, storage = globalThis.localStorage, clubCode = '') {
    const fptDev =
        String(clubCode)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '') === 'FPTDEV';
    return [
        ...(fptDev ? FPT_DEV_COMBOS : []),
        ...readClubShapes(storage).filter((item) => String(item.clubId) === String(clubId)),
    ];
}
export function publishClubShape({ clubId, clubName, label, cost, assetUrl }, storage = globalThis.localStorage) {
    if (
        !clubId ||
        !label?.trim() ||
        label.trim().length > 80 ||
        !Number.isSafeInteger(cost) ||
        cost < 1 ||
        cost > 100000
    )
        throw new Error('Vui lòng nhập tên shape và mức điểm hợp lệ.');
    if (!/^data:image\/(png|webp);base64,/.test(assetUrl || '') || assetUrl.length > 1500000)
        throw new Error('Shape cần ảnh PNG/WebP tối đa 1 MB.');
    const id = `club-${clubId}-${crypto.randomUUID()}`;
    const shape = {
        id,
        key: `shape:${id}`,
        kind: 'shape',
        clubId: String(clubId),
        clubName: String(clubName || ''),
        label: label.trim(),
        cost,
        assetUrl,
    };
    storage.setItem(CLUB_SHAPES_KEY, JSON.stringify([...readClubShapes(storage), shape]));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
    return shape;
}
export const COVER_REWARDS = FPT_DEV_COMBOS;
const identity = (user) => (user?.id === undefined || user?.id === null ? '' : String(user.id));
export const cosmeticsStorageKey = (user) => (identity(user) ? `clubhub:v2:cover-rewards:${identity(user)}` : null);
export function readCoverInventory(user, storage = globalThis.localStorage) {
    const key = cosmeticsStorageKey(user);
    if (!key) return { owned: [], wallets: {} };
    try {
        const value = JSON.parse(storage?.getItem(key) || 'null');
        if (value?.version !== 1) return { owned: [], wallets: {} };
        return {
            owned: Array.isArray(value.owned)
                ? value.owned.filter(
                      (key) =>
                          [...COVER_REWARDS, ...readClubShapes(storage)].some((item) => item.key === key) ||
                          FPT_DEV_COMBOS.some(
                              (combo) => key === `color:${combo.colorId}` || key === `shape:${combo.shapeId}`,
                          ),
                  )
                : [],
            wallets: value.wallets && typeof value.wallets === 'object' ? value.wallets : {},
        };
    } catch {
        return { owned: [], wallets: {} };
    }
}
export function canUseCoverItem(kind, id, inventory, storage = globalThis.localStorage) {
    const item = (kind === 'color' ? COVER_COLORS : getCoverShapes(storage)).find((item) => item.id === id);
    return !!item && (item.free || inventory.owned.includes(`${kind}:${id}`));
}
// Temporary per-club credits for exercising the UI; never a live points balance.
export function sampleClubBalance(inventory, clubId) {
    const value = inventory.wallets[String(clubId)];
    return Number.isSafeInteger(value) && value >= 0 ? value : 200;
}
export function redeemCoverReward(user, clubId, rewardKey, storage = globalThis.localStorage, clubCode = '') {
    const key = cosmeticsStorageKey(user);
    if (!key || !clubId) throw new Error('Vui lòng đăng nhập và chọn CLB.');
    const reward = getClubCoverRewards(clubId, storage, clubCode).find((item) => item.key === rewardKey);
    if (!reward) throw new Error('Phần quà không tồn tại.');
    const inventory = readCoverInventory(user, storage);
    if (inventory.owned.includes(rewardKey)) return inventory;
    const balance = sampleClubBalance(inventory, clubId);
    if (balance < reward.cost) throw new Error('Chưa đủ điểm mẫu để đổi phần quà này.');
    const next = {
        version: 1,
        owned: [
            ...new Set([
                ...inventory.owned,
                rewardKey,
                ...(reward.kind === 'combo' ? [`color:${reward.colorId}`, `shape:${reward.shapeId}`] : []),
            ]),
        ],
        wallets: { ...inventory.wallets, [String(clubId)]: balance - reward.cost },
    };
    storage.setItem(key, JSON.stringify(next));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
    return next;
}
