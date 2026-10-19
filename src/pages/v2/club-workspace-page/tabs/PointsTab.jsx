import WorkspaceUnavailable from './WorkspaceUnavailable';
import VerificationQueue from '../../../../components/v2/experience/VerificationQueue';
import { useAuth } from '../../../../context/AuthContext';

export default function PointsTab({ workspace, manager = false, readOnly = false }) {
    const { api, user } = useAuth();
    if (manager && !readOnly) return <VerificationQueue key={`${user?.id}:${workspace?.clubId}`} api={api} clubId={workspace?.clubId} />;
    return <WorkspaceUnavailable title="Điểm & thành tích" description="Theo dõi điểm và cột mốc của bạn trong CLB." detail="Backend chưa có sổ điểm cá nhân và huy hiệu gắn với CLB này." />;
}
