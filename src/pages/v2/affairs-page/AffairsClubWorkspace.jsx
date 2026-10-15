import { useParams } from 'react-router-dom';
import { useClubDetail } from '../discover-data';
import { ClubWorkspaceView } from '../club-workspace-page/ClubWorkspacePage';

export default function AffairsClubWorkspace({ api, sessionKey, viewer }) {
    const { clubCode } = useParams();
    // Public data projection: observing a club does not create a membership or office.
    const detail = useClubDetail(api, clubCode, [], sessionKey);
    const club = detail.data;
    const result = {
        ...detail,
        clubId: club?.id,
        data: [],
        workspace: club ? { ...club, clubId: club.id, clubCode: club.code, role: 'OBSERVER', semesters: [] } : null,
    };
    return <ClubWorkspaceView api={api} sessionKey={sessionKey} viewer={viewer} result={result} observation />;
}
