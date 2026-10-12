import { useEffect, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { formatAttendanceStatus } from '../../../locales/vi';
import { canManageActivityAttendance } from './activity-attendance-data';
import './ActivityAttendance.scss';

export default function ActivityAttendance({ activity, manager: workspaceManager }) {
    const { api, user, clubAccess } = useAuth();
    const manager = workspaceManager ?? canManageActivityAttendance(activity.clubId, clubAccess);
    const [page, setPage] = useState(1);
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState(null);
    const identity = `${user?.id || user?.email}:${activity.clubId}:${activity.id}:${manager}:${page}`;
    useEffect(() => {
        let active = true;
        setResult({ identity, status: 'loading' });
        Promise.resolve()
            .then(() =>
                manager
                    ? api.getActivityAttendance(activity.clubId, activity.id, { page, pageSize: 20 })
                    : api.getMyActivityAttendance(activity.id, { page, pageSize: 20 }),
            )
            .then(
                (data) => {
                    if (active) setResult({ identity, status: 'ready', data });
                },
                (error) => {
                    if (active) setResult({ identity, status: 'error', error });
                },
            );
        return () => {
            active = false;
        };
    }, [api, identity, version]);
    const current = result?.identity === identity ? result : { status: 'loading' };
    const data = current.data;
    const items = Array.isArray(data?.items) ? data.items : [];
    const total = manager ? data?.totalItems : data?.total;
    const totalPages = Number.isInteger(total) ? Math.ceil(total / 20) : null;
    return (
        <section className="v2-activity-attendance" aria-label="Điểm danh hoạt động">
            <header>
                <ScanLine size={21} />
                <div>
                    <h2>Điểm danh</h2>
                    <p>
                        {manager
                            ? 'Theo dõi điểm danh của thành viên trong hoạt động này.'
                            : 'Lịch sử điểm danh của bạn trong hoạt động này.'}
                    </p>
                </div>
            </header>
            {current.status === 'loading' && <p role="status">Đang tải điểm danh…</p>}
            {current.status === 'error' && (
                <div role="alert">
                    <p>
                        {current.error?.status === 403
                            ? 'Bạn không có quyền xem dữ liệu điểm danh này.'
                            : current.error?.status === 401
                              ? 'Phiên đăng nhập đã hết hạn.'
                              : 'Không tải được điểm danh của hoạt động.'}
                    </p>
                    <button type="button" className="v2-button" onClick={() => setVersion((value) => value + 1)}>
                        Thử lại
                    </button>
                </div>
            )}
            {current.status === 'ready' && (
                <>
                    {manager && (
                        <div className="v2-activity-attendance-stats">
                            {[
                                ['Có mặt', data.presentCount],
                                ['Vắng', data.absentCount],
                                ['Đi muộn', data.lateCount],
                            ].map(
                                ([label, count]) =>
                                    Number.isInteger(count) && (
                                        <span key={label}>
                                            {label}
                                            <strong>{count}</strong>
                                        </span>
                                    ),
                            )}
                        </div>
                    )}
                    {Number.isInteger(total) && (
                        <p className="v2-activity-attendance-count">
                            {total} {manager ? 'thành viên trong danh sách điểm danh' : 'lần điểm danh của bạn'}
                        </p>
                    )}
                    {items.length ? (
                        <div className="v2-activity-attendance-list">
                            {items.map((item) => (
                                <article key={manager ? item.memberId : item.id}>
                                    <div>
                                        <strong>{manager ? item.fullName : item.attendanceDate}</strong>
                                        {manager && item.role && <small>{item.role}</small>}
                                        {!manager && item.note && <small>{item.note}</small>}
                                    </div>
                                    <span className={`v2-attendance-status is-${String(item.status).toLowerCase()}`}>
                                        {formatAttendanceStatus(item.status)}
                                    </span>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p>
                            {manager
                                ? 'Chưa có thành viên trong danh sách điểm danh.'
                                : 'Bạn chưa có lượt điểm danh trong hoạt động này.'}
                        </p>
                    )}
                    {totalPages > 1 && (
                        <nav className="v2-activity-attendance-pages" aria-label="Trang điểm danh">
                            <button
                                type="button"
                                className="v2-button"
                                disabled={page <= 1}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                Trước
                            </button>
                            <span>
                                Trang {page}/{totalPages}
                            </span>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Sau
                            </button>
                        </nav>
                    )}
                </>
            )}
        </section>
    );
}
