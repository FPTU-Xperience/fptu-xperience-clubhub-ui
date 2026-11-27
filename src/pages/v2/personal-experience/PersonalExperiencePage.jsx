import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, FileCheck2, Plus, RefreshCw, Send, Trash2 } from 'lucide-react';
import PageState from '../../../components/v2/PageState';
import {
    EXPERIENCE_CATEGORIES,
    EXPERIENCE_RESULTS,
    EXPERIENCE_ROLES,
    EXPERIENCE_SCALES,
    EXPERIENCE_STATES,
    GUID,
    blankExperience,
    createPersonalExperienceClient,
    experiencePayload,
    validateEvidenceFile,
    validateExperience,
} from './personal-experience-data';
import './PersonalExperiencePage.scss';

const date = (value) =>
    value && Number.isFinite(Date.parse(value))
        ? new Date(value).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        : '—';
const category = (code) => EXPERIENCE_CATEGORIES.find(([id]) => id === code)?.[1] || code;
const status = (value) =>
    EXPERIENCE_STATES[String(value).toUpperCase().replaceAll('REVISIONREQUESTED', 'REVISION_REQUESTED')] || value;
function Field({ label, children }) {
    return (
        <label className="personal-experience-field">
            <span>{label}</span>
            {children}
        </label>
    );
}
function SelectField({ label, value, onChange, options, disabled = false }) {
    return (
        <Field label={label}>
            <select disabled={disabled} value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map(([id, text]) => (
                    <option key={id} value={id}>
                        {text}
                    </option>
                ))}
            </select>
        </Field>
    );
}

