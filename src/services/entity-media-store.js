// An in-memory projection of acknowledged API media. Missing DTO fields preserve
// known media; explicit null clears it. Nothing is persisted as a second database.
const fields = { club: ['logoUrl', 'coverImageUrl'], activity: ['coverImageUrl'] };

export function createEntityMediaStore() {
    let revision = 0;
    let generation = 0;
    const records = new Map();
    const listeners = new Set();
    const key = (kind, id) => `${kind}:${String(id)}`;
    const notify = () => listeners.forEach((listener) => listener());
    const ticket = () => ({ revision, generation });
    const ingestItem = (kind, item, request, id = item?.id ?? item?.clubId, acknowledged = false) => {
        if (!item || id == null || id === '' || request.generation !== generation) return item;
        const identity = key(kind, id);
        const current = records.get(identity) || { values: {}, versions: {} };
        const values = { ...current.values };
        const versions = { ...current.versions };
        let changed = false;
        for (const field of fields[kind] || []) {
            const supplied = Object.hasOwn(item, field) || (field === 'coverImageUrl' && Object.hasOwn(item, 'coverUrl'));
            if (!supplied || (versions[field] || 0) > request.revision) continue;
            const value = item[field] ?? (Object.hasOwn(item, field) ? '' : item.coverUrl) ?? '';
            if (values[field] !== value) changed = true;
            values[field] = value;
            versions[field] = revision + 1;
        }
        if (changed || acknowledged) {
            revision++;
            records.set(identity, { values, versions });
            if (changed) notify();
        }
        return { ...item, ...(records.get(identity)?.values || {}) };
    };
    return {
        ticket,
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        snapshot: () => revision,
        select(kind, entity) {
            const id = entity?.id ?? entity?.clubId;
            const media = id == null ? null : records.get(key(kind, id))?.values;
            return media ? { ...entity, ...media } : entity;
        },
        ingest(kind, payload, request = ticket()) {
            if (Array.isArray(payload)) return payload.map((item) => ingestItem(kind, item, request));
            if (Array.isArray(payload?.items)) return { ...payload, items: payload.items.map((item) => ingestItem(kind, item, request)) };
            return ingestItem(kind, payload, request);
        },
        commit(kind, id, values) { return ingestItem(kind, values, ticket(), id, true); },
        reset() { generation++; records.clear(); revision++; notify(); },
    };
}
