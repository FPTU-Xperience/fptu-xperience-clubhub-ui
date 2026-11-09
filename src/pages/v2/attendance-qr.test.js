import test from 'node:test';
import assert from 'node:assert/strict';
import { attendanceQrPayload, readAttendanceQr } from '../../services/attendance-qr.js';

test('QR preserves the signed server challenge and binds the selected activity/session', () => {
    const now = Date.now(), challenge = { sessionId: 3, challenge: 'signed-server-value', expiresAt: new Date(now + 30000).toISOString() };
    const text = attendanceQrPayload(9, challenge);
    assert.equal(readAttendanceQr(text, 9, 3, now), challenge.challenge);
    assert.throws(() => readAttendanceQr(text, 10, 3, now), /không thuộc phiên/);
    assert.throws(() => readAttendanceQr(text, 9, 4, now), /không thuộc phiên/);
    assert.throws(() => readAttendanceQr(text, 9, 3, now + 30000), /hết hạn/);
    assert.throws(() => readAttendanceQr('https://attacker.example', 9, 3, now), /không phải mã QR/);
    assert.throws(() => readAttendanceQr('x'.repeat(8193), 9, 3, now));
    assert.throws(() => readAttendanceQr(attendanceQrPayload(9, { ...challenge, challenge: '', expiresAt: 'invalid' }), 9, 3, now), /chưa có mã/);
});
