import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../../context/AuthContext';
import { Camera, Eye, Pencil } from 'lucide-react';
import { useActivityDetail } from '../../../activity-data';
import ActivityVisibilityControl from './ActivityVisibilityControl';
import PageState from '../../../../../components/v2/PageState';
import ActivityProfileLayout, {
    ActivityOverview,
} from '../../../../../components/v2/activity-detail/ActivityProfileLayout';
import ActivityAttendance from '../../../../../components/v2/activity-detail/ActivityAttendance';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import CoverImageModal from '../../../../../components/media/CoverImageModal';
import ActivityResourceEditor from './ActivityResourceEditor';
import { saveActivityResource } from '../../../../../services/activity-resources';
import ActivityResourceManagement from '../../../../../components/v2/activity-detail/ActivityResourceManagement';
import ActivityPublicationControl from './ActivityPublicationControl';
import ActivityStaffingPanel from '../../../../../components/v2/activity-detail/ActivityStaffingPanel';
import './ActivityEditing.scss';

const tabs = [
    ['overview', 'Tổng quan'],
    ['documents', 'Tài liệu'],
    ['media', 'Media'],
    ['assignments', 'Phân công'],
    ['recruitment', 'Tuyển dụng'],
    ['attendance', 'Điểm danh'],
];
const localDateTime = (value) => {
    const date = new Date(value || '');
    return Number.isFinite(date.getTime())
        ? new Intl.DateTimeFormat('sv-SE', {
              timeZone: 'Asia/Ho_Chi_Minh',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
          })
              .format(date)
              .replace(' ', 'T')
        : '';
};
const coreFields = (activity) => ({
    title: activity.title,
    description: activity.description,
    location: activity.location,
    startTime: localDateTime(activity.startTime),
    endTime: localDateTime(activity.endTime),
});

