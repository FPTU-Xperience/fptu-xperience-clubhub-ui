import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import ExperienceAttributesForm, { initialAttributes } from './ExperienceAttributesForm';
import PrivateEvidence, { evidenceIds } from './PrivateEvidence';

export default function ContributionDetails({ api, id, reviewer = false, onClose, onChanged }) {
    const { user } = useAuth();
    const [detail, setDetail] = useState(null),
        [error, setError] = useState(''),
        [attempt, retry] = useState(0);
    const [attributes, setAttributes] = useState(initialAttributes),
        [evidence, setEvidence] = useState([]),
        [message, setMessage] = useState('');
    const [reason, setReason] = useState(''),
        [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const keys = useRef(new Map()),
        lock = useRef(false),
        active = useRef(true);
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);
    useEffect(() => {
        let current = true;
        setDetail(null);
        setError('');
        api.request(`/api/contributions/${encodeURIComponent(id)}`).then(
            (data) => {
                if (!current) return;
                setDetail(data);
                setAttributes(data.contribution.verifiedAttributes || data.contribution.proposedAttributes);
                setEvidence(data.contribution.evidenceRefs || []);
                setMessage(data.contribution.message || '');
            },
            (issue) => {
                if (current) setError(issue.message);
            },
        );
        return () => {
            current = false;
        };
    }, [api, id, attempt]);
    const row = detail?.contribution,
        own = row && String(row.userId) === String(user?.id);
    const run = async (suffix, body, method = 'POST') => {
        if (lock.current || uploading) return;
        lock.current = true;
        setBusy(true);
        setError('');
        const fingerprint = `${id}:${suffix}:${JSON.stringify(body)}`;
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        try {
            await api.request(`/api/contributions/${encodeURIComponent(id)}${suffix}`, {
                method,
                headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                body: JSON.stringify(body),
            });
            if (!active.current) return;
            retry((value) => value + 1);
            setReason('');
            onChanged?.();
        } catch (issue) {
            if (active.current) setError(issue.message);
        } finally {
            lock.current = false;
            if (active.current) setBusy(false);
        }
    };
    return (
        <section className="v2-profile-panel v2-experience-operations" aria-label="Chi tiết đóng góp">
            <button type="button" className="v2-button" onClick={onClose}>
                Đóng chi tiết
            </button>
            {!row && !error && <p role="status">Đang tải…</p>}
            {error && (
                <p role="alert">
                    {error}{' '}
                    <button type="button" onClick={() => retry((value) => value + 1)}>
                        Tải lại
                    </button>
                </p>
            )}
            {row && (
                <>
                    <h3>{row.title}</h3>
                    <p>
                        {row.status} · {row.semesterId} · {row.rawPoints} điểm thô
                    </p>
                    {detail.calculationBreakdown && (
                        <dl>
                            {Object.entries({
                                tierBase: 'Điểm nền',
                                roleMultiplier: 'Hệ số vai trò',
                                scaleMultiplier: 'Hệ số quy mô',
                                cappedRoleScale: 'Hệ số sau giới hạn',
                                resultBonus: 'Thưởng kết quả',
                                rawPoints: 'Điểm thô',
                            }).map(([key, label]) => (
                                <div key={key}>
                                    <dt>{label}</dt>
                                    <dd>{detail.calculationBreakdown[key]}</dd>
                                </div>
                            ))}
                        </dl>
                    )}
                    <fieldset disabled={busy || uploading}>
                        <ExperienceAttributesForm
                            value={attributes}
                            onChange={setAttributes}
                            lockedBlueprint={row.sourceType === 'CLUB'}
                        />
                        <PrivateEvidence
                            api={api}
                            ids={evidence}
                            onChange={own ? setEvidence : undefined}
                            onBusyChange={setUploading}
                        />
                        <label>
                            Mô tả đóng góp
                            <textarea
                                maxLength={2000}
                                value={message}
                                readOnly={!own}
                                onChange={(event) => setMessage(event.target.value)}
                            />
                        </label>
                        <label>
                            Lý do / nhận xét
                            <input
                                value={reason}
                                maxLength={1000}
                                onChange={(event) => setReason(event.target.value)}
                            />
                        </label>
                        {own && ['SUBMITTED', 'REVISION_REQUESTED'].includes(row.status) && (
                            <button
                                type="button"
                                className="v2-button"
                                onClick={() =>
                                    run(
                                        '',
                                        {
                                            expectedVersion: row.version,
                                            proposedAttributes: attributes,
                                            message,
                                            evidenceRefs: evidence,
                                        },
                                        'PATCH',
                                    )
                                }
                            >
                                Lưu và gửi lại
                            </button>
                        )}
                        {own && row.status === 'APPROVED' && (
                            <button
                                type="button"
                                className="v2-button"
                                disabled={!reason.trim()}
                                onClick={() =>
                                    run('/role-upgrade-requests', {
                                        expectedVersion: row.version,
                                        proposedRole: attributes.role,
                                        proposedResult: attributes.result,
                                        evidenceRefs: evidence,
                                        reason,
                                    })
                                }
                            >
                                Yêu cầu nâng vai trò / kết quả
                            </button>
                        )}
                        {reviewer &&
                            !own &&
                            row.status === 'SUBMITTED' &&
                            ['APPROVE', 'REJECT', 'REQUEST_REVISION'].map((decision) => (
                                <button
                                    key={decision}
                                    type="button"
                                    className="v2-button"
                                    disabled={!reason.trim()}
                                    onClick={() =>
                                        run('/reviews', {
                                            expectedVersion: row.version,
                                            decision,
                                            reason,
                                            ...(decision === 'APPROVE' ? { verifiedAttributes: attributes } : {}),
                                        })
                                    }
                                >
                                    {
                                        {
                                            APPROVE: 'Duyệt đóng góp',
                                            REJECT: 'Từ chối',
                                            REQUEST_REVISION: 'Yêu cầu bổ sung',
                                        }[decision]
                                    }
                                </button>
                            ))}
                        {reviewer &&
                            !own &&
                            row.status === 'APPROVED' &&
                            ['CORRECT', 'REVOKE'].map((kind) => (
                                <button
                                    key={kind}
                                    type="button"
                                    className="v2-button"
                                    disabled={!reason.trim()}
                                    onClick={() =>
                                        run('/adjustments', {
                                            expectedVersion: row.version,
                                            kind,
                                            reason,
                                            ...(kind === 'CORRECT' ? { correctedAttributes: attributes } : {}),
                                        })
                                    }
                                >
                                    {kind === 'CORRECT' ? 'Ghi điều chỉnh' : 'Thu hồi bằng bút toán đảo'}
                                </button>
                            ))}
                        {reviewer &&
                            !own &&
                            detail.roleUpgradeRequests
                                ?.filter((upgrade) => upgrade.status === 'SUBMITTED')
                                .map((upgrade) => (
                                    <div key={upgrade.id}>
                                        <p>
                                            Đề nghị: {upgrade.proposedRole} · {upgrade.proposedResult} ·{' '}
                                            {upgrade.reason}
                                        </p>
                                        <PrivateEvidence api={api} ids={evidenceIds(upgrade.evidenceRefsJson)} />
                                        {['APPROVE', 'REJECT', 'REQUEST_REVISION'].map((decision) => (
                                            <button
                                                type="button"
                                                className="v2-button"
                                                key={decision}
                                                disabled={!reason.trim()}
                                                onClick={() =>
                                                    run(`/role-upgrade-requests/${upgrade.id}/reviews`, {
                                                        expectedVersion: upgrade.version,
                                                        decision,
                                                        reason,
                                                    })
                                                }
                                            >
                                                {decision}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                    </fieldset>
                    <h4>Lịch sử quyết định</h4>
                    {detail.decisions?.map((decision) => (
                        <p key={decision.id}>
                            {decision.decision} · {decision.reason} · {decision.createdAtUtc}
                        </p>
                    ))}
                    <h4>Biến động điểm</h4>
                    {detail.ledgerEffects?.map((effect) => (
                        <article key={effect.id}>
                            <p>
                                {effect.effectType}: {effect.deltaAmount} · {effect.reason}
                            </p>
                            <small>
                                Chính sách {effect.policyVersion} · {effect.formulaVersion} · {effect.recordedAt}
                            </small>
                            <dl>
                                {Object.entries(effect.allocatedDelta || {}).map(([pillar, amount]) => (
                                    <div key={pillar}>
                                        <dt>{pillar}</dt>
                                        <dd>{amount}</dd>
                                    </div>
                                ))}
                            </dl>
                        </article>
                    ))}
                </>
            )}
        </section>
    );
}

