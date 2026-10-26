import { useEffect, useState } from 'react';

export default function StudentSessionSources({ api, activityId }) {
    const [page, setPage] = useState(1),
        [revision, setRevision] = useState(0),
        [state, setState] = useState({});
    useEffect(() => {
        let active = true;
        setState({});
        api.request(`/api/v2/activities/${encodeURIComponent(activityId)}/sessions?page=${page}&pageSize=20`)
            .then((value) => {
                if (active) setState({ data: value });
            })
            .catch((error) => {
                if (active) setState({ error });
            });
        return () => {
            active = false;
        };
    }, [api, activityId, page, revision]);
    return (
        <section className="v2-activity-profile-panel">
            <h3>Phiên tham gia của tôi</h3>
            {state.error ? (
                <p role="status">
                    {[403, 404].includes(state.error.status)
                        ? 'Nguồn phiên chỉ dành cho người đã đăng ký và còn đủ điều kiện tham gia.'
                        : state.error.message}
                </p>
            ) : !state.data ? (
                <p role="status">Đang tải phiên tham gia…</p>
            ) : (
                <>
                    {!state.data.items.length && <p>Chưa có phiên tham gia.</p>}
                    <ul>
                        {state.data.items.map((row) => (
                            <li key={row.id}>
                                {new Date(row.startTimeUtc).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} ·{' '}
                                {row.location} · {row.status}
                                {row.alreadyVerified ? ' · Đã xác minh' : ' · Chưa xác minh'}
                            </li>
                        ))}
                    </ul>
                    <button className="v2-button" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>
                        Trước
                    </button>
                    <button
                        className="v2-button"
                        disabled={page >= state.data.totalPages}
                        onClick={() => setPage((x) => x + 1)}
                    >
                        Sau
                    </button>
                </>
            )}
            <button className="v2-button" onClick={() => setRevision((x) => x + 1)}>
                Tải lại phiên
            </button>
        </section>
    );
}
