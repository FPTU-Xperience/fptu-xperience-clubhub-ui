import { ArrowUpRight } from 'lucide-react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function FinanceTab() {
    return (
        <WorkspaceTabLayout
            title="Tài chính"
            description="Quản lý các khoản thu chi của CLB rõ ràng."
            action="Xem giao dịch"
            records={workspacePreviewRecords['Tài chính']}
        >
            {(records) => (
                <section className="v2-preview-operation">
                    <header>
                        <span>HẠNG MỤC</span>
                        <span>TRẠNG THÁI</span>
                        <span>GIÁ TRỊ</span>
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
