import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const labels = {
    Submitted: 'Chờ xét duyệt',
    NeedsRevision: 'Cần bổ sung',
    Approved: 'Đã duyệt',
    Rejected: 'Đã từ chối',
};
export default function MyClubFormationApplications({ api, userId, revision, onRevise }) {
    const [state, setState] = useState({}),
        [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setState({});
        api.getMyClubApplications()
            .then((rows) => {
                if (
                    !Array.isArray(rows) ||
                    rows.some(
                        (row) =>
                            row.requesterUserId !== Number(userId) ||
                            !Number.isSafeInteger(row.id) ||
                            !labels[row.status] ||
                            typeof row.version !== 'string',
                    )
                )
                    throw new Error('Danh sách đơn thành lập không khớp tài khoản hiện tại.');
                if (active) setState({ rows });
            })
            .catch((error) => {
                if (active) setState({ error: error.message });
            });
        return () => {
            active = false;
        };
    }, [api, userId, revision, retry]);
    return (
        <section className="v2-activity-profile-panel" aria-label="Đơn thành lập CLB của tôi">
            <h2>Đơn thành lập CLB của tôi</h2>
            {state.error ? (
                <p role="alert">{state.error}</p>
            ) : !state.rows ? (
                <p role="status">Đang tải đơn thành lập…</p>
            ) : !state.rows.length ? (
                <p>Bạn chưa gửi đơn thành lập CLB.</p>
            ) : (
                state.rows.map((row) => (
                    <article key={row.id}>
                        <h3>{row.name}</h3>
                        <p>
                            {labels[row.status]} · {row.campusCode} · Mã đơn #{row.id}
                        </p>
                        {row.reviewNote && <p>Phản hồi: {row.reviewNote}</p>}
                        {row.reviewConditions && <p>Điều kiện: {row.reviewConditions}</p>}
                        {row.status === 'NeedsRevision' && (
                            <button className="v2-button" onClick={() => onRevise(row)}>
                                Bổ sung và gửi lại
                            </button>
                        )}
                        {row.status === 'Approved' && (
                            <>
                                <p>Chủ nhiệm: {row.approvedManagerName || 'Xem trong CLB'}</p>
                                <Link className="v2-button" to={`/v2/my-clubs/${encodeURIComponent(row.code)}`}>
                                    Vào Club Workspace
                                </Link>
                            </>
                        )}
                    </article>
                ))
            )}
            <button className="v2-button" onClick={() => setRetry((value) => value + 1)}>
                Tải lại đơn thành lập
            </button>
        </section>
    );
}
