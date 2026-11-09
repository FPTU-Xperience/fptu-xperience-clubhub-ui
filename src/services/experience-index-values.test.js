import test from 'node:test';
import assert from 'node:assert/strict';
import { experienceIndexValues } from './experience-index-values.js';

const response = { studentId: 2008, isAuthoritative: true, eri: 94.56, d: 77.49, j: 0.9923, m: 1.225, rawPoints: 11194.4 };
test('profile displays server ERI separately from accumulated raw points', () => {
    assert.deepEqual(experienceIndexValues(response, '2008'), { eri: 94.56, d: 77.49, j: 0.9923, m: 1.225 });
});
test('preview, another student and incomplete responses do not supply a private index', () => {
    assert.equal(experienceIndexValues(response, 2009), null);
    assert.equal(experienceIndexValues({ ...response, isAuthoritative: false }, 2008), null);
    assert.equal(experienceIndexValues({ studentId: 2008, isAuthoritative: true, rawPoints: 11194.4 }, 2008), null);
    assert.equal(experienceIndexValues(undefined, undefined), null);
});
test('index accepts the documented limits and rejects invalid units', () => {
    assert.deepEqual(experienceIndexValues({ ...response, eri: 0, d: 0, j: 0, m: 1 }, 2008), { eri: 0, d: 0, j: 0, m: 1 });
    assert.deepEqual(experienceIndexValues({ ...response, eri: 130, d: 100, j: 1, m: 1.3 }, 2008), { eri: 130, d: 100, j: 1, m: 1.3 });
    for (const invalid of [{ eri: 131 }, { d: -1 }, { j: 99 }, { m: 1.4 }, { eri: NaN }, { d: Infinity }])
        assert.equal(experienceIndexValues({ ...response, ...invalid }, 2008), null);
});
