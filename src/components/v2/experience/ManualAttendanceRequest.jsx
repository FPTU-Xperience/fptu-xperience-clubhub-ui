import { useEffect, useRef, useState } from 'react';
import PrivateEvidence from './PrivateEvidence';

export default function ManualAttendanceRequest({ api, activityId, sessionId, onClose }) {
    const [reason, setReason] = useState(''),
        [evidence, setEvidence] = useState([]),
        [result, setResult] = useState(null),
        [message, setMessage] = useState(''),
        [busy, setBusy] = useState(false),
        [attempt, retry] = useState(0);
    const keys = useRef(new Map()),
        lock = useRef(false);
    const [uploading, setUploading] = useState(false);
    useEffect(() => {
        let active = true;
        api.request(`/api/activities/${activityId}/sessions/${sessionId}/manual-attendance-requests?pageSize=100`).then(
            (data) => {
                if (active) setResult(data);
            },
            (error) => {
                if (active) setMessage(error.message);
            },
        );
        return () => {
            active = false;
        };
    }, [api, activityId, sessionId, attempt]);
    return (
        <section className="v2-profile-panel v2-experience-operations">
            <h3>Yêu cầu xác nhận buổi #{sessionId}</h3>
            <button type="button" className="v2-button" onClick={onClose}>
                Đóng
            </button>
            {result?.items?.map((row) => (
                <p key={row.id}>
                    {row.status} · {row.reason} · {row.reviewReason}
                </p>
            ))}
            <form
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (lock.current || uploading) return;
                    lock.current = true;
                    setBusy(true);
                    setMessage('');
                    const body = { reason, evidenceRefs: evidence },
                        fingerprint = JSON.stringify(body);
                    if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
                    try {
                        await api.request(
                            `/api/activities/${activityId}/sessions/${sessionId}/manual-attendance-requests`,
                            {
                                method: 'POST',
                                headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                                body: JSON.stringify(body),
                            },
                        );
                        setMessage('Đã gửi yêu cầu, đang chờ người được phân quyền xác minh.');
                        retry((value) => value + 1);
                    } catch (issue) {
                        setMessage(issue.message);
                    } finally {
                        lock.current = false;
                        setBusy(false);
                    }
                }}
            >
                <fieldset disabled={busy}>
                    <label>
                        Lý do
                        <textarea
                            required
                            maxLength={1000}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                        />
                    </label>
                    <PrivateEvidence api={api} ids={evidence} onChange={setEvidence} onBusyChange={setUploading} />
                    <button className="v2-button" disabled={uploading}>
                        Gửi yêu cầu
                    </button>
                </fieldset>
            </form>
            {message && <p role="status">{message}</p>}
        </section>
    );
}
