import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import { Camera, Eye, Pencil } from 'lucide-react';
import { useActivityDetail } from '../../../activity-data';
import PageState from '../../../../../components/v2/PageState';
import ActivityProfileLayout, {
    ActivityOverview,
} from '../../../../../components/v2/activity-detail/ActivityProfileLayout';
import ActivityAttendance from '../../../../../components/v2/activity-detail/ActivityAttendance';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import CoverImageModal from '../../../../../components/media/CoverImageModal';
import ActivityResourceEditor from './ActivityResourceEditor';
import { saveActivityResource } from '../../../../../services/activity-resources';

const tabs = [
    ['overview', 'Tổng quan'],
    ['documents', 'Tài liệu'],
    ['media', 'Media'],
    ['attendance', 'Điểm danh'],
];
const localDateTime = (value) => {
    const date = new Date(value || '');
    return Number.isFinite(date.getTime())
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : '';
};

export default function ActivityManagementPage({ api, sessionKey, activityId, workspace, manager, base }) {
    const { user } = useAuth();
    const result = useActivityDetail(api, sessionKey, manager ? activityId : null);
    const activity = result.data;
    const [tab, setTab] = useState('overview');
    const [editing, setEditing] = useState(false);
    const [coverOpen, setCoverOpen] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverUrl, setCoverUrl] = useState('');
    const [drafts, setDrafts] = useState([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const objectUrls = useRef(new Set());
    const alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);
    useEffect(() => {
        if (!coverFile) {
            setCoverUrl('');
            return undefined;
        }
        const url = URL.createObjectURL(coverFile);
        setCoverUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [coverFile]);
    const addDrafts = (rows) => {
        const prepared = rows.map((row) => {
            const previewUrl = row.file ? URL.createObjectURL(row.file) : '';
            if (previewUrl) objectUrls.current.add(previewUrl);
            return {
                ...row,
                id: crypto.randomUUID(),
                draft: true,
                previewUrl,
                url: row.url || '',
                mimeType: row.mimeType || '',
            };
        });
        setDrafts((current) => [...current, ...prepared]);
    };
    const removeDraft = (id) =>
        setDrafts((current) =>
            current.filter((row) => {
                if (row.id !== id) return true;
                if (row.previewUrl) {
                    URL.revokeObjectURL(row.previewUrl);
                    objectUrls.current.delete(row.previewUrl);
                }
                return false;
            }),
        );
    const saveCore = async (event) => {
        event.preventDefault();
        if (busy) return;
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const start = new Date(values.startTime);
        const end = new Date(values.endTime);
        if (!(end > start)) {
            setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
            return;
        }
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await api.updateActivity(activity.id, {
                title: values.title.trim(),
                description: values.description.trim(),
                startTimeUtc: start.toISOString(),
                endTimeUtc: end.toISOString(),
                location: values.location.trim(),
            });
            if (alive.current) {
                setEditing(false);
                setNotice('Đã lưu thông tin hoạt động.');
                result.retry();
            }
        } catch (issue) {
            if (alive.current) setError(issue.message || 'Không thể lưu hoạt động.');
        } finally {
            if (alive.current) setBusy(false);
        }
    };
    const saveCover = async (event, selectedFile = coverFile) => {
        event.preventDefault();
        if (!selectedFile || busy) return;
        setCoverFile(selectedFile);
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const url = await api.uploadPublicImage(selectedFile, 'activity-cover', activity.id);
            await api.updateActivityCoverImage(activity.id, url);
            if (alive.current) {
                setCoverOpen(false);
                setCoverFile(null);
                setNotice('Đã lưu ảnh bìa.');
                result.retry();
                return url;
            }
        } catch (issue) {
            if (alive.current)
                setError(
                    issue.status === 404
                        ? 'Máy chủ chưa hỗ trợ lưu ảnh bìa hoạt động. Ảnh mới chưa được lưu.'
                        : issue.message || 'Không thể lưu ảnh bìa.',
                );
        } finally {
            if (alive.current) setBusy(false);
        }
    };
    const saveResources = async (rows) => {
        if (
            busy ||
            !activity.resourceCapabilities.canManage ||
            (rows.some((row) => row.file) && !activity.resourceCapabilities.canUpload)
        )
            return;
        setBusy(true);
        setError('');
        setNotice('');
        let saved = 0;
        try {
            for (const row of rows) {
                await saveActivityResource(api, activity.id, row);
                if (!alive.current) return;
                removeDraft(row.id);
                saved++;
            }
            setNotice(`Đã lưu ${saved} tài nguyên.`);
        } catch (issue) {
            if (alive.current)
                setError(
                    `${saved ? `Đã lưu ${saved} tài nguyên. ` : ''}${issue.message || 'Không thể lưu tài nguyên còn lại.'}`,
                );
        } finally {
            if (alive.current) {
                setBusy(false);
                if (saved) result.retry();
            }
        }
    };
    if (!manager || (activity && String(activity.clubId) !== String(workspace.clubId)))
        return <PageState status="forbidden" title="Bạn không có quyền quản lý hoạt động này" />;
    if (result.status !== 'populated')
        return (
            <PageState
                status={result.status}
                onRetry={result.retry}
                title={result.status === 'not-found' ? 'Không tìm thấy hoạt động' : undefined}
            />
        );
    const displayed = { ...activity, clubName: workspace.name, coverImageUrl: coverUrl || activity.coverImageUrl };
    const canSaveResources =
        activity.resourceCapabilities.canManage &&
        (!drafts.some((row) => row.file && (tab === 'documents' ? row.kind === 'DOCUMENT' : row.kind !== 'DOCUMENT')) ||
            activity.resourceCapabilities.canUpload);
    return (
        <div className="v2-activity-management-page">
            <Link className="v2-text-link" to={`${base}/activities`}>
                ← Danh sách hoạt động
            </Link>
            {notice && (
                <p className="v2-activity-profile-notice" role="status">
                    {notice}
                </p>
            )}
            {error && !editing && !coverOpen && (
                <p className="v2-activity-profile-error" role="alert">
                    {error}
                </p>
            )}
            {coverFile && !coverOpen && (
                <p className="v2-activity-profile-notice">
                    Ảnh bìa đang được xem trước và chưa lưu.{' '}
                    <button className="v2-button" type="button" onClick={() => setCoverOpen(true)}>
                        Tiếp tục chỉnh ảnh
                    </button>
                </p>
            )}
            <ActivityProfileLayout
                activity={displayed}
                preview={Boolean(coverUrl)}
                tabs={tabs}
                tab={tab}
                onTabChange={setTab}
                actions={
                    <>
                        <Link
                            className="v2-button"
                            to={`/v2/activities/${activity.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Eye size={15} />
                            Xem trang công khai
                        </Link>
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            onClick={() => {
                                setError('');
                                setEditing(true);
                            }}
                            disabled={busy}
                        >
                            <Pencil size={15} />
                            Chỉnh sửa
                        </button>
                    </>
                }
                coverAction={
                    <button
                        className="v2-button"
                        type="button"
                        onClick={() => {
                            setError('');
                            setCoverOpen(true);
                        }}
                        disabled={busy}
                    >
                        <Camera size={15} />
                        Đổi ảnh bìa
                    </button>
                }
            >
                {tab === 'overview' && (
                    <ActivityOverview
                        activity={activity}
                        clubLink={
                            <Link className="v2-button" to={`/v2/clubs/${workspace.clubCode}`}>
                                Xem CLB
                            </Link>
                        }
                    />
                )}
                {['documents', 'media'].includes(tab) && (
                    <ActivityResourceEditor
                        key={tab}
                        kind={tab === 'documents' ? 'DOCUMENT' : 'MEDIA'}
                        resources={activity.resources}
                        drafts={drafts}
                        onAdd={addDrafts}
                        onRemove={removeDraft}
                        onSave={saveResources}
                        canSave={canSaveResources}
                        busy={busy}
                    />
                )}
                {tab === 'attendance' && (
                    <div className="v2-activity-profile-panel">
                        <ActivityAttendance key={`${sessionKey}:${activity.id}`} activity={activity} manager />
                    </div>
                )}
            </ActivityProfileLayout>
            {editing && (
                <V2Modal title="Chỉnh sửa hoạt động" onClose={() => !busy && setEditing(false)} wide>
                    <form className="v2-activity-edit-form" onSubmit={saveCore}>
                        <label>
                            Tên hoạt động
                            <input name="title" defaultValue={activity.title} required maxLength={120} />
                        </label>
                        <div className="v2-activity-edit-pair">
                            <label>
                                Bắt đầu
                                <input
                                    name="startTime"
                                    type="datetime-local"
                                    defaultValue={localDateTime(activity.startTime)}
                                    required
                                />
                            </label>
                            <label>
                                Kết thúc
                                <input
                                    name="endTime"
                                    type="datetime-local"
                                    defaultValue={localDateTime(activity.endTime)}
                                    required
                                />
                            </label>
                        </div>
                        <label>
                            Địa điểm
                            <input name="location" defaultValue={activity.location} required maxLength={255} />
                        </label>
                        <label>
                            Mô tả
                            <textarea
                                name="description"
                                defaultValue={activity.description}
                                required
                                rows={5}
                                maxLength={1000}
                            />
                        </label>
                        {error && (
                            <p className="v2-activity-profile-error" role="alert">
                                {error}
                            </p>
                        )}
                        <footer>
                            <button
                                className="v2-button"
                                type="button"
                                onClick={() => setEditing(false)}
                                disabled={busy}
                            >
                                Hủy
                            </button>
                            <button className="v2-button v2-button--primary" disabled={busy}>
                                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
                            </button>
                        </footer>
                    </form>
                </V2Modal>
            )}
            {coverOpen && (
                <CoverImageModal
                    kind="activity"
                    identity={activity.id}
                    storageKey={
                        user?.id != null ? `clubhub:v2:graphic-banner:${user.id}:activity:${activity.id}` : null
                    }
                    title="Ảnh bìa hoạt động"
                    value={activity.coverImageUrl}
                    file={coverFile}
                    onChange={setCoverFile}
                    saving={busy}
                    error={error}
                    onClose={() => {
                        if (!busy) {
                            setCoverOpen(false);
                            setCoverFile(null);
                        }
                    }}
                    onSave={saveCover}
                />
            )}
        </div>
    );
}
