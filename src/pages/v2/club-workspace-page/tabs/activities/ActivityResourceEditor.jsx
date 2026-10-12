import { useState } from 'react';
import { Link2, Upload, X } from 'lucide-react';
import ActivityResources from '../../../../../components/v2/activity-detail/ActivityResources';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import {
    safeResourceUrl,
    validateActivityFile,
} from '../../../../../components/v2/activity-detail/activity-resources-data';

export default function ActivityResourceEditor({ kind, resources, drafts, onAdd, onRemove, onSave, canSave, busy }) {
    const [linkOpen, setLinkOpen] = useState(false);
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
            onAdd(rows);
        } catch (issue) {
            setError(issue.message);
        }
        event.target.value = '';
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
                    <label className="v2-button v2-activity-resource-upload">
                        <Upload size={15} />
                        {kind === 'DOCUMENT' ? 'Thêm tài liệu' : 'Thêm media'}
                        <input
                            type="file"
                            multiple
                            accept={
                                kind === 'DOCUMENT' ? '.pdf,.doc,.docx,.xls,.xlsx' : '.jpg,.jpeg,.png,.webp,.mp4,.webm'
                            }
                            aria-label={kind === 'DOCUMENT' ? 'Chọn tài liệu hoạt động' : 'Chọn media hoạt động'}
                            onChange={selectFiles}
                            disabled={busy}
                        />
                    </label>
                    {kind === 'MEDIA' && (
                        <button
                            className="v2-button"
                            type="button"
                            onClick={() => {
                                setError('');
                                setLinkOpen(true);
                            }}
                            disabled={busy}
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
