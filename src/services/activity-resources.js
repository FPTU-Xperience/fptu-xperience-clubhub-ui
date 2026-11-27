import { safeResourceUrl, validateActivityFile } from '../components/v2/activity-detail/activity-resources-data.js';

// Files are uploaded atomically through the authenticated API, with no public object URL.
export async function saveActivityResource(api, activityId, draft) {
    const id = Number(activityId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Hoạt động không hợp lệ.');
    if (draft.file) {
        const meta = validateActivityFile(draft.file, draft.kind);
        const form = new FormData();
        form.append('file', draft.file, meta.fileName);
        form.append('kind', draft.kind);
        form.append('title', draft.title);
        form.append('visibility', draft.visibility);
        const saved = await api.request(`/api/activities/${id}/resources/upload`, {
            method: 'POST',
            headers: { 'Idempotency-Key': `${draft.id}:upload` },
            body: form,
        });
        if (!saved?.id || saved.url !== `/api/activities/${id}/resources/${saved.id}/download`
            || saved.kind !== draft.kind || saved.mimeType !== meta.mimeType || saved.sizeBytes !== meta.sizeBytes)
            throw new Error('Máy chủ chưa xác nhận lưu đúng tài nguyên.');
        return saved;
    }
    const url = draft.kind === 'EMBED' ? safeResourceUrl(draft.url) : undefined;
    if (draft.kind === 'EMBED' && !url) throw new Error('Liên kết phải dùng HTTPS.');
    const saved = await api.request(`/api/activities/${id}/resources`, {
        method: 'POST',
        headers: { 'Idempotency-Key': draft.id },
        body: JSON.stringify({
            kind: draft.kind,
            title: draft.title,
            visibility: draft.visibility,
            url,
        }),
    });
    if (!saved?.id) throw new Error('Máy chủ chưa xác nhận lưu tài nguyên.');
    return saved;
}

export function updateActivityResource(api, activityId, resource, fields, key) {
    return api.request(
        `/api/activities/${encodeURIComponent(activityId)}/resources/${encodeURIComponent(resource.id)}`,
        {
            method: 'PATCH',
            headers: { 'Idempotency-Key': key },
            body: JSON.stringify({
                expectedVersion: resource.version,
                title: fields.title,
                visibility: fields.visibility,
                position: Number(fields.position),
            }),
        },
    );
}
export function detachActivityResource(api, activityId, resource, reason, key) {
    return api.request(
        `/api/activities/${encodeURIComponent(activityId)}/resources/${encodeURIComponent(resource.id)}`,
        {
            method: 'DELETE',
            headers: { 'Idempotency-Key': key },
            body: JSON.stringify({ expectedVersion: resource.version, reason }),
        },
    );
}
