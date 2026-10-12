const fileTypes = {
    pdf: ['DOCUMENT', 'application/pdf', 20],
    doc: ['DOCUMENT', 'application/msword', 20],
    docx: ['DOCUMENT', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 20],
    xls: ['DOCUMENT', 'application/vnd.ms-excel', 20],
    xlsx: ['DOCUMENT', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 20],
    jpg: ['MEDIA', 'image/jpeg', 5],
    jpeg: ['MEDIA', 'image/jpeg', 5],
    png: ['MEDIA', 'image/png', 5],
    webp: ['MEDIA', 'image/webp', 5],
    mp4: ['MEDIA', 'video/mp4', 100],
    webm: ['MEDIA', 'video/webm', 100],
};

export function safeResourceUrl(value) {
    try {
        const url = new URL(value);
        if (
            url.protocol !== 'https:' ||
            url.username ||
            url.password ||
            /^(localhost|0\.|127\.|10\.|192\.168\.|169\.254\.|172\.(?:1[6-9]|2\d|3[01])\.|\[)/i.test(url.hostname)
        )
            return '';
        return url.href;
    } catch {
        return '';
    }
}

export function youtubeEmbedUrl(value) {
    const safe = safeResourceUrl(value);
    if (!safe) return '';
    const url = new URL(safe);
    let id;
    if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
        id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
    }
    return /^[\w-]{11}$/.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}` : '';
}

export function validateActivityFile(file, kind) {
    const extension = String(file?.name || '')
        .split('.')
        .pop()
        .toLowerCase();
    const config = fileTypes[extension];
    if (!config || config[0] !== kind)
        throw new Error(
            kind === 'DOCUMENT'
                ? 'Chọn PDF, Word (.doc/.docx) hoặc Excel (.xls/.xlsx).'
                : 'Chọn JPG, PNG, WebP, MP4 hoặc WebM.',
        );
    if (file.type && file.type !== 'application/octet-stream' && file.type !== config[1])
        throw new Error('Định dạng tệp không khớp với phần mở rộng.');
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > config[2] * 1024 * 1024)
        throw new Error(`Tệp ${file.name} phải nhỏ hơn hoặc bằng ${config[2]} MB và không được rỗng.`);
    return { kind, mimeType: config[1], fileName: file.name, sizeBytes: file.size };
}

export function mapActivityResources(raw) {
    return (Array.isArray(raw) ? raw : []).flatMap((item) => {
        const url = safeResourceUrl(item.url || item.downloadUrl);
        if (
            !item.id ||
            !url ||
            !['DOCUMENT', 'MEDIA', 'EMBED'].includes(item.kind) ||
            !['PUBLIC', 'CLUB'].includes(item.visibility)
        )
            return [];
        return [
            {
                id: String(item.id),
                kind: item.kind,
                title: String(item.title || item.fileName || 'Tài nguyên'),
                url,
                mimeType: String(item.mimeType || ''),
                sizeBytes: Number.isSafeInteger(item.sizeBytes) ? item.sizeBytes : null,
                visibility: item.visibility,
            },
        ];
    });
}

export function resourceSize(bytes) {
    return Number.isFinite(bytes)
        ? bytes >= 1024 * 1024
            ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
            : `${Math.ceil(bytes / 1024)} KB`
        : '';
}

export function publicActivityResources(resources) {
    return resources.filter((resource) => resource.visibility === 'PUBLIC');
}
