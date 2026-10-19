import { useEffect, useState } from 'react';
import ContributionDetails from '../../../components/v2/experience/ContributionDetails';
import VerificationQueue from '../../../components/v2/experience/VerificationQueue';
import ExternalDeclarationForm from '../../../components/v2/experience/ExternalDeclarationForm';
import ManualAttendanceRequest from '../../../components/v2/experience/ManualAttendanceRequest';
import ExperienceRadar from '../../../components/v2/experience/ExperienceRadar';

const labels = {
    contributions: 'Đóng góp',
    ledger: 'Sổ điểm',
    history: 'Tham gia hoạt động',
    declaration: 'Tự khai trải nghiệm',
    queue: 'Hàng chờ xác minh',
};
const date = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '—');

export default function ExperiencePanel({ api, sessionKey, history = false }) {
    const [kind, setKind] = useState('contributions');
    const [semesterId, setSemesterId] = useState('');
    const [page, setPage] = useState(1);
    const [attempt, retry] = useState(0);
    const [result, setResult] = useState(null);
    const [selected, setSelected] = useState(null),
        [manual, setManual] = useState(null);
    const identity = `${sessionKey}:${history}:${kind}:${semesterId}:${page}:${attempt}`;
    useEffect(() => {
        let active = true;
        setResult({ identity, status: 'loading' });
        if (history && ['declaration', 'queue'].includes(kind)) {
            setResult({ identity, status: 'ready' });
            return undefined;
        }
        const params = { ...(semesterId ? { semesterId } : {}), scope: semesterId ? 'PERIOD' : 'CUMULATIVE' };
        const read = history
            ? api[
                  {
                      contributions: 'getMyContributions',
                      ledger: 'getMyExperienceLedger',
                      history: 'getMyActivityHistory',
                  }[kind]
              ]({ ...(semesterId ? { semesterId } : {}), page, pageSize: 20 })
            : Promise.allSettled([api.getMyExperienceSummary(params), api.getMyRadar(params)]);
        Promise.resolve(read).then(
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
    }, [api, identity]);
    const current = result?.identity === identity ? result : { status: 'loading' };
    const summary = !history && current.data?.[0]?.value;
    const radar = !history && current.data?.[1]?.value;
    const items = history && Array.isArray(current.data?.items) ? current.data.items : [];
    const totalPages = current.data?.totalPages || 1;
    const failures = !history && current.data?.filter((item) => item.status === 'rejected');
    return (
        <section className="v2-profile-panel v2-experience-operations" aria-label="Trải nghiệm cá nhân">
            <h2>{history ? 'Lịch sử đóng góp & hoạt động' : 'Trải nghiệm đã ghi nhận'}</h2>
            <label>
                Học kỳ (để trống xem tích lũy)
                <input
                    value={semesterId}
                    maxLength={40}
                    placeholder="Mã học kỳ"
                    onChange={(event) => {
                        setSemesterId(event.target.value.trim());
                        setPage(1);
                    }}
                />
            </label>
            {history && (
                <div className="v2-tabs" role="group" aria-label="Loại lịch sử">
                    {Object.entries(labels).map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            aria-pressed={kind === value}
                            onClick={() => {
                                setKind(value);
                                setPage(1);
                                setSelected(null);
                                setManual(null);
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
            {history && kind === 'queue' && <VerificationQueue key={sessionKey} api={api} />}
            {history && kind === 'declaration' && <ExternalDeclarationForm key={sessionKey} api={api} />}
            {selected && (
                <ContributionDetails
                    key={`${sessionKey}:${selected}`}
                    api={api}
                    id={selected}
                    onClose={() => setSelected(null)}
                    onChanged={() => retry((value) => value + 1)}
                />
            )}
            {manual && (
                <ManualAttendanceRequest
                    key={`${sessionKey}:${manual.activityId}:${manual.sessionId}`}
                    api={api}
                    {...manual}
                    onClose={() => setManual(null)}
                />
            )}
            {current.status === 'loading' && <p role="status">Đang tải trải nghiệm…</p>}
            {(current.status === 'error' || failures?.length > 0) && (
                <div role="alert">
                    <p>{current.error?.message || failures?.[0]?.reason?.message || 'Không thể tải trải nghiệm.'}</p>
                    <button type="button" className="v2-button" onClick={() => retry((value) => value + 1)}>
                        Thử lại
                    </button>
                </div>
            )}
            {summary && (
                <dl className="v2-profile-stats">
                    <div>
                        <dt>Điểm trải nghiệm thô</dt>
                        <dd>{summary.rawExperiencePoints ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Đóng góp được ghi nhận</dt>
                        <dd>{summary.recognizedContributionCount ?? '—'}</dd>
                    </div>
                    <div>
                        <dt>Lần điểm danh xác minh</dt>
                        <dd>{summary.availability?.attendance ? summary.verifiedAttendanceCount : 'Chưa khả dụng'}</dd>
                    </div>
                </dl>
            )}
            {radar && (
                <>
                    <p>
                        {radar.isAuthoritative ? 'Dữ liệu đã xác minh' : 'Dữ liệu xem trước'} · {radar.profileTitle} ·
                        ERI: {radar.eri}
                    </p>
                    <ExperienceRadar radarAxes={radar.radarAxes} />
                    <dl>
                        {radar.radarAxes?.map((axis) => (
                            <div key={axis.pillar}>
                                <dt>{axis.pillar}</dt>
                                <dd>
                                    {axis.saturatedScore}/100 · {axis.rawPointsSum} điểm thô
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {radar.plusOne && (
                        <p>
                            Thực chiến: {radar.plusOne.rawPointsSum} · Hệ số: {radar.m}
                        </p>
                    )}
                    <small>
                        Chính sách {radar.policyVersion || '—'} · {radar.formulaVersion} · {date(radar.asOf)}
                    </small>
                </>
            )}
            {history && !['declaration', 'queue'].includes(kind) && current.status === 'ready' && (
                <>
                    {!items.length && <p>Chưa có bản ghi phù hợp.</p>}
                    {items.map((item, index) => (
                        <article key={item.entryId || item.id || `${item.activityId}:${item.sessionId}:${index}`}>
                            <h3>{item.title || item.pillar || `Hoạt động ${item.activityId || ''}`}</h3>
                            <p>
                                {item.status || item.verificationStatus || item.entryType} ·{' '}
                                {item.semesterId || 'Chưa gán học kỳ'}
                            </p>
                            {kind === 'ledger' && (
                                <p>
                                    {item.amount} · {item.pillar} · {item.entryType}
                                </p>
                            )}
                            <p>
                                {date(item.occurredAt || item.startTime || item.recordedAt)} ·{' '}
                                {item.sourceNamespace || item.sourceType}
                            </p>
                            {item.policyVersion && (
                                <small>
                                    Chính sách {item.policyVersion} · {item.formulaVersion}
                                </small>
                            )}
                            {(item.contributionId || (kind === 'contributions' && item.isAuthoritative !== false)) && (
                                <button
                                    type="button"
                                    className="v2-button"
                                    onClick={() => setSelected(item.contributionId || item.id)}
                                >
                                    Xem chi tiết & lịch sử quyết định
                                </button>
                            )}
                            {kind === 'history' && item.sessionId && item.verificationStatus !== 'VERIFIED' && (
                                <button
                                    type="button"
                                    className="v2-button"
                                    onClick={() =>
                                        setManual({ activityId: item.activityId, sessionId: item.sessionId })
                                    }
                                >
                                    Yêu cầu xác nhận điểm danh
                                </button>
                            )}
                        </article>
                    ))}
                    <nav aria-label="Trang lịch sử">
                        <button
                            type="button"
                            className="v2-button"
                            disabled={page <= 1}
                            onClick={() => setPage((value) => value - 1)}
                        >
                            Trước
                        </button>
                        <span>
                            {' '}
                            {page}/{totalPages}{' '}
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
                </>
            )}
        </section>
    );
}
