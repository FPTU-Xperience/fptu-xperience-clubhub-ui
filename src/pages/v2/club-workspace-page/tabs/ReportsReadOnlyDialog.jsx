import { useCallback, useState } from 'react';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import PageState from '../../../../components/v2/PageState';
import MinimalUploadedReportPreview from '../../../../components/reports/MinimalUploadedReportPreview';
import useWorkspaceResource from './useWorkspaceResource';

export default function ReportsReadOnlyDialog({ api, clubId, reportId, onClose }) {
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        const report = await api.getReport(reportId);
        if (report.clubId != null && String(report.clubId) !== String(clubId))
            throw new Error('Báo cáo không thuộc CLB này.');
        return report;
    }, [api, clubId, reportId]);
    const result = useWorkspaceResource(clubId, load, reportId);
    const report = result.data;
    const preview = useCallback((id) => api.getUploadedReportFilePreview(id), [api]);
    const download = async (attachment) => {
        setError('');
        try {
            if (attachment) await api.downloadReportAttachment(reportId, attachment.id, attachment.fileName);
            else await api.downloadUploadedReportFile(reportId, report.uploadedFile?.originalFileName);
        } catch (issue) {
            setError(issue?.message || 'Không thể tải tệp.');
        }
    };
    return (
        <V2Modal title="Chi tiết báo cáo · Chỉ xem" onClose={onClose} wide>
            {result.status !== 'ready' ? (
                <PageState status={result.status === 'loading' ? 'loading' : 'error'} onRetry={result.retry} />
            ) : (
                <>
                    <h3>{report.title || report.tag || report.period || `Báo cáo #${report.id}`}</h3>
                    <p>
                        {report.period} · {report.reportType} · {report.status}
                    </p>
                    {report.description && <p>{report.description}</p>}
                    {report.feedbackNote && <p>Phản hồi: {report.feedbackNote}</p>}
                    {report.uploadedFile && (
                        <MinimalUploadedReportPreview
                            reportId={reportId}
                            originalFileName={report.uploadedFile.originalFileName}
                            fetchPreview={preview}
                            onDownloadOriginal={() => download()}
                        />
                    )}
                    {!!report.attachments?.length && (
                        <section aria-label="Tệp đính kèm">
                            <h4>Tệp đính kèm</h4>
                            {report.attachments.map((attachment) => (
                                <button
                                    key={attachment.id}
                                    type="button"
                                    className="v2-button"
                                    onClick={() => download(attachment)}
                                >
                                    {attachment.fileName} · Tải xuống
                                </button>
                            ))}
                        </section>
                    )}
                </>
            )}
            {error && <p role="alert">{error}</p>}
        </V2Modal>
    );
}
