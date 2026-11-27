import { useEffect, useState } from 'react';
import '../../../components/v2/activity-detail/RawFunding.scss';

const pillars = [['Academic', 'Học tập'], ['Research', 'Nghiên cứu'], ['Global', 'Quốc tế'], ['CultureSports', 'Thể thao & văn hóa'], ['Community', 'Cộng đồng'], ['Entrepreneurship', 'Khởi nghiệp']];

export default function FundingPlanFields({ api, draft, change }) {
    const [state, setState] = useState({});
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let active = true;
        setState({});
        if (draft.period) api.request(`/api/v1/semesters/${encodeURIComponent(draft.period.trim())}/approved-experience-policies`)
            .then(data => {
                if (!Array.isArray(data?.items)) throw new Error('Danh sách chính sách không hợp lệ.');
                if (active) setState({ data });
            }).catch(error => { if (active) setState({ error }); });
        return () => { active = false; };
    }, [api, draft.period, retry]);
    if (!draft.fundingEnabled) return <p>Hồ sơ này được tạo theo luồng cũ. Chính sách lịch sử được giữ theo phiên bản đã lưu.</p>;
    return <fieldset className="v2-raw-funding-fields">
        <legend>Dự toán quỹ điểm thô</legend>
        <p>CTSV giữ quỹ khi duyệt mở. Điểm chỉ được ghi sau khi báo cáo đóng và toàn bộ kết quả được duyệt.</p>
        {state.error && <p role="alert">{state.error.message} <button type="button" onClick={() => setRetry(x => x + 1)}>Tải lại chính sách</button></p>}
        {!state.data && !state.error && <p role="status">Đang tải chính sách được duyệt…</p>}
        {state.data?.items.length === 0 && <p>Học kỳ chưa có chính sách có hiệu lực. Liên hệ CTSV trước khi gửi duyệt.</p>}
        <label>Chính sách có hiệu lực <select name="policyVersion" value={draft.policyVersion ?? ''} onChange={e => change('policyVersion', e.target.value)}>
            <option value="">Chọn chính sách</option>{state.data?.items.map(x => <option key={x.policyVersion} value={x.policyVersion}>Phê duyệt {new Date(x.approvedAt).toLocaleString('vi-VN')}</option>)}
        </select></label>
        <label>Dự toán điểm thô <input name="rawBudget" type="number" min="0.0001" step="0.0001" max="1000000000" value={draft.rawBudget ?? ''} onChange={e => change('rawBudget', e.target.value)} /></label>
        <label>Mức độ đóng góp <select name="fundingTier" value={draft.fundingAttributes?.tier ?? ''} onChange={e => change('fundingAttributes', { ...draft.fundingAttributes, tier: e.target.value })}>
            <option value="">Chọn mức T</option>{['T1', 'T2', 'T3', 'T4', 'T5'].map(x => <option key={x} value={x}>{x}</option>)}
        </select></label>
        <label>Trụ cột chính <select name="fundingPillar" value={draft.fundingAttributes?.pillarWeights?.[0]?.pillar ?? ''} onChange={e => change('fundingAttributes', { ...draft.fundingAttributes, pillarWeights: e.target.value ? [{ pillar: e.target.value, weight: 1 }] : [] })}>
            <option value="">Chọn trụ cột</option>{pillars.map(([value, label]) => <option key={value} value={value}>{label} · 100%</option>)}
        </select></label>
    </fieldset>;
}
