import { ArrowUpRight } from 'lucide-react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function QuestsTab() {
    return (
        <WorkspaceTabLayout
            title="Nhiệm vụ & đóng góp"
            description="Ghi nhận những đóng góp tạo nên hành trình của CLB."
            action="Tạo nhiệm vụ"
            records={workspacePreviewRecords['Nhiệm vụ & đóng góp']}
        >
            {(records) => (
                <section className="v2-preview-operation">
                    <header>
                        <span>NHIỆM VỤ</span>
                        <span>TRẠNG THÁI</span>
                        <span>ĐIỂM</span>
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
