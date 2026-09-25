import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function ClubPageTab() {
    return (
        <WorkspaceTabLayout
            title="Trang CLB"
            description="Cập nhật nội dung hiển thị công khai trên trang giới thiệu của CLB."
            action="Chỉnh sửa thông tin"
            records={workspacePreviewRecords['Trang CLB']}
        >
            {(records) => (
                <section className="v2-preview-settings">
                    {records.map((record) => (
                        <article key={record.title}>
                            <div>
                                <h2>{record.title}</h2>
                                <p>{record.meta}</p>
                            </div>
                            <button type="button" disabled>
                                Chỉnh sửa
                            </button>
                        </article>
                    ))}
                </section>
            )}
        </WorkspaceTabLayout>
    );
}
