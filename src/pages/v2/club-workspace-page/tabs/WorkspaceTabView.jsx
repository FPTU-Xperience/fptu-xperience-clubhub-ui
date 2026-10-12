import { useWorkspaceSemester } from '../WorkspaceSemesterContext';
import ActivitiesTab from './ActivitiesTab';
import ClubPageTab from './ClubPageTab';
import FinanceTab from './FinanceTab';
import GiftsTab from './GiftsTab';
import MembersTab from './MembersTab';
import PointsTab from './PointsTab';
import QuestsTab from './QuestsTab';
import ReportsTab from './ReportsTab';

const views = {
    'Hoạt động': ActivitiesTab,
    'Nhiệm vụ & đóng góp': QuestsTab,
    'Thành viên': MembersTab,
    'Điểm & thành tích': PointsTab,
    'Kho quà': GiftsTab,
    'Báo cáo': ReportsTab,
    'Tài chính': FinanceTab,
    'Trang CLB': ClubPageTab,
};

export default function WorkspaceTabView({ label, manager, dashboard, workspace }) {
    const { semester } = useWorkspaceSemester();
    const View = views[label];
    return View ? <View manager={manager} dashboard={dashboard} workspace={{ ...workspace, semester }} /> : null;
}
