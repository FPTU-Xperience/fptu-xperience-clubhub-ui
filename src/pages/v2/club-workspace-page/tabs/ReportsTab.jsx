import { useWorkspaceSemester } from '../WorkspaceSemesterContext';
import { workspaceSemesterQuery, workspaceSemesterKey } from '../workspace-semester-data';
import { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import useWorkspaceResource from './useWorkspaceResource';
import ReportTemplateModal from '../../report-detail-page/ReportTemplateModal';
import { reportTemplateLabel } from '../../report-detail-page/report-templates';
import ClubExperiencePanel from './ClubExperiencePanel';

const statusLabel = (status) =>
    ({
        Draft: 'Bản nháp',
        Submitted: 'Đã nộp',
        'Awaiting Finance': 'Chờ tài chính',
        'Under Review': 'Đang duyệt',
        Approved: 'Đã duyệt',
        Rejected: 'Cần chỉnh sửa',
    })[status] || status;

export default function ReportsTab({ workspace, readOnly = false }) {
    const [page, setPage] = useState(1);
    const [choosingTemplate, setChoosingTemplate] = useState(false);
    const location = useLocation();
    const clubId = workspace?.clubId;
    const { api, clubAccess } = useAuth();
    const canCreate = clubAccess.some((access) => String(access.clubId) === String(clubId) && access.isManager);
    const { semester } = useWorkspaceSemester();
    useEffect(() => {
        setPage(1);
        setChoosingTemplate(false);
    }, [clubId, semester]);
    const load = useCallback(
        (id) => api.getReports({ ...workspaceSemesterQuery(semester, 'reports'), clubId: id, page, pageSize: 100 }),
        [api, semester, page],
    );
    const result = useWorkspaceResource(clubId, load, `${workspaceSemesterKey(semester)}:${page}`);
    const reports = result.data?.items || [];
    return (
        <WorkspaceTabLayout
            title="Báo cáo"
            description={
                semester?.reportPeriod ? `Báo cáo trong ${semester.label}.` : 'Báo cáo toàn CLB theo quyền truy cập.'
            }
            action={
                canCreate &&
                !readOnly && (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        onClick={() => setChoosingTemplate(true)}
                    >
                        Tạo báo cáo
                    </button>
                )
            }
            records={reports}
        >
            {(records) => (
                <>
                    {canCreate && <ClubExperiencePanel key={`${clubId}:${semester?.id}`} clubId={clubId} semester={semester} readOnly={readOnly} />}
                    {result.status === 'loading' && (
                        <p className="v2-workspace-data-note" role="status">
                            Đang tải báo cáo…
                        </p>
                    )}
                    {result.status !== 'loading' && result.status !== 'ready' && (
                        <p className="v2-workspace-data-note" role="alert">
                            Không tải được báo cáo.{' '}
                            <button type="button" onClick={result.retry}>
                                Thử lại
                            </button>
                        </p>
                    )}
                    {result.status === 'ready' && records.length === 0 && (
                        <p className="v2-workspace-data-note">CLB chưa có báo cáo nào bạn có thể xem.</p>
                    )}
                    {records.length > 0 && (
                        <section className="v2-preview-operation">
                            <header>
                                <span>BÁO CÁO</span>
                                <span>TRẠNG THÁI</span>
                                <span>HẠN NỘP</span>
                            </header>
                            {records.map((report) => (
                                <article key={report.id}>
                                    <div>
                                        <strong>
                                            {reportTemplateLabel(report) ||
                                                report.tag ||
                                                report.period ||
                                                `Báo cáo #${report.id}`}
                                        </strong>
                                        <small>
                                            {report.period} · {reportTemplateLabel(report) || report.reportType}
                                        </small>
                                    </div>
                                    <span>{statusLabel(report.status)}</span>
                                    <em>
                                        {report.dueDate ? new Date(report.dueDate).toLocaleDateString('vi-VN') : '—'}
                                    </em>
                                    <Link
                                        to={`${location.pathname.replace(/\/$/, '')}/${encodeURIComponent(report.id)}`}
                                        aria-label={`Xem báo cáo ${report.id}`}
                                    >
                                        <ArrowUpRight size={18} />
                                    </Link>
                                </article>
                            ))}
                        </section>
                    )}
                    {(page > 1 || result.data?.total > records.length) && (
                        <div className="v2-report-actions">
                            <button
                                className="v2-button"
                                type="button"
                                disabled={page === 1 || result.status === 'loading'}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                Trang trước
                            </button>
                            <span>Trang {page}</span>
                            <button
                                className="v2-button"
                                type="button"
                                disabled={result.status !== 'ready' || page * 100 >= (result.data?.total || 0)}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                    {choosingTemplate && canCreate && !readOnly && (
                        <ReportTemplateModal
                            key={`${clubId}:${workspaceSemesterKey(semester)}`}
                            api={api}
                            workspace={workspace}
                            semester={semester}
                            basePath={location.pathname.replace(/\/$/, '')}
                            onClose={() => setChoosingTemplate(false)}
                        />
                    )}
                </>
            )}
        </WorkspaceTabLayout>
    );
}
