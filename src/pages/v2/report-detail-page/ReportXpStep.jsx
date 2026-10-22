import { useRef, useState, useEffect } from 'react';
import { Pencil, RefreshCw } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { editReportXp, mergeReportXp, validateReportXp, xpReportApplicable, xpReportTotal } from './report-xp';
import './ReportXpStep.scss';

const format = (value) => value.toLocaleString('vi-VN', { maximumFractionDigits: 4 });
function XpTable({ label, columns, children }) {
    return (
        <div className="v2-report-xp-scroll" tabIndex={0} role="region" aria-label={label}>
            <table>
                <thead>
                    <tr>
                        {columns.map((title) => (
                            <th key={title}>{title}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

export function ReportXpPreview({ snapshot, applicable }) {
    if (!applicable) return null;
    return (
        <div className="v2-report-editor-preview">
            <h3>Báo cáo Xperience Point</h3>
            {snapshot ? (
                <>
                    <p>
                        {snapshot.rows.length} dòng sinh viên/action · {format(xpReportTotal(snapshot.rows))} điểm thô
                        đề xuất · {snapshot.changes.length} thay đổi.
                    </p>
                    <p>
                        {snapshot.dirty
                            ? 'Có chỉnh sửa đang chờ lưu cùng báo cáo.'
                            : 'Bảng Xperience Point đã tải, sẽ được gắn với báo cáo khi lưu.'}{' '}
                        Điểm chỉ được ghi nhận sau bước xét duyệt quyết toán của CTSV.
                    </p>
                </>
            ) : (
                <p>Chưa có bảng Xperience Point từ máy chủ. Lưu/nộp hiện tại chỉ gửi nội dung báo cáo, chưa gửi hoặc cộng Xperience Point.</p>
            )}
        </div>
    );
}

export default function ReportXpStep({ api, scope, snapshot, onChange, actor, disabled }) {
    const [view, setView] = useState('rows'),
        [student, setStudent] = useState(''),
        [action, setAction] = useState('');
    const [loading, setLoading] = useState(false),
        [error, setError] = useState(''),
        [editing, setEditing] = useState(null);
    const lock = useRef(false),
        alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const connected = typeof api.getReportXpDraft === 'function' && typeof api.saveReportXpDraft === 'function';
    const applicable = xpReportApplicable(scope.reportType);
    const validScope =
        Number.isSafeInteger(scope.clubId) &&
        scope.clubId > 0 &&
        scope.period &&
        (scope.reportType !== 'CLUB_ACTIVITY' || scope.activityId);
    const load = async () => {
        if (lock.current || !connected || !validScope || disabled) return;
        lock.current = true;
        setLoading(true);
        setError('');
        try {
            const incoming = validateReportXp(await api.getReportXpDraft(scope), scope);
            if (!alive.current) return;
            onChange(mergeReportXp(snapshot, { ...incoming, baseChangeCount: incoming.changes.length, dirty: false }));
        } catch (issue) {
            if (alive.current) setError(issue.message || 'Không thể tự điền dữ liệu Xperience Point.');
        } finally {
            lock.current = false;
            if (alive.current) setLoading(false);
        }
    };
    const rows = snapshot?.rows || [];
    const filtered = rows.filter(
        (row) => (!student || row.studentCode === student) && (!action || String(row.actionId) === action),
    );
    const students = [...new Set(rows.map((row) => row.studentCode))];
    const actions = [...new Map(rows.map((row) => [String(row.actionId), row.actionTitle])).entries()];
    const changes = (snapshot?.changes || []).filter(
        (row) => (!student || row.studentCode === student) && (!action || String(row.actionId) === action),
    );
    const grouped = new Map();
    for (const row of filtered) {
        const key = view === 'students' ? row.studentCode : String(row.actionId);
        const group = grouped.get(key) || {
            title: view === 'students' ? `${row.studentCode} · ${row.fullName || ''}` : row.actionTitle,
            count: 0,
            quantity: 0,
            points: 0,
        };
        group.count++;
        group.quantity += row.quantity;
        group.points += row.rawPoints;
        grouped.set(key, group);
    }
    const canEdit = connected && !disabled && !loading && snapshot?.capabilities?.canEdit === true;
    return (
        <section className="v2-report-editor-card v2-report-xp" aria-label="Báo cáo Xperience Point">
            <div className="v2-report-editor-card-heading">
                <div>
                    <h2>Báo cáo Xperience Point</h2>
                    <p className="v2-report-editor-hint">
                        Tổng hợp điểm theo từng sinh viên và từng action, kiểm tra thay đổi trước khi nộp.
                    </p>
                </div>
                {applicable && (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        disabled={!connected || !validScope || disabled || loading}
                        onClick={load}
                    >
                        <RefreshCw size={16} /> {loading ? 'Đang tự điền…' : 'Tự điền từ minh chứng'}
                    </button>
                )}
            </div>
            {!applicable ? (
                <p className="v2-report-xp-notice">
                    Mẫu báo cáo này dùng để lập kế hoạch, chưa quyết toán Xperience Point. Điểm thực tế được tổng hợp trong báo cáo
                    hoạt động hoặc cuối kỳ sau khi có minh chứng.
                </p>
            ) : (
                <>
                    {!connected && (
                        <p className="v2-report-xp-notice" role="status">
                            Chưa kết nối dữ liệu báo cáo Xperience Point. Máy chủ hiện chưa hỗ trợ tự điền, lưu bảng Xperience Point và lịch sử
                            chỉnh sửa. Bạn vẫn có thể hoàn thiện nội dung báo cáo; Xperience Point chưa được gửi hoặc cộng điểm.
                        </p>
                    )}
                    {!validScope && (
                        <p className="v2-report-xp-notice">
                            Cần chọn đúng CLB, kỳ báo cáo và hoạt động nguồn để tổng hợp Xperience Point.
                        </p>
                    )}
                    {error && (
                        <p role="alert" className="v2-report-editor-error">
                            {error}
                        </p>
                    )}
                    <dl className="v2-report-editor-summary">
                        <div>
                            <dt>Điểm thô đề xuất</dt>
                            <dd>{snapshot ? format(xpReportTotal(rows)) : 'Chưa có dữ liệu'}</dd>
                        </div>
                        <div>
                            <dt>Sinh viên / action</dt>
                            <dd>{snapshot ? `${students.length} sinh viên · ${actions.length} action` : '—'}</dd>
                        </div>
                        <div>
                            <dt>Ngân sách Xperience Point thô</dt>
                            <dd>{snapshot ? format(snapshot.budgetRaw) : '—'}</dd>
                        </div>
                    </dl>
                    <p className="v2-report-editor-hint">
                        Tự điền lấy các lượt hoàn thành có minh chứng, không suy ra điểm từ số người tham gia. Chỉnh sửa
                        cần lý do; điểm đề xuất chưa phải Xperience Point chính thức.
                    </p>
                    {snapshot && (
                        <p role="status" className="v2-report-editor-hint">
                            Phiên bản {snapshot.version} · nguồn v{snapshot.sourceVersion} ·{' '}
                            {snapshot.dirty ? 'Có thay đổi chưa lưu' : 'Đã tải từ máy chủ'}. Tự điền lại giữ các dòng đã
                            chỉnh sửa khi nguồn còn hợp lệ.
                        </p>
                    )}
                    <div className="v2-report-editor-grid v2-report-xp-filters">
                        <label className="v2-report-editor-field">
                            Sinh viên
                            <select
                                aria-label="Lọc sinh viên Xperience Point"
                                value={student}
                                onChange={(event) => setStudent(event.target.value)}
                                disabled={!snapshot || loading}
                            >
                                <option value="">Tất cả sinh viên</option>
                                {students.map((code) => (
                                    <option key={code}>{code}</option>
                                ))}
                            </select>
                        </label>
                        <label className="v2-report-editor-field">
                            Action
                            <select
                                aria-label="Lọc action Xperience Point"
                                value={action}
                                onChange={(event) => setAction(event.target.value)}
                                disabled={!snapshot || loading}
                            >
                                <option value="">Tất cả action</option>
                                {actions.map(([id, title]) => (
                                    <option key={id} value={id}>
                                        {title}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="v2-report-xp-views" role="group" aria-label="Chế độ xem Xperience Point">
                        {[
                            ['rows', 'Sinh viên / action'],
                            ['students', 'Theo sinh viên'],
                            ['actions', 'Theo action'],
                            ['changes', 'Lịch sử thay đổi'],
                        ].map(([id, title]) => (
                            <button
                                type="button"
                                key={id}
                                className="v2-button"
                                aria-pressed={view === id}
                                onClick={() => setView(id)}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                    {!snapshot ? (
                        <div className="v2-report-xp-empty">
                            <h3>Chưa có bảng điểm Xperience Point</h3>
                            <p>
                                {connected
                                    ? 'Chọn Tự điền từ minh chứng để lấy dữ liệu của đúng CLB và kỳ báo cáo.'
                                    : 'Bảng sẽ hiển thị khi có nguồn minh chứng và chức năng lưu Xperience Point từ máy chủ.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="v2-report-editor-hint">
                                Đang xem {filtered.length} dòng · {format(xpReportTotal(filtered))} điểm thô đề xuất
                            </p>
                            {view === 'rows' && (
                                <XpTable
                                    label="Xperience Point theo sinh viên và action"
                                    columns={[
                                        'Sinh viên',
                                        'Hoạt động / action',
                                        'Lượt × điểm',
                                        'Điểm thô',
                                        'Minh chứng',
                                        'Thao tác',
                                    ]}
                                >
                                    {filtered.map((row) => (
                                        <tr key={row.sourceId}>
                                            <td>
                                                <strong>{row.studentCode}</strong>
                                                <small>{row.fullName}</small>
                                            </td>
                                            <td>
                                                {row.actionTitle}
                                                <small>
                                                    {row.activityName || `Hoạt động #${row.activityId}`} ·{' '}
                                                    {row.sourceId}
                                                </small>
                                            </td>
                                            <td>
                                                {row.quantity} × {format(row.points)}
                                            </td>
                                            <td>{format(row.rawPoints)}</td>
                                            <td>{row.evidence}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="v2-button"
                                                    disabled={!canEdit}
                                                    onClick={() => {
                                                        setError('');
                                                        setEditing({ ...row, reason: '' });
                                                    }}
                                                >
                                                    <Pencil size={14} /> Chỉnh sửa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {!filtered.length && (
                                        <tr>
                                            <td colSpan={6}>Chưa có dòng Xperience Point phù hợp.</td>
                                        </tr>
                                    )}
                                </XpTable>
                            )}
                            {['students', 'actions'].includes(view) && (
                                <XpTable
                                    label="Tổng hợp Xperience Point"
                                    columns={[
                                        view === 'students' ? 'Sinh viên' : 'Action',
                                        'Số dòng',
                                        'Số lượt',
                                        'Điểm thô đề xuất',
                                    ]}
                                >
                                    {[...grouped].map(([id, row]) => (
                                        <tr key={id}>
                                            <td>{row.title}</td>
                                            <td>{row.count}</td>
                                            <td>{row.quantity}</td>
                                            <td>{format(row.points)}</td>
                                        </tr>
                                    ))}
                                    {!filtered.length && (
                                        <tr>
                                            <td colSpan={4}>Chưa có dữ liệu phù hợp.</td>
                                        </tr>
                                    )}
                                </XpTable>
                            )}
                            {view === 'changes' && (
                                <XpTable
                                    label="Lịch sử chỉnh sửa Xperience Point"
                                    columns={[
                                        'Sinh viên / action',
                                        'Trước → sau',
                                        'Lý do / minh chứng',
                                        'Người sửa / thời gian',
                                    ]}
                                >
                                    {changes.map((row) => (
                                        <tr key={row.id}>
                                            <td>
                                                {row.studentCode}
                                                <small>{row.actionTitle}</small>
                                            </td>
                                            <td>
                                                {row.before
                                                    ? `${row.before.quantity} lượt · ${format(row.before.rawPoints)} điểm`
                                                    : 'Chưa có'}{' '}
                                                → {row.after.quantity} lượt · {format(row.after.rawPoints)} điểm
                                            </td>
                                            <td>
                                                {row.reason}
                                                <small>Trước: {row.before?.evidence || '—'}</small>
                                                <small>Sau: {row.after.evidence}</small>
                                            </td>
                                            <td>
                                                {row.actor}
                                                <small>
                                                    {new Date(row.at).toLocaleString('vi-VN', {
                                                        timeZone: 'Asia/Ho_Chi_Minh',
                                                    })}
                                                </small>
                                            </td>
                                        </tr>
                                    ))}
                                    {!changes.length && (
                                        <tr>
                                            <td colSpan={4}>Chưa có thay đổi phù hợp.</td>
                                        </tr>
                                    )}
                                </XpTable>
                            )}
                        </>
                    )}
                </>
            )}
            {editing && (
                <V2Modal title="Chỉnh sửa dòng Xperience Point" onClose={() => setEditing(null)}>
                    <form
                        className="v2-report-xp-edit"
                        onSubmit={(event) => {
                            event.preventDefault();
                            try {
                                onChange(editReportXp(snapshot, editing.sourceId, editing, actor));
                                setEditing(null);
                                setError('');
                            } catch (issue) {
                                setError(issue.message);
                            }
                        }}
                    >
                        <p>
                            {editing.studentCode} · {editing.actionTitle}
                        </p>
                        <p>
                            Định mức đã duyệt: {format(editing.points)} điểm/lượt. Nhập 0 lượt để loại điểm nhưng giữ
                            nguồn và lịch sử.
                        </p>
                        <label>
                            Số lượt tính Xperience Point
                            <input
                                aria-label="Số lượt tính Xperience Point"
                                type="number"
                                min="0"
                                step="1"
                                required
                                value={editing.quantity}
                                onChange={(event) => setEditing({ ...editing, quantity: event.target.value })}
                            />
                        </label>
                        <label>
                            Minh chứng Xperience Point
                            <textarea
                                aria-label="Minh chứng Xperience Point"
                                required
                                value={editing.evidence}
                                onChange={(event) => setEditing({ ...editing, evidence: event.target.value })}
                            />
                        </label>
                        <label>
                            Lý do chỉnh sửa Xperience Point
                            <textarea
                                aria-label="Lý do chỉnh sửa Xperience Point"
                                required
                                minLength={5}
                                value={editing.reason}
                                onChange={(event) => setEditing({ ...editing, reason: event.target.value })}
                            />
                        </label>
                        <p>Điểm sau chỉnh sửa: {format(Number(editing.quantity) * editing.points)} điểm thô</p>
                        {error && <p role="alert">{error}</p>}
                        <div className="v2-report-xp-views">
                            <button type="button" className="v2-button" onClick={() => setEditing(null)}>
                                Hủy
                            </button>
                            <button type="submit" className="v2-button v2-button--primary" disabled={!canEdit}>
                                Áp dụng vào bản nháp
                            </button>
                        </div>
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
