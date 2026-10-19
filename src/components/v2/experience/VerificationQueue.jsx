import { useEffect, useRef, useState } from 'react';
import ContributionDetails from './ContributionDetails';
import PrivateEvidence from './PrivateEvidence';

function ManualReview({ api, row, onChanged }) {
    const [reason, setReason] = useState(''),
        [busy, setBusy] = useState(false),
        [error, setError] = useState('');
    const keys = useRef(new Map()),
        lock = useRef(false);
    let evidence = [];
    try {
        evidence = JSON.parse(row.evidenceRefsJson || '[]');
    } catch {
        /* Invalid source metadata remains unavailable. */
    }
    const review = async (decision) => {
        if (lock.current || !reason.trim()) return;
        lock.current = true;
        setBusy(true);
        setError('');
        const body = { expectedVersion: row.version, decision, reason },
            fingerprint = JSON.stringify(body);
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        try {
            await api.request(
                `/api/activities/${row.activityId}/sessions/${row.sessionId}/manual-attendance-requests/${row.id}/reviews`,
                {
                    method: 'POST',
                    headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                    body: JSON.stringify(body),
                },
            );
            onChanged();
        } catch (issue) {
            setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <article>
            <h3>Yêu cầu xác nhận điểm danh · #{row.userId}</h3>
            <p>{row.reason}</p>
            <PrivateEvidence api={api} ids={evidence} />
            <label>
                Nhận xét
                <input maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} />
            </label>
            {['APPROVE', 'REJECT'].map((decision) => (
                <button
                    type="button"
                    className="v2-button"
                    key={decision}
                    disabled={busy || !reason.trim()}
                    onClick={() => review(decision)}
                >
                    {decision === 'APPROVE' ? 'Xác nhận điểm danh' : 'Từ chối'}
                </button>
            ))}
            {error && <p role="alert">{error}</p>}
        </article>
    );
}

export default function VerificationQueue({ api, clubId }) {
    const [result, setResult] = useState(null),
        [page, setPage] = useState(1),
        [attempt, retry] = useState(0),
        [selected, setSelected] = useState(null);
    useEffect(() => {
        let active = true;
        setResult(null);
        const query = new URLSearchParams({ page, pageSize: 20, ...(clubId ? { clubId } : {}) });
        api.request(`/api/verifications/me/queue?${query}`).then(
            (data) => {
                if (active) setResult({ data });
            },
            (error) => {
                if (active) setResult({ error });
            },
        );
        return () => {
            active = false;
        };
    }, [api, clubId, page, attempt]);
    const refresh = () => retry((value) => value + 1),
        data = result?.data;
    if (selected)
        return (
            <ContributionDetails
                key={selected}
                api={api}
                id={selected}
                reviewer
                onClose={() => setSelected(null)}
                onChanged={refresh}
            />
        );
    return (
        <section className="v2-profile-panel v2-experience-operations">
            <h2>Hàng chờ xác minh được phân quyền</h2>
            {!result && <p role="status">Đang tải…</p>}
            {result?.error && (
                <p role="alert">
                    {result.error.status === 403
                        ? 'Tài khoản chưa được cấp quyền xác minh trong phạm vi này.'
                        : result.error.message}
                </p>
            )}
            <button type="button" className="v2-button" onClick={refresh}>
                Tải lại
            </button>
            {data && (
                <>
                    <h3>Đóng góp</h3>
                    {!data.items?.length && <p>Không có đóng góp chờ duyệt ở trang này.</p>}
                    {data.items?.map((row) => (
                        <article key={row.id}>
                            <p>
                                {row.title} · #{row.userId} · {row.semesterId}
                            </p>
                            <button type="button" className="v2-button" onClick={() => setSelected(row.id)}>
                                Kiểm tra & quyết định
                            </button>
                        </article>
                    ))}
                    <h3>Yêu cầu nâng vai trò / kết quả</h3>
                    {data.roleUpgradeRequests?.map((row) => (
                        <article key={row.upgrade.id}>
                            <p>
                                {row.title} · {row.upgrade.proposedRole} · {row.upgrade.reason}
                            </p>
                            <button
                                type="button"
                                className="v2-button"
                                onClick={() => setSelected(row.upgrade.contributionId)}
                            >
                                Kiểm tra yêu cầu
                            </button>
                        </article>
                    ))}
                    <h3>Xác nhận điểm danh thủ công</h3>
                    {data.manualAttendanceRequests?.map((row) => (
                        <ManualReview key={`${row.id}:${row.version}`} api={api} row={row} onChanged={refresh} />
                    ))}
                    <nav aria-label="Trang hàng chờ">
                        <button
                            type="button"
                            className="v2-button"
                            disabled={page <= 1}
                            onClick={() => setPage((value) => value - 1)}
                        >
                            Trước
                        </button>
                        <span> Trang {page} </span>
                        <button
                            type="button"
                            className="v2-button"
                            disabled={
                                page >= data.totalPages &&
                                (data.roleUpgradeRequests?.length || 0) < 20 &&
                                (data.manualAttendanceRequests?.length || 0) < 20
                            }
                            onClick={() => setPage((value) => value + 1)}
                        >
                            Sau
                        </button>
                    </nav>
                </>
            )}
        </section>
    );
}
