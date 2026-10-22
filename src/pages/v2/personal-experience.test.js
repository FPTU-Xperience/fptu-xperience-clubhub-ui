import test from 'node:test';
import assert from 'node:assert/strict';
import {
    blankExperience,
    createPersonalExperienceClient,
    experiencePage,
    experiencePayload,
    validateEvidenceFile,
    validateExperience,
} from './personal-experience/personal-experience-data.js';
const id = '12345678-1234-1234-1234-123456789abc';
const form = () => ({
    ...blankExperience('FALL2026'),
    title: 'Đạt giải thi đấu bên ngoài',
    organizationSource: 'Ban tổ chức cuộc thi',
    occurredDate: '2026-10-15',
    description: 'Giấy chứng nhận có tên và kết quả thi đấu.',
});
const files = () => [{ file: { name: 'certificate.pdf', type: 'application/pdf', size: 512 } }];

test('personal experience requires real evidence, valid dates and a canonical external declaration payload', () => {
    const draft = form();
    validateExperience(draft, files());
    for (const patch of [
        { title: '' },
        { organizationSource: '' },
        { semesterId: '' },
        { occurredDate: '2099-01-01' },
        { occurredDate: '2026-02-30' },
        { category: 'FAKE' },
        { description: '' },
    ])
        assert.throws(() => validateExperience({ ...draft, ...patch }, files()));
    assert.throws(() => validateExperience(draft, []));
    assert.throws(() => validateEvidenceFile({ name: 'fake.pdf', type: 'image/png', size: 200 }));
    assert.throws(() => validateEvidenceFile({ name: 'huge.pdf', type: 'application/pdf', size: 11 * 1024 * 1024 }));
    const body = experiencePayload(draft, [id]);
    assert.equal(body.isOutsideClub, true);
    assert.equal(body.clubId, null);
    assert.equal(body.semesterId, 'FALL2026');
    assert.equal(body.occurredAt, '2026-10-15T00:00:00+07:00');
    assert.deepEqual(body.proposedAttributes.pillarWeights, [{ pillar: 'Academic', weight: 1 }]);
    assert.equal('rawPoints' in body, false);
    assert.equal(body.evidenceUrl, '');
    assert.throws(() => experiencePayload(draft, []));
    assert.throws(() => experiencePayload(draft, [id, id]));
});
test('club reference never silently becomes a direct submission or unrelated club contribution', () => {
    const draft = { ...form(), referenceMode: 'CLUB', referenceClubId: '7' };
    assert.throws(() => validateExperience(draft, files()), /CLB/);
    assert.throws(() => experiencePayload(draft, [id]), /CLB/);
});
test('personal report rejects cross-account records, malformed pages and fabricated approved totals', () => {
    const row = { id, userId: 1, status: 'SUBMITTED', title: 'Trải nghiệm' };
    assert.equal(experiencePage({ items: [row], total: 1, totalPages: 1 }, 1).items.length, 1);
    assert.throws(() => experiencePage({ items: [{ ...row, userId: 2 }], total: 1, totalPages: 1 }, 1));
    assert.throws(() => experiencePage({ items: [{ ...row, status: 'APPROVED' }], total: 1, totalPages: 1 }, 1));
    assert.throws(() => experiencePage({ items: [row, row], total: 2, totalPages: 1 }, 1));
    assert.equal(experiencePage({ items: [], total: 0, totalPages: 0 }, 1).totalPages, 1);
});
test('personal client uses declared own-source routes and stable submit receipts; server failures remain failures', async () => {
    const calls = [];
    const client = createPersonalExperienceClient(
        {
            request: async (path, options) => {
                calls.push({ path, options });
                if (path.includes('?')) return { items: [], total: 0, totalPages: 0 };
                if (options) return { id, userId: 1, status: 'SUBMITTED' };
                return { contribution: { id, userId: 1 } };
            },
        },
        1,
    );
    await client.list({ semesterId: 'FALL2026', page: 2, pageSize: 20 });
    assert.equal(calls[0].path, '/api/users/me/contributions?semesterId=FALL2026&page=2&pageSize=20');
    await client.detail({ id });
    assert.equal(calls[1].path, `/api/contributions/${id}`);
    await client.submit(experiencePayload(form(), [id]), 'stable-key');
    assert.equal(calls[2].options.headers['Idempotency-Key'], 'stable-key');
    assert.equal(calls[2].path, '/api/v1/declarations/');
    const bad = createPersonalExperienceClient({ request: async () => ({ id, userId: 2, status: 'SUBMITTED' }) }, 1);
    await assert.rejects(() => bad.submit({}, 'same-key'));
    await assert.rejects(() => bad.detail({ id }));
    await assert.rejects(
        () =>
            createPersonalExperienceClient(
                {
                    request: async () => {
                        throw Error('API unavailable');
                    },
                },
                1,
            ).list({}),
        /unavailable/,
    );
    await assert.rejects(() => createPersonalExperienceClient({ request: async () => null }, 1).summary(), /hợp lệ/);
});
