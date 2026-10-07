import { useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';

export default function AttendanceTab({ manager = false, dashboard, workspace }) {
    const clubId = workspace?.clubId;
    const { api } = useAuth();
    const activities = dashboard.data?.activities || [];
    const [selectedId, setSelectedId] = useState(null);
    const [attendance, setAttendance] = useState({ status: 'loading', data: null });
    const selected = activities.find((activity) => activity.id === selectedId) || activities[0];
    useEffect(() => {
        if (!selected || dashboard.status !== 'ready') return undefined;
        let active = true;
        setAttendance({ status: 'loading', data: null });
        const request = manager
            ? api.getActivityAttendance(clubId, selected.id, { page: 1, pageSize: 100 })
            : api.getMyActivityAttendance(selected.id);
        request.then(
            (data) => { if (active) setAttendance({ status: 'ready', data }); },
            (error) => { if (active) setAttendance({ status: 'error', data: null, error }); },
        );
        return () => { active = false; };
    }, [api, clubId, dashboard.status, manager, selected?.id]);

    return (
        <WorkspaceTabLayout title="Điểm danh hoạt động" description={manager ? 'Theo dõi điểm danh của thành viên theo hoạt động.' : 'Xem lịch sử điểm danh của bạn theo hoạt động.'} records={activities}>
            {(records) => (
                <>
                    {dashboard.status === 'loading' && <p className="v2-workspace-data-note" role="status">Đang tải hoạt động…</p>}
                    {dashboard.status !== 'loading' && !dashboard.data?.activityAvailable && <p className="v2-workspace-data-note" role="alert">Không tải được hoạt động. <button type="button" onClick={dashboard.retry}>Thử lại</button></p>}
                    {dashboard.data?.activityAvailable && records.length === 0 && <p className="v2-workspace-data-note">CLB chưa có hoạt động để điểm danh.</p>}
                    {selected && (
                        <div className="v2-preview-attendance">
                            <section>
                                <ScanLine size={32} />
                                <span>HOẠT ĐỘNG</span>
                                <h2>{selected.title}</h2>
                                <p>{selected.startTime ? new Date(selected.startTime).toLocaleString('vi-VN') : 'Chưa có lịch'} · {selected.location}</p>
                                <label htmlFor="v2-attendance-activity">Chọn hoạt động</label>
                                <select id="v2-attendance-activity" value={selected.id} onChange={(event) => setSelectedId(Number(event.target.value))}>
                                    {records.map((activity) => <option key={activity.id} value={activity.id}>{activity.title}</option>)}
                                </select>
                            </section>
                            <div className="v2-workspace-attendance-results">
                                {attendance.status === 'loading' && <p role="status">Đang tải điểm danh…</p>}
                                {attendance.status === 'error' && <p role="alert">Không tải được điểm danh cho hoạt động này.</p>}
                                {attendance.status === 'ready' && manager && (
                                    <>
                                        <h3>{attendance.data.totalItems} thành viên trong danh sách điểm danh</h3>
                                        <p>Có mặt: {attendance.data.presentCount} · Vắng: {attendance.data.absentCount} · Đi muộn: {attendance.data.lateCount}</p>
                                        {(attendance.data.items || []).map((member) => (
                                            <article key={member.memberId}>
                                                <ScanLine size={18} />
                                                <div><strong>{member.fullName}</strong><small>{member.role}</small></div>
                                                <span>{member.status}</span>
                                            </article>
                                        ))}
                                        {attendance.data.totalItems > (attendance.data.items?.length || 0) && <p>Đang hiển thị 100 thành viên đầu tiên.</p>}
                                    </>
                                )}
                                {attendance.status === 'ready' && !manager && (
                                    <>
                                        <h3>{attendance.data.total || 0} lần điểm danh của bạn</h3>
                                        {(attendance.data.items || []).map((item) => (
                                            <article key={item.id}>
                                                <ScanLine size={18} />
                                                <div><strong>{item.attendanceDate}</strong><small>{item.note || 'Điểm danh hoạt động'}</small></div>
                                                <span>{item.status}</span>
                                            </article>
                                        ))}
                                        {!attendance.data.total && <p>Chưa có lượt điểm danh nào.</p>}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </WorkspaceTabLayout>
    );
}
