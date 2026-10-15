import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { canJoinClub } from '../../../pages/v2/discover-data';
import { getAdminClubUrl, isAffairsViewer } from '../../../pages/v2/affairs-access';

export default function ClubHeaderActions({ club, clubCode, viewer, joined, acceptingInvitation, onJoin }) {
    const code = encodeURIComponent(club.code || clubCode);
    if (isAffairsViewer(viewer)) {
        const adminUrl = getAdminClubUrl(club.id, {
            override: import.meta.env.VITE_ADMIN_APP_URL,
            development: import.meta.env.DEV,
        });
        return (
            <div className="v2-club-observer-actions" role="group" aria-label="Xem câu lạc bộ">
                <Link className="v2-button" to={`/v2/ctsv/clubs/${code}/workspace`}>
                    Ghé thăm CLB
                </Link>
                {adminUrl && (
                    <a className="v2-button" href={adminUrl} target="_blank" rel="noopener noreferrer">
                        Xem ở Admin <ExternalLink size={14} aria-hidden="true" />
                    </a>
                )}
            </div>
        );
    }
    if (['MEMBER', 'MANAGER'].includes(club.viewerRelationship)) {
        return (
            <Link className="v2-button" to={`/v2/my-clubs/${code}`}>
                Đến không gian CLB
            </Link>
        );
    }
    if (joined) return <p role="status">Hồ sơ đã được gửi, CLB sẽ phản hồi sớm.</p>;
    return acceptingInvitation || canJoinClub(club) ? (
        <button className="v2-button v2-button--primary" type="button" onClick={onJoin}>
            {acceptingInvitation ? 'Chấp nhận lời mời' : 'Nộp hồ sơ gia nhập'}
        </button>
    ) : null;
}
