const inventories = new Map(), catalog = new Map();
export function acceptServerCosmetics(userId, items) {
    const owned = [];
    for (const item of items) {
        const value = item.cosmetic;
        const kind = value.kind.toLowerCase();
        if (!['color', 'shape', 'frame'].includes(kind)) throw new Error('Vật phẩm chưa có loại được hỗ trợ.');
        const key = `${kind}:${value.cosmeticId}`;
        catalog.set(value.cosmeticId, { ...value.definition, id: value.cosmeticId, key, kind,
            label: value.label, clubId: String(value.issuerClubId), free: false, server: true });
        owned.push(key);
    }
    inventories.set(String(userId), { owned, wallets: {}, source: 'SERVER' });
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
}
export const serverCosmeticInventory = (userId) => inventories.get(String(userId)) || { owned: [], wallets: {}, source: 'SERVER_UNAVAILABLE' };
export const serverCosmeticDefinitions = (kind) => [...catalog.values()].filter((item) => item.kind === kind);
export const clearServerCosmetics = (userId) => inventories.delete(String(userId));
