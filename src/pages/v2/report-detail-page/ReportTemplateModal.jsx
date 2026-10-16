import { useEffect, useState } from 'react';
import { CalendarCheck2, CalendarPlus, ChevronRight, ClipboardCheck, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { workspaceSemesterKey, workspaceSemesterQuery } from '../club-workspace-page/workspace-semester-data';
import { REPORT_TEMPLATES, eligibleReportActivities, reportTemplateUrl } from './report-templates';
import { reportDate } from './report-detail-data';
import './ReportTemplateModal.scss';

const icons = [ClipboardCheck, CalendarPlus, Flag, CalendarCheck2];
export default function ReportTemplateModal({ api, workspace, semester, onClose, basePath = '/v2/reports' }) {
    const navigate = useNavigate();
    const [selectingActivity, setSelectingActivity] = useState(false);
    const [selectedId, setSelectedId] = useState('');
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState({ status: 'loading', items: [] });
    const [error, setError] = useState('');
    const scope = `${workspace.clubId}:${workspaceSemesterKey(semester)}`;
    useEffect(() => {
        if (!selectingActivity) return undefined;
        let active = true;
        setSelectedId('');
        setResult({ status: 'loading', items: [] });
        Promise.resolve()
            .then(async () => {
                let page = 1,
                    all = [],
                    payload;
                do {
                    payload = await api.getActivities(workspace.clubId, {
                        ...workspaceSemesterQuery(semester, 'activities'),
                        page,
                        pageSize: 100,
                    });
                    if (!active) return;
                    all.push(...eligibleReportActivities(payload, workspace.clubId, semester));
                    const rows = Array.isArray(payload) ? payload : payload?.items;
                    if (Array.isArray(payload) || !rows?.length || page * 100 >= (payload.total ?? rows.length)) break;
                    page += 1;
                } while (active);
                if (active)
                    setResult({
                        status: 'ready',
                        items: [...new Map(all.map((item) => [String(item.id), item])).values()],
                    });
            })
            .catch((issue) => {
                if (active)
                    setResult({
                        status: 'error',
                        items: [],
                        error: issue.message || 'Không thể tải danh sách hoạt động.',
                    });
            });
        return () => {
            active = false;
        };
    }, [api, workspace.clubId, selectingActivity, scope, semester, attempt]);
    const open = (template, activityId) => {
        try {
            navigate(reportTemplateUrl(template.id, workspace.clubId, semester, activityId, basePath));
        } catch (issue) {
            setError(issue.message);
        }
    };
    if (selectingActivity)
        return (
            <V2Modal
                key="activity"
                title="Chọn hoạt động cần báo cáo"
                onClose={onClose}
                className="v2-report-template-modal"
            >
                <p className="v2-report-template-intro">
                    Báo cáo Hoạt động CLB · {workspace.name}
                    {semester?.label ? ` · ${semester.label}` : ''}
                </p>
                {result.status === 'loading' && <p role="status">Đang tải danh sách hoạt động…</p>}
                {result.status === 'error' && (
                    <div role="alert" className="v2-report-template-error">
                        <p>{result.error}</p>
                        <button className="v2-button" type="button" onClick={() => setAttempt((value) => value + 1)}>
                            Thử lại
                        </button>
                    </div>
                )}
                {result.status === 'ready' && !result.items.length && (
                    <p role="status">Chưa có hoạt động trong phạm vi này để tạo báo cáo.</p>
                )}
                {result.status === 'ready' && result.items.length > 0 && (
                    <label className="v2-report-template-field" htmlFor="report-activity-selection">
                        Hoạt động cần báo cáo
                        <select
                            id="report-activity-selection"
                            value={selectedId}
                            onChange={(event) => setSelectedId(event.target.value)}
                        >
                            <option value="">Chọn hoạt động</option>
                            {result.items.map((item) => (
                                <option key={item.id} value={item.id}>
                                    {item.title || `Hoạt động #${item.id}`} ·{' '}
                                    {reportDate(item.startTimeUtc || item.startTime)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
                {error && <p role="alert">{error}</p>}
                <footer className="v2-report-template-footer">
                    <button
                        className="v2-button"
                        type="button"
                        onClick={() => {
                            setSelectingActivity(false);
                            setError('');
                        }}
                    >
                        Quay lại chọn mẫu
                    </button>
                    <button
                        className="v2-button v2-button--primary"
                        type="button"
                        disabled={
                            result.status !== 'ready' || !result.items.some((item) => String(item.id) === selectedId)
                        }
                        onClick={() => open(REPORT_TEMPLATES[0], selectedId)}
                    >
                        Tiếp tục <ChevronRight size={16} />
                    </button>
                </footer>
            </V2Modal>
        );
    return (
        <V2Modal key="templates" title="Chọn mẫu báo cáo" onClose={onClose} className="v2-report-template-modal">
            <p className="v2-report-template-intro">
                Chọn báo cáo muốn tạo cho {workspace.name}
                {semester?.label ? ` · ${semester.label}` : ''}.
            </p>
            <div className="v2-report-template-list">
                {REPORT_TEMPLATES.map((template, index) => {
                    const Icon = icons[index];
                    return (
                        <button
                            className="v2-report-template-choice"
                            key={template.id}
                            type="button"
                            aria-label={template.label}
                            onClick={() => (template.requiresActivity ? setSelectingActivity(true) : open(template))}
                        >
                            <span className="v2-report-template-icon">
                                <Icon size={22} />
                            </span>
                            <span>
                                <strong>{template.label}</strong>
                                <small>{template.description}</small>
                            </span>
                            <ChevronRight size={18} />
                        </button>
                    );
                })}
            </div>
            {error && <p role="alert">{error}</p>}
            <footer className="v2-report-template-footer">
                <button className="v2-button" type="button" onClick={onClose}>
                    Hủy
                </button>
            </footer>
        </V2Modal>
    );
}
