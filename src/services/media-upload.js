const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function validateImageUpload(file) {
    if (!file || !IMAGE_TYPES.has(file.type) || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
        throw new Error('Ảnh phải là JPG, PNG hoặc WebP và không vượt quá 5 MB.');
    }
}

export function validateUploadIntent(intent, s3Endpoint, bucketName) {
    let uploadUrl;
    let publicUrl;
    let endpoint;
    try {
        uploadUrl = new URL(intent?.uploadUrl);
        publicUrl = new URL(intent?.publicUrl);
        endpoint = new URL(s3Endpoint);
    } catch {
        throw new Error('Máy chủ chưa trả về thông tin tải ảnh hợp lệ.');
    }

    const bucketHost = `${bucketName}.${endpoint.host}`;
    const validBucketPath = (uploadUrl.host === endpoint.host && uploadUrl.pathname.startsWith(`/${bucketName}/`)) ||
        (uploadUrl.host === bucketHost && uploadUrl.pathname !== '/');
    if (
        !bucketName || endpoint.protocol !== 'https:' || uploadUrl.protocol !== 'https:' ||
        !validBucketPath || !uploadUrl.searchParams.has('X-Amz-Signature') ||
        publicUrl.protocol !== 'https:' || [endpoint.host, bucketHost].includes(publicUrl.host) ||
        publicUrl.searchParams.has('X-Amz-Signature') ||
        typeof intent?.key !== 'string' || !intent.key
    ) {
        throw new Error('Máy chủ chưa trả về thông tin tải ảnh hợp lệ.');
    }
    return { uploadUrl: uploadUrl.href, publicUrl: publicUrl.href, key: intent.key };
}

export async function putImageWithIntent(file, intent, config, fetcher = fetch) {
    validateImageUpload(file);
    const { uploadUrl, publicUrl } = validateUploadIntent(intent, config.s3Endpoint, config.bucketName);
    const response = await fetcher(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!response.ok) {
        throw new Error('Không thể tải ảnh lên kho lưu trữ. Vui lòng thử lại.');
    }
    return publicUrl;
}