function ExperienceForm({ api, client, semesterId, clubAccess = [], onBack, onSubmitted, revisionRecord = null, legacyRecord = null }) {
    const [form, setForm] = useState(() =>
            revisionRecord
                ? {
                      ...blankExperience(revisionRecord.semesterId),
                      title: revisionRecord.title,
                      organizationSource: revisionRecord.organizationSource || '',
                      isRevision: true,
                      occurredDate: new Date(Date.parse(revisionRecord.occurredAt) + 7 * 60 * 60 * 1000)
                          .toISOString()
                          .slice(0, 10),
                      category: revisionRecord.proposedAttributes.pillarWeights[0].pillar,
                      description: revisionRecord.message || '',
                      ...revisionRecord.proposedAttributes,
                      referenceMode: revisionRecord.referringClubId ? 'CLUB' : 'DIRECT',
                      referenceClubId: revisionRecord.referringClubId || '',
                  }
                : legacyRecord ? {
                    ...blankExperience(semesterId), title: legacyRecord.title,
                    organizationSource: legacyRecord.organizationSource || '',
                    occurredDate: legacyRecord.startDate || '', description: legacyRecord.evidenceDescription || '',
                    category: legacyRecord.category || 'Academic',
                } : blankExperience(semesterId),
        ),
        [files, setFiles] = useState(() =>
            (revisionRecord?.evidenceRefs || []).map((id, index) => ({
                key: id,
                evidenceId: id,
                file: { name: `Minh chứng đã gửi ${index + 1}`, size: 0 },
            })),
        ),
        [busy, setBusy] = useState(false),
        [error, setError] = useState('');
    const key = useRef(crypto.randomUUID()),
        lock = useRef(false),
        alive = useRef(true);
    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);
    const change = (field, value) => {
        setForm((p) => ({ ...p, [field]: value }));
        key.current = crypto.randomUUID();
    };
    const submit = async (event) => {
        event.preventDefault();
        if (lock.current) return;
        try {
            validateExperience(form, files);
        } catch (issue) {
            setError(issue.message);
            return;
        }
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const refs = [];
            for (const item of files) {
                let id = item.evidenceId;
                if (!id) {
                    const result = await api.uploadContributionEvidence(item.file, item.key);
                    id = result?.evidenceId;
                    if (!GUID.test(id)) throw new Error('Máy chủ chưa xác nhận minh chứng đã tải lên.');
                    if (!alive.current) return;
                    setFiles((previous) =>
                        previous.map((row) => (row.key === item.key ? { ...row, evidenceId: id } : row)),
                    );
                }
                refs.push(id);
            }
            const payload = experiencePayload(form, refs);
            if (revisionRecord) payload.evidenceDescription = form.description.trim();
            if (revisionRecord && revisionRecord.proposedAttributes.pillarWeights.length > 1)
                payload.proposedAttributes.pillarWeights = revisionRecord.proposedAttributes.pillarWeights;
            const result = legacyRecord ? await client.upgrade(legacyRecord, payload, key.current) : revisionRecord
                ? await client.revise(revisionRecord, payload, key.current)
                : await client.submit(payload, key.current);
            if (alive.current) onSubmitted(result);
        } catch (issue) {
            if (alive.current)
                setError(issue.message || 'Không thể gửi trải nghiệm. Các minh chứng đã tải lên được giữ để thử lại.');
        } finally {
            lock.current = false;
            if (alive.current) setBusy(false);
        }
    };
    return (
        <form className="personal-experience-form" onSubmit={submit}>
            <button className="v2-button" type="button" onClick={onBack} disabled={busy}>
                <ArrowLeft size={16} /> Danh sách trải nghiệm
            </button>
            <section className="personal-experience-panel">
                <h2>{legacyRecord ? 'Bổ sung hồ sơ cũ để xét duyệt' : revisionRecord ? 'Bổ sung và gửi lại trải nghiệm' : 'Tạo trải nghiệm tự khai'}</h2>
                {legacyRecord && <p>Chọn học kỳ và tải minh chứng riêng tư để tiếp tục hồ sơ đang chờ. Hồ sơ giữ nguyên mã và chưa được cộng điểm.</p>}
                <p>
                    Ghi nhận giải thi đấu, cuộc thi bên ngoài, văn bằng hoặc chứng chỉ bạn đã đạt được. Đính kèm minh
                    chứng để đề nghị xét Xperience Point.
                </p>
                <fieldset disabled={busy} className="personal-experience-fields">
                    <div className="personal-experience-grid">
                        <Field label="Tên trải nghiệm *">
                            <input
                                required
                                maxLength={200}
                                disabled={Boolean(revisionRecord)}
                                value={form.title}
                                onChange={(e) => change('title', e.target.value)}
                                placeholder="Ví dụ: Đạt giải cuộc thi lập trình bên ngoài"
                            />
                        </Field>
                        {!revisionRecord && (
                            <SelectField
                                label="Hình thức trải nghiệm"
                                disabled={Boolean(revisionRecord)}
                                value={form.kind}
                                onChange={(v) => change('kind', v)}
                                options={[
                                    ['competition', 'Thi đấu / cuộc thi bên ngoài'],
                                    ['certificate', 'Chứng chỉ'],
                                    ['qualification', 'Văn bằng'],
                                    ['other', 'Trải nghiệm khác'],
                                ]}
                            />
                        )}
                        <Field label="Đơn vị tổ chức / cấp chứng nhận *">
                            <input
                                disabled={Boolean(revisionRecord)}
                                required
                                value={form.organizationSource}
                                onChange={(e) => change('organizationSource', e.target.value)}
                                placeholder="Tên đơn vị ghi trên minh chứng"
                            />
                        </Field>
                        <Field label="Ngày đạt được / hoàn thành *">
                            <input
                                type="date"
                                disabled={Boolean(revisionRecord)}
                                required
                                value={form.occurredDate}
                                onChange={(e) => change('occurredDate', e.target.value)}
                            />
                        </Field>
                        <Field label="Học kỳ *">
                            <input
                                required
                                value={form.semesterId}
                                disabled={Boolean(revisionRecord)}
                                onChange={(e) => change('semesterId', e.target.value)}
                                placeholder="Mã học kỳ do trường cung cấp"
                            />
                        </Field>
                        <SelectField
                            label="Nhóm trải nghiệm"
                            disabled={
                                Boolean(revisionRecord) &&
                                (revisionRecord.sourceType === 'REAL_WORLD' ||
                                    revisionRecord.proposedAttributes.pillarWeights.length > 1)
                            }
                            value={form.category}
                            onChange={(v) => change('category', v)}
                            options={
                                revisionRecord?.sourceType === 'EXTERNAL'
                                    ? EXPERIENCE_CATEGORIES.filter(([id]) => id !== 'RealWorldWork')
                                    : EXPERIENCE_CATEGORIES
                            }
                        />
                    </div>
                    <Field label="Kết quả đạt được & mô tả minh chứng *">
                        <textarea
                            required
                            maxLength={1800}
                            rows={5}
                            value={form.description}
                            onChange={(e) => change('description', e.target.value)}
                            placeholder="Bạn đã làm gì, đạt kết quả nào? Minh chứng thể hiện tên, ngày, đơn vị cấp hoặc giải thưởng ở đâu?"
                        />
                    </Field>
                </fieldset>
            </section>
            <section className="personal-experience-panel">
                <h2>Tham chiếu từ CLB</h2>
                <p>
                    Bạn có thể gửi trực tiếp hoặc chọn thông qua CLB mình trực thuộc để tham chiếu/xác nhận. Tham chiếu
                    CLB không thay thế quyết định xét duyệt của CTSV.
                </p>
                <fieldset disabled={busy || Boolean(revisionRecord)} className="personal-experience-reference">
                    <legend className="personal-experience-sr">Hình thức gửi trải nghiệm</legend>
                    <label>
                        <input
                            type="radio"
                            name="referenceMode"
                            checked={form.referenceMode === 'DIRECT'}
                            onChange={() => change('referenceMode', 'DIRECT')}
                        />
                        <span>
                            <strong>Gửi trực tiếp</strong>
                            <small>Không qua tham chiếu CLB; gửi minh chứng để CTSV xét duyệt.</small>
                        </span>
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="referenceMode"
                            checked={form.referenceMode === 'CLUB'}
                            onChange={() => change('referenceMode', 'CLUB')}
                        />
                        <span>
                            <strong>Thông qua CLB trực thuộc</strong>
                            <small>Đề nghị CLB tham chiếu trước khi chuyển xét duyệt.</small>
                        </span>
                    </label>
                </fieldset>
                {form.referenceMode === 'CLUB' && (
                    <>
                        <Field label="CLB tham chiếu">
                            <select
                                value={form.referenceClubId}
                                disabled={busy || Boolean(revisionRecord) || !clubAccess.length}
                                onChange={(e) => change('referenceClubId', e.target.value)}
                            >
                                <option value="">Chọn CLB bạn đang trực thuộc</option>
                                {revisionRecord?.referringClubId && (
                                    <option value={revisionRecord.referringClubId}>
                                        CLB #{revisionRecord.referringClubId}
                                    </option>
                                )}
                                {clubAccess.map((club) => (
                                    <option key={club.clubId} value={club.clubId}>
                                        {club.clubName || club.name || `CLB #${club.clubId}`}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <p className="personal-experience-notice" role="status">
                            {!clubAccess.length && !revisionRecord ? 'Bạn chưa có CLB trực thuộc để lựa chọn. ' : ''}Hồ
                            sơ được CLB xem xét trước, sau đó chuyển CTSV quyết định. Mọi bản bổ sung cần CLB xét lại.
                        </p>
                    </>
                )}
            </section>
            <section className="personal-experience-panel">
                <h2>Minh chứng bắt buộc</h2>
                <p>
                    Giấy chứng nhận, kết quả thi đấu, văn bằng hoặc chứng chỉ thể hiện rõ thông tin của bạn. PDF, PNG,
                    JPEG · tối đa 10 MB/tệp · tối đa 10 tệp. Minh chứng được tải riêng tư để người có quyền xét duyệt
                    kiểm tra.
                </p>
                <Field label="Thêm minh chứng">
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={busy}
                        onChange={(e) => {
                            const selected = [...e.target.files];
                            e.target.value = '';
                            try {
                                if (files.length + selected.length > 10) throw new Error('Tối đa 10 minh chứng.');
                                selected.forEach(validateEvidenceFile);
                                setFiles((previous) => [
                                    ...previous,
                                    ...selected.map((file) => ({ file, key: crypto.randomUUID(), evidenceId: null })),
                                ]);
                                key.current = crypto.randomUUID();
                                setError('');
                            } catch (issue) {
                                setError(issue.message);
                            }
                        }}
                    />
                </Field>
                {!files.length ? (
                    <p className="personal-experience-muted">
                        Chưa có minh chứng. Cần ít nhất một tệp để gửi xét duyệt.
                    </p>
                ) : (
                    <ul className="personal-experience-files">
                        {files.map((item) => (
                            <li key={item.key}>
                                <span>
                                    {item.file.name}
                                    <small>
                                        {item.file.size > 0 ? `${Math.ceil(item.file.size / 1024)} KB · ` : ''}
                                        {item.evidenceId ? 'Đã tải lên riêng tư' : 'Chờ tải lên khi gửi'}
                                    </small>
                                </span>
                                <button
                                    type="button"
                                    className="v2-button"
                                    disabled={busy}
                                    aria-label={`Bỏ minh chứng ${item.file.name}`}
                                    onClick={() => {
                                        setFiles((previous) => previous.filter((row) => row.key !== item.key));
                                        key.current = crypto.randomUUID();
                                    }}
                                >
                                    <Trash2 size={15} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <section className="personal-experience-panel">
                <h2>Thông tin đề xuất xét ghi nhận</h2>
                <p>
                    Chọn thông tin đúng với minh chứng. CTSV kiểm tra và xác định Xperience Point; gửi trải nghiệm chưa
                    đồng nghĩa được cộng điểm.
                </p>
                <fieldset disabled={busy} className="personal-experience-grid">
                    <SelectField
                        label="Mức công sức đề xuất"
                        value={form.tier}
                        onChange={(v) => change('tier', v)}
                        options={['T1', 'T2', 'T3', 'T4', 'T5'].map((id, i) => [id, `${id} · Mức ${i + 1}`])}
                    />
                    <SelectField
                        label="Vai trò của bạn"
                        value={form.role}
                        onChange={(v) => change('role', v)}
                        options={EXPERIENCE_ROLES}
                    />
                    <SelectField
                        label="Quy mô"
                        value={form.scale}
                        onChange={(v) => change('scale', v)}
                        options={EXPERIENCE_SCALES}
                    />
                    <SelectField
                        label="Kết quả"
                        value={form.result}
                        onChange={(v) => change('result', v)}
                        options={EXPERIENCE_RESULTS}
                    />
                </fieldset>
            </section>
            {error && (
                <p className="personal-experience-error" role="alert">
                    {error}
                </p>
            )}
            <div className="personal-experience-actions">
                <button type="button" className="v2-button" onClick={onBack} disabled={busy}>
                    Hủy
                </button>
                <button
                    type="submit"
                    className="v2-button v2-button--primary"
                    disabled={busy || !files.length || (form.referenceMode === 'CLUB' && !form.referenceClubId)}
                >
                    <Send size={16} />
                    {busy ? 'Đang tải minh chứng & gửi…' : 'Gửi trải nghiệm xét duyệt'}
                </button>
            </div>
        </form>
    );
}

function ExperienceDetail({ row, client, api, onBack, semesterId, clubAccess }) {
    const [result, setResult] = useState({ loading: true }),
        [retry, setRetry] = useState(0),
        [error, setError] = useState(''),
        [editing, setEditing] = useState(false);
    useEffect(() => {
        let active = true;
        setResult({ loading: true });
        client.detail(row).then(
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
    }, [client, row.id, retry]);
    if (result.loading) return <PageState status="loading" title="Đang tải trải nghiệm…" />;
    if (result.error)
        return (
            <>
                <button className="v2-button" onClick={onBack}>
                    <ArrowLeft size={16} />
                    Danh sách trải nghiệm
                </button>
                <PageState status="error" description={result.error.message} onRetry={() => setRetry((v) => v + 1)} />
            </>
        );
    const data = result.data,
        record = data.contribution;
    if (editing && record.canUpgradeLegacy) return <ExperienceForm key={`${record.id}:${record.legacyVersion}`} api={api} client={client}
        legacyRecord={record} semesterId={semesterId} clubAccess={clubAccess}
        onBack={() => setEditing(false)} onSubmitted={() => { setEditing(false); setRetry(v => v + 1); }} />;
    if (editing && record.status === 'REVISION_REQUESTED')
        return (
            <ExperienceForm
                key={`${record.id}:${record.version}`}
                api={api}
                client={client}
                revisionRecord={record}
                onBack={() => {
                    setEditing(false);
                    setRetry((v) => v + 1);
                }}
                onSubmitted={() => {
                    setEditing(false);
                    setRetry((v) => v + 1);
                }}
            />
        );
    const evidenceUrl =
        typeof record.evidenceUrl === 'string' && /^https:\/\//i.test(record.evidenceUrl) ? record.evidenceUrl : null;
    return (
        <>
            <button type="button" className="v2-button" onClick={onBack}>
                <ArrowLeft size={16} />
                Danh sách trải nghiệm
            </button>
            <section className="personal-experience-panel">
                <div className="personal-experience-heading">
                    <h2>{record.title}</h2>
                    <span className="personal-experience-status">{status(record.status)}</span>
                </div>
                <p>{record.message || record.evidenceDescription || 'Chưa có mô tả.'}</p>
                {record.sourceNamespace === 'LEGACY_DECLARATION' && <p className="personal-experience-notice">
                    {record.canUpgradeLegacy ? 'Hồ sơ cũ đang chờ bổ sung học kỳ và minh chứng riêng tư trước khi xét duyệt.' : 'Hồ sơ lịch sử chỉ đọc. Kết quả cũ không được tự động tính lại vào sổ điểm hiện tại.'}
                </p>}
                {record.canUpgradeLegacy && <button type="button" className="v2-button v2-button--primary" onClick={() => setEditing(true)}>Bổ sung hồ sơ cũ</button>}
                {record.referringClubId && (
                    <p className="personal-experience-notice">
                        Tham chiếu CLB #{record.referringClubId} ·{' '}
                        {record.ctsvSubmissionStatus === 'SUBMITTED'
                            ? 'Đã chuyển CTSV'
                            : {
                                  PENDING: 'Chờ CLB xét',
                                  APPROVED: 'CLB đã thông qua, chờ chuyển CTSV',
                                  CHANGES_REQUESTED: 'CLB yêu cầu bổ sung',
                              }[record.clubReviewStatus] || 'Đang xử lý'}
                        .{record.clubReviewReason && <span> Phản hồi CLB: {record.clubReviewReason}</span>}
                    </p>
                )}
                {record.status === 'REVISION_REQUESTED' &&
                    GUID.test(record.version) &&
                    ['EXTERNAL', 'REAL_WORLD'].includes(record.sourceType) && (
                        <button className="v2-button v2-button--primary" onClick={() => setEditing(true)}>
                            Bổ sung và gửi lại
                        </button>
                    )}
                <dl className="personal-experience-metadata">
                    <div>
                        <dt>Ngày trải nghiệm</dt>
                        <dd>{date(record.occurredAt || record.startDate)}</dd>
                    </div>
                    <div>
                        <dt>Học kỳ</dt>
                        <dd>{record.semesterId || 'Chưa được gán học kỳ'}</dd>
                    </div>
                    <div>
                        <dt>Xperience Point thô được duyệt</dt>
                        <dd>
                            {String(record.status).toUpperCase() === 'APPROVED' &&
                            GUID.test(record.version) &&
                            record.isAuthoritative !== false &&
                            typeof record.rawPoints === 'number'
                                ? record.rawPoints.toLocaleString('vi-VN')
                                : 'Chưa ghi nhận'}
                        </dd>
                    </div>
                    <div>
                        <dt>Nguồn trải nghiệm</dt>
                        <dd>
                            {record.sourceType === 'CLUB'
                                ? 'Hoạt động CLB'
                                : record.sourceType === 'REAL_WORLD'
                                  ? 'Kinh nghiệm thực tế'
                                  : 'Trải nghiệm tự khai bên ngoài'}
                        </dd>
                    </div>
                </dl>
                <h3>Minh chứng</h3>
                {evidenceUrl && (
                    <p>
                        <a className="v2-text-link" href={evidenceUrl} target="_blank" rel="noopener noreferrer">
                            Mở minh chứng đã khai báo trước đây
                        </a>
                    </p>
                )}
                <div className="personal-experience-actions">
                    {(record.evidenceRefs || []).map((id, index) => (
                        <button
                            type="button"
                            className="v2-button"
                            key={id}
                            onClick={async () => {
                                try {
                                    await api.downloadContributionEvidence(id, `minh-chung-${index + 1}`);
                                } catch (issue) {
                                    setError(issue.message);
                                }
                            }}
                        >
                            <Download size={15} />
                            Minh chứng {index + 1}
                        </button>
                    ))}
                </div>
                {!record.evidenceRefs?.length && !evidenceUrl && <p>Chưa có minh chứng riêng tư trong bản ghi này.</p>}
                {record.reviewNote && <p>Phản hồi xét duyệt: {record.reviewNote}</p>}
                {error && (
                    <p role="alert" className="personal-experience-error">
                        {error}
                    </p>
                )}
            </section>
            <section className="personal-experience-panel">
                <h2>Lịch sử xét duyệt</h2>
                {data.revisions
                    ?.filter((item) => item.status?.startsWith('CLUB_'))
                    .map((item) => (
                        <article key={item.id}>
                            <strong>
                                {{
                                    CLUB_ENDORSE: 'CLB thông qua',
                                    CLUB_REQUEST_CHANGES: 'CLB yêu cầu bổ sung',
                                    CLUB_FORWARD: 'CLB chuyển CTSV',
                                }[item.status] || item.status}
                            </strong>
                            <p>{item.reason}</p>
                            <small>{date(item.createdAtUtc)}</small>
                        </article>
                    ))}
                {data.decisions?.length ? (
                    <ol className="personal-experience-history">
                        {data.decisions.map((decision) => (
                            <li key={decision.id}>
                                <strong>
                                    {{
                                        APPROVE: 'Ghi nhận trải nghiệm',
                                        REJECT: 'Không ghi nhận',
                                        REQUEST_REVISION: 'Yêu cầu bổ sung minh chứng',
                                    }[decision.decision] || status(decision.decision)}
                                </strong>
                                <p>{decision.reason || decision.reviewNote}</p>
                                <small>{date(decision.createdAtUtc || decision.createdAt)}</small>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p>Chưa có quyết định xét duyệt trong lịch sử trả về.</p>
                )}
            </section>
        </>
    );
}

export default function PersonalExperiencePage({ api, user, clubAccess = [] }) {
    const client = useMemo(() => createPersonalExperienceClient(api, user.id), [api, user.id]);
    const [search, setSearch] = useSearchParams(),
        [result, setResult] = useState({ loading: true }),
        [summary, setSummary] = useState({ loading: true }),
        [retry, setRetry] = useState(0),
        [notice, setNotice] = useState('');
    const semester = search.get('semester') || '',
        selectedStatus = search.get('status') || '',
        page = Math.max(1, parseInt(search.get('page'), 10) || 1),
        record = search.get('record'),
        creating = search.get('view') === 'create';
    useEffect(() => {
        let active = true;
        setSummary({ loading: true });
        client.summary().then(
            (data) => {
                if (active && String(data.userId) === String(user.id)) setSummary({ data });
                else if (active) setSummary({ error: new Error('Không đọc được báo cáo Xperience Point cá nhân.') });
            },
            (error) => {
                if (active) setSummary({ error });
            },
        );
        return () => {
            active = false;
        };
    }, [client, retry]);
    useEffect(() => {
        let active = true;
        setResult({ loading: true });
        client.list({ semesterId: semester, status: selectedStatus, page, pageSize: 20 }).then(
            (data) => {
                if (active) setResult({ data });
            },
            (error) => {
                if (active) setResult({ error });
            },
        );
        return () => {
            active = false;
        };
    }, [client, semester, selectedStatus, page, retry]);
    const update = (key, value) =>
        setSearch((previous) => {
            const next = new URLSearchParams(previous);
            value ? next.set(key, value) : next.delete(key);
            next.delete('page');
            return next;
        });
    const back = () =>
        setSearch((previous) => {
            const next = new URLSearchParams(previous);
            next.delete('view');
            next.delete('record');
            next.delete('legacy');
            return next;
        });
    return (
        <div className="v2-public-content personal-experience-page">
            <header className="personal-experience-heading">
                <div>
                    <span className="personal-experience-eyebrow">CỦA TÔI</span>
                    <h1>Trải nghiệm cá nhân</h1>
                    <p>Xem trải nghiệm đã tham gia, gửi trải nghiệm tự khai và theo dõi kết quả xét Xperience Point.</p>
                </div>
                {!creating && !record && (
                    <button
                        type="button"
                        className="v2-button v2-button--primary"
                        onClick={() => update('view', 'create')}
                    >
                        <Plus size={16} />
                        Tạo trải nghiệm tự khai
                    </button>
                )}
            </header>
            {notice && (
                <p className="personal-experience-success" role="status">
                    {notice}
                </p>
            )}
            {creating ? (
                <ExperienceForm
                    api={api}
                    client={client}
                    semesterId={semester || summary.data?.semesterId || ''}
                    clubAccess={clubAccess}
                    onBack={back}
                    onSubmitted={(row) => {
                        setNotice('Đã gửi trải nghiệm cùng minh chứng. Xperience Point chờ xét duyệt, chưa được cộng.');
                        setRetry((v) => v + 1);
                        setSearch((previous) => {
                            const next = new URLSearchParams(previous);
                            next.delete('view');
                            next.set('record', row.id);
                            return next;
                        });
                    }}
                />
            ) : record ? (
                GUID.test(record) ? (
                    <ExperienceDetail
                        key={record}
                        row={{
                            id: record,
                            sourceNamespace: search.get('legacy') === '1' ? 'LEGACY_DECLARATION' : null,
                        }}
                        client={client}
                        api={api}
                        onBack={back}
                        semesterId={semester || summary.data?.semesterId || ''}
                        clubAccess={clubAccess}
                    />
                ) : (
                    <PageState status="error" description="Mã trải nghiệm không hợp lệ." />
                )
            ) : (
                <>
                    <section className="personal-experience-panel">
                        <div className="personal-experience-heading">
                            <h2>Báo cáo trải nghiệm</h2>
                            <button
                                type="button"
                                className="v2-button"
                                onClick={() => setRetry((v) => v + 1)}
                                disabled={result.loading}
                            >
                                <RefreshCw size={15} />
                                Tải lại
                            </button>
                        </div>
                        {summary.loading ? (
                            <p>Đang tải báo cáo học kỳ hiện tại…</p>
                        ) : summary.error ? (
                            <p className="personal-experience-notice" role="status">
                                Báo cáo học kỳ hiện tại chưa khả dụng: {summary.error.message}. Danh sách trải nghiệm
                                được tải riêng bên dưới.
                            </p>
                        ) : (
                            <p>
                                Học kỳ {summary.data.semesterId} · {summary.data.recognizedContributionCount ?? '—'}{' '}
                                trải nghiệm được ghi nhận ·{' '}
                                {typeof summary.data.rawExperiencePoints === 'number'
                                    ? summary.data.rawExperiencePoints.toLocaleString('vi-VN')
                                    : '—'}{' '}
                                Xperience Point thô. Điểm ghi nhận không phải số dư đổi quà.
                            </p>
                        )}
                        <div className="personal-experience-grid">
                            <Field label="Học kỳ của danh sách">
                                <input
                                    value={semester}
                                    placeholder="Tất cả học kỳ"
                                    onChange={(e) => update('semester', e.target.value)}
                                />
                            </Field>
                            <SelectField
                                label="Trạng thái xét duyệt"
                                value={selectedStatus}
                                onChange={(v) => update('status', v)}
                                options={[['', 'Tất cả trạng thái'], ...Object.entries(EXPERIENCE_STATES)]}
                            />
                        </div>
                    </section>
                    {result.loading ? (
                        <PageState status="loading" title="Đang tải trải nghiệm…" />
                    ) : result.error ? (
                        <PageState
                            status="error"
                            description={result.error.message}
                            onRetry={() => setRetry((v) => v + 1)}
                        />
                    ) : !result.data.items.length ? (
                        <section className="personal-experience-panel personal-experience-empty">
                            <FileCheck2 size={32} />
                            <h2>Chưa có trải nghiệm phù hợp</h2>
                            <p>
                                Bạn có kết quả thi đấu, văn bằng hoặc chứng chỉ bên ngoài? Tạo trải nghiệm tự khai và
                                đính kèm minh chứng để gửi xét duyệt.
                            </p>
                        </section>
                    ) : (
                        <>
                            <div className="personal-experience-records">
                                {result.data.items.map((row) => (
                                    <article key={row.id} className="personal-experience-panel">
                                        <div className="personal-experience-heading">
                                            <h2>
                                                <button
                                                    type="button"
                                                    className="personal-experience-record-link"
                                                    onClick={() =>
                                                        setSearch((previous) => {
                                                            const next = new URLSearchParams(previous);
                                                            next.set('record', row.id);
                                                            row.sourceNamespace === 'LEGACY_DECLARATION'
                                                                ? next.set('legacy', '1')
                                                                : next.delete('legacy');
                                                            return next;
                                                        })
                                                    }
                                                >
                                                    {row.title}
                                                </button>
                                            </h2>
                                            <span className="personal-experience-status">{status(row.status)}</span>
                                        </div>
                                        <p>
                                            {row.sourceType === 'CLUB' ? 'Hoạt động CLB' : 'Trải nghiệm tự khai'} ·{' '}
                                            {date(row.occurredAt)} · {row.semesterId || 'Chưa gán học kỳ'}
                                        </p>
                                        <p>
                                            {row.proposedAttributes?.pillarWeights
                                                ?.map((weight) => category(weight.pillar))
                                                .join(', ')}
                                        </p>
                                        <p>
                                            {row.status === 'APPROVED' && row.isAuthoritative !== false
                                                ? `${row.rawPoints.toLocaleString('vi-VN')} Xperience Point thô đã duyệt`
                                                : 'Xperience Point: chưa ghi nhận chính thức'}
                                        </p>
                                    </article>
                                ))}
                            </div>
                            <nav className="personal-experience-actions" aria-label="Trang trải nghiệm">
                                <button
                                    type="button"
                                    className="v2-button"
                                    disabled={page <= 1}
                                    onClick={() =>
                                        setSearch((previous) => {
                                            const next = new URLSearchParams(previous);
                                            next.set('page', page - 1);
                                            return next;
                                        })
                                    }
                                >
                                    Trước
                                </button>
                                <span>
                                    Trang {page}/{result.data.totalPages} · {result.data.total} trải nghiệm
                                </span>
                                <button
                                    type="button"
                                    className="v2-button"
                                    disabled={page >= result.data.totalPages}
                                    onClick={() =>
                                        setSearch((previous) => {
                                            const next = new URLSearchParams(previous);
                                            next.set('page', page + 1);
                                            return next;
                                        })
                                    }
                                >
                                    Sau
                                </button>
                            </nav>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
