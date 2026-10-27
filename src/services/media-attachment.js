// Upload completion only supplies a staging URL. The attachment response owns
// the durable URL and the next entity version.
export function confirmedImageAttachment(response, fields) {
    if (!response || typeof response.version !== 'string' || !response.version) {
        throw new Error('Máy chủ chưa xác nhận lưu ảnh. Vui lòng tải lại và thử lại.');
    }
    for (const field of ['avatarUrl', 'logoUrl', 'coverImageUrl']) {
        if (!Object.hasOwn(fields, field)) continue;
        const value = response[field];
        if (fields[field] === null && value === null) continue;
        let url;
        try {
            url = new URL(value);
        } catch {
            /* Reject missing attachment fields. */
        }
        if (!url || url.protocol !== 'https:' || url.username || url.password || url.pathname.startsWith('/staging/')) {
            throw new Error('Máy chủ chưa xác nhận ảnh đã lưu. Vui lòng tải lại và thử lại.');
        }
    }
    return response;
}
