import assert from 'node:assert/strict';
import test from 'node:test';
import { mapActivityResources, publicActivityResources, safeResourceUrl, validateActivityFile, youtubeEmbedUrl } from '../../components/v2/activity-detail/activity-resources-data.js';
import { saveActivityResource } from '../../services/activity-resources.js';

test('document selection accepts requested formats and rejects disguised, macro, empty and oversized files', () => {
    for (const name of ['a.pdf', 'a.doc', 'a.docx', 'a.xls', 'a.xlsx']) assert.equal(validateActivityFile({ name, type: '', size: 10 }, 'DOCUMENT').kind, 'DOCUMENT');
    assert.throws(() => validateActivityFile({ name: 'a.pdf', type: 'text/html', size: 10 }, 'DOCUMENT'));
    for (const name of ['a.xlsm', 'a.docm', 'a.exe', 'a.svg']) assert.throws(() => validateActivityFile({ name, type: '', size: 10 }, 'DOCUMENT'));
    assert.throws(() => validateActivityFile({ name: 'a.pdf', type: '', size: 21 * 1024 * 1024 }, 'DOCUMENT'));
    assert.throws(() => validateActivityFile({ name: 'a.pdf', type: '', size: 0 }, 'DOCUMENT'));
    assert.throws(() => validateActivityFile({ name: 'a.png', type: 'image/png', size: 6 * 1024 * 1024 }, 'MEDIA'));
});

test('resource projection excludes unknown visibility, private actor fields and unsafe links', () => {
    const raw = [
        { id: 1, kind: 'DOCUMENT', title: 'Public PDF', visibility: 'PUBLIC', url: 'https://cdn.example.edu/a.pdf', actorEmail: 'private@example.edu' },
        { id: 2, kind: 'DOCUMENT', title: 'Club PDF', visibility: 'CLUB', url: 'https://cdn.example.edu/b.pdf' },
        { id: 3, kind: 'EMBED', visibility: 'PUBLIC', url: 'javascript:alert(1)' },
        { id: 4, kind: 'DOCUMENT', url: 'https://cdn.example.edu/c.pdf' },
    ];
    const mapped = mapActivityResources(raw);
    assert.equal(mapped.length, 2);
    assert.equal('actorEmail' in mapped[0], false);
    assert.deepEqual(publicActivityResources(mapped).map(row => row.id), ['1']);
    assert.equal(mapped.length, 2);
});

test('embedded video links only produce controlled YouTube iframe URLs', () => {
    assert.equal(youtubeEmbedUrl('https://youtu.be/M7lc1UVf-VE'), 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE');
    assert.equal(youtubeEmbedUrl('https://www.youtube.com/watch?v=M7lc1UVf-VE'), 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE');
    for (const value of ['https://youtube.com.evil.test/watch?v=M7lc1UVf-VE', 'https://evil.test/a', 'javascript:alert(1)']) assert.equal(youtubeEmbedUrl(value), '');
    for (const value of ['http://example.com', 'https://user:pass@example.com', 'https://127.0.0.1', 'https://172.16.0.1']) assert.equal(safeResourceUrl(value), '');
});

test('provisional upload refuses an unexpected signed destination before sending file bytes or committing', async () => {
    const requests = [];
    const api = { request: async (path) => { requests.push(path); return { id: 'intent', mimeType: 'application/pdf', uploadUrl: 'https://evil.test/file?X-Amz-Signature=foo' }; } };
    await assert.rejects(saveActivityResource(api, 1, { id: 'draft', kind: 'DOCUMENT', file: { name: 'a.pdf', type: 'application/pdf', size: 10 } }), /địa chỉ/);
    assert.deepEqual(requests, ['/api/activities/1/resources/upload-intents']);
});

test('a resource is not reported saved without a server acknowledgement', async () => {
    await assert.rejects(saveActivityResource({ request: async () => ({}) }, 1, { id: 'draft', kind: 'EMBED', title: 'Link', url: 'https://example.edu/video', visibility: 'PUBLIC' }), /chưa xác nhận/);
});
