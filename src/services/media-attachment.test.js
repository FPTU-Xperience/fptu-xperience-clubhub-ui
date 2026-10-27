import assert from 'node:assert/strict';
import test from 'node:test';
import { confirmedImageAttachment } from './media-attachment.js';

test('all five image flows require the verified attachment response', () => {
    for (const [kind, field] of [
        ['student-avatar', 'avatarUrl'],
        ['student-cover', 'coverImageUrl'],
        ['club-logo', 'logoUrl'],
        ['club-cover', 'coverImageUrl'],
        ['activity-cover', 'coverImageUrl'],
    ]) {
        const uploaded = { [field]: 'https://media.example/staging/upload.png' };
        const saved = { version: 'next-version', [field]: 'https://media.example/verified/saved.png' };
        assert.equal(confirmedImageAttachment(saved, uploaded), saved, kind);
        for (const response of [
            null,
            {},
            { ...saved, version: null },
            { ...saved, [field]: uploaded[field] },
            { ...saved, [field]: undefined },
            { ...saved, [field]: 'http://media.example/saved.png' },
        ]) {
            assert.throws(() => confirmedImageAttachment(response, uploaded));
        }
    }
});

test('explicit image clearing needs a server-confirmed null and preserves omitted fields', () => {
    const saved = { version: 'next-version', logoUrl: null };
    assert.equal(confirmedImageAttachment(saved, { logoUrl: null }), saved);
    assert.throws(() => confirmedImageAttachment({ version: 'next-version' }, { logoUrl: null }));
});
