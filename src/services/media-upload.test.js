import assert from 'node:assert/strict';
import test from 'node:test';
import { putImageWithIntent, validateImageUpload, validateUploadIntent } from './media-upload.js';

const config = {
    bucketName: 'fptux-cloud-storage',
    s3Endpoint: 'https://c2e463013aa669515ae4e2c54843c4ae.r2.cloudflarestorage.com',
    publicBaseUrl: 'https://pub-3092f35e8d664b8caf203e269232769a.r2.dev',
};
const file = { type: 'image/webp', size: 1024 };
const intent = {
    uploadUrl: `${config.s3Endpoint}/fptux-cloud-storage/club/1/logo.webp?X-Amz-Signature=abc`,
    publicUrl: `${config.publicBaseUrl}/club/1/logo.webp`,
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
    const validate = (value) => validateUploadIntent(value, config.s3Endpoint, config.bucketName, config.publicBaseUrl);
    assert.throws(() => validate({ ...intent, uploadUrl: 'https://attacker.example/upload?X-Amz-Signature=abc' }));
    assert.throws(() => validate({ ...intent, uploadUrl: `${config.s3Endpoint}/another-bucket/a.webp?X-Amz-Signature=abc` }));
    assert.throws(() => validate({ ...intent, publicUrl: `${config.s3Endpoint}/fptux-cloud-storage/club/1/logo.webp` }));
});

test('only accepts the configured public domain and matching object paths', () => {
    const validate = (value) => validateUploadIntent(value, config.s3Endpoint, config.bucketName, config.publicBaseUrl);
    assert.equal(validate(intent).publicUrl, intent.publicUrl);
    assert.throws(() => validate({ ...intent, publicUrl: 'https://another-bucket.r2.dev/club/1/logo.webp' }));
    assert.throws(() => validate({ ...intent, publicUrl: `${config.publicBaseUrl}/club/2/logo.webp` }));
    assert.throws(() => validate({ ...intent, uploadUrl: `${config.s3Endpoint}/${config.bucketName}/club/2/logo.webp?X-Amz-Signature=abc` }));
    assert.throws(() => validate({ ...intent, key: 'club/../logo.webp' }));
    assert.throws(() => validateUploadIntent(intent, config.s3Endpoint, config.bucketName, ''));
});

test('accepts virtual-hosted R2 upload URLs and trailing slash on the public base URL', () => {
    const uploadUrl = `https://${config.bucketName}.${new URL(config.s3Endpoint).host}/club/1/logo.webp?X-Amz-Signature=abc`;
    assert.equal(validateUploadIntent({ ...intent, uploadUrl }, config.s3Endpoint, config.bucketName, `${config.publicBaseUrl}/`).uploadUrl, uploadUrl);
});

test('rejects unsupported files and failed R2 writes before returning a URL', async () => {
    assert.throws(() => validateImageUpload({ type: 'image/svg+xml', size: 100 }));
    await assert.rejects(putImageWithIntent(file, intent, config, async () => ({ ok: false })), /Không thể tải ảnh/);
});
