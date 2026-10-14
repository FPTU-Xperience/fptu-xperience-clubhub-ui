import { Link } from 'react-router-dom';
import './ClubNavigationLinks.scss';

export default function ClubNavigationLinks({ clubCode, showPage = true, workspaceLabel = 'Đến không gian CLB' }) {
    if (!clubCode) return null;
    const code = encodeURIComponent(clubCode);
    return (
        <div className="v2-club-navigation-links">
            {showPage && (
                <Link className="v2-button" to={`/v2/clubs/${code}`}>
                    Đến trang CLB
                </Link>
            )}
            <Link className="v2-button" to={`/v2/my-clubs/${code}`}>
                {workspaceLabel}
            </Link>
        </div>
    );
}
