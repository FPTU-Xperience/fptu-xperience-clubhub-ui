import { useEffect, useRef, useState } from 'react';
import { attendanceQrPayload, readAttendanceQr } from '../../../services/attendance-qr';

export function AttendanceQrDisplay({ activityId, challenge }) {
    const [image, setImage] = useState(null);
    const payload = attendanceQrPayload(activityId, challenge);
    useEffect(() => {
        let active = true;
        setImage(null);
        import('qrcode').then(({ default: qr }) => qr.toDataURL(payload, { width: 360, margin: 4, errorCorrectionLevel: 'M' }))
            .then((url) => { if (active) setImage({ payload, url }); })
            .catch(() => { if (active) setImage({ payload, error: true }); });
        return () => { active = false; };
    }, [payload]);
    return image?.payload === payload && image.url
        ? <img className="v2-attendance-qr" src={image.url} alt={`Mã QR điểm danh phiên ${challenge.sessionId}`} />
        : <p role="status">{image?.error ? 'Không tạo được ảnh QR. Dùng mã xác thực bên dưới.' : 'Đang tạo mã QR…'}</p>;
}

export function AttendanceQrInput({ activityId, sessionId, onCode }) {
    const [scanning, setScanning] = useState(false), [busy, setBusy] = useState(false),
        [error, setError] = useState(''), [notice, setNotice] = useState('');
    const video = useRef(null), generation = useRef(0), fileLock = useRef(false), fileUrl = useRef(null);
    useEffect(() => () => { generation.current++; if (fileUrl.current) URL.revokeObjectURL(fileUrl.current); }, [activityId, sessionId]);
    const receive = (text) => {
        const code = readAttendanceQr(text, activityId, sessionId);
        onCode(code);
        setNotice('Đã đọc mã QR. Kiểm tra phiên, lấy vị trí nếu cần và bấm Xác nhận điểm danh.');
        setError('');
    };
    useEffect(() => {
        if (!scanning) return;
        let active = true, stream, controls, accepted = false;
        const stop = () => {
            controls?.stop();
            stream?.getTracks().forEach((track) => track.stop());
        };
        (async () => {
            const { BrowserQRCodeReader } = await import('@zxing/browser');
            if (!active) return;
            if (!navigator.mediaDevices?.getUserMedia) throw new Error('CAMERA_UNAVAILABLE');
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
            if (!active) { stop(); return; }
            controls = await new BrowserQRCodeReader().decodeFromStream(stream, video.current, (result) => {
                if (!active || !result || accepted) return;
                accepted = true;
                try { receive(result.getText()); } catch (issue) { setError(issue.message); }
                setScanning(false);
            });
            if (!active) stop();
        })().catch((issue) => {
            if (!active) return;
            setError(issue.name === 'NotAllowedError'
                ? 'Chưa được cấp quyền camera. Bạn có thể chọn ảnh QR hoặc nhập mã xác thực.'
                : 'Không mở được camera. Bạn có thể chọn ảnh QR hoặc nhập mã xác thực.');
            setScanning(false);
        });
        return () => { active = false; stop(); };
    }, [scanning, activityId, sessionId]);
    const readFile = async (file) => {
        if (!file || fileLock.current) return;
        setScanning(false);
        setError(''); setNotice('');
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
            setError('Chọn ảnh QR tối đa 10 MB.'); return;
        }
        fileLock.current = true; setBusy(true);
        const ticket = generation.current, url = URL.createObjectURL(file);
        fileUrl.current = url;
        try {
            const { BrowserQRCodeReader } = await import('@zxing/browser');
            if (generation.current !== ticket) return;
            const result = await new BrowserQRCodeReader().decodeFromImageUrl(url);
            if (generation.current !== ticket) return;
            receive(result.getText());
        } catch (issue) {
            if (generation.current === ticket)
                setError(issue.name === 'NotFoundException' ? 'Không tìm thấy QR trong ảnh. Chọn ảnh rõ hơn hoặc nhập mã.' : issue.message);
        } finally {
            URL.revokeObjectURL(url);
            if (fileUrl.current === url) fileUrl.current = null;
            if (generation.current === ticket) { fileLock.current = false; setBusy(false); }
        }
    };
    return <div className="v2-attendance-scanner">
        <button className="v2-button" type="button" disabled={busy} onClick={() => { setError(''); setNotice(''); setScanning((value) => !value); }}>
            {scanning ? 'Dừng camera' : 'Quét mã QR bằng camera'}
        </button>
        {scanning && <video ref={video} autoPlay muted playsInline aria-label="Camera quét QR điểm danh" />}
        <label>Hoặc chọn ảnh QR
            <input type="file" aria-label="Ảnh QR điểm danh" accept="image/*" disabled={busy || scanning}
                onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; readFile(file); }} />
        </label>
        <p>QR được đọc trên thiết bị, không tải ảnh lên máy chủ. Quét mã chưa gửi điểm danh.</p>
        {busy && <p role="status">Đang đọc ảnh QR…</p>}
        {notice && <p role="status">{notice}</p>}
        {error && <p role="alert">{error}</p>}
    </div>;
}
