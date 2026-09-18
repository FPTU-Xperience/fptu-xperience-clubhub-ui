import React from 'react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { Empty } from '../../components/ui/Empty';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { Stat } from '../../components/ui/Stat';
import { fmt } from '../../components/ui/formatters';

export function FinancePage() {
    const { state } = useClubHub();
    const { clubId, term } = useWorkspace();
    const rows = state.transactions.filter(
        (t) => (t.clubId === clubId || String(t.clubId) === String(clubId)) && t.term === term,
    );
    const income = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0);
    const expense = -rows.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);

    return (
        <>
            <PageHeading
                eyebrow="TÍNH NĂNG TÙY CHỌN CỦA CLB"
                title="Tổng quan tài chính"
                description="Màn hình thu chi và dự trù kinh phí hoạt động câu lạc bộ."
            />
            <div className="dx-stats three">
                <Stat label="Tổng thu trong kỳ" value={`${fmt(income)} ₫`} note="Nguồn quỹ hoạt động" />
                <Stat label="Tổng chi trong kỳ" value={`${fmt(expense)} ₫`} note="Khoản chi đã ghi nhận" />
                <Stat label="Chênh lệch thu chi" value={`${fmt(income - expense)} ₫`} note="Theo dõi ngân sách" />
            </div>
            <section className="dx-panel">
                <SectionHeading title="Các khoản thu chi" />
                <table className="dx-table">
                    <thead>
                        <tr>
                            <th>Nội dung</th>
                            <th>Ngày</th>
                            <th>Loại</th>
                            <th>Số tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    <strong>{r.title}</strong>
                                </td>
                                <td>{r.date}</td>
                                <td>
                                    <Pill tone={r.amount > 0 ? 'green' : 'orange'}>{r.amount > 0 ? 'Thu' : 'Chi'}</Pill>
                                </td>
                                <td>
                                    {r.amount > 0 ? '+' : '−'}
                                    {fmt(Math.abs(r.amount))} ₫
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!rows.length && <Empty title="Chưa có khoản thu chi trong kỳ" />}
            </section>
        </>
    );
}

export default FinancePage;
