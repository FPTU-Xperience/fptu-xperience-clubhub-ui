import assert from 'node:assert/strict';
import test from 'node:test';
import { campusLabel, inferStudentFromEmail, inferStudentYear } from './profile-options.js';

test('FPT student email uses the last eight characters as student code', () => {
    assert.deepEqual(inferStudentFromEmail('CuongNKCE161131@fpt.edu.vn'), { studentCode: 'CE161131', campus: 'FPTU Cần Thơ', year: 'K16' });
    assert.deepEqual(inferStudentFromEmail('  cuongnkce161131@FPT.EDU.VN  '), { studentCode: 'CE161131', campus: 'FPTU Cần Thơ', year: 'K16' });
});

test('student code campus prefixes match the supplied campus mapping', () => {
    for (const [prefix, campus] of [['C', 'FPTU Cần Thơ'], ['S', 'FPTU Hồ Chí Minh'], ['H', 'FPTU Hà Nội'], ['D', 'FPTU Đà Nẵng']]) {
        assert.equal(inferStudentFromEmail(`Student${prefix}E123456@fpt.edu.vn`).campus, campus);
    }
});

test('FQN student codes identify Quy Nhon and preserve the entire prefix', () => {
    assert.deepEqual(inferStudentFromEmail('CuongNKFQN16113@fpt.edu.vn'), { studentCode: 'FQN16113', campus: 'FPTU Quy Nhơn', year: '' });
    assert.deepEqual(inferStudentFromEmail('cuongnkfqn161131@fpt.edu.vn'), { studentCode: 'FQN161131', campus: 'FPTU Quy Nhơn', year: 'K16' });
});

test('other domains and email names without a student code do not autofill', () => {
    for (const email of [null, '', 'CuongNKCE161131@gmail.com', 'CuongNKCE161131@fpt.edu.vn.evil.test', 'teacher@fpt.edu.vn', 'NameCE1234567@fpt.edu.vn', 'fqn.student@fpt.edu.vn']) {
        assert.deepEqual(inferStudentFromEmail(email), { studentCode: '', campus: '', year: '' });
    }
});

test('cohort uses the first two of six numeric student-code characters', () => {
    assert.equal(inferStudentYear('CE161131'), 'K16');
    assert.equal(inferStudentYear('SE201234'), 'K20');
    assert.equal(inferStudentYear('he191234'), 'K19');
    assert.equal(inferStudentYear('DE181234'), 'K18');
    assert.equal(inferStudentYear('FQN211234'), 'K21');
    assert.equal(inferStudentYear('CE091234'), 'K09');
    for (const code of ['', null, 'CE16113', 'CE1611317', 'invalid']) assert.equal(inferStudentYear(code), '');
});

test('campus labels use only the nicknames supplied by the user', () => {
    assert.equal(campusLabel('FPTU Cần Thơ'), 'FPTU Cần Thơ · Hovilo');
    assert.equal(campusLabel('FPTU Hồ Chí Minh'), 'FPTU Hồ Chí Minh · Xavalo');
    assert.equal(campusLabel('FPTU Hà Nội'), 'FPTU Hà Nội · Hola');
    assert.equal(campusLabel('FPTU Quy Nhơn'), 'FPTU Quy Nhơn · Cahata');
    assert.equal(campusLabel('FPTU Đà Nẵng'), 'FPTU Đà Nẵng · Fuda');
});
