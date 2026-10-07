import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import ImagePicker from '../../../../components/media/ImagePicker';

export default function ClubPageTab({ manager = false, workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const [club, setClub] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    useEffect(() => {
        let active = true;
        api.getClub(clubId)
            .then((data) => { if (active) setClub(data); })
            .catch((requestError) => { if (active) setError(requestError?.message || 'Không thể tải thông tin CLB.'); });
        return () => { active = false; };
    }, [api, clubId]);

    const save = async (event) => {
        event.preventDefault();
        if (!manager || saving || (!logoFile && !coverFile)) return;
        setSaving(true);
        setError('');
        setNotice('');
        try {
            const logoUrl = logoFile ? await api.uploadPublicImage(logoFile, 'club-logo', clubId) : club.logoUrl;
            const coverImageUrl = coverFile ? await api.uploadPublicImage(coverFile, 'club-cover', clubId) : club.coverImageUrl;
            await api.updateClubPublicImages(clubId, { logoUrl, coverImageUrl });
            setClub((current) => ({ ...current, logoUrl, coverImageUrl }));
            setLogoFile(null);
            setCoverFile(null);
            setNotice('Đã cập nhật ảnh công khai của CLB.');
        } catch (requestError) {
            setError(requestError?.status === 404
                ? 'Máy chủ chưa hỗ trợ lưu ảnh công khai của CLB.'
                : requestError?.message || 'Không thể lưu ảnh CLB.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="v2-workspace-section">
            <header><div><span className="v2-eyebrow">KHÔNG GIAN CLB</span><h1>Trang CLB</h1><p>Ảnh hiển thị trên trang giới thiệu công khai của CLB.</p></div></header>
            {error && <p className="v2-workspace-form-error" role="alert">{error}</p>}
            {notice && <p role="status">{notice}</p>}
            {club && (
                <form className="v2-club-images-form" onSubmit={save}>
                    <ImagePicker label="Logo CLB" value={club.logoUrl} file={logoFile} onChange={setLogoFile} disabled={!manager || saving} />
                    <ImagePicker label="Ảnh bìa CLB" value={club.coverImageUrl} file={coverFile} onChange={setCoverFile} disabled={!manager || saving} />
                    {manager && <button className="v2-button v2-button--primary" disabled={saving || (!logoFile && !coverFile)}>{saving ? 'Đang lưu…' : 'Lưu ảnh CLB'}</button>}
                </form>
            )}
        </section>
    );
}
