import { useEffect, useRef, useState } from 'react';

const date = (value) => new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

export default function ActivityClosingReport({ api, activityId }) {
    const path = `/api/activities/${activityId}/closing-report`;
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const pending = useRef(null);

    useEffect(() => {
        let active = true;
        api.request(path).then((value) => {
            if (active) setData(value);
        }).catch((issue) => {
            if (active) setError(issue.message);
        });
        return () => { active = false; };
    }, [api, path]);

    const submit = async (event) => {
        event.preventDefault();
        if (busy || !data.canSubmit) return;
        const fields = new FormData(event.currentTarget);
        const body = JSON.stringify({
            summary: String(fields.get('summary') || '').trim(),
            improvements: String(fields.get('improvements') || '').trim(),
        });
        if (pending.current?.body !== body) pending.current = { body, key: crypto.randomUUID() };
        setError('');
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
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="v2-activity-profile-panel">
            <h2>Báo cáo kết thúc</h2>
            {error && <p role="alert">{error}</p>}
            {!data && !error && <p>Đang tải báo cáo…</p>}
            {data && !data.available && <p>Có thể nộp báo cáo sau khi hoạt động hoàn thành.</p>}
            {data?.available && (
                <>
                    <p>Hạn nộp {date(data.deadlineUtc)}{data.isOverdue ? ' · Đã qua hạn' : ''}</p>
                    <p>{data.totals.registrations} đăng ký · {data.totals.verifiedParticipants} người đã xác minh điểm danh · {data.totals.verifiedCompletions} lượt hoàn thành nhiệm vụ</p>
                    {data.report && (
                        <>
                            <p><strong>{data.report.status === 'APPROVED' ? 'Đã duyệt' : data.isOverdue ? 'Nộp quá hạn, không thể duyệt' : 'Chờ CTSV duyệt'}</strong></p>
                            <p>{data.report.summary}</p>
                            {data.report.improvements && <p>{data.report.improvements}</p>}
                            {data.report.reviewNote && <p>Ghi chú CTSV: {data.report.reviewNote}</p>}
                        </>
                    )}
                    {data.canSubmit && (
                        <form onSubmit={submit} className="v2-activity-recap-form">
                            {data.isOverdue && <p>Báo cáo nộp lúc này sẽ được lưu và không đủ điều kiện duyệt.</p>}
                            <label>Tổng kết<textarea name="summary" required maxLength={4000} disabled={busy} /></label>
                            <label>Đề xuất cải thiện<textarea name="improvements" maxLength={4000} disabled={busy} /></label>
                            <button type="submit" className="v2-button" disabled={busy}>Nộp báo cáo</button>
                        </form>
                    )}
                </>
            )}
        </section>
    );
}
