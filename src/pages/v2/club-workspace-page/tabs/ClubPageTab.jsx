import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import ClubPagePreview from './club-page/ClubPagePreview';
import ClubPageInfoModal from './club-page/ClubPageInfoModal';
import ClubPageImageModal from './club-page/ClubPageImageModal';
import './ClubPageTab.scss';

function useImagePreview(file, savedUrl) {
    const [preview, setPreview] = useState(null);
    useEffect(() => {
        if (!file) {
            setPreview(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setPreview({ file, url });
        return () => URL.revokeObjectURL(url);
    }, [file]);
    return preview?.file === file ? preview?.url || savedUrl : savedUrl;
}

export default function ClubPageTab({ manager = false, workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const [club, setClub] = useState(null);
    const [profileDraft, setProfileDraft] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [editor, setEditor] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [modalError, setModalError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const requestVersion = useRef(0);
    const logo = useImagePreview(editor === 'logo' ? imageFile : null, club?.logoUrl);
    const cover = useImagePreview(editor === 'cover' ? imageFile : null, club?.coverImageUrl);
    const imageEditor = editor === 'logo' || editor === 'cover';
    const previewClub = club ? { ...club, ...profileDraft } : null;

    useEffect(() => {
        const version = ++requestVersion.current;
        setClub(null);
        setProfileDraft(null);
        setEditor(null);
        setImageFile(null);
        setError('');
        setNotice('');
        setModalError('');
        setLoading(true);
        setSaving(false);
        if (!clubId) {
            setLoading(false);
            return undefined;
        }
        api.getClub(clubId)
            .then((data) => {
                if (version === requestVersion.current) setClub(data);
            })
            .catch((issue) => {
                if (version === requestVersion.current) setError(issue?.message || 'Không thể tải thông tin CLB.');
            })
            .finally(() => {
                if (version === requestVersion.current) setLoading(false);
            });
        return () => {
            requestVersion.current++;
        };
    }, [api, clubId, attempt]);

    const openEditor = (section) => {
        if (!manager || saving) return;
        setImageFile(null);
        setModalError('');
        setNotice('');
        setEditor(section);
    };
    const closeEditor = () => {
        if (saving) return;
        setEditor(null);
        setImageFile(null);
        setModalError('');
    };
    const saveImage = async (event) => {
        event.preventDefault();
        if (!manager || saving || !imageFile || !imageEditor) return;
        const version = requestVersion.current;
        const field = editor === 'logo' ? 'logoUrl' : 'coverImageUrl';
        const label = editor === 'logo' ? 'logo' : 'ảnh bìa';
        setSaving(true);
        setModalError('');
        try {
            const url = await api.uploadPublicImage(imageFile, editor === 'logo' ? 'club-logo' : 'club-cover', clubId);
            if (version !== requestVersion.current) return;
            const images = { logoUrl: club.logoUrl ?? null, coverImageUrl: club.coverImageUrl ?? null, [field]: url };
            const updated = await api.updateClubPublicImages(clubId, images);
            if (version !== requestVersion.current) return;
            setClub((current) => ({ ...current, ...images, ...(updated || {}) }));
            setImageFile(null);
            setEditor(null);
            setNotice(`Đã cập nhật ${label} CLB.`);
        } catch (issue) {
            if (version !== requestVersion.current) return;
            setModalError(
                issue?.status === 404
                    ? 'Máy chủ chưa hỗ trợ lưu ảnh CLB. Ảnh đã chọn được giữ để bạn thử lại.'
                    : issue?.message || 'Không thể lưu ảnh. Vui lòng thử lại.',
            );
        } finally {
            if (version === requestVersion.current) setSaving(false);
        }
    };
    const previewInfo = (fields) => {
        if (!manager || saving || !club) return;
        setProfileDraft(fields);
        setEditor(null);
        setError('');
        setNotice('');
        setModalError('');
    };
    const cancelPreview = () => {
        if (saving) return;
        setProfileDraft(null);
        setError('');
        setNotice('');
    };
    const saveInfo = async () => {
        if (!manager || saving || !club || !profileDraft) return;
        const fields = profileDraft;
        const version = requestVersion.current;
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const updated = await api.updateClubPublicProfile(clubId, fields);
            if (version !== requestVersion.current) return;
            setClub((current) => ({ ...current, ...fields, ...(updated || {}) }));
            setProfileDraft(null);
            setNotice('Đã cập nhật thông tin trang CLB.');
        } catch (issue) {
            if (version !== requestVersion.current) return;
            setError(
                issue?.status === 404 || issue?.status === 405
                    ? 'Máy chủ chưa hỗ trợ lưu thông tin trang CLB cho ban điều hành. Nội dung đã nhập được giữ để bạn thử lại.'
                    : issue?.status === 403
                      ? 'Bạn không có quyền cập nhật thông tin của CLB này.'
                      : issue?.message || 'Không thể lưu thông tin CLB. Vui lòng thử lại.',
            );
        } finally {
            if (version === requestVersion.current) setSaving(false);
        }
    };

    return (
        <section className="v2-workspace-section v2-club-page-editor">
            <header>
                <div>
                    <span className="v2-eyebrow">KHÔNG GIAN CLB</span>
                    <h1>Trang CLB</h1>
                    <p>Xem trước trang giới thiệu và chỉnh sửa thông tin CLB ngay tại đây.</p>
                </div>
            </header>
            {loading && (
                <div className="club-page-message" role="status">
                    Đang tải trang CLB…
                </div>
            )}
            {error && (
                <div className="club-page-message is-error" role="alert">
                    {error}
                    {!club && !loading && (
                        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
                            Thử lại
                        </button>
                    )}
                </div>
            )}
            {notice && (
                <div className="club-page-message is-success" role="status">
                    <Check size={18} aria-hidden="true" />
                    {notice}
                </div>
            )}
            {club && (
                <ClubPagePreview
                    club={{ ...previewClub, name: previewClub.name || workspace?.name }}
                    logo={logo}
                    cover={cover}
                    manager={manager}
                    disabled={saving}
                    onEdit={openEditor}
                />
            )}
            {manager && profileDraft && (
                <div className="club-page-pending" aria-busy={saving}>
                    <div role="status">
                        <strong>Bản xem trước chưa lưu</strong>
                        <p>Kiểm tra nội dung bên trên trước khi lưu thay đổi.</p>
                    </div>
                    <div className="club-page-pending-actions">
                        <button type="button" className="v2-button" onClick={cancelPreview} disabled={saving}>
                            Hủy
                        </button>
                        <button type="button" className="v2-button v2-button--primary" onClick={saveInfo} disabled={saving}>
                            {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            )}
            {manager && club && imageEditor && (
                <ClubPageImageModal
                    kind={editor}
                    value={editor === 'logo' ? club.logoUrl : club.coverImageUrl}
                    file={imageFile}
                    onChange={(file) => {
                        setImageFile(file);
                        setModalError('');
                    }}
                    saving={saving}
                    error={modalError}
                    onClose={closeEditor}
                    onSave={saveImage}
                />
            )}
            {manager && club && editor && !imageEditor && (
                <ClubPageInfoModal
                    club={previewClub}
                    saving={saving}
                    error={modalError}
                    onClose={closeEditor}
                    onPreview={previewInfo}
                />
            )}
        </section>
    );
}
