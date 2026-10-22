import { useEffect, useState } from 'react';
import { Download, ExternalLink, FileCheck2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../../../context/AuthContext';
import PageState from '../../../../../components/v2/PageState';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import WorkspaceTabLayout from '../WorkspaceTabLayout';
import {
    canViewClubDeclarations,
    declarationStatus,
    declarationStatusLabel,
    filterClubDeclarations,
    loadClubDeclarationDetail,
    loadClubDeclarations,
} from './club-declarations-data';
import { declarationPermissions } from './club-declaration-permissions';
import DeclarationPermissionEditor from './DeclarationPermissionEditor';
import ClubDeclarationActions from './ClubDeclarationActions';
import './StudentDeclarationsTab.scss';

const date = (value) =>
    value && Number.isFinite(Date.parse(value))
        ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : '—';
const student = (row) => row.studentName || `Sinh viên #${row.userId ?? row.studentId ?? '—'}`;
function DeclarationDetail({ api, clubId, item, permissions, onClose }) {
    const [result, setResult] = useState({ loading: true }),
        [retry, setRetry] = useState(0),
        [error, setError] = useState(''),
        [busy, setBusy] = useState(false);
    useEffect(() => {
        let active = true;
        setResult({ loading: true });
        loadClubDeclarationDetail(api, clubId, item.id).then(
            (data) => {
                if (active) setResult({ data });
            },
            (issue) => {
                if (active) setResult({ error: issue });
            },
        );
        return () => {
            active = false;
        };
    }, [api, clubId, item.id, retry]);
    const record = result.data?.contribution;
    const url =
        typeof record?.evidenceUrl === 'string' && /^https:\/\//i.test(record.evidenceUrl) ? record.evidenceUrl : null;
    return (
        <V2Modal title="Chi tiết trải nghiệm tự khai" wide onClose={onClose}>
            {result.loading ? (
                <PageState status="loading" title="Đang tải trải nghiệm…" />
            ) : result.error ? (
                <PageState
                    status={result.error.status === 403 ? 'forbidden' : 'error'}
                    description={result.error.message}
                    onRetry={() => setRetry((v) => v + 1)}
                />
            ) : (
                <div className="club-student-declaration-detail">
                    <header>
                        <h3>{record.title || item.title}</h3>
                        <span>{declarationStatusLabel(record.status)}</span>
                    </header>
                    <dl>
                        <div>
                            <dt>Sinh viên</dt>
                            <dd>{student({ ...item, ...record })}</dd>
                        </div>
                        <div>
                            <dt>Mã sinh viên / tài khoản</dt>
                            <dd>
                                {record.studentCode || item.studentCode || record.userId || record.studentId || '—'}
                            </dd>
                        </div>
                        <div>
                            <dt>Học kỳ</dt>
                            <dd>{record.semesterId || 'Bản ghi chưa được gán học kỳ'}</dd>
                        </div>
                        <div>
                            <dt>Ngày trải nghiệm</dt>
                            <dd>{date(record.occurredAt || record.startDate)}</dd>
                        </div>
                        <div>
                            <dt>Đơn vị tổ chức / cấp chứng nhận</dt>
                            <dd>{record.organizationSource || 'Chưa được cung cấp'}</dd>
                        </div>
                        <div>
                            <dt>Xperience Point thô theo bản ghi</dt>
                            <dd>
                                {declarationStatus(record.status) === 'APPROVED' && typeof record.rawPoints === 'number'
                                    ? record.rawPoints.toLocaleString('vi-VN')
                                    : 'Chưa có kết quả được duyệt'}
                            </dd>
                        </div>
                    </dl>
                    <h3>Nội dung & kết quả</h3>
                    <p>{record.message || record.evidenceDescription || 'Chưa có mô tả.'}</p>
                    <h3>Minh chứng</h3>
                    {url && (
                        <a href={url} className="v2-button" target="_blank" rel="noopener noreferrer">
                            <ExternalLink size={15} />
                            Mở minh chứng
                        </a>
                    )}
                    <div className="club-student-declaration-actions">
                        {(record.evidenceRefs || []).map((id, index) => (
                            <button
                                type="button"
                                className="v2-button"
                                key={id}
                                disabled={busy}
                                onClick={async () => {
                                    setBusy(true);
                                    setError('');
                                    try {
                                        await api.downloadContributionEvidence(id, `minh-chung-${index + 1}`);
                                    } catch (issue) {
                                        setError(issue.message);
                                    } finally {
                                        setBusy(false);
                                    }
                                }}
                            >
                                <Download size={15} />
                                Tải minh chứng {index + 1}
                            </button>
                        ))}
                    </div>
                    {!url && !record.evidenceRefs?.length && <p>Chưa có minh chứng được trả về cho bản ghi này.</p>}
                    {error && <p role="alert">{error}</p>}
                    <h3>Phản hồi & lịch sử</h3>
                    {record.reviewNote && <p>{record.reviewNote}</p>}
                    {result.data.decisions?.length ? (
                        <ol>
                            {result.data.decisions.map((decision) => (
                                <li key={decision.id}>
                                    <strong>
                                        {{
                                            APPROVE: 'Đã duyệt',
                                            REJECT: 'Không thông qua',
                                            REQUEST_REVISION: 'Yêu cầu bổ sung',
                                        }[decision.decision] || declarationStatusLabel(decision.decision)}
                                    </strong>
                                    <p>{decision.reason || decision.reviewNote}</p>
                                    <small>{date(decision.createdAtUtc || decision.createdAt)}</small>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        !record.reviewNote && <p>Chưa có phản hồi xét duyệt trong dữ liệu trả về.</p>
                    )}
                    <ClubDeclarationActions
                        api={api}
                        clubId={clubId}
                        record={record}
                        permissions={permissions}
                        onChanged={() => setRetry((v) => v + 1)}
                    />
                    <p className="club-student-declaration-notice">
                        Tab này dùng để xem trải nghiệm và minh chứng được cấp quyền. Tham chiếu của CLB không thay thế
                        quyết định ghi nhận Xperience Point của CTSV.
                    </p>
                </div>
            )}
        </V2Modal>
    );
}

function StudentDeclarationList({ api, workspace, permissions }) {
    const [permissionEditorOpen, setPermissionEditorOpen] = useState(false);
    const [result, setResult] = useState({ loading: true }),
        [retry, setRetry] = useState(0),
        [query, setQuery] = useState(''),
        [status, setStatus] = useState(''),
        [period, setPeriod] = useState('all'),
        [page, setPage] = useState(1),
        [selected, setSelected] = useState(null);
    const clubId = workspace.clubId,
        semester =
            workspace.semester?.reportPeriod || workspace.semester?.invitationCode || workspace.semester?.code || '';
    useEffect(() => {
        let active = true;
        setResult({ loading: true });
        setSelected(null);
        loadClubDeclarations(api, clubId).then(
            (items) => {
                if (active) setResult({ items });
            },
            (error) => {
                if (active) setResult({ error });
            },
        );
        return () => {
            active = false;
        };
    }, [api, clubId, retry]);
    useEffect(() => {
        setPage(1);
    }, [query, status, period, semester]);
    const rows = filterClubDeclarations(result.items || [], { query, status, period, semester }),
        pages = Math.max(1, Math.ceil(rows.length / 20)),
        current = Math.min(page, pages);
    const update = (set, value) => {
        set(value);
        setPage(1);
    };
    return (
        <WorkspaceTabLayout
            title="Trải nghiệm tự khai"
            description="Theo dõi trải nghiệm sinh viên gắn với CLB, kiểm tra minh chứng và xem kết quả xét duyệt."
            action={
                <div className="club-student-declaration-actions">
                    {permissions.manage && (
                        <button type="button" className="v2-button" onClick={() => setPermissionEditorOpen(true)}>
                            Phân quyền
                        </button>
                    )}
                    <button
                        type="button"
                        className="v2-button"
                        disabled={result.loading}
                        onClick={() => setRetry((v) => v + 1)}
                    >
                        <RefreshCw size={16} />
                        Tải lại
                    </button>
                </div>
            }
        >
            {() => (
                <div className="club-student-declarations">
                    <p className="club-student-declaration-notice">
                        Chỉ hiển thị hồ sơ gắn với {workspace.name} mà máy chủ cho phép bạn xem. Trải nghiệm gửi trực
                        tiếp cho CTSV không tự động chia sẻ với CLB; luồng tham chiếu CLB cho trải nghiệm bên ngoài đang
                        chờ backend hỗ trợ.
                    </p>
                    <p className="club-student-declaration-scope">
                        Quyền của bạn: Xử lý trải nghiệm tự khai trong CLB (đọc, duyệt tại CLB và chuyển lên CTSV).
                        {permissions.manage
                            ? ' Chủ tịch và Phó chủ tịch mặc định đầy đủ quyền.'
                            : ' Các thao tác được cấp theo checkbox phân quyền.'}
                    </p>
                    <div className="club-student-declaration-filters">
                        <label>
                            Tìm sinh viên / trải nghiệm
                            <input
                                value={query}
                                onChange={(e) => update(setQuery, e.target.value)}
                                placeholder="Tên, mã sinh viên, tên trải nghiệm…"
                            />
                        </label>
                        <label>
                            Trạng thái
                            <select value={status} onChange={(e) => update(setStatus, e.target.value)}>
                                <option value="">Tất cả trạng thái</option>
                                {[
                                    ['SUBMITTED', 'Chờ xét duyệt'],
                                    ['APPROVED', 'Đã duyệt'],
                                    ['REVISIONREQUESTED', 'Cần bổ sung'],
                                    ['REJECTED', 'Không thông qua'],
                                    ['REVOKED', 'Đã thu hồi'],
                                ].map(([id, label]) => (
                                    <option key={id} value={id}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Phạm vi học kỳ
                            <select value={period} onChange={(e) => update(setPeriod, e.target.value)}>
                                <option value="all">Tất cả học kỳ</option>
                                <option value="workspace" disabled={!semester}>
                                    Học kỳ workspace{semester ? ` · ${semester}` : ''}
                                </option>
                                <option value="unassigned">Chưa gán học kỳ</option>
                            </select>
                        </label>
                    </div>
                    <p className="club-student-declaration-scope">
                        Hồ sơ cũ chưa có mã học kỳ được giữ riêng; chọn “Tất cả học kỳ” hoặc “Chưa gán học kỳ” để xem.
                    </p>
                    {result.loading ? (
                        <PageState status="loading" title="Đang tải trải nghiệm của sinh viên…" />
                    ) : result.error ? (
                        <PageState
                            status={result.error.status === 403 ? 'forbidden' : 'error'}
                            title={
                                result.error.status === 403 ? 'Chưa được cấp quyền xem trải nghiệm của CLB' : undefined
                            }
                            description={
                                result.error.status === 403
                                    ? 'Máy chủ chưa cấp phạm vi đọc trải nghiệm cho tài khoản tại CLB này. Quyền đọc minh chứng cần được đồng bộ với vai trò hoặc phân quyền đã cấp.'
                                    : result.error.message
                            }
                            onRetry={() => setRetry((v) => v + 1)}
                        />
                    ) : (
                        <>
                            <p className="club-student-declaration-scope" role="status">
                                {rows.length} trải nghiệm phù hợp · {workspace.name}
                            </p>
                            {!rows.length ? (
                                <div className="club-student-declaration-empty">
                                    <FileCheck2 size={30} />
                                    <h2>Chưa có trải nghiệm tự khai phù hợp</h2>
                                    <p>
                                        Chưa có hồ sơ gắn với CLB trong phạm vi được cấp quyền, hoặc không khớp bộ lọc.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className="club-student-declaration-table-scroll"
                                    tabIndex={0}
                                    role="region"
                                    aria-label="Danh sách trải nghiệm tự khai của sinh viên"
                                >
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Sinh viên</th>
                                                <th>Trải nghiệm</th>
                                                <th>Học kỳ / ngày</th>
                                                <th>Minh chứng</th>
                                                <th>Trạng thái</th>
                                                <th>Chi tiết</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.slice((current - 1) * 20, current * 20).map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <strong>{student(item)}</strong>
                                                        <small>
                                                            {item.studentCode ||
                                                                item.studentEmail ||
                                                                `Tài khoản #${item.userId ?? item.studentId ?? '—'}`}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {item.title}
                                                        <small>{item.organizationSource || item.message}</small>
                                                    </td>
                                                    <td>
                                                        {item.semesterId || 'Chưa gán học kỳ'}
                                                        <small>
                                                            {date(
                                                                item.occurredAt || item.startDate || item.createdAtUtc,
                                                            )}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {item.evidenceRefs?.length
                                                            ? `${item.evidenceRefs.length} tệp riêng tư`
                                                            : item.evidenceUrl
                                                              ? 'Có liên kết'
                                                              : 'Chưa có dữ liệu'}
                                                    </td>
                                                    <td>
                                                        <span className="club-student-declaration-status">
                                                            {declarationStatusLabel(item.status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="v2-button"
                                                            onClick={() => setSelected(item)}
                                                        >
                                                            Xem chi tiết
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {rows.length > 0 && (
                                <nav className="club-student-declaration-actions" aria-label="Trang trải nghiệm CLB">
                                    <button
                                        type="button"
                                        className="v2-button"
                                        disabled={current <= 1}
                                        onClick={() => setPage(current - 1)}
                                    >
                                        Trước
                                    </button>
                                    <span>
                                        Trang {current}/{pages}
                                    </span>
                                    <button
                                        type="button"
                                        className="v2-button"
                                        disabled={current >= pages}
                                        onClick={() => setPage(current + 1)}
                                    >
                                        Sau
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                    {permissionEditorOpen && permissions.manage && (
                        <DeclarationPermissionEditor
                            api={api}
                            clubId={clubId}
                            onClose={() => setPermissionEditorOpen(false)}
                        />
                    )}
                    {selected && (
                        <DeclarationDetail
                            api={api}
                            clubId={clubId}
                            item={selected}
                            permissions={permissions}
                            onClose={() => setSelected(null)}
                        />
                    )}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}

export default function StudentDeclarationsTab({ manager, workspace, readOnly = false }) {
    const { api, user } = useAuth();
    if (!canViewClubDeclarations(manager, workspace, readOnly))
        return (
            <PageState
                status="forbidden"
                description="Chỉ BQL được cấp quyền trong CLB mới có thể mở trải nghiệm của sinh viên."
            />
        );
    return (
        <StudentDeclarationList
            key={`${user?.id}:${workspace.clubId}`}
            api={api}
            workspace={workspace}
            permissions={declarationPermissions(manager, workspace, readOnly)}
        />
    );
}
