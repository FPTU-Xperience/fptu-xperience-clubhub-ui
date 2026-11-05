import { useEffect, useState } from 'react';
import { Award, Sparkles, Gift, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import {
    clubPointPillars,
    clubPointStatistics,
    clubPointSummary,
    personalClubPoints,
} from '../../../../services/club-points';
import { creditNumber, creditWallet } from '../../../../services/club-credit';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import WorkspacePolicyStatus from '../../../../components/v2/activity-detail/WorkspacePolicyStatus';
import ClubCreditWallet from './ClubCreditWallet';
import './PointsTab.scss';

const statusLabels = {
    APPROVED: 'Đã ghi nhận',
    REVOKED: 'Đã thu hồi',
    SUBMITTED: 'Chờ xác minh',
    REVISION_REQUESTED: 'Cần bổ sung',
    REJECTED: 'Không thông qua',
};
function Stat({ label, value, note, icon: Icon = Award }) {
    return (
        <div className="v2-club-points-stat">
            <Icon size={22} />
            <span>{label}</span>
            <strong>{value == null ? '—' : creditNumber(value)}</strong>
            <small>{note}</small>
        </div>
    );
}

export default function PointsTab({ workspace, manager = false, readOnly = false }) {
    const { user, api } = useAuth();
    const [selected, setSelected] = useState('club'),
        [retry, setRetry] = useState(0),
        [result, setResult] = useState({}),
        [walletOpen, setWalletOpen] = useState(false);
    const view = manager && !readOnly ? selected : 'mine';
    const clubId = workspace?.clubId,
        semesterId = workspace?.semester?.code || workspace?.semester?.semesterId;
    const identity = `${user?.id}:${clubId}:${semesterId}:${view}:${readOnly}`;
    const state = result.identity === identity ? result : {};
    useEffect(() => {
        let active = true;
        setResult({});
        setWalletOpen(false);
        if (readOnly || !user?.id || !clubId || !semesterId) return;
        const load =
            view === 'club'
                ? api
                      .request(
                          `/api/clubs/${encodeURIComponent(clubId)}/experience-statistics?${new URLSearchParams({ semesterId })}`,
                      )
                      .then((value) => ({ statistics: clubPointStatistics(value, clubId, semesterId) }))
                : Promise.all([
                      personalClubPoints(api, user.id, clubId),
                      api
                          .request(`/api/clubs/${encodeURIComponent(clubId)}/wallet/me`)
                          .then((value) => ({ wallet: creditWallet(value, user.id, clubId) }))
                          .catch((issue) => ({ walletError: issue.message })),
                  ]).then(([rows, wallet]) => ({ ...clubPointSummary(rows, semesterId), ...wallet }));
        load.then((value) => {
            if (active) setResult({ identity, ...value });
        }).catch((issue) => {
            if (active) setResult({ identity, error: issue.message });
        });
        return () => {
            active = false;
        };
    }, [api, identity, retry]);
    return (
        <WorkspaceTabLayout
            title="Điểm & thành tích"
            description="Mỗi điểm ghi nhận đều có một câu chuyện và nguồn minh chứng."
        >
            {() => (
                <div className="v2-club-points">
                    {manager && !readOnly && (
                        <div className="v2-club-points-tabs" role="tablist" aria-label="Phạm vi điểm CLB">
                            {[
                                ['club', 'Tính điểm CLB'],
                                ['mine', 'Điểm cá nhân trong CLB'],
                            ].map(([key, title]) => (
                                <button
                                    key={key}
                                    id={`points-tab-${key}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={view === key}
                                    aria-controls="club-points-panel"
                                    className={`v2-button${view === key ? ' v2-button--primary' : ''}`}
                                    onClick={() => setSelected(key)}
                                >
                                    {title}
                                </button>
                            ))}
                        </div>
                    )}
                    <div
                        id="club-points-panel"
                        role={manager && !readOnly ? 'tabpanel' : undefined}
                        aria-labelledby={manager && !readOnly ? `points-tab-${view}` : undefined}
                    >
                        {readOnly ? (
                            <p>Chế độ quan sát không hiển thị điểm và ví cá nhân.</p>
                        ) : !semesterId ? (
                            <p>Chọn học kỳ của workspace để xem điểm tại CLB.</p>
                        ) : (
                            <>
                                <div className="v2-club-points-heading">
                                    <h2>{view === 'club' ? 'Tổng hợp điểm CLB' : 'Đóng góp của tôi tại CLB'}</h2>
                                    <button
                                        className="v2-button"
                                        type="button"
                                        onClick={() => setRetry((value) => value + 1)}
                                    >
                                        Tải lại điểm
                                    </button>
                                </div>
                                <p className="v2-club-points-period">
                                    {workspace.name || workspace.clubName} · {workspace.semester.label || semesterId}
                                </p>
                                {state.error ? (
                                    <p role="alert">{state.error}</p>
                                ) : !(state.statistics || state.rows) ? (
                                    <p role="status">Đang tải điểm đã xác minh…</p>
                                ) : view === 'club' ? (
                                    <ClubPoints
                                        statistics={state.statistics}
                                        api={api}
                                        clubId={clubId}
                                        semesterId={semesterId}
                                    />
                                ) : (
                                    <>
                                        <div className="v2-club-points-stats">
                                            <Stat
                                                label="XP của tôi trong học kỳ"
                                                value={state.periodXp}
                                                note={`${state.approvedCount} đóng góp đã ghi nhận`}
                                            />
                                            <Stat
                                                label="XP tích lũy tại CLB"
                                                value={state.lifetimeXp}
                                                note="Giữ lại qua các học kỳ"
                                                icon={Sparkles}
                                            />
                                            <Stat
                                                label="Credit đổi quà tại CLB"
                                                value={state.wallet?.balance}
                                                note="Đổi quà không làm giảm XP"
                                                icon={Gift}
                                            />
                                        </div>
                                        {state.walletError && (
                                            <p role="alert">Chưa tải được ví đổi quà: {state.walletError}</p>
                                        )}
                                        <div className="v2-club-points-note">
                                            <ShieldCheck size={28} />
                                            <div>
                                                <h3>Điểm ghi nhận từ đóng góp đã xác minh</h3>
                                                <p>
                                                    XP chỉ tính các đóng góp được duyệt của bạn tại CLB này. Khoản đã
                                                    thu hồi được giữ trong lịch sử và loại khỏi tổng điểm hiện tại.
                                                </p>
                                            </div>
                                        </div>
                                        <section className="v2-club-points-panel">
                                            <h3>Sổ ghi nhận đóng góp trong học kỳ</h3>
                                            <div className="v2-club-points-scroll">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Đóng góp</th>
                                                            <th>Ngày diễn ra</th>
                                                            <th>Trạng thái</th>
                                                            <th>XP ghi nhận</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {state.rows.map((row) => (
                                                            <tr key={row.id}>
                                                                <td>
                                                                    <strong>{row.title}</strong>
                                                                    <small>
                                                                        {row.activityId
                                                                            ? `Hoạt động #${row.activityId}`
                                                                            : 'Đóng góp CLB'}
                                                                    </small>
                                                                </td>
                                                                <td>
                                                                    {new Date(row.occurredAt).toLocaleDateString(
                                                                        'vi-VN',
                                                                        { timeZone: 'Asia/Ho_Chi_Minh' },
                                                                    )}
                                                                </td>
                                                                <td>{statusLabels[row.status]}</td>
                                                                <td>
                                                                    {row.status === 'APPROVED'
                                                                        ? creditNumber(row.rawPoints)
                                                                        : '—'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            {!state.rows.length && (
                                                <p>Chưa có đóng góp của bạn tại CLB trong học kỳ này.</p>
                                            )}
                                        </section>
                                        <details
                                            className="v2-club-points-panel"
                                            open={walletOpen}
                                            onToggle={(event) => setWalletOpen(event.currentTarget.open)}
                                        >
                                            <summary>Ví đổi quà và lịch sử credit</summary>
                                            {walletOpen && (
                                                <ClubCreditWallet key={identity} clubId={clubId} revision={retry} />
                                            )}
                                        </details>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </WorkspaceTabLayout>
    );
}

function ClubPoints({ statistics: value, api, clubId, semesterId }) {
    const total = clubPointPillars.reduce((sum, [key]) => sum + value.netPointsByPillar[key], 0);
    return (
        <>
            <div className="v2-club-points-stats">
                <Stat label="XP ghi nhận từ đóng góp tại CLB" value={total} note="Tổng ròng sau điều chỉnh" />
                <Stat label="Đóng góp đã duyệt" value={value.approvedContributionCount} note="Trong học kỳ đang chọn" />
                <Stat
                    label="Người tham gia đã xác minh"
                    value={value.activities.uniqueVerifiedParticipantCount}
                    note="Mỗi người chỉ tính một lần"
                />
            </div>
            <div className="v2-club-points-note">
                <ShieldCheck size={28} />
                <div>
                    <h3>Tính theo nguồn đã xác minh</h3>
                    <p>
                        Điểm tổng hợp từ sổ XP của các đóng góp tại CLB trong học kỳ, sau các điều chỉnh và thu hồi.
                        Credit đổi quà không làm giảm số điểm này.
                    </p>
                    <WorkspacePolicyStatus api={api} clubId={clubId} semesterId={semesterId} />
                </div>
            </div>
            <section className="v2-club-points-panel">
                <h3>Phân bổ XP theo trụ cột</h3>
                <div className="v2-club-points-bars">
                    {clubPointPillars.map(([key, label]) => (
                        <div key={key}>
                            <span>{label}</span>
                            <strong>{creditNumber(value.netPointsByPillar[key])}</strong>
                            <progress
                                aria-label={label}
                                value={Math.max(0, value.netPointsByPillar[key])}
                                max={Math.max(1, ...Object.values(value.netPointsByPillar))}
                            />
                        </div>
                    ))}
                </div>
            </section>
            <section className="v2-club-points-panel">
                <h3>Hoạt động và mục tiêu học kỳ</h3>
                <div className="v2-club-points-scroll">
                    <table>
                        <thead>
                            <tr>
                                <th>Chỉ tiêu</th>
                                <th>Đã ghi nhận</th>
                                <th>Mục tiêu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                ['activities', 'Hoạt động đã công bố'],
                                ['sessions', 'Phiên đã hoàn thành'],
                                ['uniqueParticipants', 'Người tham gia đã xác minh'],
                            ].map(([key, label]) => (
                                <tr key={key}>
                                    <td>{label}</td>
                                    <td>{creditNumber(value.progress[key].actual)}</td>
                                    <td>
                                        {value.plan ? creditNumber(value.progress[key].target) : 'Chưa có kế hoạch'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
