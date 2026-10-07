import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { academicCalendarRepository } from './v2/academic-calendar-repository';
import { emptyAcademicCalendar } from './v2/academic-calendar-data';
import { STUDY_TERMS, defaultStudyPeriod, formatStudyTerm } from './v2/study-schedule-data';

export default function AcademicCalendarPage() {
    const { user } = useAuth();
    const [period, setPeriod] = useState(() => {
        const { year, term } = defaultStudyPeriod();
        return { year, term };
    });
    const [draft, setDraft] = useState(emptyAcademicCalendar);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const years = Array.from({ length: 101 }, (_, index) => 2100 - index);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setDraft(emptyAcademicCalendar);
        setError('');
        setNotice('');
        academicCalendarRepository.get(user, period)
            .then((calendar) => { if (active) setDraft(calendar); })
            .catch((loadError) => { if (active) setError(loadError?.message || 'Không thể tải lịch học kỳ.'); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [user, period.year, period.term]);

    const save = async (event) => {
        event.preventDefault();
        if (busy || loading) return;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const calendar = await academicCalendarRepository.save(user, period, draft);
            setDraft(calendar);
            setNotice(`Đã lưu mốc thời gian ${formatStudyTerm(period)} trong mock.`);
        } catch (saveError) {
            setError(saveError?.message || 'Không thể lưu lịch học kỳ.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-ink">Lịch học kỳ</h1>
                <p className="mt-2 text-sm text-muted">Cấu hình ngày bắt đầu học kỳ và từng block để sinh viên xem lịch học theo tuần.</p>
            </header>
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold text-ink">
                        Năm
                        <select className="rounded-lg border border-gray-300 px-3 py-2" value={period.year} disabled={busy} onChange={(event) => setPeriod((value) => ({ ...value, year: Number(event.target.value) }))}>
                            {years.map((year) => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-ink">
                        Học kỳ
                        <select className="rounded-lg border border-gray-300 px-3 py-2" value={period.term} disabled={busy} onChange={(event) => setPeriod((value) => ({ ...value, term: event.target.value }))}>
                            {STUDY_TERMS.map((term) => <option key={term.id} value={term.id}>{formatStudyTerm({ year: period.year, term: term.id })}</option>)}
                        </select>
                    </label>
                </div>
            </section>
            <form className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" onSubmit={save}>
                <h2 className="text-lg font-bold text-ink">Mốc thời gian {formatStudyTerm(period)}</h2>
                <p className="mt-1 text-sm text-muted">10W học trước 3W. Mỗi block có ngày bắt đầu riêng để có thể chừa khoảng nghỉ giữa hai block.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {[
                        ['termStartDate', 'Bắt đầu học kỳ'],
                        ['block10StartDate', 'Bắt đầu Block 10W'],
                        ['block3StartDate', 'Bắt đầu Block 3W'],
                    ].map(([key, label]) => (
                        <label className="grid gap-2 text-sm font-semibold text-ink" key={key}>
                            {label}
                            <input className="rounded-lg border border-gray-300 px-3 py-2" type="date" value={draft[key]} disabled={loading || busy} onChange={(event) => setDraft((value) => ({ ...value, [key]: event.target.value }))} required />
                        </label>
                    ))}
                </div>
                <p className="mt-3 text-sm text-muted">Ngày bắt đầu block phải là Thứ Hai; 3W chỉ được bắt đầu sau khi 10W học đủ 10 tuần.</p>
                {loading && <p className="mt-4 text-sm text-muted" role="status">Đang tải cấu hình...</p>}
                {error && <p className="mt-4 text-sm text-red-700" role="alert">{error}</p>}
                {notice && <p className="mt-4 text-sm text-green-700" role="status">{notice}</p>}
                <div className="mt-5 flex justify-end">
                    <button className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50" type="submit" disabled={loading || busy}>Lưu mốc thời gian</button>
                </div>
            </form>
            <p className="text-sm text-muted">Chế độ mock: cấu hình chỉ lưu trong trình duyệt hiện tại. Backend chưa có API lịch học kỳ.</p>
        </div>
    );
}
