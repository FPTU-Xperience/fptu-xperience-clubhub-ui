import { useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { Pill } from '../DiscoveryLayout';
import './ClubProfileHeader.scss';

export default function ClubProfileHeader({ club, children }) {
    const [failedCover, setFailedCover] = useState(null);
    const [failedLogo, setFailedLogo] = useState(null);
    const palette = [...String(club.id ?? club.name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
    return (
        <>
            <div className={`v2-club-profile-cover v2-club-profile-cover--${palette}`}>
                {club.coverImageUrl && failedCover !== club.coverImageUrl ? (
                    <img
                        src={club.coverImageUrl}
                        alt={`Ảnh bìa ${club.name}`}
                        onError={() => setFailedCover(club.coverImageUrl)}
                    />
                ) : (
                    <div className="v2-club-profile-cover-art" aria-hidden="true">
                        <span>CLUBHUB / COMMUNITY</span>
                        <strong>
                            Một cộng đồng.
                            <br />
                            Cùng nhau trưởng thành.
                        </strong>
                    </div>
                )}
            </div>
            <header className="v2-club-profile-identity">
                <div className="v2-club-profile-mark" style={{ '--club': club.color }} aria-hidden="true">
                    {club.logoUrl && failedLogo !== club.logoUrl ? (
                        <img src={club.logoUrl} alt="" onError={() => setFailedLogo(club.logoUrl)} />
                    ) : (
                        <strong>{club.mark || club.name?.slice(0, 3).toUpperCase() || 'CLB'}</strong>
                    )}
                </div>
                <div className="v2-club-profile-name">
                    <div className="v2-club-profile-labels">
                        <Pill>{club.category || 'Chưa phân loại'}</Pill>
                        <Pill tone={club.isRecruiting ? 'orange' : ''}>
                            {club.hasRecruitmentStatus
                                ? club.isRecruiting
                                    ? 'Đang tuyển thành viên'
                                    : 'Chưa mở tuyển'
                                : 'Trạng thái tuyển đang cập nhật'}
                        </Pill>
                    </div>
                    <h1>{club.fullName || club.name}</h1>
                    <p>{club.tagline}</p>
                </div>
                <div className="v2-club-detail-actions">{children}</div>
            </header>
            <div className="v2-club-profile-quick-facts">
                <span>
                    <CalendarDays size={16} aria-hidden="true" />
                    {club.scheduleLabel || 'Lịch sinh hoạt đang cập nhật'}
                </span>
                <span>
                    <MapPin size={16} aria-hidden="true" />
                    {club.locationLabel || 'Địa điểm đang cập nhật'}
                </span>
            </div>
        </>
    );
}
