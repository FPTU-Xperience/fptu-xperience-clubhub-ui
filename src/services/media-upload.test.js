import assert from 'node:assert/strict';
import test from 'node:test';
import { putImageWithIntent, validateImageUpload, validateUploadIntent } from './media-upload.js';

const config = {
    bucketName: 'fptux-cloud-storage',
    s3Endpoint: 'https://c2e463013aa669515ae4e2c54843c4ae.r2.cloudflarestorage.com',
};
const file = { type: 'image/webp', size: 1024 };
const intent = {
    uploadUrl: `${config.s3Endpoint}/fptux-cloud-storage/club/1/logo.webp?X-Amz-Signature=abc`,
    publicUrl: 'https://images.example.edu/club/1/logo.webp',
    key: 'club/1/logo.webp',
};

test('direct upload sends only the file and signed content type to R2', async () => {
    let request;
    const url = await putImageWithIntent(file, intent, config, async (target, options) => {
        request = { target, options };
        return { ok: true };
    });
    assert.equal(url, intent.publicUrl);
    assert.equal(request.target, intent.uploadUrl);
    assert.deepEqual(request.options.headers, { 'Content-Type': 'image/webp' });
    assert.equal(request.options.body, file);
    assert.equal(request.options.method, 'PUT');
});

test('rejects untrusted upload hosts and S3 API URLs as public image URLs', () => {
    assert.throws(() => validateUploadIntent({ ...intent, uploadUrl: 'https://attacker.example/upload?X-Amz-Signature=abc' }, config.s3Endpoint, config.bucketName));
    assert.throws(() => validateUploadIntent({ ...intent, uploadUrl: `${config.s3Endpoint}/another-bucket/a.webp?X-Amz-Signature=abc` }, config.s3Endpoint, config.bucketName));
    assert.throws(() => validateUploadIntent({ ...intent, publicUrl: `${config.s3Endpoint}/fptux-cloud-storage/club/1/logo.webp` }, config.s3Endpoint, config.bucketName));
});

test('rejects unsupported files and failed R2 writes before returning a URL', async () => {
    assert.throws(() => validateImageUpload({ type: 'image/svg+xml', size: 100 }));
    await assert.rejects(putImageWithIntent(file, intent, config, async () => ({ ok: false })), /Không thể tải ảnh/);
});
