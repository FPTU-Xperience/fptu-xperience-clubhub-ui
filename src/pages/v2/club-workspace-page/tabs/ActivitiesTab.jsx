import { useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import PageState from '../../../../components/v2/PageState';
import ActivityDetail from '../../../../components/v2/activity-detail/ActivityDetail';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import { useActivityFeed } from '../../activity-data';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function ActivitiesTab({ manager = false }) {
    const { clubId } = useParams();
    const { api, user } = useAuth();
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const result = useActivityFeed(api, user?.id || user?.email || 'anonymous', clubId);

    const createActivity = async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.createActivity({
                clubId,
                title: values.title.trim(),
                description: values.description.trim(),
                startTimeUtc: new Date(values.startTime).toISOString(),
                location: values.location.trim(),
            });
            setCreating(false);
            result.retry();
        } catch (error) {
            setSubmitError(error?.message || 'Không thể tạo hoạt động. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <WorkspaceTabLayout
                title="Hoạt động của CLB"
                description="Theo dõi lịch hoạt động và những điều sắp diễn ra."
                action={
                    manager ? (
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            onClick={() => setCreating(true)}
                        >
                            <Plus size={16} /> Tạo hoạt động
                        </button>
                    ) : null
                }
                records={result.data || []}
            >
                {(records) =>
                    result.status === 'populated' ? (
                        <div className="v2-preview-events">
                            {records.map((record) => {
                                const date = new Date(record.startTime);
                                return (
                                    <article key={record.id}>
                                        <time>
                                            <strong>
                                                {Number.isNaN(date.getTime())
                                                    ? '—'
                                                    : String(date.getDate()).padStart(2, '0')}
                                            </strong>
                                            <span>
                                                {Number.isNaN(date.getTime())
                                                    ? 'ĐANG CẬP NHẬT'
                                                    : `THÁNG ${date.getMonth() + 1}`}
                                            </span>
                                        </time>
                                        <div>
                                            <span>
                                                {record.status === 'LIVE' ? 'Đang diễn ra' : 'Sắp diễn ra'}
                                                {record.location ? ` · ${record.location}` : ''}
                                            </span>
                                            <h2>{record.title}</h2>
                                            <p>{record.description || 'Thông tin chi tiết đang được cập nhật.'}</p>
                                        </div>
                                        <button
                                            type="button"
                                            aria-label={`Xem ${record.title}`}
                                            onClick={() => setSelected(record)}
                                        >
                                            <ArrowUpRight size={20} />
                                        </button>
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <PageState
                            status={result.status}
                            onRetry={result.retry}
                            title={result.status === 'empty' ? 'Chưa có hoạt động' : undefined}
                        />
                    )
                }
            </WorkspaceTabLayout>
            <ActivityDetail activity={selected} onClose={() => setSelected(null)} />
            {creating && (
                <V2Modal title="Tạo hoạt động nội bộ" onClose={() => !submitting && setCreating(false)}>
                    <form className="v2-workspace-activity-form" onSubmit={createActivity}>
                        <label>
                            Tên hoạt động
                            <input
                                name="title"
                                required
                                maxLength="120"
                                placeholder="Ví dụ: Workshop thiết kế sản phẩm"
                            />
                        </label>
                        <label>
                            Thời gian bắt đầu
                            <input name="startTime" type="datetime-local" required />
                        </label>
                        <label>
                            Địa điểm
                            <input name="location" required placeholder="Ví dụ: Innovation Hub" />
                        </label>
                        <label>
                            Mô tả
                            <textarea
                                name="description"
                                rows="4"
                                maxLength="1000"
                                placeholder="Mục tiêu, nội dung và lưu ý cho người tham gia"
                            />
                        </label>
                        {submitError && (
                            <p className="v2-workspace-form-error" role="alert">
                                {submitError}
                            </p>
                        )}
                        <div>
                            <button
                                className="v2-button"
                                type="button"
                                disabled={submitting}
                                onClick={() => setCreating(false)}
                            >
                                Hủy
                            </button>
                            <button className="v2-button v2-button--primary" disabled={submitting}>
                                {submitting ? 'Đang tạo…' : 'Tạo hoạt động'}
                            </button>
                        </div>
                    </form>
                </V2Modal>
            )}
        </>
    );
}
