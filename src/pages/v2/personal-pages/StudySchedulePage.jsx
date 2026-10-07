import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Pencil, Plus } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import { emptyAcademicCalendar } from '../academic-calendar-data';
import {
    STUDY_BLOCKS,
    STUDY_DAYS,
    STUDY_TERMS,
    defaultStudyPeriod,
    formatStudyDate,
    formatStudyTerm,
    getStudySlot,
    getStudySlots,
    getStudyWeekCount,
    getStudyWeekDates,
    toStudyEntryMap,
} from '../study-schedule-data';
import { studyScheduleRepository } from '../study-schedule-repository';
import PersonalPageHeading from './PersonalPageHeading';
import StudyScheduleBulkImportModal from './StudyScheduleBulkImportModal';
import './PersonalPages.scss';
import './StudySchedulePage.scss';

export default function StudySchedulePage({ user }) {
    const [period, setPeriod] = useState(defaultStudyPeriod);
    const [week, setWeek] = useState(1);
    const [allEntries, setAllEntries] = useState([]);
    const [calendar, setCalendar] = useState(emptyAcademicCalendar);
    const [legacyCount, setLegacyCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [draft, setDraft] = useState({ subject: '', room: '' });
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const slots = getStudySlots(period.block);
    const weekCount = getStudyWeekCount(period.block);
    const weekDates = getStudyWeekDates(calendar, period.block, week);
    const entries = toStudyEntryMap(
        allEntries.filter((entry) => entry.week === week),
        period.block,
    );
    const occupiedCount = Object.keys(entries).length;
    const yearOptions = Array.from({ length: 101 }, (_, index) => 2100 - index);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setAllEntries([]);
        setCalendar(emptyAcademicCalendar);
        setError('');
        setNotice('');
        Promise.all([studyScheduleRepository.get(user, period), studyScheduleRepository.getLegacy(user)])
            .then(([schedule, legacy]) => {
                if (active) {
                    for (let number = 1; number <= weekCount; number += 1) {
                        toStudyEntryMap(
                            schedule.entries.filter((entry) => entry.week === number),
                            period.block,
                        );
                    }
                    setAllEntries(schedule.entries);
                    setCalendar(schedule.calendar);
                    setLegacyCount(legacy.entries.length);
                }
            })
            .catch((loadError) => {
                if (active) setError(loadError?.message || 'Không thể tải lịch học.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [user, period.year, period.term, period.block]);

    const changePeriod = (part) => {
        setEditing(null);
        setBulkOpen(false);
        setCalendar(emptyAcademicCalendar);
        setWeek(1);
        setPeriod((current) => ({ ...current, ...part }));
    };

    const changeWeek = (number) => {
        setWeek(number);
        setEditing(null);
        setNotice('');
    };

    const openSlot = (day, slot) => {
        const current = getStudySlot(entries, day.id, slot.id);
        setEditing({ day, slot });
        setDraft(current || { subject: '', room: '' });
        setError('');
        setNotice('');
    };

    const save = async (event) => {
        event.preventDefault();
        if (!editing || busy) return;
        setBusy(true);
        try {
            const saved = await studyScheduleRepository.putSlot(
                user,
                period,
                week,
                editing.day.id,
                editing.slot.id,
                draft,
            );
            setAllEntries((current) => [
                ...current.filter(
                    (item) => !(item.week === week && item.day === saved.day && item.slotId === saved.slotId),
                ),
                saved,
            ]);
            setEditing(null);
            setNotice(`Đã lưu tuần ${week}, ${editing.day.label}, ${editing.slot.label}.`);
        } catch (saveError) {
            setError(saveError?.message || 'Không thể lưu lịch học.');
        } finally {
            setBusy(false);
        }
    };

    const clear = async () => {
        if (!editing || busy) return;
        setBusy(true);
        try {
            await studyScheduleRepository.deleteSlot(user, period, week, editing.day.id, editing.slot.id);
            setAllEntries((current) =>
                current.filter(
                    (item) => !(item.week === week && item.day === editing.day.id && item.slotId === editing.slot.id),
                ),
            );
            setEditing(null);
            setNotice(`Đã xóa tuần ${week}, ${editing.day.label}, ${editing.slot.label}.`);
        } catch (saveError) {
            setError(saveError?.message || 'Không thể xóa lịch học.');
        } finally {
            setBusy(false);
        }
    };

    const importLegacy = async () => {
        if (busy || loading) return;
        setBusy(true);
        setError('');
        try {
            const schedule = await studyScheduleRepository.importLegacy(user, period);
            setAllEntries(schedule.entries);
            setLegacyCount(0);
            setNotice(`Đã chuyển lịch cũ vào cả 10 tuần của ${formatStudyTerm(period)} · Block 10W.`);
        } catch (importError) {
            setError(importError?.message || 'Không thể chuyển lịch cũ.');
        } finally {
            setBusy(false);
        }
    };

    const importTemplate = async (template, mode) => {
        setBusy(true);
        try {
            const result = await studyScheduleRepository.bulkImport(user, period, template, mode);
            setAllEntries(result.entries);
            setBulkOpen(false);
            setNotice(`Đã thêm ${result.imported} ô, thay ${result.replaced} ô và giữ nguyên ${result.skipped} ô.`);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="v2-public-content v2-personal-page v2-study-schedule-page">
            <PersonalPageHeading
                title="Lịch học của tôi"
                description="Quản lý lịch học theo học kỳ, block và từng tuần từ thứ Hai đến Chủ nhật."
            />
            <div className="v2-study-schedule-period" aria-label="Chọn học kỳ và block học">
                <label>
                    Năm
                    <select
                        value={period.year}
                        disabled={busy}
                        onChange={(event) => changePeriod({ year: Number(event.target.value) })}
                    >
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Học kỳ
                    <select
                        value={period.term}
                        disabled={busy}
                        onChange={(event) => changePeriod({ term: event.target.value })}
                    >
                        {STUDY_TERMS.map((term) => (
                            <option key={term.id} value={term.id}>
                                {formatStudyTerm({ year: period.year, term: term.id })}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="v2-study-schedule-blocks" role="group" aria-label="Block học">
                    {STUDY_BLOCKS.map((block) => (
                        <button
                            key={block.id}
                            type="button"
                            className={period.block === block.id ? 'is-active' : ''}
                            aria-pressed={period.block === block.id}
                            disabled={busy}
                            onClick={() => changePeriod({ block: block.id })}
                        >
                            {block.label}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="v2-button v2-button--primary v2-study-schedule-bulk-trigger"
                    disabled={loading || busy}
                    onClick={() => setBulkOpen(true)}
                >
                    Nhập hàng loạt
                </button>
            </div>
            <p className="v2-study-schedule-calendar-note">
                {calendar.block10StartDate
                    ? `${formatStudyTerm(period)}: học kỳ bắt đầu ${calendar.termStartDate}; Block 10W từ ${calendar.block10StartDate}, Block 3W từ ${calendar.block3StartDate}.`
                    : `Mốc thời gian của ${formatStudyTerm(period)} chưa được quản trị viên cấu hình. Bạn vẫn có thể nhập lịch theo tuần trong block.`}
            </p>
            {legacyCount > 0 && (
                <div className="v2-study-schedule-legacy">
                    <p>
                        Có {legacyCount} ô lịch cũ chưa gắn học kỳ. Chọn năm, học kỳ và Block 10W trống để chuyển vào cả
                        10 tuần.
                    </p>
                    <button
                        type="button"
                        className="v2-button"
                        disabled={period.block !== '10W' || allEntries.length > 0 || loading || busy}
                        onClick={importLegacy}
                    >
                        Chuyển lịch cũ vào kỳ này
                    </button>
                </div>
            )}
            {loading && (
                <p className="v2-study-schedule-notice" role="status">
                    Đang tải lịch học...
                </p>
            )}
            {!loading && error && !editing && (
                <p className="v2-study-schedule-error" role="alert">
                    {error}
                </p>
            )}
            {notice && (
                <p className="v2-study-schedule-notice" role="status">
                    {notice}
                </p>
            )}
            <section className="v2-study-schedule-panel" aria-label="Thời khóa biểu tuần">
                <div className="v2-study-schedule-intro">
                    <span className="v2-study-schedule-icon">
                        <CalendarDays size={23} aria-hidden="true" />
                    </span>
                    <div className="v2-study-schedule-intro-content">
                        <div className="v2-study-schedule-intro-heading">
                            <strong>
                                {formatStudyTerm(period)} · Block {period.block}
                            </strong>
                            <div className="v2-study-schedule-intro-navigation" role="group" aria-label="Chuyển tuần">
                                <button
                                    type="button"
                                    aria-label="Tuần trước"
                                    title="Tuần trước"
                                    disabled={busy || week === 1}
                                    onClick={() => changeWeek(week - 1)}
                                >
                                    <ArrowLeft size={17} aria-hidden="true" />
                                </button>
                                <span className="v2-study-schedule-week-select">
                                    <select
                                        aria-label={`Chọn tuần trong Block ${period.block}`}
                                        value={week}
                                        disabled={busy}
                                        onChange={(event) => changeWeek(Number(event.target.value))}
                                    >
                                        {Array.from({ length: weekCount }, (_, index) => index + 1).map((number) => {
                                            const dates = getStudyWeekDates(calendar, period.block, number);
                                            return (
                                                <option key={number} value={number}>
                                                    {dates
                                                        ? `Tuần ${number}/${weekCount} · lịch ${dates.calendarWeek}, ${dates.calendarYear}`
                                                        : `Tuần ${number}/${weekCount}`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <ChevronDown size={16} aria-hidden="true" />
                                </span>
                                <button
                                    type="button"
                                    aria-label="Tuần sau"
                                    title="Tuần sau"
                                    disabled={busy || week === weekCount}
                                    onClick={() => changeWeek(week + 1)}
                                >
                                    <ArrowRight size={17} aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                        {weekDates && (
                            <p>
                                Tuần ({formatStudyDate(weekDates.days[0])} – {formatStudyDate(weekDates.days[6])})
                            </p>
                        )}
                    </div>
                </div>
                <div
                    className="v2-study-schedule-scroll"
                    role="region"
                    aria-label={`Bảng lịch học tuần ${week}`}
                    tabIndex="0"
                >
                    <table className="v2-study-schedule-grid">
                        <thead>
                            <tr>
                                <th scope="col">Khung giờ</th>
                                {STUDY_DAYS.map((day, index) => (
                                    <th key={day.id} scope="col">
                                        <span>{day.label}</span>
                                        <small>
                                            {weekDates ? formatStudyDate(weekDates.days[index]) : day.shortLabel}
                                        </small>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot, index) => (
                                <tr key={slot.id}>
                                    <th scope="row">
                                        <span>Slot {index + 1}</span>
                                        <small>{slot.label}</small>
                                    </th>
                                    {STUDY_DAYS.map((day) => {
                                        const entry = getStudySlot(entries, day.id, slot.id);
                                        return (
                                            <td key={day.id}>
                                                <button
                                                    className={`v2-study-schedule-cell${entry ? ' is-filled' : ''}`}
                                                    type="button"
                                                    disabled={loading || busy}
                                                    onClick={() => openSlot(day, slot)}
                                                    aria-label={`${day.label}, slot ${index + 1}, ${slot.label}: ${entry ? `${entry.subject}${entry.room ? `, ${entry.room}` : ''}. Sửa lịch học` : 'Thêm môn học'}`}
                                                >
                                                    {entry ? (
                                                        <>
                                                            <Pencil size={13} aria-hidden="true" />
                                                            <strong>{entry.subject}</strong>
                                                            {entry.room && <small>{entry.room}</small>}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus size={17} aria-hidden="true" />
                                                            <span>Thêm môn</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            {editing && (
                <V2Modal
                    title={
                        <span className="v2-study-schedule-modal-title">
                            <span>
                                {formatStudyTerm(period)} · Block {period.block} · Tuần {week}
                            </span>
                            <span>
                                {editing.day.label} · {editing.slot.label}
                            </span>
                        </span>
                    }
                    onClose={() => !busy && setEditing(null)}
                >
                    <form className="v2-study-schedule-form" onSubmit={save}>
                        <p>
                            Thay đổi này chỉ áp dụng cho tuần {week}. Dùng “Nhập hàng loạt” để điền cùng lịch vào mọi
                            tuần.
                        </p>
                        <label>
                            Tên môn học
                            <input
                                autoFocus
                                value={draft.subject}
                                onChange={(event) =>
                                    setDraft((current) => ({ ...current, subject: event.target.value }))
                                }
                                maxLength="120"
                                placeholder="Ví dụ: Thiết kế giao diện"
                                required
                            />
                        </label>
                        <label>
                            Phòng học <small>(không bắt buộc)</small>
                            <input
                                value={draft.room}
                                onChange={(event) => setDraft((current) => ({ ...current, room: event.target.value }))}
                                maxLength="80"
                                placeholder="Ví dụ: AL-R101"
                            />
                        </label>
                        {error && (
                            <p className="v2-study-schedule-error" role="alert">
                                {error}
                            </p>
                        )}
                        <footer>
                            {getStudySlot(entries, editing.day.id, editing.slot.id) && (
                                <button
                                    className="v2-button v2-study-schedule-delete"
                                    type="button"
                                    onClick={clear}
                                    disabled={busy}
                                >
                                    Xóa slot
                                </button>
                            )}
                            <button
                                className="v2-button"
                                type="button"
                                onClick={() => setEditing(null)}
                                disabled={busy}
                            >
                                Hủy
                            </button>
                            <button className="v2-button v2-button--primary" type="submit" disabled={busy}>
                                Lưu lịch học
                            </button>
                        </footer>
                    </form>
                </V2Modal>
            )}
            {bulkOpen && (
                <StudyScheduleBulkImportModal
                    period={period}
                    existingEntries={allEntries}
                    onImport={importTemplate}
                    onClose={() => setBulkOpen(false)}
                />
            )}
        </div>
    );
}
