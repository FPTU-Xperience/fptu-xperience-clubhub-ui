import { useSearchParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { History as HistoryIcon, FileText, Users, ShieldCheck, Plus } from 'lucide-react';
import { useAuth } from '../../../../../../context/AuthContext';
import { useWorkspaceSemester } from '../../../WorkspaceSemesterContext';
import V2Modal from '../../../../../../components/v2/common/modal/V2Modal';
import { CLUB_CAPABILITY_LABELS } from '../../../../../../services/club-capabilities';
import {
    governanceCatalog,
    governanceConfiguration,
    governanceError,
    governanceDisplayName,
    governanceGuid,
    governancePage,
    governancePeriod,
    governancePresetLabels,
    governanceReceipt,
    governanceTerm,
} from '../../../../../../services/club-governance';
import './ClubGovernance.scss';
import './ClubGovernancePreview.scss';
import GovernanceGroupCards from './GovernanceGroupCards';

function useGovernanceQuery(defaults) {
    const [params, setParams] = useSearchParams();
    const values = Object.fromEntries(
        Object.entries(defaults).map(([key, fallback]) => {
            const raw = params.get(key);
            return [
                key,
                typeof fallback === 'number'
                    ? /^[1-9]\d*$/.test(raw || '') && Number.isSafeInteger(Number(raw))
                        ? Number(raw)
                        : fallback
                    : typeof fallback === 'boolean'
                      ? raw == null
                          ? fallback
                          : raw === 'true'
                      : (raw ?? fallback),
            ];
        }),
    );
    const set = (updates) => {
        const next = new URLSearchParams(params);
        Object.entries(updates).forEach(([key, value]) => next.set(key, String(value)));
        setParams(next, {
            replace: !Object.keys(updates).some((key) => key.endsWith('Page')),
        });
    };
    return [values, set];
}
const dates = (value) =>
    value
        ? new Date(value).toLocaleString('vi-VN', {
              timeZone: 'Asia/Ho_Chi_Minh',
          })
        : '—';
const actions = {
    TERM_INITIALIZED: 'Khởi tạo BQL',
    GROUP_CREATED: 'Tạo nhóm',
    GROUP_UPDATED: 'Sửa nhóm',
    GROUP_ARCHIVED: 'Ngừng nhóm',
    ASSIGNMENT_ADD: 'Thêm phân công',
    ASSIGNMENT_REMOVE: 'Gỡ phân công',
    ASSIGNMENT_TRANSFER: 'Chuyển nhóm',
    ASSIGNMENT_REPLACE: 'Thay thành viên trong ban',
    ASSIGNMENT_SET_LEAD: 'Chỉ định Chủ nhiệm ban',
    ASSIGNMENT_CLEAR_LEAD: 'Gỡ Chủ nhiệm ban',
    LEGACY_ROLE_CHANGED: 'Đổi duty cũ',
    MEMBER_DEPARTED: 'Thành viên rời CLB',
    LEADERSHIP_NOMINATED: 'Đề nghị bổ nhiệm',
    LEADERSHIP_APPROVED: 'CTSV duyệt bổ nhiệm',
    LEADERSHIP_REJECTED: 'CTSV từ chối',
    LEADERSHIP_REVOKED: 'CTSV thu hồi',
    OWNER_TRANSFER_APPROVED: 'CTSV duyệt chuyển giao',
    LEADERSHIP_SUPERSEDED: 'Kết thúc vai trò trước chuyển giao',
};
export default function ClubGovernance({ clubId, readOnly = false, onChanged }) {
    const { api, user, refreshClubAccess } = useAuth();
    const { semester } = useWorkspaceSemester();
    const period = governancePeriod(semester);
    const identity = `${user?.id}:${clubId}:${period?.id || ''}:${readOnly}`;
    const current = useRef(identity);
    current.current = identity;
    const [result, setResult] = useState({}),
        [revision, setRevision] = useState(0);
    const [route, setRoute] = useGovernanceQuery({ bql: 'groups' });
    const section = ['groups', 'history', 'reports', 'leadership'].includes(route.bql) ? route.bql : 'groups';
    const setSection = (value) => setRoute({ bql: value });
    const [dialog, setDialog] = useState(null),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    const keys = useRef(new Map()),
        lock = useRef(false);
    const state = result.identity === identity ? result : {};
    const modal = dialog?.identity === identity ? dialog.value : null;
    const open = (value) => {
        if (lock.current) return;
        setError('');
        setDialog(value ? { identity, value } : null);
    };
    const root = `/api/clubs/${encodeURIComponent(clubId)}/governance`,
        termPath = period ? `${root}/terms/${period.id}` : null;
    useEffect(() => {
        let active = true;
        setResult({});
        setDialog(null);
        setError('');
        setNotice('');
        setBusy(false);
        lock.current = false;
        keys.current.clear();
        const loads = [
            api.request(root + '/permission-catalog').then((data) => governanceCatalog(data, clubId, user.id)),
            termPath
                ? api.request(termPath).then((data) => governanceTerm(data, clubId, user.id, period))
                : Promise.resolve(null),
        ];
        Promise.all(loads)
            .then(([catalog, term]) => {
                if (active) setResult({ identity, catalog, term });
            })
            .catch((issue) => {
                if (active) setResult({ identity, error: governanceError(issue) });
            });
        return () => {
            active = false;
        };
    }, [api, identity, revision]);
    const canConfigure = !readOnly && state.term?.capabilities.canConfigure === true;
    const initialized = state.term?.initialized === true;
    const run = async (kind, path, method, body) => {
        if (lock.current || readOnly) return;
        const context = identity;
        const fingerprint = JSON.stringify([path, method, body]);
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const response = await api.request(path, {
                method,
                headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                body: JSON.stringify(body),
            });
            governanceReceipt(response, clubId, ['nominate', 'transfer'].includes(kind) ? null : period?.id, kind);
            if (current.current !== context) return;
            keys.current.delete(fingerprint);
            setDialog(null);
            setNotice(
                kind === 'report'
                    ? 'Đã nộp bản chụp BQL. Việc nộp báo cáo không thay đổi quyền.'
                    : ['nominate', 'transfer'].includes(kind)
                      ? 'Đã gửi đề nghị. Quyền lãnh đạo chỉ thay đổi sau quyết định CTSV có hiệu lực.'
                      : 'Đã lưu thay đổi BQL.',
            );
            setRevision((value) => value + 1);
            await refreshClubAccess?.();
            if (current.current === context) onChanged?.();
        } catch (issue) {
            if (current.current === context) {
                setError(governanceError(issue));
                if (issue.status === 403) refreshClubAccess?.();
            }
        } finally {
            if (current.current === context) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    const reload = () => {
        if (!busy) {
            setDialog(null);
            setRevision((value) => value + 1);
        }
    };
    if (state.error)
        return (
            <section className="club-governance club-governance-preview">
                <h3>Ban quản lý</h3>
                <p role="alert">{state.error}</p>
                <button className="v2-button" onClick={reload}>
                    Tải lại BQL
                </button>
            </section>
        );
    if (!state.catalog) return <p role="status">Đang tải BQL…</p>;
    const presentMember = (member) => ({ ...member, displayName: governanceDisplayName(state.term, member) });
    const groups = (state.term?.configuration?.groups || []).map((group) => ({
        ...group,
        assignments: group.assignments.map(presentMember),
    }));
    const people = new Map();
    const cardGroups = groups
        .filter((group) => !group.archived)
        .map((group) => {
            const leaders =
                group.presetCode === 'CLUB_OWNER'
                    ? state.term.leadership.owners.map(presentMember)
                    : group.presetCode === 'VICE_PRESIDENT'
                      ? state.term.leadership.vicePresidents.map(presentMember)
                      : group.assignments;
            leaders.forEach((member) =>
                people.set(String(member.userId), { id: String(member.userId), name: member.displayName }),
            );
            return {
                ...group,
                memberIds: leaders.map((member) => String(member.userId)),
                leadId: leaders.find((member) => member.isGroupLead)?.userId,
                canManageMembers: !readOnly && !busy && state.term.capabilities.manageableGroupIds?.includes(group.id) === true,
                permissions: group.permissionCodes,
                canNominate:
                    group.presetCode === 'CLUB_OWNER'
                        ? state.catalog.capabilities.canTransferOwner
                        : state.catalog.capabilities.canNominateVice,
                nominationLabel: group.presetCode === 'CLUB_OWNER' ? 'Đề nghị chuyển giao' : 'Đề nghị bổ nhiệm',
            };
        });
    const cardMembers = [...people.values()];
    const groupAction = (action) => {
        const group = groups.find((item) => item.id === action.groupId);
        const member = group?.assignments.find((item) => String(item.userId) === String(action.memberId));
        if (action.type === 'saveGroup') return open({ kind: group ? 'edit' : 'create', group });
        if (action.type === 'assign') return open({ kind: 'assign', group, scoped: !canConfigure });
        if (action.type === 'remove') return member && open({ kind: 'remove', group, member });
        if (action.type === 'replace') return member && open({ kind: 'replace', group, member, scoped: !canConfigure });
        if (action.type === 'setLead' || action.type === 'clearLead')
            return member && open({ kind: action.type, group, member });
        if (action.type === 'deleteGroup') return open({ kind: 'archive', group });
        if (action.type === 'transfer') {
            const target = groups.find((item) => !item.protected && !item.archived && item.id !== group.id);
            return target && member && open({ kind: 'assign', group: target, fromGroup: group, member });
        }
        if (action.type === 'nominate')
            return group.presetCode === 'CLUB_OWNER'
                ? open({ kind: 'transfer' })
                : open({ kind: 'nominate', clubVersion: state.term.clubVersion });
    };
    return (
        <section className="club-governance club-governance-preview" aria-label="Ban quản lý CLB">
            <header>
                <div>
                    <h3>Ban quản lý</h3>
                    <p>
                        Một thành viên có thể được phân công nhiều nhóm. Quyền được cộng theo phân công hợp lệ trong
                        CLB.
                    </p>
                </div>
                <button className="v2-button" disabled={busy} onClick={reload}>
                    Tải lại BQL
                </button>
            </header>
            {notice && <p role="status">{notice}</p>}
            {error && !modal && <p role="alert">{error}</p>}
            <nav className="governance-toolbar-actions" aria-label="Nội dung BQL">
                {[
                    ['groups', 'Nhóm và phân công', Users],
                    ['history', 'Lịch sử', HistoryIcon],
                    ['reports', 'Báo cáo BQL', FileText],
                    ['leadership', 'Đề nghị lãnh đạo', ShieldCheck],
                ].map(([id, label, Icon]) => (
                    <button
                        className="v2-button"
                        key={id}
                        aria-pressed={section === id}
                        disabled={busy}
                        onClick={() => setSection(id)}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
                {canConfigure && initialized && (
                    <button
                        className="v2-button v2-button--primary"
                        disabled={busy}
                        onClick={() => open({ kind: 'create' })}
                    >
                        <Plus size={16} /> Tạo nhóm
                    </button>
                )}
            </nav>
            {section === 'groups' && (
                <>
                    {!period && <p>Chọn học kỳ chính thức trên thanh workspace để xem hoặc cấu hình nhóm.</p>}
                    {period && !initialized && (
                        <div>
                            <p>Học kỳ này chưa khởi tạo cấu trúc BQL.</p>
                            {canConfigure && (
                                <button
                                    className="v2-button v2-button--primary"
                                    onClick={() => open({ kind: 'initialize' })}
                                >
                                    Khởi tạo BQL học kỳ
                                </button>
                            )}
                        </div>
                    )}
                    {initialized && (
                        <>
                            <p>
                                {period.label || state.term.semesterCode} · Bản lưu #{state.term.sequence}
                                {!canConfigure && !cardGroups.some((group) => group.canManageMembers) ? ' · Chỉ xem' : ''}
                            </p>
                            <GovernanceGroupCards
                                groups={cardGroups}
                                members={cardMembers}
                                permissionLabels={CLUB_CAPABILITY_LABELS}
                                editable={canConfigure && !busy}
                                manageGroupLeads
                                onAction={groupAction}
                            />
                            {state.term.reportNeedsUpdate && (
                                <p role="status">
                                    Phân công hoặc lãnh đạo đã thay đổi sau báo cáo gần nhất. Có thể nộp bản bổ sung sau
                                    khi kiểm tra.
                                </p>
                            )}
                        </>
                    )}
                </>
            )}
            {section === 'history' && (
                <GovernanceHistory
                    key={`${identity}:${revision}`}
                    root={root}
                    period={period}
                    api={api}
                    clubId={clubId}
                    groups={groups}
                />
            )}
            {section === 'reports' && (
                <GovernanceReports
                    key={`${identity}:${revision}`}
                    termPath={termPath}
                    period={period}
                    api={api}
                    clubId={clubId}
                    canSubmit={!readOnly && state.term?.capabilities.canSubmitReport}
                    onSubmit={() => open({ kind: 'report' })}
                />
            )}
            {section === 'leadership' && (
                <GovernanceLeadership
                    key={`${identity}:${revision}`}
                    root={root}
                    api={api}
                    clubId={clubId}
                    readOnly={readOnly}
                    capabilities={state.catalog.capabilities}
                    onNominate={(clubVersion) => open({ kind: 'nominate', clubVersion })}
                    onTransfer={() => open({ kind: 'transfer' })}
                />
            )}
            {modal && (
                <GovernanceModal
                    key={`${identity}:${modal.kind}:${modal.group?.id || ''}:${modal.member?.membershipId || ''}`}
                    modal={modal}
                    catalog={state.catalog}
                    term={state.term}
                    root={root}
                    termPath={termPath}
                    api={api}
                    clubId={clubId}
                    busy={busy}
                    error={error}
                    onClose={() => !busy && setDialog(null)}
                    onReload={reload}
                    onSave={run}
                />
            )}
        </section>
    );
}

function GovernanceHistory({ root, period, api, clubId, groups }) {
    const [page, setPage] = useState(1),
        [group, setGroup] = useState(''),
        [member, setMember] = useState(null),
        [result, setResult] = useState({}),
        [unmapped, setUnmapped] = useState(true);
    useEffect(() => {
        let active = true;
        setResult({});
        const query = new URLSearchParams({
            page,
            pageSize: 20,
            includeUnmapped: unmapped,
        });
        if (period) query.set('semesterId', period.id);
        if (group) query.set('groupId', group);
        if (member) query.set('membershipId', member.membershipId);
        api.request(root + '/history?' + query)
            .then((value) => {
                const data = governancePage(value, clubId, period?.id);
                if (active) setResult({ data });
            })
            .catch((error) => {
                if (active) setResult({ error: governanceError(error) });
            });
        return () => {
            active = false;
        };
    }, [api, root, period?.id, page, group, member, unmapped]);
    return (
        <section>
            <h4>Lịch sử thay đổi BQL</h4>
            <label>
                Nhóm
                <select
                    value={group}
                    onChange={(e) => {
                        setGroup(e.target.value);
                        setPage(1);
                    }}
                >
                    <option value="">Tất cả nhóm trong học kỳ</option>
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.name}
                            {g.archived ? ' (đã ngừng)' : ''}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <input
                    type="checkbox"
                    checked={unmapped}
                    onChange={(e) => {
                        setUnmapped(e.target.checked);
                        setPage(1);
                    }}
                />{' '}
                Kèm lịch sử lãnh đạo và duty cũ chưa gắn học kỳ
            </label>
            {member && (
                <p>
                    Đang lọc: {member.displayName}{' '}
                    <button
                        className="v2-button"
                        onClick={() => {
                            setMember(null);
                            setPage(1);
                        }}
                    >
                        Bỏ lọc thành viên
                    </button>
                </p>
            )}
            <ReadState result={result} />
            {result.data?.items.map((item) => (
                <article className="governance-history" key={item.id}>
                    <h4>{actions[item.action] || item.action}</h4>
                    <p>
                        {dates(item.at)} · {item.actorName || `Tài khoản ${item.actorId}`}
                        {item.termId ? '' : ' · Chưa gắn học kỳ'}
                    </p>
                    <p>{item.reason}</p>
                    {item.memberChanges?.map((change) => (
                        <div key={change.membershipId}>
                            <strong>{change.displayName}</strong>
                            <p>
                                Trước:{' '}
                                {change.before?.groups?.map((g) => g.name).join(', ') ||
                                    change.before?.legacyRole ||
                                    'Chưa có phân công'}{' '}
                                → Sau:{' '}
                                {change.after?.groups?.map((g) => g.name).join(', ') ||
                                    change.after?.legacyRole ||
                                    'Đã gỡ phân công'}
                            </p>
                            <button
                                className="v2-button"
                                onClick={() => {
                                    setMember(change);
                                    setPage(1);
                                }}
                            >
                                Lọc theo thành viên này
                            </button>
                        </div>
                    ))}
                    {item.details && (
                        <details>
                            <summary>Chi tiết thay đổi</summary>
                            <p>
                                {item.details.displayName || item.details.memberName || ''} ·{' '}
                                {item.details.before?.displayName ||
                                    (typeof item.details.before === 'string' ? item.details.before : '')}{' '}
                                →{' '}
                                {item.details.after?.displayName ||
                                    (typeof item.details.after === 'string'
                                        ? item.details.after
                                        : item.details.status || '')}
                            </p>
                        </details>
                    )}
                </article>
            ))}
            <Pager data={result.data} page={page} setPage={setPage} />
        </section>
    );
}
function GovernanceReports({ termPath, period, api, clubId, canSubmit, onSubmit }) {
    const [route, setRoute] = useGovernanceQuery({ bqlReportsPage: 1 });
    const page = route.bqlReportsPage,
        setPage = (value) => setRoute({ bqlReportsPage: value });
    const [result, setResult] = useState({}),
        [snapshot, setSnapshot] = useState(null);
    const request = useRef(0);
    useEffect(
        () => () => {
            request.current++;
        },
        [],
    );
    const closeSnapshot = () => {
        request.current++;
        setSnapshot(null);
    };
    useEffect(() => {
        let active = true;
        setResult({});
        if (termPath)
            api.request(termPath + `/report-submissions?page=${page}&pageSize=20`)
                .then((value) => {
                    const data = governancePage(value, clubId, period.id);
                    if (active) setResult({ data });
                })
                .catch((error) => {
                    if (active) setResult({ error: governanceError(error) });
                });
        return () => {
            active = false;
        };
    }, [api, termPath, page]);
    const show = async (id) => {
        const sequence = ++request.current;
        setSnapshot({ loading: true });
        try {
            const value = await api.request(termPath + '/report-submissions/' + id);
            if (
                String(value.clubId) !== String(clubId) ||
                String(value.semesterId) !== String(period.id) ||
                value.submission?.id !== id
            )
                throw new Error('Bản chụp không khớp phạm vi.');
            const data = JSON.parse(value.submission.snapshotJson);
            governanceConfiguration(data.configuration, period.id);
            if (sequence !== request.current) return;
            setSnapshot({
                value: data,
                number: value.submission.number,
                at: value.submission.at,
            });
        } catch (error) {
            if (sequence !== request.current) return;
            setSnapshot({ error: governanceError(error) });
        }
    };
    return (
        <section>
            <header>
                <h4>Báo cáo BQL theo học kỳ</h4>
                {canSubmit && (
                    <button className="v2-button v2-button--primary" onClick={onSubmit}>
                        Kiểm tra và nộp báo cáo
                    </button>
                )}
            </header>
            {!period ? (
                <p>Chọn học kỳ trên thanh workspace.</p>
            ) : (
                <>
                    <ReadState result={result} />
                    {result.data?.items.map((item) => (
                        <article className="governance-history" key={item.id}>
                            <p>
                                Bản #{item.number} · {dates(item.at)}
                            </p>
                            <p>{item.reason}</p>
                            <button className="v2-button" onClick={() => show(item.id)}>
                                Xem bản chụp #{item.number}
                            </button>
                        </article>
                    ))}
                    <Pager data={result.data} page={page} setPage={setPage} />
                </>
            )}
            {snapshot && (
                <V2Modal title="Bản chụp BQL đã nộp" onClose={closeSnapshot}>
                    {snapshot.loading ? (
                        <p role="status">Đang tải bản chụp…</p>
                    ) : snapshot.error ? (
                        <p role="alert">{snapshot.error}</p>
                    ) : (
                        <div>
                            <p>
                                Bản #{snapshot.number} · {dates(snapshot.at)}
                            </p>
                            <p>
                                Duty Thủ quỹ cũ:{' '}
                                {snapshot.value.legacyTreasurers?.map((m) => m.displayName).join(', ') || 'Không có'}
                            </p>
                            <p>
                                Chủ nhiệm:{' '}
                                {snapshot.value.leadership.owners.map((m) => m.displayName).join(', ') ||
                                    'Chưa có dữ liệu'}
                            </p>
                            <p>
                                Phó chủ nhiệm:{' '}
                                {snapshot.value.leadership.vicePresidents.map((m) => m.displayName).join(', ') ||
                                    'Chưa có bổ nhiệm hiệu lực lúc nộp'}
                            </p>
                            {snapshot.value.configuration.groups
                                .filter((g) => !g.protected && !g.archived)
                                .map((g) => (
                                    <p key={g.id}>
                                        <strong>{g.name}:</strong>{' '}
                                        {g.assignments.map((m) => m.displayName).join(', ') || 'Chưa phân công'}
                                    </p>
                                ))}
                        </div>
                    )}
                </V2Modal>
            )}
        </section>
    );
}
function GovernanceLeadership({ root, api, clubId, readOnly, capabilities, onNominate, onTransfer }) {
    const [route, setRoute] = useGovernanceQuery({ bqlLeadershipPage: 1 });
    const page = route.bqlLeadershipPage,
        setPage = (value) => setRoute({ bqlLeadershipPage: value });
    const [result, setResult] = useState({});
    useEffect(() => {
        let active = true;
        setResult({});
        if (!capabilities.canNominateVice && !capabilities.canTransferOwner) return;
        Promise.all([
            api.request(root + `/leadership-nominations?page=${page}&pageSize=20`),
            capabilities.canTransferOwner
                ? api.request(`/api/clubs/${encodeURIComponent(clubId)}/transfer-request`)
                : Promise.resolve(null),
        ])
            .then(([value, transfer]) => {
                const data = governancePage(value, clubId);
                if (transfer?.id && String(transfer.clubId) !== String(clubId))
                    throw new Error('Đề nghị chuyển giao không khớp CLB.');
                if (!governanceGuid(data.clubVersion)) throw new Error('Chưa có phiên bản CLB.');
                if (active) setResult({ data, transfer });
            })
            .catch((error) => {
                if (active) setResult({ error: governanceError(error) });
            });
        return () => {
            active = false;
        };
    }, [api, root, page]);
    return (
        <section>
            <h4>Bổ nhiệm lãnh đạo</h4>
            <p>
                Đề nghị và quyết định có hiệu lực riêng với báo cáo BQL. Phó chủ nhiệm không được tự chuyển giao chủ sở
                hữu.
            </p>
            {!readOnly && capabilities.canNominateVice && result.data && (
                <button className="v2-button" onClick={() => onNominate(result.data.clubVersion)}>
                    Đề nghị Phó chủ nhiệm
                </button>
            )}
            {!readOnly && capabilities.canTransferOwner && (
                <button
                    className="v2-button"
                    disabled={!result.data || result.transfer?.status === 'Pending'}
                    onClick={onTransfer}
                >
                    Đề nghị chuyển giao Chủ nhiệm
                </button>
            )}
            {result.transfer?.status === 'Pending' && (
                <p role="status">Đang chờ CTSV duyệt chuyển giao cho {result.transfer.newOwnerName}.</p>
            )}
            {capabilities.canNominateVice ? (
                <>
                    <ReadState result={result} />
                    {result.data?.items.map((item) => (
                        <article className="governance-history" key={item.id}>
                            <strong>{item.memberName}</strong>
                            <p>
                                {item.status === 'PENDING'
                                    ? 'Chờ CTSV duyệt'
                                    : item.status === 'APPROVED'
                                      ? Date.parse(item.effectiveFromUtc) > Date.now()
                                          ? 'Đã duyệt · Chờ ngày hiệu lực'
                                          : Date.parse(item.effectiveUntilUtc) <= Date.now()
                                            ? 'Đã hết hạn'
                                            : 'Bổ nhiệm đã có hiệu lực'
                                      : item.status === 'REVOKED'
                                        ? 'Đã thu hồi'
                                        : item.status === 'REJECTED'
                                          ? 'Đã từ chối'
                                          : item.status}
                            </p>
                            <p>
                                {dates(item.effectiveFromUtc)} → {dates(item.effectiveUntilUtc)}
                            </p>
                        </article>
                    ))}
                    <Pager data={result.data} page={page} setPage={setPage} />
                </>
            ) : (
                <p>Chủ nhiệm theo dõi đề nghị; CTSV có thẩm quyền duyệt và thu hồi bổ nhiệm.</p>
            )}
        </section>
    );
}
function ReadState({ result }) {
    return result.error ? (
        <p role="alert">{result.error}</p>
    ) : !result.data ? (
        <p role="status">Đang tải…</p>
    ) : !result.data.items.length ? (
        <p>Chưa có bản ghi.</p>
    ) : null;
}
function Pager({ data, page, setPage }) {
    return data?.totalPages > 1 ? (
        <nav aria-label="Phân trang BQL">
            <button className="v2-button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Trước
            </button>
            <span>
                Trang {page}/{data.totalPages}
            </span>
            <button className="v2-button" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
                Sau
            </button>
        </nav>
    ) : null;
}

function GovernanceModal({
    modal,
    catalog,
    term,
    root,
    termPath,
    api,
    clubId,
    busy,
    error,
    onClose,
    onReload,
    onSave,
}) {
    const [name, setName] = useState(modal.group?.name || ''),
        [description, setDescription] = useState(modal.group?.description || ''),
        [preset, setPreset] = useState(modal.group?.presetCode || 'CUSTOM'),
        [codes, setCodes] = useState(modal.group?.permissionCodes || []);
    const [reason, setReason] = useState(''),
        [memberId, setMemberId] = useState(modal.member && modal.kind !== 'replace' ? String(modal.member.membershipId) : ''),
        [sourceGroup, setSourceGroup] = useState(modal.fromGroup?.id || '');
    const [query, setQuery] = useState(''),
        [page, setPage] = useState(1),
        [members, setMembers] = useState({});
    const choosing = ['assign', 'replace', 'nominate', 'transfer'].includes(modal.kind);
    const candidatePath = modal.scoped ? termPath : root;
    const candidateGroupId = modal.scoped ? modal.group.id : null;
    const candidateSemesterId = modal.scoped ? term.semesterId : null;
    useEffect(() => {
        let active = true;
        if (!choosing) return;
        setMembers({});
        const timer = setTimeout(
            () =>
                api
                    .request(
                        candidatePath +
                            '/eligible-members?' +
                            new URLSearchParams({
                                page,
                                pageSize: 20,
                                search: query,
                                ...(candidateGroupId ? { groupId: candidateGroupId } : {}),
                            }),
                    )
                    .then((value) => {
                        const data = governancePage(value, clubId, candidateSemesterId);
                        if (
                            data.items.some(
                                (m) =>
                                    !Number.isSafeInteger(m.memberId) ||
                                    !Number.isSafeInteger(m.userId) ||
                                    !m.displayName,
                            )
                        )
                            throw new Error('Danh sách ứng viên chưa hợp lệ.');
                        if (active) setMembers({ data });
                    })
                    .catch((issue) => {
                        if (active) setMembers({ error: governanceError(issue) });
                    }),
            query ? 250 : 0,
        );
        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [api, candidatePath, candidateGroupId, candidateSemesterId, clubId, page, query, choosing]);
    const titles = {
        initialize: 'Khởi tạo BQL học kỳ',
        create: 'Tạo nhóm BQL',
        edit: 'Sửa nhóm BQL',
        assign: 'Thêm hoặc chuyển phân công',
        replace: 'Thay thành viên trong ban',
        setLead: 'Chỉ định Chủ nhiệm ban',
        clearLead: 'Gỡ Chủ nhiệm ban',
        remove: 'Gỡ phân công',
        archive: 'Ngừng sử dụng nhóm',
        report: 'Kiểm tra bản chụp trước khi nộp',
        nominate: 'Đề nghị Phó chủ nhiệm',
        transfer: 'Đề nghị chuyển giao Chủ nhiệm',
    };
    const submit = (event) => {
        event.preventDefault();
        if (busy || !reason.trim()) return;
        const common = {
            expectedVersion: term?.version,
            reason: reason.trim(),
        };
        if (modal.kind === 'initialize')
            return onSave('initialize', termPath + '/initialize', 'POST', {
                expectedClubVersion: term.clubVersion,
                reason: reason.trim(),
            });
        if (['create', 'edit'].includes(modal.kind))
            return onSave(
                modal.kind,
                termPath + '/groups' + (modal.group ? '/' + modal.group.id : ''),
                modal.group ? 'PATCH' : 'POST',
                {
                    ...common,
                    name: name.trim(),
                    description: description.trim(),
                    presetCode: preset,
                    permissionCodes: codes,
                },
            );
        if (modal.kind === 'archive')
            return onSave('archive', termPath + '/groups/' + modal.group.id + '/archive', 'POST', common);
        const memberOperation = { remove: 'REMOVE', setLead: 'SET_LEAD', clearLead: 'CLEAR_LEAD' }[modal.kind];
        if (memberOperation)
            return onSave(modal.kind, termPath + '/assignment-changes', 'POST', {
                ...common,
                operation: memberOperation,
                groupId: modal.group.id,
                membershipIds: [modal.member.membershipId],
            });
        if (modal.kind === 'report')
            return onSave('report', termPath + '/report-submissions', 'POST', {
                ...common,
                sourceRevisionId: term.revisionId,
                expectedLeadershipDigest: term.leadershipDigest,
                expectedClubVersion: term.clubVersion,
            });
        const member = members.data?.items.find((m) => String(m.memberId) === memberId);
        if (!member) return;
        if (modal.kind === 'nominate')
            return onSave('nominate', root + '/leadership-nominations', 'POST', {
                membershipId: member.memberId,
                expectedClubVersion: modal.clubVersion,
                reason: reason.trim(),
            });
        if (modal.kind === 'transfer')
            return onSave('transfer', `/api/clubs/${encodeURIComponent(clubId)}/transfer-ownership`, 'POST', {
                newOwnerUserId: member.userId,
                reason: reason.trim(),
            });
        return onSave('assign', termPath + '/assignment-changes', 'POST', {
            ...common,
            operation: modal.kind === 'replace' ? 'REPLACE' : sourceGroup ? 'TRANSFER' : 'ADD',
            groupId: modal.group.id,
            membershipIds: [member.memberId],
            fromGroupId: sourceGroup || null,
            ...(modal.kind === 'replace' ? { replaceMembershipId: modal.member.membershipId } : {}),
        });
    };
    return (
        <V2Modal title={titles[modal.kind]} onClose={onClose} wide className="governance-modal">
            <form className="governance-form" onSubmit={submit}>
                <fieldset disabled={busy}>
                    {['create', 'edit'].includes(modal.kind) && (
                        <>
                            <label>
                                Tên nhóm
                                <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
                            </label>
                            <label>
                                Mô tả
                                <textarea
                                    maxLength={300}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </label>
                            <label>
                                Nhóm mẫu
                                <select
                                    value={preset}
                                    onChange={(e) => {
                                        setPreset(e.target.value);
                                        setCodes(
                                            catalog.presets.find((p) => p.code === e.target.value)?.permissionCodes ||
                                                [],
                                        );
                                    }}
                                >
                                    {catalog.presets.map((p) => (
                                        <option key={p.code} value={p.code}>
                                            {governancePresetLabels[p.code]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div className="governance-permissions">
                                {catalog.permissions.map((permission) => (
                                    <label key={permission.code}>
                                        <input
                                            type="checkbox"
                                            checked={codes.includes(permission.code)}
                                            onChange={(e) =>
                                                setCodes((values) =>
                                                    e.target.checked
                                                        ? [...values, permission.code]
                                                        : values.filter((code) => code !== permission.code),
                                                )
                                            }
                                        />
                                        {CLUB_CAPABILITY_LABELS[permission.code]}
                                    </label>
                                ))}
                            </div>
                            <p>
                                Tên nhóm không tự cấp quyền lãnh đạo. Quyền tài chính ghi/nộp chịu giới hạn hai người
                                giữ duty Thủ quỹ.
                            </p>
                        </>
                    )}
                    {choosing && (
                        <>
                            <label>
                                Tìm ứng viên
                                <input
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setPage(1);
                                        setMemberId('');
                                    }}
                                />
                            </label>
                            <ReadState result={members} />
                            <label>
                                Thành viên
                                <select
                                    required
                                    value={memberId}
                                    onChange={(e) => {
                                        setMemberId(e.target.value);
                                        setSourceGroup('');
                                    }}
                                >
                                    <option value="">Chọn thành viên được duyệt</option>
                                    {members.data?.items.map((member) => (
                                        <option key={member.memberId} value={member.memberId}>
                                            {member.displayName}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <Pager
                                data={members.data}
                                page={page}
                                setPage={(value) => {
                                    setPage(value);
                                    setMemberId('');
                                }}
                            />
                            {modal.kind === 'assign' && !modal.scoped && (
                                <label>
                                    Kiểu phân công
                                    <select value={sourceGroup} onChange={(e) => setSourceGroup(e.target.value)}>
                                        <option value="">Thêm nhóm, giữ các nhóm hiện có</option>
                                        {term.configuration.groups
                                            .filter(
                                                (g) =>
                                                    !g.protected &&
                                                    !g.archived &&
                                                    g.id !== modal.group.id &&
                                                    g.assignments.some((a) => String(a.membershipId) === memberId),
                                            )
                                            .map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    Chuyển từ {g.name}
                                                </option>
                                            ))}
                                    </select>
                                </label>
                            )}
                        </>
                    )}
                    {modal.kind === 'remove' && (
                        <p>
                            Gỡ {modal.member.displayName} khỏi {modal.group.name}. Các phân công khác của thành viên
                            được giữ lại.
                        </p>
                    )}
                    {['replace', 'setLead', 'clearLead'].includes(modal.kind) && (
                        <p>{modal.member.displayName} · {modal.group.name}</p>
                    )}
                    {modal.kind === 'archive' && (
                        <p>
                            Ngừng nhóm {modal.group.name} và kết thúc mọi phân công trong nhóm. Các bản chụp, lịch sử
                            trước đó được giữ lại.
                        </p>
                    )}
                    {modal.kind === 'report' && (
                        <>
                            <p>
                                Bản lưu #{term.sequence} · {term.semesterCode}
                            </p>
                            <p>
                                Duty Thủ quỹ cũ:{' '}
                                {term.legacyTreasurers?.map((m) => m.displayName).join(', ') || 'Không có'}
                            </p>
                            <p>
                                Chủ nhiệm:{' '}
                                {term.leadership.owners.map((m) => m.displayName).join(', ') || 'Chưa có dữ liệu'}
                            </p>
                            <p>
                                Phó chủ nhiệm:{' '}
                                {term.leadership.vicePresidents.map((m) => m.displayName).join(', ') ||
                                    'Chưa có bổ nhiệm hiệu lực'}
                            </p>
                            {term.configuration.groups
                                .filter((g) => !g.archived && !g.protected)
                                .map((g) => (
                                    <p key={g.id}>
                                        <strong>{g.name}:</strong>{' '}
                                        {g.assignments.map((m) => m.displayName).join(', ') || 'Chưa phân công'}
                                    </p>
                                ))}
                            <p>
                                Nộp báo cáo không thay đổi quyền. Nếu phân công hoặc lãnh đạo đổi sau khi xem, cần tải
                                lại trước khi nộp.
                            </p>
                        </>
                    )}
                    {modal.kind === 'initialize' && (
                        <p>
                            Tạo bảy nhóm mặc định cho học kỳ chính thức. Không tự sao chép quyền, phân công hay bổ nhiệm
                            từ dữ liệu cũ.
                        </p>
                    )}
                    {['nominate', 'transfer'].includes(modal.kind) && (
                        <p>
                            Đây là đề nghị chờ CTSV duyệt. Không cấp quyền lãnh đạo ngay; không tự đổi vai trò qua báo
                            cáo BQL.
                        </p>
                    )}
                    <label>
                        Lý do
                        <textarea required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
                    </label>
                </fieldset>
                {error && <p role="alert">{error}</p>}
                <footer>
                    <button type="button" className="v2-button" disabled={busy} onClick={onClose}>
                        Đóng
                    </button>
                    {error && (
                        <button type="button" className="v2-button" disabled={busy} onClick={onReload}>
                            Tải lại bản mới
                        </button>
                    )}
                    <button className="v2-button v2-button--primary" disabled={busy || (choosing && !memberId)}>
                        {busy ? 'Đang lưu…' : modal.kind === 'report' ? 'Nộp bản chụp BQL' : 'Xác nhận'}
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
