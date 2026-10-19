import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';

const targets = {
    targetActivityCount: 'Số hoạt động',
    targetSessionCount: 'Số buổi',
    targetUniqueParticipantCount: 'Số người tham gia',
};
const empty = { title: '', targetActivityCount: 0, targetSessionCount: 0, targetUniqueParticipantCount: 0 };

export default function ClubExperiencePanel({ clubId, semester, readOnly }) {
    const { api, user } = useAuth();
    const [period, setPeriod] = useState(semester?.code || semester?.id || '');
    const [draft, setDraft] = useState(empty);
    const [result, setResult] = useState(null);
    const [attempt, retry] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [report, setReport] = useState(null);
    const keys = useRef(new Map());
    const lock = useRef(false);
    const identity = `${user?.id}:${clubId}:${period}:${attempt}`;
    const activeIdentity = useRef(identity);
    activeIdentity.current = identity;
    useEffect(() => {
        setPeriod(semester?.code || semester?.id || '');
    }, [semester?.code, semester?.id]);
    useEffect(() => {
        let active = true;
        setResult(null);
        setReport(null);
        setError('');
        setDraft(empty);
        if (!period) return undefined;
        Promise.allSettled([
            api.request(`/api/clubs/${clubId}/semester-plans/${encodeURIComponent(period)}`),
            api.request(`/api/clubs/${clubId}/experience-statistics?${new URLSearchParams({ semesterId: period })}`),
        ]).then(([plan, statistics]) => {
            if (!active) return;
            setResult({
                identity,
                plan: plan.value,
                statistics: statistics.value,
                planMissing: plan.reason?.status === 404,
                error: statistics.reason || (plan.reason?.status !== 404 ? plan.reason : null),
            });
            if (plan.value) setDraft(plan.value);
        });
        return () => {
            active = false;
        };
    }, [api, identity]);
    const mutate = async (operation) => {
        if (lock.current || readOnly) return;
        lock.current = true;
        setBusy(true);
        setError('');
        const currentIdentity = identity;
        const body =
            operation === 'plan'
                ? {
                      title: draft.title,
                      ...Object.fromEntries(Object.keys(targets).map((key) => [key, Number(draft[key])])),
                      ...(result.plan?.version ? { expectedVersion: result.plan.version } : {}),
                  }
                : {
                      semesterId: period,
                      expectedPlanVersion: result.statistics.planVersion,
                      expectedLedgerRevision: result.statistics.ledgerRevision,
                  };
        const fingerprint = `${operation}:${identity}:${JSON.stringify(body)}`;
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        try {
            const response = await api.request(
                `/api/clubs/${clubId}/${operation === 'plan' ? `semester-plans/${encodeURIComponent(period)}` : 'experience-reports'}`,
                {
                    method: operation === 'plan' ? 'PUT' : 'POST',
                    headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                    body: JSON.stringify(body),
                },
            );
            if (activeIdentity.current !== currentIdentity) return;
            if (operation === 'plan') retry((value) => value + 1);
            else setReport(response);
        } catch (issue) {
            if (activeIdentity.current === currentIdentity) setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    const statistics = result?.identity === identity ? result.statistics : null;
    return (
        <section className="v2-profile-panel v2-experience-operations" aria-label="Kế hoạch và báo cáo trải nghiệm">
            <h2>Kế hoạch & trải nghiệm CLB</h2>
            <label>
                Học kỳ
                <input value={period} maxLength={40} onChange={(event) => setPeriod(event.target.value.trim())} />
            </label>
            {!period ? (
                <p>Nhập mã học kỳ để xem kế hoạch và thống kê.</p>
            ) : !result ? (
                <p role="status">Đang tải…</p>
            ) : (
                <>
                    {result.error && <p role="alert">{result.error.message}</p>}
                    <button
                        type="button"
                        className="v2-button"
                        disabled={busy}
                        onClick={() => retry((value) => value + 1)}
                    >
                        Tải lại
                    </button>
                    {statistics && (
                        <>
                            <p>
                                {statistics.activityCount} hoạt động · {statistics.sessionCount} buổi hoàn thành ·{' '}
                                {statistics.uniqueParticipantCount} người đã xác minh
                            </p>
                            <dl>
                                {Object.entries(statistics.netPointsByPillar || {}).map(([pillar, points]) => (
                                    <div key={pillar}>
                                        <dt>{pillar}</dt>
                                        <dd>{points} điểm thô</dd>
                                    </div>
                                ))}
                            </dl>
                            <p>
                                Sổ điểm {statistics.ledgerBasis} · {statistics.semesterId}
                            </p>
                            {!readOnly && (
                                <button
                                    className="v2-button"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => mutate('report')}
                                >
                                    Tạo báo cáo PDF
                                </button>
                            )}
                        </>
                    )}
                    {(result.plan || result.planMissing) && (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                mutate('plan');
                            }}
                        >
                            <fieldset disabled={busy || readOnly}>
                                <legend>{result.plan ? 'Cập nhật kế hoạch học kỳ' : 'Tạo kế hoạch học kỳ'}</legend>
                                <label>
                                    Tên kế hoạch
                                    <input
                                        required
                                        maxLength={200}
                                        value={draft.title}
                                        onChange={(event) =>
                                            setDraft((current) => ({ ...current, title: event.target.value }))
                                        }
                                    />
                                </label>
                                {Object.entries(targets).map(([key, label]) => (
                                    <label key={key}>
                                        {label}
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            required
                                            value={draft[key]}
                                            onChange={(event) =>
                                                setDraft((current) => ({ ...current, [key]: event.target.value }))
                                            }
                                        />
                                    </label>
                                ))}
                                {!readOnly && <button className="v2-button">Lưu kế hoạch</button>}
                            </fieldset>
                        </form>
                    )}
                </>
            )}
            {report && (
                <div>
                    <p>Báo cáo: {report.status}</p>
                    <button
                        type="button"
                        className="v2-button"
                        onClick={async () => {
                            try {
                                const updated = await api.request(
                                    `/api/club-experience-reports/${encodeURIComponent(report.reportId)}`,
                                );
                                if (activeIdentity.current === identity) setReport(updated);
                            } catch (issue) {
                                if (activeIdentity.current === identity) setError(issue.message);
                            }
                        }}
                    >
                        Cập nhật trạng thái PDF
                    </button>
                    {report.status === 'Completed' && (
                        <button
                            type="button"
                            className="v2-button"
                            onClick={async () => {
                                try {
                                    await api.downloadClubExperienceReport(report.reportId);
                                } catch (issue) {
                                    setError(issue.message);
                                }
                            }}
                        >
                            Tải PDF
                        </button>
                    )}
                </div>
            )}
            {error && <p role="alert">{error}</p>}
        </section>
    );
}
