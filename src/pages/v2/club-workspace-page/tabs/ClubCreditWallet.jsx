import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { creditGraph, creditNumber, creditPage, creditWallet } from '../../../../services/club-credit';
import './ServerClubRewards.scss';

export default function ClubCreditWallet({ clubId, readOnly = false, revision = 0 }) {
    const { api, user } = useAuth();
    const [days, setDays] = useState(30), [page, setPage] = useState(1), [reload, setReload] = useState(0), [result, setResult] = useState({});
    const identity = `${user?.id}:${clubId}:${readOnly}:${days}:${page}`;
    const current = useRef(identity); current.current = identity;
    const state = result.identity === identity ? result : {};
    useEffect(() => {
        let active = true; setResult({});
        if (!user?.id || !clubId || readOnly) return;
        const base = `/api/clubs/${encodeURIComponent(clubId)}`;
        Promise.all([
            api.request(base + '/wallet/me').then((value) => creditWallet(value, user.id, clubId)),
            api.request(base + `/wallet/me/graph?days=${days}`).then((value) => creditGraph(value, user.id, clubId)),
            api.request(base + `/points/me/ledger?page=${page}&pageSize=20`).then((value) => {
                creditPage(value);
                if (String(value.userId) !== String(user.id) || String(value.clubId) !== String(clubId)) throw new Error('Lịch sử không đúng tài khoản/CLB.');
                return value;
            }),
        ]).then(([wallet, graph, ledger]) => {
            if (wallet.version !== graph.version) throw new Error('Điểm đang được cập nhật. Tải lại để xem cùng một phiên bản.');
            if (active && current.current === identity) setResult({ identity, wallet, graph, ledger });
        }).catch((error) => { if (active && current.current === identity) setResult({ identity, error: error.message }); });
        return () => { active = false; };
    }, [api, identity, reload, revision]);
    if (readOnly) return <p>Chế độ quan sát không hiển thị ví cá nhân.</p>;
    return <section className="club-credit-wallet" aria-label="Ví credit CLB">
        <header><div><h2>Ví credit của tôi</h2><p>1 XP đã xác minh trong CLB = 1 credit. Đổi quà không làm giảm XP hoặc radar.</p></div>
            <button className="v2-button" onClick={() => setReload((value) => value + 1)}>Tải lại ví</button></header>
        {state.error ? <p role="alert">{state.error}</p> : !state.wallet ? <p role="status">Đang tải ví và biểu đồ…</p> : <>
            <dl className="credit-summary">{[['Đã nhận', state.wallet.earnedTotal], ['Đã thu hồi', state.wallet.revokedTotal], ['Đã đổi', state.wallet.spentTotal], ['Số dư khả dụng', state.wallet.balance]].map(([label, amount]) => <div key={label}><dt>{label}</dt><dd>{creditNumber(amount)}</dd></div>)}</dl>
            {state.wallet.hasDebt && <p role="alert">Credit đã dùng vượt phần XP còn được xác nhận. Ví giữ khoản âm và tạm chặn đổi quà đến khi bù đủ.</p>}
            <label>Khoảng biểu đồ <select value={days} onChange={(event) => setDays(Number(event.target.value))}>{[7, 30, 90, 365].map((value) => <option key={value} value={value}>{value} ngày</option>)}</select></label>
            <CreditChart graph={state.graph} />
            <h3>Lịch sử cộng/trừ credit</h3>
            <div className="credit-table-scroll"><table><thead><tr><th>Thời điểm</th><th>Loại</th><th>Credit</th><th>Nguồn</th></tr></thead><tbody>
                {state.ledger.items.map((row) => <tr key={row.id}><td>{new Date(row.at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</td><td>{{ CREDIT: 'Ghi nhận', REVERSAL: 'Thu hồi/điều chỉnh', DEBIT: 'Đổi quà' }[row.type]}</td><td>{creditNumber(row.amount)}</td><td>{row.sourceType === 'VERIFIED_XP_EFFECT' ? `XP #${row.sourceId}` : `Phiếu đổi ${row.sourceId}`}</td></tr>)}
            </tbody></table></div>
            {!state.ledger.items.length && <p>Chưa có giao dịch credit tại CLB này.</p>}
            {state.ledger.totalPages > 1 && <nav aria-label="Trang lịch sử credit"><button className="v2-button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page}/{state.ledger.totalPages}</span><button className="v2-button" disabled={page >= state.ledger.totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></nav>}
        </>}
    </section>;
}

function CreditChart({ graph }) {
    const series = [{ key: 'earned', name: 'Credit sau điều chỉnh', color: '#087f5b' }, { key: 'spent', name: 'Đã đổi', color: '#e67700' }, { key: 'balance', name: 'Khả dụng', color: '#1c7ed6' }];
    const [visible, setVisible] = useState(['earned', 'spent', 'balance']);
    const values = graph.points.flatMap((point) => visible.map((key) => point[key]));
    const min = Math.min(0, ...values), max = Math.max(1, ...values), spread = max - min || 1;
    const x = (index) => 50 + index * 700 / Math.max(1, graph.points.length - 1), y = (value) => 225 - (value - min) * 190 / spread;
    return <div className="credit-chart">
        <div className="credit-legend">{series.map((line) => <label key={line.key}><input type="checkbox" checked={visible.includes(line.key)} onChange={() => setVisible((keys) => keys.includes(line.key) ? keys.filter((key) => key !== line.key) : [...keys, line.key])} /><span style={{ color: line.color }}>{line.name}</span></label>)}</div>
        <svg viewBox="0 0 800 270" role="img" aria-label={`Biểu đồ credit từ ${graph.from} đến ${graph.to}, giờ Việt Nam`}>
            <line x1="50" x2="750" y1={y(0)} y2={y(0)} stroke="#adb5bd" />
            <text x="5" y="25">{creditNumber(max)}</text><text x="5" y="240">{creditNumber(min)}</text>
            {series.filter((line) => visible.includes(line.key)).map((line) => <g key={line.key}><polyline fill="none" stroke={line.color} strokeWidth="2.5" points={graph.points.map((point, index) => `${x(index)},${y(point[line.key])}`).join(' ')} />
                {graph.points.map((point, index) => <circle key={point.date} cx={x(index)} cy={y(point[line.key])} r="3" fill={line.color}><title>{point.date} · {line.name}: {creditNumber(point[line.key])}</title></circle>)}</g>)}
            <text x="50" y="262">{graph.from}</text><text x="650" y="262">{graph.to}</text>
        </svg>
        <details><summary>Xem dữ liệu biểu đồ</summary><div className="credit-table-scroll"><table><thead><tr><th>Ngày (Việt Nam)</th>{series.map((line) => <th key={line.key}>{line.name}</th>)}</tr></thead><tbody>{graph.points.map((point) => <tr key={point.date}><th>{point.date}</th>{series.map((line) => <td key={line.key}>{creditNumber(point[line.key])}</td>)}</tr>)}</tbody></table></div></details>
    </div>;
}
