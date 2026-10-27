import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, LockKeyhole } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import ImagePicker from '../../../components/media/ImagePicker';
import ProfileAvatar from './ProfileAvatar';
import { getAvatarFrames } from './cover-cosmetics';
import { canUseCoverItem, readCoverInventory } from './cover-cosmetics';
import InitialsDesignControls from '../../../components/media/InitialsDesignControls';
import MediaEditorTabs from '../../../components/media/MediaEditorTabs';
import { normalizeInitialsDesign } from '../../../components/media/initials-design';
import './ProfileAvatarModal.scss';
import { canSyncPaletteAsset, resolvePaletteAsset } from './palette-asset';
import ProfilePaletteSync from './ProfilePaletteSync';
import './ShapeHslControls.scss';

export default function ProfileAvatarModal({ user, images, profile, onClose, onSave }) {
    const id = useId();
    const [tab, setTab] = useState(profile.avatarMode === 'default' ? 'default' : 'image');
    const [mode, setMode] = useState(profile.avatarMode || 'image');
    const [design, setDesign] = useState(() => normalizeInitialsDesign(profile.avatarDesign));
    const [frameUsePalette, setFrameUsePalette] = useState(profile.avatarFrameUsePalette || false);
    const [syncing, setSyncing] = useState(false);
    const draftProfile = { ...profile, avatarMode: mode, avatarDesign: design, avatarFrameUsePalette: frameUsePalette };
    const selectTab = (next) => {
        setTab(next);
        if (next !== 'frame') setMode(next);
    };
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [frame, setFrame] = useState(profile.avatarFrame || 'none');
    const selectedFrame = getAvatarFrames().find((item) => item.id === frame);
    const canSyncFrame = selectedFrame?.assetUrl ? canSyncPaletteAsset(selectedFrame.assetUrl) : !!selectedFrame?.color;
    const toggleFramePalette = async (checked) => {
        setFrameUsePalette(checked);
        setError('');
        if (!checked || !selectedFrame?.assetUrl) return;
        setSyncing(true);
        try {
            await resolvePaletteAsset(selectedFrame.assetUrl);
        } catch (issue) {
            setFrameUsePalette(false);
            setError(issue.message || 'Không thể đồng bộ màu khung.');
        } finally {
            setSyncing(false);
        }
    };
    const paletteId = profile.coverPreset === 'custom' ? profile.coverBackgroundColor : profile.coverPreset;
    const [inventory, setInventory] = useState(() => readCoverInventory(user));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (!file) {
            setPreview('');
            return;
        }
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    useEffect(() => {
        const refresh = () => setInventory(readCoverInventory(user));
        window.addEventListener('storage', refresh);
        window.addEventListener('clubhub:cover-rewards-updated', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('clubhub:cover-rewards-updated', refresh);
        };
    }, [user]);
    const owned = canUseCoverItem('frame', frame, inventory);
    const changed =
        (mode === 'image' && !!file) ||
        frame !== (profile.avatarFrame || 'none') ||
        mode !== (profile.avatarMode || 'image') ||
        JSON.stringify(design) !== JSON.stringify(normalizeInitialsDesign(profile.avatarDesign)) ||
        frameUsePalette !== (profile.avatarFrameUsePalette || false);
    const submit = async (event) => {
        event.preventDefault();
        if (saving || syncing || !changed || !owned) return;
        setSaving(true);
        setError('');
        try {
            await onSave({
                file: mode === 'image' ? file : null,
                frame,
                avatarMode: mode,
                avatarDesign: design,
                frameUsePalette,
            });
            onClose();
        } catch (issue) {
            setError(issue.message || 'Không thể lưu ảnh đại diện.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <V2Modal
            title="Tùy chỉnh ảnh đại diện"
            onClose={() => {
                if (!saving && !syncing) onClose();
            }}
            className="v2-avatar-modal"
            footer={
                <>
                    <button type="button" className="v2-button" disabled={saving || syncing} onClick={onClose}>
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form={`${id}-form`}
                        className="v2-button v2-button--primary"
                        disabled={saving || syncing || !changed || !owned}
                    >
                        {saving ? 'Đang lưu…' : 'Lưu ảnh đại diện'}
                    </button>
                </>
            }
        >
            <form id={`${id}-form`} className="v2-avatar-form" onSubmit={submit}>
                {tab !== 'image' && (
                    <div className="v2-avatar-preview">
                        <ProfileAvatar profile={draftProfile} imageUrl={preview || images.avatar} frame={frame} large />
                        <p>Xem trước ảnh đại diện và khung</p>
                    </div>
                )}
                <MediaEditorTabs
                    id={id}
                    items={[
                        ['image', 'Ảnh'],
                        ['default', 'Mặc định'],
                        ['frame', 'Khung'],
                    ]}
                    value={tab}
                    onChange={selectTab}
                    disabled={saving}
                    label="Tùy chỉnh ảnh đại diện"
                />
                {tab === 'frame' && (
                    <ProfilePaletteSync
                        colorId={paletteId}
                        target="khung avatar"
                        checked={canSyncFrame && frameUsePalette}
                        onChange={toggleFramePalette}
                        disabled={saving || syncing || !canSyncFrame}
                        reason={
                            syncing
                                ? 'Đang chuẩn bị SVG và đồng bộ màu…'
                                : !canSyncFrame
                                  ? frame === 'none'
                                      ? 'Chọn khung trong tab Khung để bật đồng bộ màu.'
                                      : 'Thiết kế này chưa hỗ trợ đồng bộ hai màu.'
                                  : undefined
                        }
                    />
                )}
                <div role="tabpanel" id={`${id}-panel-${tab}`} aria-labelledby={`${id}-${tab}`}>
                    {tab === 'image' ? (
                        <ImagePicker
                            label="Ảnh đại diện"
                            recommendedSize={{ width: 300, height: 300 }}
                            renderPreview={(image) => (
                                <span className="media-avatar-upload-preview">
                                    <ProfileAvatar profile={draftProfile} imageUrl={image} frame={frame} large />
                                </span>
                            )}
                            file={file}
                            value={images.avatar || profile.avatarUrl}
                            onChange={(next) => {
                                setFile(next);
                                setMode('image');
                            }}
                            disabled={saving}
                        />
                    ) : tab === 'default' ? (
                        <InitialsDesignControls value={design} onChange={setDesign} disabled={saving} />
                    ) : (
                        <div className="v2-avatar-frames">
                            {getAvatarFrames().map((item) => {
                                const unlocked = canUseCoverItem('frame', item.id, inventory);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-pressed={frame === item.id}
                                        disabled={saving || syncing}
                                        onClick={() => setFrame(item.id)}
                                    >
                                        <ProfileAvatar
                                            profile={draftProfile}
                                            imageUrl={preview || images.avatar}
                                            frame={item.id}
                                        />
                                        <strong>
                                            {item.label} {frame === item.id && <Check size={14} aria-hidden="true" />}
                                        </strong>
                                        <small>
                                            {item.free ? (
                                                'Miễn phí'
                                            ) : unlocked ? (
                                                'Đã sở hữu'
                                            ) : (
                                                <>
                                                    <LockKeyhole size={12} aria-hidden="true" />{' '}
                                                    {item.cost === 0
                                                        ? 'Miễn phí · Nhận tại CLB'
                                                        : `${item.cost} điểm tại CLB`}
                                                </>
                                            )}
                                        </small>
                                        {item.clubName && <small>{item.clubName} · Độc quyền CLB</small>}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                {!owned && (
                    <p className="v2-avatar-locked" role="status">
                        Bạn đang xem thử khung này. Đổi khung tại Kho quà của CLB để sử dụng.
                    </p>
                )}
                {tab === 'frame' && <Link to="/v2/my-clubs">Mở Kho quà tại CLB của tôi →</Link>}
                <p className="v2-avatar-note">
                    Ảnh tải lên được lưu trên máy chủ. Lựa chọn khung lưu theo tài khoản trên thiết bị này.
                </p>
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
            </form>
        </V2Modal>
    );
}
