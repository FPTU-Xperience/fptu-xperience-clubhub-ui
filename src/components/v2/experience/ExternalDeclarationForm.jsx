import { useRef, useState } from 'react';
import ExperienceAttributesForm, { initialAttributes } from './ExperienceAttributesForm';
import PrivateEvidence from './PrivateEvidence';

export default function ExternalDeclarationForm({ api, onSaved }) {
    const [draft, setDraft] = useState({
        title: '',
        organizationSource: '',
        semesterId: '',
        occurredAt: '',
        evidenceDescription: '',
    });
    const [attributes, setAttributes] = useState(initialAttributes),
        [evidence, setEvidence] = useState([]),
        [busy, setBusy] = useState(false),
        [message, setMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const keys = useRef(new Map()),
        lock = useRef(false);
    const submit = async (event) => {
        event.preventDefault();
        if (lock.current || uploading) return;
        lock.current = true;
        setBusy(true);
        setMessage('');
        try {
            const occurredAt = new Date(`${draft.occurredAt}:00+07:00`).toISOString();
            const body = {
                ...draft,
                occurredAt,
                isOutsideClub: true,
                clubId: null,
                category: attributes.pillarWeights[0].pillar,
                startDate: occurredAt.slice(0, 10),
                endDate: occurredAt.slice(0, 10),
                evidenceUrl: '',
                proposedAttributes: attributes,
                evidenceRefs: evidence,
            };
            const fingerprint = JSON.stringify(body);
            if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
            await api.request('/api/v1/declarations', {
                method: 'POST',
                headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                body: JSON.stringify(body),
            });
            setMessage('Đã gửi minh chứng để xác minh. Chưa có điểm được duyệt.');
            onSaved?.();
        } catch (issue) {
            setMessage(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <section className="v2-profile-panel v2-experience-operations">
            <h2>Tự khai trải nghiệm ngoài CLB</h2>
            <p>Khai công sức và minh chứng, không nhập điểm. Điểm và quyền duyệt do máy chủ quyết định.</p>
            <form onSubmit={submit}>
                <fieldset disabled={busy}>
                    {Object.entries({
                        title: 'Tên hoạt động',
                        organizationSource: 'Đơn vị tổ chức',
                        semesterId: 'Mã học kỳ',
                        occurredAt: 'Thời điểm thực hiện (giờ Việt Nam)',
                    }).map(([key, label]) => (
                        <label key={key}>
                            {label}
                            <input
                                required
                                maxLength={key === 'semesterId' ? 40 : 200}
                                type={key === 'occurredAt' ? 'datetime-local' : 'text'}
                                value={draft[key]}
                                onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                            />
                        </label>
                    ))}
                    <label>
                        Mô tả minh chứng
                        <textarea
                            required
                            maxLength={2000}
                            value={draft.evidenceDescription}
                            onChange={(event) =>
                                setDraft((current) => ({ ...current, evidenceDescription: event.target.value }))
                            }
                        />
                    </label>
                    <ExperienceAttributesForm value={attributes} onChange={setAttributes} />
                    <PrivateEvidence api={api} ids={evidence} onChange={setEvidence} onBusyChange={setUploading} />
                    <button className="v2-button" disabled={uploading}>
                        Gửi minh chứng
                    </button>
                </fieldset>
            </form>
            {message && <p role="status">{message}</p>}
        </section>
    );
}
