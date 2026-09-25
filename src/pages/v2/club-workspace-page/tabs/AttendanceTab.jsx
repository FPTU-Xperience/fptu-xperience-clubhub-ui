import { ScanLine } from 'lucide-react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function AttendanceTab() {
    return (
        <WorkspaceTabLayout
            title="Điểm danh hoạt động"
            description="Mở phiên điểm danh và theo dõi sự có mặt của thành viên."
            action="Mở phiên điểm danh"
            records={workspacePreviewRecords['Điểm danh']}
        >
            {(records) => (
                <div className="v2-preview-attendance">
                    <section>
                        <ScanLine size={32} />
                        <span>PHIÊN GẦN NHẤT</span>
                        <h2>{records[0]?.title}</h2>
                        <p>{records[0]?.meta}</p>
                        <button className="v2-button v2-button--primary" type="button" disabled>
                            Mở mã QR
                        </button>
                    </section>
                    <div>
                        {records.slice(1).map((record) => (
                            <article key={record.title}>
                                <ScanLine size={18} />
                                <div>
                                    <strong>{record.title}</strong>
                                    <small>{record.meta}</small>
                                </div>
                                <span>{record.status}</span>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
