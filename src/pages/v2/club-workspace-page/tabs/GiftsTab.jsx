import { Gift } from 'lucide-react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function GiftsTab() {
    return (
        <WorkspaceTabLayout
            title="Kho quà"
            description="Khám phá những phần quà dành cho thành viên."
            action="Quản lý kho quà"
            records={workspacePreviewRecords['Kho quà']}
        >
            {(records) => (
                <div className="v2-preview-gifts">
                    {records.map((record, index) => (
                        <article key={record.title}>
                            <div className={`v2-preview-gift-art art-${index}`}>
                                <Gift size={30} />
                            </div>
                            <span>{record.status}</span>
                            <h2>{record.title}</h2>
                            <p>{record.meta}</p>
                            <button type="button" disabled>
                                Đổi {record.tag}
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
