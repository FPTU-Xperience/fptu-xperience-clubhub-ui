import { useEffect, useState } from 'react';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import { publishClubShape } from '../../profile-page/cover-cosmetics';

export default function ClubShapeUploadModal({ workspace, onClose, onPublished }) {
    const [file, setFile] = useState(null);
    const [assetUrl, setAssetUrl] = useState('');
    const [label, setLabel] = useState('');
    const [cost, setCost] = useState('100');
    const [error, setError] = useState('');
    useEffect(() => {
        setAssetUrl('');
        if (!file) return;
        let active = true;
        const reader = new FileReader();
        reader.onload = () => {
            if (active) setAssetUrl(String(reader.result));
        };
        reader.onerror = () => {
            if (active) setError('Không thể đọc ảnh shape.');
        };
        const validate = async () => {
            let bitmap;
            try {
                bitmap = await createImageBitmap(file);
                if (!active) return;
                if (bitmap.width > 4096 || bitmap.height > 4096) throw new Error('Ảnh shape tối đa 4096 × 4096 pixel.');
                const canvas = document.createElement('canvas');
                canvas.width = bitmap.width;
                canvas.height = bitmap.height;
                const context = canvas.getContext('2d');
                context.drawImage(bitmap, 0, 0);
                const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
                let transparent = false;
                for (let i = 3; i < pixels.length; i += 4) {
                    if (pixels[i] < 255) {
                        transparent = true;
                        break;
                    }
                }
                if (!transparent) throw new Error('Shape cần PNG có nền trong suốt để nằm đè lên ảnh nền.');
                reader.readAsDataURL(file);
            } catch (issue) {
                if (active) setError(issue.message || 'Không thể đọc ảnh PNG.');
            } finally {
                bitmap?.close();
            }
        };
        validate();
        return () => {
            active = false;
            reader.onload = null;
            reader.onerror = null;
            if (reader.readyState === 1) reader.abort();
        };
    }, [file]);
    const submit = (event) => {
        event.preventDefault();
        if (!assetUrl) return;
        try {
            publishClubShape({
                clubId: workspace.clubId,
                clubName: workspace.name || workspace.clubName || workspace.clubCode,
                label,
                cost: Number(cost),
                assetUrl,
            });
            onPublished();
        } catch (issue) {
            setError(
                issue.name === 'QuotaExceededError' ? 'Bộ nhớ thiết bị đã đầy. Hãy dùng ảnh nhỏ hơn.' : issue.message,
            );
        }
    };
    return (
        <V2Modal title="Thêm shape riêng của CLB" onClose={onClose} wide>
            <form className="v2-club-shape-form" onSubmit={submit}>
                <p>
                    Upload thiết kế riêng của CLB để thành viên đổi điểm và dùng trên ảnh bìa. Shape chung luôn miễn
                    phí.
                </p>
                <label>
                    Tên shape
                    <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} required />
                </label>
                <label>
                    Điểm cần đổi
                    <input
                        type="number"
                        min={1}
                        max={100000}
                        step={1}
                        value={cost}
                        onChange={(event) => setCost(event.target.value)}
                        required
                    />
                </label>
                <label>
                    Ảnh shape
                    <input
                        type="file"
                        accept="image/png"
                        onChange={(event) => {
                            const selected = event.target.files?.[0];
                            event.target.value = '';
                            setAssetUrl('');
                            setError('');
                            if (!selected) {
                                setFile(null);
                                return;
                            }
                            if (selected.type !== 'image/png' || selected.size > 1024 * 1024) {
                                setFile(null);
                                setError('Chọn PNG nền trong suốt tối đa 1 MB.');
                                return;
                            }
                            setFile(selected);
                        }}
                    />
                </label>
                <small>
                    PNG nền trong suốt · Tối đa 1 MB, 4096 × 4096 pixel. Thành viên có thể chỉnh vị trí và kích thước
                    trên ảnh bìa. Dữ liệu đang lưu tạm trên thiết bị.
                </small>
                {assetUrl && (
                    <div className="v2-club-shape-preview">
                        <ProfileCoverArt color="horizon" shape="club-preview" shapeAssetUrl={assetUrl} />
                    </div>
                )}
                {error && (
                    <p className="v2-profile-form-error" role="alert">
                        {error}
                    </p>
                )}
                <footer>
                    <button type="button" className="v2-button" onClick={onClose}>
                        Hủy
                    </button>
                    <button type="submit" className="v2-button v2-button--primary" disabled={!assetUrl}>
                        Thêm vào Kho quà
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
