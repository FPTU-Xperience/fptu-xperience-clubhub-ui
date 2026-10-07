import { useCallback } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import useWorkspaceResource from './useWorkspaceResource';

const statusLabel = (status) => ({
    Draft: 'Bản nháp', Submitted: 'Đã nộp', 'Awaiting Finance': 'Chờ tài chính',
    'Under Review': 'Đang duyệt', Approved: 'Đã duyệt', Rejected: 'Cần chỉnh sửa',
})[status] || status;

export default function ReportsTab({ workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const load = useCallback((id) => api.getReports({ clubId: id, page: 1, pageSize: 100 }), [api]);
    const result = useWorkspaceResource(clubId, load);
    const reports = result.data?.items || [];
    return (
        <WorkspaceTabLayout
            title="Báo cáo"
            description="Báo cáo thực tế của CLB, theo quyền truy cập của bạn."
            action={<Link className="v2-button v2-button--primary" to="/reports/create">Tạo báo cáo</Link>}
            records={reports}
        >
            {(records) => (
                <>
                    {result.status === 'loading' && <p className="v2-workspace-data-note" role="status">Đang tải báo cáo…</p>}
                    {result.status !== 'loading' && result.status !== 'ready' && <p className="v2-workspace-data-note" role="alert">Không tải được báo cáo. <button type="button" onClick={result.retry}>Thử lại</button></p>}
                    {result.status === 'ready' && records.length === 0 && <p className="v2-workspace-data-note">CLB chưa có báo cáo nào bạn có thể xem.</p>}
                    {records.length > 0 && (
                        <section className="v2-preview-operation">
                            <header><span>BÁO CÁO</span><span>TRẠNG THÁI</span><span>HẠN NỘP</span></header>
                            {records.map((report) => (
                                <article key={report.id}>
                                    <div>
                                        <strong>{report.tag || report.period || `Báo cáo #${report.id}`}</strong>
                                        <small>{report.period} · {report.reportType}</small>
                                    </div>
                                    <span>{statusLabel(report.status)}</span>
                                    <em>{report.dueDate ? new Date(report.dueDate).toLocaleDateString('vi-VN') : '—'}</em>
                                    <Link to={`/reports/${report.id}`} aria-label={`Xem báo cáo ${report.id}`}><ArrowUpRight size={18} /></Link>
                                </article>
                            ))}
                        </section>
                    )}
                    {result.data?.total > records.length && <p className="v2-workspace-data-note">Đang hiển thị {records.length}/{result.data.total} báo cáo. <Link to="/reports">Xem tất cả</Link></p>}
                </>
            )}
        </WorkspaceTabLayout>
    );
}
