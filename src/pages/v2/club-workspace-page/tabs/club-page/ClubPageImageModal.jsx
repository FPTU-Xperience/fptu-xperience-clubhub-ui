import { Upload } from 'lucide-react';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import ImagePicker from '../../../../../components/media/ImagePicker';

export default function ClubPageImageModal({ kind, value, file, onChange, saving, error, onClose, onSave }) {
    const cover = kind === 'cover';
    return (
        <V2Modal title={cover ? 'Đổi ảnh bìa CLB' : 'Đổi logo CLB'} onClose={onClose} wide={cover}>
            <form
                className={`club-page-modal-form club-page-image-form ${cover ? 'is-cover' : 'is-logo'}`}
                onSubmit={onSave}
                aria-busy={saving}
            >
                <p>
                    {cover
                        ? 'Chọn ảnh ngang để giới thiệu không gian và hoạt động của CLB.'
                        : 'Chọn logo rõ nét để mọi người dễ nhận ra CLB.'}
                </p>
                <ImagePicker
                    label={cover ? 'Ảnh bìa' : 'Logo'}
                    value={value}
                    file={file}
                    onChange={onChange}
                    disabled={saving}
                    hint={`${cover ? 'Nên dùng ảnh ngang tỉ lệ 3:1' : 'Nên dùng ảnh vuông'} · JPG, PNG, WebP · tối đa 5 MB`}
                />
                {error && (
                    <div className="club-page-modal-error" role="alert">
                        {error}
                    </div>
                )}
                <footer>
                    <button type="button" className="v2-button" onClick={onClose} disabled={saving}>
                        Hủy
                    </button>
                    <button type="submit" className="v2-button v2-button--primary" disabled={saving || !file}>
                        <Upload size={16} aria-hidden="true" />
                        {saving ? 'Đang tải và lưu…' : cover ? 'Lưu ảnh bìa' : 'Lưu logo'}
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
