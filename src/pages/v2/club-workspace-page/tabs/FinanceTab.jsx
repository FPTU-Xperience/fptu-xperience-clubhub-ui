import { useCallback } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import useWorkspaceResource from './useWorkspaceResource';

const money = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);

export default function FinanceTab({ workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const load = useCallback(async (id) => {
        const [proposals, transactions] = await Promise.allSettled([
            api.getBudgetProposals({ clubId: id, page: 1, pageSize: 100 }),
            api.getFinanceTransactions(id),
        ]);
        return {
            proposals: proposals.status === 'fulfilled' ? proposals.value : null,
            transactions: transactions.status === 'fulfilled' ? transactions.value : null,
        };
    }, [api]);
    const result = useWorkspaceResource(clubId, load);
    const proposals = result.data?.proposals?.items || [];
    const transactions = Array.isArray(result.data?.transactions) ? result.data.transactions : [];
    return (
        <WorkspaceTabLayout title="Tài chính" description="Đề xuất ngân sách và giao dịch của CLB theo quyền truy cập." records={proposals}>
            {() => (
                <>
                    {result.status === 'loading' && <p className="v2-workspace-data-note" role="status">Đang tải dữ liệu tài chính…</p>}
                    {result.status !== 'loading' && (result.status !== 'ready' || (!result.data?.proposals && !result.data?.transactions)) && (
                        <p className="v2-workspace-data-note" role="alert">Bạn chưa có quyền xem hoặc không tải được tài chính CLB. <button type="button" onClick={result.retry}>Thử lại</button></p>
                    )}
                    {result.data?.proposals && (
                        <section className="v2-preview-operation">
                            <header><span>ĐỀ XUẤT NGÂN SÁCH</span><span>TRẠNG THÁI</span><span>SỐ TIỀN</span></header>
                            {proposals.map((proposal) => (
                                <article key={proposal.id}>
                                    <div><strong>{proposal.title}</strong><small>{proposal.description}</small></div>
                                    <span>{proposal.status}</span>
                                    <em>{money(proposal.approvedAmount ?? proposal.requestedAmount)}</em>
                                </article>
                            ))}
                            {proposals.length === 0 && <p className="v2-workspace-data-note">Chưa có đề xuất ngân sách.</p>}
                        </section>
                    )}
                    {result.data?.proposals?.total > proposals.length && <p className="v2-workspace-data-note">Hiển thị {proposals.length}/{result.data.proposals.total} đề xuất đầu tiên.</p>}
                    {result.data?.transactions && (
                        <section className="v2-preview-operation v2-workspace-finance-transactions">
                            <header><span>GIAO DỊCH GẦN ĐÂY</span><span>LOẠI</span><span>GIÁ TRỊ</span></header>
                            {transactions.map((transaction) => (
                                <article key={transaction.id}>
                                    <div><strong>{transaction.description}</strong><small>{new Date(transaction.transactionDateUtc).toLocaleDateString('vi-VN')}</small></div>
                                    <span>{transaction.type}</span>
                                    <em>{money(transaction.amount)}</em>
                                </article>
                            ))}
                            {transactions.length === 0 && <p className="v2-workspace-data-note">Chưa có giao dịch.</p>}
                        </section>
                    )}
                </>
            )}
        </WorkspaceTabLayout>
    );
}
