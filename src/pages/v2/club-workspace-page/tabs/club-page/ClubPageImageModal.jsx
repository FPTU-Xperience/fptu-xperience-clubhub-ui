import CoverImageModal from '../../../../../components/media/CoverImageModal';
import { Upload } from 'lucide-react';
import { useId, useState } from 'react';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import ImagePicker from '../../../../../components/media/ImagePicker';
import InitialsDesignControls from '../../../../../components/media/InitialsDesignControls';
import MediaEditorTabs from '../../../../../components/media/MediaEditorTabs';
import {
    DEFAULT_INITIALS_DESIGN,
    initialsDesignStyle,
    initialsTextStyle,
    nameInitials,
    createInitialsLogoFile,
} from '../../../../../components/media/initials-design';

export default function ClubPageImageModal({
    kind,
    value,
    file,
    onChange,
    saving,
    error,
    onClose,
    onSave,
    clubName,
    clubIdentity,
    graphicStorageKey,
}) {
    const cover = kind === 'cover';
    const id = useId();
    const [tab, setTab] = useState('image');
    const [design, setDesign] = useState({ ...DEFAULT_INITIALS_DESIGN });
    const [generating, setGenerating] = useState(false);
    const [generateError, setGenerateError] = useState('');
    const busy = saving || generating;
    const initials = nameInitials(clubName);
    const submit = async (event) => {
        event.preventDefault();
        if (busy) return;
        setGenerating(true);
        setGenerateError('');
        try {
            const generated = cover || tab === 'image' ? file : await createInitialsLogoFile(initials, design);
            await onSave(event, generated);
        } catch (issue) {
            setGenerateError(issue.message || 'Không thể tạo logo mặc định.');
        } finally {
            setGenerating(false);
        }
    };
    if (cover)
        return (
            <CoverImageModal
                kind="club"
                identity={clubIdentity ?? clubName}
                storageKey={graphicStorageKey}
                title="Đổi ảnh bìa CLB"
                value={value}
                file={file}
                onChange={onChange}
                saving={saving}
                error={error}
                onClose={onClose}
                onSave={onSave}
            />
        );
    return (
        <V2Modal
            title={cover ? 'Đổi ảnh bìa CLB' : 'Đổi logo CLB'}
            onClose={() => {
                if (!busy) onClose();
            }}
            wide={cover}
        >
            <form
                className={`club-page-modal-form club-page-image-form ${cover ? 'is-cover' : 'is-logo'}`}
                onSubmit={submit}
                aria-busy={busy}
            >
                <p>
                    {cover
                        ? 'Chọn ảnh ngang để giới thiệu không gian và hoạt động của CLB.'
                        : 'Chọn logo rõ nét để mọi người dễ nhận ra CLB.'}
                </p>
                {!cover && (
                    <MediaEditorTabs
                        id={id}
                        items={[
                            ['image', 'Ảnh'],
                            ['default', 'Mặc định'],
                        ]}
                        value={tab}
                        onChange={setTab}
                        disabled={busy}
                        label="Tùy chỉnh logo CLB"
                    />
                )}
                <div
                    {...(!cover
                        ? { role: 'tabpanel', id: `${id}-panel-${tab}`, 'aria-labelledby': `${id}-${tab}` }
                        : {})}
                >
                    {cover || tab === 'image' ? (
                        <ImagePicker
                            label={cover ? 'Ảnh bìa' : 'Logo'}
                            value={value}
                            file={file}
                            onChange={onChange}
                            disabled={busy}
                            recommendedSize={{ width: cover ? 1200 : 300, height: 300 }}
                            hint={`${cover ? 'Đề xuất ảnh ngang 1200 × 300px (4:1)' : 'Đề xuất logo vuông 300 × 300px (1:1)'} · JPG, PNG, WebP · tối đa 5 MB`}
                        />
                    ) : (
                        <div className="club-logo-default-editor">
                            <div className="media-cover-guide">
                                <div className="media-cover-guide-heading">
                                    <strong>Kích thước đề xuất</strong>
                                    <span>300 × 300px</span>
                                </div>
                                <div
                                    className="media-cover-guide-frame is-square club-logo-default-preview"
                                    style={initialsDesignStyle(design)}
                                    role="img"
                                    aria-label={`Xem trước logo mặc định ${initials}`}
                                >
                                    <span className="club-logo-default-text" style={initialsTextStyle(design)}>
                                        {initials}
                                    </span>
                                </div>
                            </div>
                            <InitialsDesignControls value={design} onChange={setDesign} disabled={busy} />
                        </div>
                    )}
                </div>
                {(error || generateError) && (
                    <div className="club-page-modal-error" role="alert">
                        {error || generateError}
                    </div>
                )}
                <footer>
                    <button type="button" className="v2-button" onClick={onClose} disabled={busy}>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="v2-button v2-button--primary"
                        disabled={busy || ((cover || tab === 'image') && !file)}
                    >
                        <Upload size={16} aria-hidden="true" />
                        {busy ? 'Đang tải và lưu…' : cover ? 'Lưu ảnh bìa' : 'Lưu logo'}
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