export default function ActivityManagementPage({ api, sessionKey, activityId, workspace, manager, base }) {
    const { user, clubAccess } = useAuth();
    const result = useActivityDetail(api, sessionKey, manager ? activityId : null);
    const activity = result.data;
    const [tab, setTab] = useState('overview');
    const [coreDraft, setCoreDraft] = useState(null);
    const [editorDraft, setEditorDraft] = useState(null);
    const editing = editorDraft !== null;
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
    const previewCore = (event) => {
        event.preventDefault();
        if (!editorDraft || busy) return;
        if (![editorDraft.title, editorDraft.description, editorDraft.location].every((value) => value.trim())) {
            setError('Vui lòng nhập tên, địa điểm và mô tả hoạt động.');
            return;
        }
        if (!(new Date(`${editorDraft.endTime}:00+07:00`) > new Date(`${editorDraft.startTime}:00+07:00`))) {
            setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
            return;
        }
        setCoreDraft({ ...editorDraft });
        setEditorDraft(null);
        setTab('overview');
        setError('');
        setNotice('');
    };
    const saveCore = async (event) => {
        event.preventDefault();
        if (busy || !coreDraft || activity.sourceApplicationId) return;
        const values = coreDraft;
        if (![values.title, values.description, values.location].every((value) => value.trim())) {
            setError('Vui lòng nhập tên, địa điểm và mô tả hoạt động.');
            return;
        }
        const start = new Date(`${values.startTime}:00+07:00`);
        const end = new Date(`${values.endTime}:00+07:00`);
        if (!(end > start)) {
            setError('Thời gian kết thúc phải sau thời gian bắt đầu.');
            return;
        }
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await api.updateActivity(activity.id, {
                expectedVersion: activity.version,
                title: values.title.trim(),
                description: values.description.trim(),
                startTimeUtc: start.toISOString(),
                endTimeUtc: end.toISOString(),
                location: values.location.trim(),
            });
            if (alive.current) {
                setCoreDraft(null);
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
            const updated = await api.updateActivityCoverImage(activity.id, url, activity.version);
            if (alive.current) {
                setCoverOpen(false);
                setCoverFile(null);
                setNotice('Đã lưu ảnh bìa.');
                result.retry();
                return updated.coverImageUrl;
            }
        } catch (issue) {
            if (alive.current)
                setError(
                    issue.status === 404
                        ? 'Máy chủ chưa hỗ trợ lưu ảnh bìa hoạt động. Ảnh mới chưa được lưu.'
                        : issue.message || 'Không thể lưu ảnh bìa.',
                );
            throw issue;
        } finally {
            if (alive.current) setBusy(false);
        }
    };
    const saveResources = async (rows) => {
        if (
            busy ||
            !activity.resourceCapabilities.canManage ||
            rows.some(
                (row) =>
                    !activity.resourceCapabilities.supportedKinds.includes(row.kind) ||
                    (row.file && !activity.resourceCapabilities.canUpload),
            )
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
    const displayed = {
        ...activity,
        ...(coreDraft || {}),
        clubName: workspace.name,
        coverImageUrl: coverUrl || activity.coverImageUrl,
        startTime: coreDraft ? (coreDraft.startTime ? `${coreDraft.startTime}:00+07:00` : '') : activity.startTime,
        endTime: coreDraft ? (coreDraft.endTime ? `${coreDraft.endTime}:00+07:00` : '') : activity.endTime,
    };
    const changeCore = (key, value) => {
        setEditorDraft((current) => ({ ...current, [key]: value }));
        setError('');
    };

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
            <div className="v2-activity-edit-layout">
                <div className="v2-activity-live-preview">
                    <ActivityProfileLayout
                        activity={displayed}
                        preview={Boolean(coverUrl || coreDraft)}
                        tabs={tabs}
                        tab={tab}
                        onTabChange={setTab}
                        actions={
                            <>
                                {activity.isPublished === true && (
                                    <Link
                                        className="v2-button"
                                        to={`/v2/activities/${activity.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Eye size={15} />
                                        Xem trang công khai
                                    </Link>
                                )}
                                <button
                                    className="v2-button v2-button--primary"
                                    type="button"
                                    onClick={() => {
                                        setError('');
                                        setNotice('');
                                        setEditorDraft({ ...(coreDraft || coreFields(activity)) });
                                        setTab('overview');
                                    }}
                                    disabled={busy || Boolean(activity.sourceApplicationId)}
                                >
                                    <Pencil size={15} />
                                    Chỉnh sửa
                                </button>
                            </>
                        }
                        beforeTabs={
                            <><ActivityVisibilityControl api={api} activity={activity}
                                disabled={busy || Boolean(coreDraft || editorDraft)} onSaved={() => result.retry()} />
                            <ActivityPublicationControl
                                api={api}
                                activity={activity}
                                access={clubAccess.find((item) => String(item.clubId) === String(activity.clubId))}
                                busy={busy}
                                hasUnsavedContent={Boolean(coreDraft || editorDraft || coverFile || drafts.length)}
                                onSaved={() => result.retry()}
                            />
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
                        {tab === 'overview' && <ActivityOverview activity={displayed} />}
                        {['documents', 'media'].includes(tab) && (
                            <>
                                <ActivityResourceEditor
                                    key={tab}
                                    kind={tab === 'documents' ? 'DOCUMENT' : 'MEDIA'}
                                    resources={activity.resources}
                                    drafts={drafts}
                                    onAdd={addDrafts}
                                    onRemove={removeDraft}
                                    onSave={saveResources}
                                    canSave={canSaveResources}
                                    capabilities={activity.resourceCapabilities}
                                    busy={busy}
                                />
                                {activity.resourceCapabilities.canManage && (
                                    <ActivityResourceManagement
                                        key={activity.id}
                                        api={api}
                                        activityId={activity.id}
                                        resources={activity.resources}
                                        onChanged={result.retry}
                                    />
                                )}
                            </>
                        )}
                        {['assignments', 'recruitment'].includes(tab) && (
                            <ActivityStaffingPanel
                                activityId={activity.id}
                                mode={tab}
                                manager
                                onChanged={result.retry}
                            />
                        )}
                        {tab === 'attendance' && (
                            <div className="v2-activity-profile-panel">
                                <ActivityAttendance key={`${sessionKey}:${activity.id}`} activity={activity} manager />
                            </div>
                        )}
                    </ActivityProfileLayout>
                    {coreDraft && (
                        <div className="v2-activity-preview-pending" aria-busy={busy}>
                            <div role="status">
                                <strong>Bản xem trước chưa lưu</strong>
                                <p>Kiểm tra nội dung bên trên trước khi lưu thay đổi.</p>
                            </div>
                            <div className="v2-activity-preview-pending-actions">
                                <button
                                    className="v2-button"
                                    type="button"
                                    disabled={busy}
                                    onClick={() => {
                                        setCoreDraft(null);
                                        setError('');
                                        setNotice('');
                                    }}
                                >
                                    Hủy
                                </button>
                                <button
                                    className="v2-button v2-button--primary"
                                    type="button"
                                    disabled={busy}
                                    onClick={saveCore}
                                >
                                    {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {editing && (
                <V2Modal
                    title="Chỉnh sửa hoạt động"
                    wide
                    onClose={() => {
                        if (!busy) {
                            setEditorDraft(null);
                            setError('');
                        }
                    }}
                >
                    <form className="v2-activity-edit-form" onSubmit={previewCore}>
                        <fieldset disabled={busy}>
                            <div className="v2-activity-edit-field">
                                <label htmlFor="activity-edit-title">Tên hoạt động</label>
                                <input
                                    id="activity-edit-title"
                                    name="title"
                                    value={editorDraft.title}
                                    onChange={(event) => changeCore('title', event.target.value)}
                                    required
                                    maxLength={120}
                                />
                            </div>
                            <div className="v2-activity-edit-pair">
                                <div className="v2-activity-edit-field">
                                    <label htmlFor="activity-edit-startTime">Bắt đầu (giờ Việt Nam)</label>
                                    <input
                                        id="activity-edit-startTime"
                                        name="startTime"
                                        type="datetime-local"
                                        value={editorDraft.startTime}
                                        onChange={(event) => changeCore('startTime', event.target.value)}
                                        required
                                    />
                                </div>
                                <div className="v2-activity-edit-field">
                                    <label htmlFor="activity-edit-endTime">Kết thúc (giờ Việt Nam)</label>
                                    <input
                                        id="activity-edit-endTime"
                                        name="endTime"
                                        type="datetime-local"
                                        value={editorDraft.endTime}
                                        onChange={(event) => changeCore('endTime', event.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="v2-activity-edit-field">
                                <label htmlFor="activity-edit-location">Địa điểm</label>
                                <input
                                    id="activity-edit-location"
                                    name="location"
                                    value={editorDraft.location}
                                    onChange={(event) => changeCore('location', event.target.value)}
                                    required
                                    maxLength={255}
                                />
                            </div>
                            <div className="v2-activity-edit-field">
                                <label htmlFor="activity-edit-description">Mô tả</label>
                                <textarea
                                    id="activity-edit-description"
                                    name="description"
                                    value={editorDraft.description}
                                    onChange={(event) => changeCore('description', event.target.value)}
                                    required
                                    rows={5}
                                    maxLength={1000}
                                />
                            </div>
                            {error && (
                                <p className="v2-activity-profile-error" role="alert">
                                    {error}
                                </p>
                            )}
                            <footer>
                                <button
                                    className="v2-button"
                                    type="button"
                                    onClick={() => {
                                        setEditorDraft(null);
                                        setError('');
                                        setNotice('');
                                    }}
                                    disabled={busy}
                                >
                                    Hủy
                                </button>
                                <button className="v2-button v2-button--primary" disabled={busy}>
                                    Xem trước
                                </button>
                            </footer>
                        </fieldset>
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
