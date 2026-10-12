import { FileText } from 'lucide-react';
import { governanceDate } from './GovernanceHistoryPanel';
import { governanceDisplayText } from './governance-preview-data';

export default function GovernanceReportsPanel({ period, editable, onAction }) {
    const latestReport = period.reports.at(-1);
    const status = !latestReport
        ? 'Chưa nộp báo cáo'
        : latestReport.sourceRevision === period.revision
          ? 'Đã nộp báo cáo'
          : 'Có thay đổi chưa cập nhật';
    return (
        <section className="governance-reports-panel">
            <div className="governance-section-heading">
                <div>
                    <p>Mỗi bản nộp giữ nguyên người, group và quyền tại thời điểm đó.</p>
                    <span className="governance-report-status">{status}</span>
                </div>
                {editable && (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        onClick={() => onAction({ type: 'report', returnPanel: 'reports' })}
                    >
                        Nộp báo cáo BQL
                    </button>
                )}
            </div>
            {!period.reports.length && <div className="governance-empty">Chưa nộp báo cáo kỳ này.</div>}
            <div className="governance-report-list">
                {[...period.reports].reverse().map((report) => (
                    <article key={report.id}>
                        <FileText size={22} />
                        <div>
                            <strong>
                                Bản nộp #{report.number} · Cơ cấu v{report.sourceRevision}
                            </strong>
                            <small>
                                {governanceDate(report.at)} · {governanceDisplayText(report.actor)}
                            </small>
                            <p>{governanceDisplayText(report.reason)}</p>
                        </div>
                        <button
                            type="button"
                            className="v2-button"
                            onClick={() => onAction({ type: 'viewReport', report, returnPanel: 'reports' })}
                        >
                            Xem bản nộp
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
}
