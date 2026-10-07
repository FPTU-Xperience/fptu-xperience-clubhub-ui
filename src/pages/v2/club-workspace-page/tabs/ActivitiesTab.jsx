import { useState } from 'react';
import { ArrowUpRight, Plus } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import PageState from '../../../../components/v2/PageState';
import ActivityDetail from '../../../../components/v2/activity-detail/ActivityDetail';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import ImagePicker from '../../../../components/media/ImagePicker';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function ActivitiesTab({ manager = false, dashboard, workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [imageActivity, setImageActivity] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const activities = dashboard.data?.activities || [];
    const result = {
        status: dashboard.status === 'ready'
            ? dashboard.data?.activityAvailable ? (activities.length ? 'populated' : 'empty') : 'error'
            : dashboard.status,
        data: activities,
        retry: dashboard.retry,
    };

    const createActivity = async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        setSubmitting(true);
        setSubmitError('');
        try {
            await api.createActivity({
                clubId: Number(clubId),
                clubName: workspace.name,
                title: values.title.trim(),
                description: values.description.trim(),
                startTimeUtc: new Date(values.startTime).toISOString(),
                endTimeUtc: new Date(values.endTime).toISOString(),
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

    const saveCover = async (event) => {
        event.preventDefault();
        if (!manager || !imageActivity || !coverFile || submitting) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const url = await api.uploadPublicImage(coverFile, 'activity-cover', imageActivity.id);
            await api.updateActivityCoverImage(imageActivity.id, url);
            setImageActivity(null);
            setCoverFile(null);
            result.retry();
        } catch (error) {
            setSubmitError(error?.status === 404
                ? 'Máy chủ chưa hỗ trợ lưu ảnh hoạt động.'
                : error?.message || 'Không thể lưu ảnh hoạt động.');
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
                                            {record.coverImageUrl && <img className="v2-workspace-event-cover" src={record.coverImageUrl} alt="" />}
                                            <span>
                                                {record.status === 'COMPLETED' ? 'Đã hoàn thành' : record.status === 'LIVE' ? 'Đang diễn ra' : 'Đã lên lịch'}
                                                {record.location ? ` · ${record.location}` : ''}
                                            </span>
                                            <h2>{record.title}</h2>
                                            <p>{record.description || 'Thông tin chi tiết đang được cập nhật.'}</p>
                                            {manager && <button className="v2-workspace-image-action" type="button" onClick={() => { setImageActivity(record); setCoverFile(null); setSubmitError(''); }}>Ảnh hoạt động</button>}
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
            <ActivityDetail activity={selected ? { ...selected, clubCode: workspace?.clubCode } : null} onClose={() => setSelected(null)} />
            {imageActivity && <V2Modal title={`Ảnh hoạt động: ${imageActivity.title}`} onClose={() => !submitting && setImageActivity(null)}>
                <form className="v2-workspace-activity-form" onSubmit={saveCover}>
                    <ImagePicker label="Ảnh bìa hoạt động" value={imageActivity.coverImageUrl} file={coverFile} onChange={setCoverFile} disabled={submitting} />
                    {submitError && <p className="v2-workspace-form-error" role="alert">{submitError}</p>}
                    <div><button className="v2-button" type="button" onClick={() => setImageActivity(null)} disabled={submitting}>Hủy</button><button className="v2-button v2-button--primary" disabled={submitting || !coverFile}>{submitting ? 'Đang lưu…' : 'Lưu ảnh'}</button></div>
                </form>
            </V2Modal>}
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
                            Thời gian kết thúc
                            <input name="endTime" type="datetime-local" required />
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
                                required
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
