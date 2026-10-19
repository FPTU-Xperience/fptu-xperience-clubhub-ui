import { useRef, useState } from 'react';
import ExperienceAttributesForm from './ExperienceAttributesForm';
import PrivateEvidence from './PrivateEvidence';

export default function ClubContributionSubmission({ api, session }) {
    const [attributes, setAttributes] = useState(() => structuredClone(session.scoringSnapshot.attributes));
    const [message, setMessage] = useState(''),
        [evidence, setEvidence] = useState([]),
        [busy, setBusy] = useState(false),
        [uploading, setUploading] = useState(false),
        [notice, setNotice] = useState('');
    const keys = useRef(new Map()),
        lock = useRef(false);
    return (
        <details>
            <summary>Gửi đóng góp của tôi trong buổi này</summary>
            <p>
                Mỗi buổi có một nguồn đóng góp. Nếu đã có bản ghi, mở lịch sử cá nhân để bổ sung hoặc đề nghị nâng vai
                trò.
            </p>
            <form
                onSubmit={async (event) => {
                    event.preventDefault();
                    if (lock.current || uploading) return;
                    lock.current = true;
                    setBusy(true);
                    setNotice('');
                    const body = {
                        sessionId: session.id,
                        contributionKind: 'WORK',
                        proposedAttributes: attributes,
                        message,
                        evidenceRefs: evidence,
                        expectedActivityVersion: session.scoringSnapshot.activityVersion,
                    };
                    const fingerprint = JSON.stringify(body);
                    if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
                    try {
                        await api.request(`/api/activities/${session.activityId}/contributions`, {
                            method: 'POST',
                            headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                            body: JSON.stringify(body),
                        });
                        setNotice('Đã gửi đóng góp, đang chờ xác minh.');
                    } catch (issue) {
                        setNotice(issue.message);
                    } finally {
                        lock.current = false;
                        setBusy(false);
                    }
                }}
            >
                <fieldset disabled={busy}>
                    <ExperienceAttributesForm value={attributes} onChange={setAttributes} lockedBlueprint />
                    <label>
                        Mô tả công việc
                        <textarea
                            maxLength={2000}
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                        />
                    </label>
                    <PrivateEvidence api={api} ids={evidence} onChange={setEvidence} onBusyChange={setUploading} />
                    <button className="v2-button" disabled={uploading}>
                        Gửi đóng góp
                    </button>
                </fieldset>
            </form>
            {notice && <p role="status">{notice}</p>}
        </details>
    );
}
