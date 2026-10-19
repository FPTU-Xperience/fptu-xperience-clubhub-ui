import { useRef, useState } from 'react';

export function evidenceIds(value) {
    try {
        const parsed = Array.isArray(value) ? value : JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
        return [];
    }
}

export default function PrivateEvidence({ api, ids, onChange, onBusyChange, disabled = false }) {
    const [busy, setBusy] = useState(false),
        [error, setError] = useState('');
    const keys = useRef(new WeakMap());
    const upload = async (file) => {
        if (!file || busy || disabled) return;
        setBusy(true);
        onBusyChange?.(true);
        setError('');
        if (!keys.current.has(file)) keys.current.set(file, crypto.randomUUID());
        try {
            const result = await api.uploadPrivateEvidence(file, keys.current.get(file));
            if (!result.evidenceId) throw new Error('Máy chủ chưa xác nhận minh chứng.');
            onChange([...new Set([...ids, result.evidenceId])]);
        } catch (issue) {
            setError(issue.message);
        } finally {
            setBusy(false);
            onBusyChange?.(false);
        }
    };
    return (
        <fieldset disabled={disabled || busy}>
            <legend>Minh chứng riêng tư</legend>
            {onChange && (
                <label>
                    Tải PDF, PNG hoặc JPG (tối đa 10 MB)
                    <input
                        type="file"
                        accept="application/pdf,image/png,image/jpeg"
                        onChange={(event) => upload(event.target.files[0])}
                    />
                </label>
            )}
            {ids.map((id, index) => (
                <div key={id}>
                    <button
                        type="button"
                        className="v2-button"
                        onClick={async () => {
                            try {
                                await api.downloadPrivateEvidence(id);
                            } catch (issue) {
                                setError(issue.message);
                            }
                        }}
                    >
                        Tải minh chứng {index + 1}
                    </button>
                    {onChange && (
                        <button
                            type="button"
                            className="v2-button"
                            onClick={() => onChange(ids.filter((value) => value !== id))}
                        >
                            Bỏ đính kèm
                        </button>
                    )}
                </div>
            ))}
            {busy && <p role="status">Đang tải minh chứng…</p>}
            {error && <p role="alert">{error}</p>}
        </fieldset>
    );
}
