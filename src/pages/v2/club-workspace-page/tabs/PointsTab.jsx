import WorkspaceTabLayout from './WorkspaceTabLayout';
import ClubCreditWallet from './ClubCreditWallet';

export default function PointsTab({ workspace, readOnly = false }) {
    return <WorkspaceTabLayout title="Điểm & thành tích" description="Ví credit và lịch sử đổi quà của bạn trong CLB.">
        {() => <><ClubCreditWallet clubId={workspace?.clubId} readOnly={readOnly} /><p>Huy hiệu chưa có nguồn trao thưởng chính thức.</p></>}
    </WorkspaceTabLayout>;
}
