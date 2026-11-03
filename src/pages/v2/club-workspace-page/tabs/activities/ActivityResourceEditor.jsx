import { useState } from 'react';
import { Link2, Upload, X } from 'lucide-react';
import ActivityResources from '../../../../../components/v2/activity-detail/ActivityResources';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import {
    safeResourceUrl,
    validateActivityFile,
} from '../../../../../components/v2/activity-detail/activity-resources-data';

export default function ActivityResourceEditor({ kind, resources, drafts, onAdd, onRemove, onSave, canSave, busy, capabilities }) {
    const canManage = capabilities?.canManage === true;
    const canUpload = canManage && capabilities?.canUpload === true && capabilities.supportedKinds?.includes(kind);
    const canLink = canManage && capabilities.supportedKinds?.includes('EMBED');
    const [linkOpen, setLinkOpen] = useState(false);
    const [fileOpen, setFileOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const [visibility, setVisibility] = useState(kind === 'DOCUMENT' ? 'CLUB' : 'PUBLIC');
    const visibleDrafts = drafts.filter((item) =>
        kind === 'MEDIA' ? item.kind !== 'DOCUMENT' : item.kind === 'DOCUMENT',
    );
    const selectFiles = (event) => {
        setError('');
        try {
            const files = [...event.target.files];
            const rows = files.map((file) => ({
                ...validateActivityFile(file, kind),
                file,
                title: file.name,
                visibility,
            }));
            setFiles(rows);
        } catch (issue) {
            setFiles([]);
            setError(issue.message);
        }
    };
    const addLink = (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        const url = safeResourceUrl(values.url);
        if (!url) {
            setError('Nhập một liên kết HTTPS hợp lệ.');
            return;
        }
        onAdd([
            {
                kind: 'EMBED',
                title: values.title.trim(),
                url,
                visibility: values.visibility,
                mimeType: '',
                sizeBytes: null,
            },
        ]);
        setLinkOpen(false);
        setError('');
    };
    return (
        <section>
            <div className="v2-activity-resource-toolbar">
                <div>
                    <h2>{kind === 'DOCUMENT' ? 'Tài liệu hoạt động' : 'Thư viện media'}</h2>
                    <p>
                        {kind === 'DOCUMENT'
                            ? 'PDF, Word, Excel · tối đa 20 MB/tệp'
                            : 'Ảnh tối đa 5 MB · video tối đa 100 MB'}
                    </p>
                </div>
                <div>
                    <select
                        className="v2-activity-resource-visibility"
                        aria-label="Phạm vi tài nguyên mới"
                        value={visibility}
                        onChange={(event) => setVisibility(event.target.value)}
                        disabled={busy}
                    >
                        <option value="CLUB">Trong CLB</option>
                        <option value="PUBLIC">Công khai</option>
                    </select>
                    <button type="button" className="v2-button" disabled={busy || !canManage || !canUpload} onClick={() => { setFiles([]); setTitle(''); setError(''); setFileOpen(true); }}>
                        <Upload size={15} /> {kind === 'DOCUMENT' ? 'Thêm tài liệu' : 'Thêm media'}
                    </button>
                    {kind === 'MEDIA' && (
                        <button
                            className="v2-button"
                            type="button"
                            onClick={() => {
                                setError('');
                                setLinkOpen(true);
                            }}
                            disabled={busy || !canLink}
                        >
                            <Link2 size={15} />
                            Thêm liên kết
                        </button>
                    )}
                </div>
            </div>
            {error && (
                <p className="v2-activity-profile-error" role="alert">
                    {error}
                </p>
            )}
            <ActivityResources resources={[...resources, ...drafts]} kind={kind} />
            {!!visibleDrafts.length && (
                <>
                    <div className="v2-activity-resource-editor-list">
                        {visibleDrafts.map((draft) => (
                            <div key={draft.id}>
                                <span>
                                    {draft.title} · {draft.visibility === 'PUBLIC' ? 'Công khai' : 'Trong CLB'} · Chưa
                                    lưu
                                </span>
                                <button
                                    type="button"
                                    aria-label={`Bỏ ${draft.title}`}
                                    onClick={() => onRemove(draft.id)}
                                    disabled={busy}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {!canSave && (
                        <p className="v2-activity-profile-notice">
                            Tài nguyên mới chưa được tải lên. Máy chủ chưa hỗ trợ lưu media và tài liệu cho hoạt động
                            này.
                        </p>
                    )}
                    <div className="v2-activity-resource-save">
                        <button
                            className="v2-button v2-button--primary"
                            type="button"
                            onClick={() => onSave(visibleDrafts)}
                            disabled={busy || !canSave}
                        >
                            {busy ? 'Đang lưu…' : 'Lưu tài nguyên'}
                        </button>
                    </div>
                </>
            )}
            {!canManage && <p role="status">Bạn không có quyền thêm tài nguyên cho hoạt động này.</p>}
            {canManage && !canUpload && <p role="status">Máy chủ chưa hỗ trợ tải tệp. Bạn có thể thêm liên kết media khi được cấp quyền.</p>}
            {fileOpen && (
                <V2Modal title={kind === 'DOCUMENT' ? 'Thêm tài liệu hoạt động' : 'Thêm media hoạt động'} onClose={() => setFileOpen(false)}>
                    <form className="v2-activity-edit-form" onSubmit={(event) => {
                        event.preventDefault();
                        if (!files.length || !canManage || !canUpload) return;
                        onAdd(files.map((row) => ({ ...row, visibility, title: files.length === 1 && title.trim() ? title.trim() : row.title })));
                        setFileOpen(false); setFiles([]);
                    }}>
                        <label>Tệp đính kèm<input type="file" multiple required accept={kind === 'DOCUMENT' ? '.pdf,.doc,.docx,.xls,.xlsx' : '.jpg,.jpeg,.png,.webp,.mp4,.webm'} onChange={selectFiles} /></label>
                        <label>Tiêu đề (cho một tệp)<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} /></label>
                        <label>Phạm vi chia sẻ<select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="CLUB">Trong CLB</option><option value="PUBLIC">Công khai</option></select></label>
                        {files.map((row) => <p key={row.title}>{row.title}</p>)}
                        <p>Tệp sẽ được xem trước. Chọn Lưu tài nguyên để tải lên và lưu vào hoạt động.</p>
                        {error && <p role="alert">{error}</p>}
                        <footer><button type="button" className="v2-button" onClick={() => setFileOpen(false)}>Hủy</button><button className="v2-button v2-button--primary" disabled={!files.length || !!error}>Thêm vào bản xem trước</button></footer>
                    </form>
                </V2Modal>
            )}
            {linkOpen && (
                <V2Modal title="Thêm liên kết" onClose={() => setLinkOpen(false)}>
                    <form className="v2-activity-edit-form" onSubmit={addLink}>
                        <label>
                            Tiêu đề
                            <input
                                name="title"
                                required
                                maxLength={160}
                                placeholder="Ví dụ: Video giới thiệu hoạt động"
                            />
                        </label>
                        <label>
                            Liên kết
                            <input name="url" type="url" required placeholder="https://…" />
                        </label>
                        <label>
                            Chia sẻ
                            <select name="visibility">
                                <option value="PUBLIC">Công khai</option>
                                <option value="CLUB">Trong CLB</option>
                            </select>
                        </label>
                        <p>YouTube có thể xem nhúng; các liên kết khác mở ở trang riêng.</p>
                        {error && (
                            <p role="alert" className="v2-activity-profile-error">
                                {error}
                            </p>
                        )}
                        <footer>
                            <button className="v2-button" type="button" onClick={() => setLinkOpen(false)}>
                                Hủy
                            </button>
                            <button className="v2-button v2-button--primary">Thêm liên kết</button>
                        </footer>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
