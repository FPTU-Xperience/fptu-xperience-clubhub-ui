import { useEffect, useState } from 'react';
import './RawFunding.scss';

const number = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);
const kinds = { GRANT: 'Cấp quỹ', RESERVE: 'Giữ quỹ', AWARD: 'Ghi điểm', SETTLE: 'Quyết toán', REFUND: 'Hoàn quỹ', REVERSAL: 'Đảo điểm', BUDGET_INCREASE: 'Bổ sung phân bổ' };

export default function RawFundingBalance({ api, clubId, semesterId }) {
    const [state, setState] = useState({});
    const [page, setPage] = useState(1);
    const [revision, setRevision] = useState(0);
    useEffect(() => { setPage(1); }, [clubId, semesterId]);
    useEffect(() => {
        let active = true;
        setState({});
        if (clubId && semesterId) api.request(`/api/v1/raw-funding/${encodeURIComponent(clubId)}?${new URLSearchParams({ semesterId, page })}`)
            .then(data => {
                if (data?.unit !== 'RAW_POINTS' || !Array.isArray(data.entries)) throw new Error('Dữ liệu quỹ điểm không hợp lệ.');
                if (active) setState({ data });
            }).catch(error => { if (active) setState({ error }); });
        return () => { active = false; };
    }, [api, clubId, semesterId, page, revision]);
    const data = state.data;
    return <section className="v2-raw-funding-balance" aria-label="Quỹ điểm thô học kỳ">
        <h3>Quỹ điểm thô · {semesterId || 'Chưa chọn học kỳ'}</h3>
        {!semesterId ? <p>Chọn học kỳ để xem quỹ điểm thô.</p> : state.error ? <p role="alert">{state.error.message} <button type="button" onClick={() => setRevision(x => x + 1)}>Thử lại</button></p> : !data ? <p role="status">Đang tải quỹ điểm…</p> : <>
            <dl>{[['granted', 'Đã cấp'], ['available', 'Khả dụng'], ['reserved', 'Đang giữ cho hoạt động'], ['spent', 'Đã ghi điểm']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{number(data[key])} điểm thô</dd></div>)}</dl>
            <h4>Lịch sử quỹ</h4>
            {data.entries.map(x => <article key={x.id}><strong>{kinds[x.kind] ?? x.kind}</strong><p>{x.reason}</p><p>{new Date(x.recordedAt).toLocaleString('vi-VN')} · Khả dụng {number(x.availableDelta)} · Giữ quỹ {number(x.reservedDelta)} · Ghi điểm {number(x.spentDelta)}</p></article>)}
            {!data.entries.length && <p>Chưa có bút toán trong trang này.</p>}
            <nav aria-label="Trang lịch sử quỹ"><button type="button" disabled={page === 1} onClick={() => setPage(x => x - 1)}>Trang trước</button> Trang {page} <button type="button" disabled={page * data.pageSize >= data.total} onClick={() => setPage(x => x + 1)}>Trang sau</button></nav>
        </>}
    </section>;
}
