import ActivitiesTab from './ActivitiesTab';
import AttendanceTab from './AttendanceTab';
import ClubPageTab from './ClubPageTab';
import FinanceTab from './FinanceTab';
import GiftsTab from './GiftsTab';
import MembersTab from './MembersTab';
import PointsTab from './PointsTab';
import QuestsTab from './QuestsTab';
import ReportsTab from './ReportsTab';

const views = { 'Hoạt động': ActivitiesTab, 'Điểm danh': AttendanceTab, 'Nhiệm vụ & đóng góp': QuestsTab, 'Thành viên': MembersTab, 'Điểm & thành tích': PointsTab, 'Kho quà': GiftsTab, 'Báo cáo': ReportsTab, 'Tài chính': FinanceTab, 'Trang CLB': ClubPageTab };

export default function WorkspaceTabView({ label, manager }) {
    const View = views[label];
    return View ? <View manager={manager} /> : null;
}
