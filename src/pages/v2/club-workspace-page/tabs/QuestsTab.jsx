import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useWorkspaceSemester } from '../WorkspaceSemesterContext';
import { workspaceSemesterQuery } from '../workspace-semester-data';
import PageState from '../../../../components/v2/PageState';
import ActivityStaffingPanel from '../../../../components/v2/activity-detail/ActivityStaffingPanel';
import { staffingError } from '../../../../services/activity-staffing';

export default function QuestsTab({ workspace, manager = false, readOnly = false }) {
    const { api } = useAuth();
    const { semester } = useWorkspaceSemester();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selected, setSelected] = useState(null);
    const [retry, setRetry] = useState(0);
    const filters = new URLSearchParams(workspaceSemesterQuery(semester, 'activities')).toString();
    useEffect(() => {
        setSelected(null);
    }, [workspace.clubId, filters]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');
        api.request(`/api/clubs/${encodeURIComponent(workspace.clubId)}/activity-recruitments?${filters}`)
            .then((value) => {
                const rows = Array.isArray(value) ? value : value?.items;
                if (
                    !Array.isArray(rows) ||
                    rows.some((row) => !row.id || !row.activityId || String(row.clubId) !== String(workspace.clubId))
                )
                    throw new Error('Máy chủ chưa trả về danh sách tuyển dụng hợp lệ.');
                if (active)
                    setItems(
                        rows.filter(
                            (row) =>
                                row.visibility === 'PUBLIC' ||
                                (row.visibility === 'PRIVATE' && (manager || row.canView === true)),
                        ),
                    );
            })
            .catch((issue) => {
                if (active) setError(staffingError(issue));
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [api, workspace.clubId, filters, retry, manager]);
    if (loading) return <PageState status="loading" />;
    if (error) return <PageState status="error" description={error} onRetry={() => setRetry((value) => value + 1)} />;
    return (
        <section className="v2-workspace-section">
            <header>
                <h1>Nhiệm vụ & đóng góp</h1>
                <p>
                    Nhận vị trí host/staff từ các hoạt động của CLB. Điểm đóng góp chờ xác minh và CTSV duyệt báo cáo
                    kết thúc.
                </p>
            </header>
            {selected ? (
                <>
                    <button type="button" className="v2-button" onClick={() => setSelected(null)}>
                        ← Danh sách nhiệm vụ
                    </button>
                    <h2>{selected.activityTitle}</h2>
                    <ActivityStaffingPanel
                        key={selected.activityId}
                        activityId={selected.activityId}
                        manager={manager && !readOnly}
                        readOnly={readOnly}
                        onChanged={() => setRetry((value) => value + 1)}
                    />
                </>
            ) : !items.length ? (
                <PageState status="empty" title="Chưa có nhiệm vụ tuyển dụng" />
            ) : (
                <div className="v2-club-recruitment-list">
                    {items.map((item) => (
                        <button type="button" key={item.id} onClick={() => setSelected(item)}>
                            <strong>{item.title}</strong>
                            <span>
                                {item.activityTitle} ·{' '}
                                {item.visibility === 'PRIVATE' ? 'Riêng tư trong CLB' : 'Công khai'} ·{' '}
                                {item.status === 'OPEN'
                                    ? 'Đang tuyển'
                                    : item.status === 'CLOSED'
                                      ? 'Đã đóng'
                                      : 'Bản nháp'}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
