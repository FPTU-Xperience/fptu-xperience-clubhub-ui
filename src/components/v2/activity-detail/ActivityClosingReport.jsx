import { useEffect, useRef, useState } from 'react';

const date = (value) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export default function ActivityClosingReport({ api, activityId }) {
    const path = `/api/activities/${activityId}/closing-report`;
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef(null);
    const lock = useRef(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        setData(null); setError(''); pending.current = null;
        api.request(path).then((value) => {
            if (active) setData(value);
        }).catch((issue) => {
            if (active) setError(issue.message);
        });
        return () => { active = false; };
    }, [api, path, reload]);

    const submit = async (event) => {
        event.preventDefault();
        if (lock.current || !data.canSubmit) return;
        const fields = new FormData(event.currentTarget);
        const body = JSON.stringify({
            summary: String(fields.get('summary') || '').trim(),
            improvements: String(fields.get('improvements') || '').trim(),
            expectedVersion: data.report?.version ?? null,
        });
        if (pending.current?.body !== body) pending.current = { body, key: crypto.randomUUID() };
        setError('');
        lock.current = true;
        setBusy(true);
        try {
            const report = await api.request(path, {
                method: 'POST', body, headers: { 'Idempotency-Key': pending.current.key },
            });
            setData((current) => ({
                ...current, canSubmit: false, report,
                isOverdue: Date.parse(report.submittedAtUtc) >= Date.parse(current.deadlineUtc),
            }));
        } catch (issue) {
            setError(issue.message);
            if (issue.status === 409) {
                try { setData(await api.request(path)); } catch { /* Preserve the write error. */ }
            }
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };

    return (
        <section className="v2-activity-profile-panel">
            <h2>Báo cáo kết thúc</h2>
            {error && <p role="alert">{error} {!data && <button type="button" onClick={() => setReload((value) => value + 1)}>Thử lại</button>}</p>}
            {!data && !error && <p>Đang tải báo cáo…</p>}
            {data && !data.available && <p>Có thể nộp báo cáo sau khi hoạt động hoàn thành.</p>}
            {data?.available && (
                <>
                    <p>Hạn nộp {date(data.deadlineUtc)}{data.isOverdue ? ' · Đã qua hạn' : ''}</p>
                    <p>{data.totals.registrations} đăng ký · {data.totals.verifiedParticipants} người đã xác minh điểm danh · {data.totals.verifiedCompletions} lượt hoàn thành nhiệm vụ</p>
                    {data.report && (
                        <>
                            <p><strong>{data.report.status === 'APPROVED' ? 'Đã duyệt' : data.report.status === 'RETURNED' ? 'CTSV yêu cầu chỉnh sửa' : data.isOverdue ? 'Nộp quá hạn, không thể duyệt' : 'Chờ CTSV duyệt'}</strong></p>
                            <p>{data.report.summary}</p>
                            {data.report.improvements && <p>{data.report.improvements}</p>}
                            {data.report.reviewNote && <p>Ghi chú CTSV: {data.report.reviewNote}</p>}
                        </>
                    )}
                    {data.canSubmit && (
                        <form key={data.report?.version || 'new'} onSubmit={submit} className="v2-activity-recap-form">
                            {data.isOverdue && <p>Báo cáo nộp lúc này sẽ được lưu và không đủ điều kiện duyệt.</p>}
                            <label>Tổng kết<textarea name="summary" required maxLength={4000} disabled={busy} defaultValue={data.report?.summary || ''} /></label>
                            <label>Đề xuất cải thiện<textarea name="improvements" maxLength={4000} disabled={busy} defaultValue={data.report?.improvements || ''} /></label>
                            <button type="submit" className="v2-button" disabled={busy}>{data.report ? 'Gửi lại báo cáo' : 'Nộp báo cáo'}</button>
                        </form>
                    )}
                </>
            )}
        </section>
    );
}
