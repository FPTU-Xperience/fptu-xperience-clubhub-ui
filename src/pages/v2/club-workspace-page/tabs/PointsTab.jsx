import { Award } from 'lucide-react';
import { workspacePreviewRecords } from '../../workspace-preview-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function PointsTab() {
    return (
        <WorkspaceTabLayout
            title="Điểm & thành tích"
            description="Theo dõi dấu ấn và thành tích trong hành trình của bạn."
            action="Xem bảng điểm"
            records={workspacePreviewRecords['Điểm & thành tích']}
        >
            {(records) => (
                <div className="v2-preview-points">
                    <section>
                        <span>ĐIỂM ĐÓNG GÓP</span>
                        <strong>120</strong>
                        <p>+30 điểm so với tháng trước</p>
                        <div>
                            <i style={{ width: '68%' }} />
                        </div>
                        <small>680 / 1.000 điểm để đạt huy hiệu tiếp theo</small>
                    </section>
                    <div>
                        {records.slice(1).map((record) => (
                            <article key={record.title}>
                                <Award size={22} />
                                <div>
                                    <strong>{record.title}</strong>
                                    <small>{record.meta}</small>
                                </div>
                                <span>{record.tag}</span>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
