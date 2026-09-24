import { ArrowUpRight } from 'lucide-react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function ReportsTab() {
    return (
        <WorkspaceTabLayout
            title="Báo cáo"
            description="Theo dõi các báo cáo và cột mốc của CLB."
            action="Tạo báo cáo"
            records={workspacePreviewRecords['Báo cáo']}
        >
            {(records) => (
                <section className="v2-preview-operation">
                    <header>
                        <span>BÁO CÁO</span>
                        <span>TRẠNG THÁI</span>
                        <span>HẠN NỘP</span>
                    </header>
                    {records.map((record) => (
                        <article key={record.title}>
                            <div>
                                <strong>{record.title}</strong>
                                <small>{record.meta}</small>
                            </div>
                            <span>{record.status}</span>
                            <em>{record.tag}</em>
                            <button type="button" aria-label={`Xem ${record.title}`}>
                                <ArrowUpRight size={18} />
                            </button>
                        </article>
                    ))}
                </section>
            )}
        </WorkspaceTabLayout>
    );
}
