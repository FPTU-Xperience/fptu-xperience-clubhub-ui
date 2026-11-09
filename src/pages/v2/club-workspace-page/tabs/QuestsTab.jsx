import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { useWorkspaceSemester } from '../WorkspaceSemesterContext';
import { workspaceSemesterQuery } from '../workspace-semester-data';
import PageState from '../../../../components/v2/PageState';
import ActivityStaffingPanel from '../../../../components/v2/activity-detail/ActivityStaffingPanel';
import { staffingError } from '../../../../services/activity-staffing';
import { loadClubEventTasks } from '../../../../services/club-event-tasks';
import './QuestsTab.scss';

export default function QuestsTab({ workspace, manager = false, readOnly = false }) {
    const { api, user } = useAuth();
    const { semester } = useWorkspaceSemester();
    const [result, setResult] = useState({}),
        [retry, setRetry] = useState(0),
        [selection, setSelection] = useState(null),
        [mode, setMode] = useState('recruitment'),
        [filter, setFilter] = useState('all');
    const filters = new URLSearchParams(workspaceSemesterQuery(semester, 'activities')).toString();
    const identity = `${user?.id}:${workspace.clubId}:${semester?.id || semester?.code}:${filters}:${manager}:${readOnly}`;
    const state = result.identity === identity ? result : { loading: true };
    const selected = selection?.identity === identity ? selection.item : null;
    useEffect(() => {
        let active = true;
        setResult({ identity, loading: true });
        if (!semester || !filters) {
            setResult({ identity, missingSemester: true });
            return () => {
                active = false;
            };
        }
        loadClubEventTasks(
            api,
            workspace.clubId,
            user?.id,
            Object.fromEntries(new URLSearchParams(filters)),
            manager || readOnly,
        )
            .then((value) => {
                if (active) setResult({ identity, ...value });
            })
            .catch((issue) => {
                if (active) setResult({ identity, error: staffingError(issue) });
            });
        return () => {
            active = false;
        };
    }, [api, identity, retry]);
    useEffect(() => {
        setSelection(null);
        setFilter('all');
    }, [identity]);
    if (state.loading) return <PageState status="loading" />;
    if (state.missingSemester)
        return (
            <PageState
                status="empty"
                title="Chọn học kỳ để xem nhiệm vụ sự kiện"
                description="Cần khoảng thời gian học kỳ chính thức của workspace để tải tuyển dụng và phân công."
            />
        );
    if (state.error)
        return <PageState status="error" description={state.error} onRetry={() => setRetry((value) => value + 1)} />;
    const items = state.items || [],
        visible = filter === 'all' ? items : items.filter((item) => item.kind === filter);
    return (
        <section className="v2-workspace-section v2-club-task-page">
            <header>
                <div>
                    <h1>Nhiệm vụ & đóng góp</h1>
                    <p>Tuyển dụng và phân công từ các sự kiện của CLB trong học kỳ đang chọn.</p>
                </div>
                <button type="button" className="v2-button" onClick={() => setRetry((value) => value + 1)}>
                    Tải lại nhiệm vụ
                </button>
            </header>
            {!!state.warnings?.length && (
                <div className="v2-club-task-warning" role="alert">
                    {state.warnings.map((message) => (
                        <p key={message}>{message}</p>
                    ))}
                    <p>Một phần dữ liệu chưa tải được. Tải lại để đối chiếu đầy đủ.</p>
                </div>
            )}
            {selected ? (
                <div className="v2-club-task-detail">
                    <button type="button" className="v2-button" onClick={() => setSelection(null)}>
                        ← Danh sách nhiệm vụ
                    </button>
                    <h2>{selected.activityTitle}</h2>
                    <div className="v2-club-task-filters" role="group" aria-label="Nội dung nhiệm vụ">
                        {[
                            ['recruitment', 'Tuyển dụng và duyệt đơn'],
                            ['assignments', 'Phân công và minh chứng'],
                        ].map(([key, title]) => (
                            <button
                                type="button"
                                key={key}
                                className="v2-button"
                                aria-pressed={mode === key}
                                onClick={() => setMode(key)}
                            >
                                {title}
                            </button>
                        ))}
                    </div>
                    <ActivityStaffingPanel
                        key={`${identity}:${selected.activityId}`}
                        activityId={selected.activityId}
                        mode={mode}
                        manager={manager && !readOnly}
                        readOnly={readOnly}
                        onChanged={() => setRetry((value) => value + 1)}
                    />
                </div>
            ) : (
                <>
                    <div className="v2-club-task-filters" role="group" aria-label="Lọc nhiệm vụ sự kiện">
                        {[
                            ['all', 'Tất cả'],
                            ['recruitment', 'Tuyển dụng'],
                            ['assignments', 'Phân công'],
                        ].map(([key, title]) => (
                            <button
                                type="button"
                                key={key}
                                className={`v2-button${filter === key ? ' v2-button--primary' : ''}`}
                                aria-pressed={filter === key}
                                onClick={() => setFilter(key)}
                            >
                                {title} (
                                {key === 'all' ? items.length : items.filter((item) => item.kind === key).length})
                            </button>
                        ))}
                    </div>
                    {!visible.length ? (
                        <PageState
                            status={state.warnings?.length ? 'error' : 'empty'}
                            title={
                                state.warnings?.length
                                    ? 'Chưa đối chiếu đầy đủ nhiệm vụ sự kiện'
                                    : 'Chưa có tuyển dụng hoặc phân công phù hợp'
                            }
                            onRetry={state.warnings?.length ? () => setRetry((value) => value + 1) : undefined}
                        />
                    ) : (
                        <div className="v2-club-recruitment-list">
                            {visible.map((item) => (
                                <button
                                    type="button"
                                    key={item.key}
                                    onClick={() => {
                                        setMode(item.kind);
                                        setSelection({ identity, item });
                                    }}
                                >
                                    <span className="v2-club-task-kind">
                                        {item.kind === 'recruitment' ? 'Tuyển dụng sự kiện' : 'Phân công sự kiện'}
                                    </span>
                                    <strong>{item.title || item.activityTitle}</strong>
                                    {item.kind === 'recruitment' ? (
                                        <span>
                                            {item.activityTitle} ·{' '}
                                            {item.visibility === 'PRIVATE' ? 'Riêng tư trong CLB' : 'Công khai'} ·{' '}
                                            {{ OPEN: 'Đang tuyển', CLOSED: 'Đã đóng', DRAFT: 'Bản nháp' }[
                                                item.status
                                            ] || item.status}
                                        </span>
                                    ) : (
                                        <span>
                                            {item.assignments.length} phân công ·{' '}
                                            {item.assignments.map((row) => row.actionTitle).join(' · ')}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
