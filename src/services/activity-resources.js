import { safeResourceUrl, validateActivityFile } from '../components/v2/activity-detail/activity-resources-data.js';

// Provisional resource contract. Call only when the server advertises canManage/canUpload.
export async function saveActivityResource(api, activityId, draft) {
    const id = Number(activityId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Hoạt động không hợp lệ.');
    let uploadIntentId;
    if (draft.file) {
        const meta = validateActivityFile(draft.file, draft.kind);
        const intent = await api.request(`/api/activities/${id}/resources/upload-intents`, {
            method: 'POST',
            headers: { 'Idempotency-Key': `${draft.id}:upload` },
            body: JSON.stringify(meta),
        });
        const url = new URL(intent.uploadUrl);
        const endpointValue = import.meta.env?.VITE_R2_S3_ENDPOINT;
        const bucket = import.meta.env?.VITE_R2_BUCKET_NAME;
        let signingHost = '';
        try { const endpoint = new URL(endpointValue); if (endpoint.protocol === 'https:') signingHost = endpoint.hostname; } catch { /* Unconfigured origins must not receive file bytes. */ }
        const validOrigin = signingHost && bucket && (url.hostname === signingHost || url.hostname === `${bucket}.${signingHost}`);
        if (
            url.protocol !== 'https:' ||
            !url.hostname.endsWith('.r2.cloudflarestorage.com') ||
            !validOrigin ||
            (url.port && url.port !== '443') ||
            !url.searchParams.has('X-Amz-Signature') ||
            url.username ||
            url.password ||
            !intent.id ||
            intent.mimeType !== meta.mimeType
        )
            throw new Error('Máy chủ trả về địa chỉ tải tệp không hợp lệ hoặc chưa cấu hình origin tải lên.');
        const uploaded = await fetch(url.href, {
            method: 'PUT',
            headers: { 'Content-Type': meta.mimeType },
            body: draft.file,
        });
        if (!uploaded.ok) throw new Error('Không thể tải tệp lên. Vui lòng thử lại.');
        uploadIntentId = intent.id;
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
            uploadIntentId,
            url,
        }),
    });
    if (!saved?.id) throw new Error('Máy chủ chưa xác nhận lưu tài nguyên.');
    return saved;
}
