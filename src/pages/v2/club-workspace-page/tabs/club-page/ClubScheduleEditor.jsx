import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Clock, RotateCcw } from 'lucide-react';
import {
    CLUB_DAYS,
    CLUB_TERMS,
    DAY_MINUTES,
    clampClubTime,
    defaultClubSchedule,
    displayClubSchedule,
    formatClubSchedule,
    formatClubTime,
    parseClubSchedule,
} from './club-schedule-data';
import './ClubScheduleEditor.scss';

const ClubScheduleEditor = forwardRef(function ClubScheduleEditor({ value, onChange, disabled = false }, ref) {
    const [schedule, setSchedule] = useState(() => parseClubSchedule(value) || defaultClubSchedule());
    const [touched, setTouched] = useState(false);
    const [invalid, setInvalid] = useState(false);
    const firstDay = useRef(null);
    const valid = !touched || schedule.days.length > 0;
    useImperativeHandle(
        ref,
        () => ({
            checkValidity: () => valid,
            focus: () => firstDay.current?.focus(),
            reportValidity: () => {
                setInvalid(!valid);
                return valid;
            },
        }),
        [valid],
    );
    const update = (patch) => {
        const next = { ...schedule, ...patch };
        setSchedule(next);
        setTouched(true);
        setInvalid(false);
        onChange(formatClubSchedule(next));
    };
    const changeTime = (handle, value) =>
        update({ [handle]: clampClubTime(value, handle, schedule.start, schedule.end) });
    const year = new Date().getFullYear();
    const years = [...new Set([year - 1, year, year + 1, year + 2, schedule.year])].sort();
    return (
        <div className="club-schedule-editor">
            <input type="hidden" name="scheduleLabel" value={value} />
            <div className="club-schedule-period">
                <label>
                    Học kỳ
                    <select
                        value={schedule.term}
                        onChange={(event) => update({ term: event.target.value })}
                        disabled={disabled}
                    >
                        {CLUB_TERMS.map((term) => (
                            <option key={term.id} value={term.id}>
                                {term.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Năm
                    <select
                        value={schedule.year}
                        onChange={(event) => update({ year: Number(event.target.value) })}
                        disabled={disabled}
                    >
                        {years.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <fieldset disabled={disabled} className="club-schedule-days">
                <legend>Ngày sinh hoạt</legend>
                <div>
                    {CLUB_DAYS.map((day, index) => (
                        <button
                            key={day.id}
                            ref={index === 0 ? firstDay : undefined}
                            type="button"
                            aria-pressed={schedule.days.includes(day.id)}
                            aria-label={day.label}
                            onClick={() =>
                                update({
                                    days: schedule.days.includes(day.id)
                                        ? schedule.days.filter((id) => id !== day.id)
                                        : [...schedule.days, day.id],
                                })
                            }
                        >
                            {day.shortLabel}
                        </button>
                    ))}
                </div>
                <small>Chọn một hoặc nhiều ngày trong tuần.</small>
                {invalid && (
                    <p className="club-page-modal-error" role="alert">
                        Vui lòng chọn ít nhất một ngày sinh hoạt.
                    </p>
                )}
            </fieldset>
            <label className="club-schedule-repeat">
                <input
                    type="checkbox"
                    checked={schedule.repeat}
                    onChange={(event) => update({ repeat: event.target.checked })}
                    disabled={disabled}
                />
                <span>Lặp lại hàng tuần trong học kỳ</span>
            </label>
            <section className="club-schedule-time" aria-label="Khung giờ sinh hoạt">
                <div className="club-schedule-time-heading">
                    <strong>
                        <Clock size={17} aria-hidden="true" />
                        Khung giờ
                    </strong>
                    <span>{(schedule.end - schedule.start) / 60} giờ</span>
                </div>
                <div className="club-schedule-time-values">
                    <div>
                        <small>Bắt đầu</small>
                        <output>{formatClubTime(schedule.start)}</output>
                    </div>
                    <span>→</span>
                    <div>
                        <small>Kết thúc</small>
                        <output>{formatClubTime(schedule.end)}</output>
                    </div>
                </div>
                <div
                    className="club-schedule-range"
                    style={{
                        '--start': `${(schedule.start / DAY_MINUTES) * 100}%`,
                        '--end': `${(schedule.end / DAY_MINUTES) * 100}%`,
                    }}
                >
                    <div className="club-schedule-range-track">
                        <span />
                    </div>
                    <input
                        className="is-start"
                        type="range"
                        min="0"
                        max={DAY_MINUTES}
                        step="30"
                        value={schedule.start}
                        aria-label="Giờ bắt đầu"
                        aria-valuetext={formatClubTime(schedule.start)}
                        onChange={(event) => changeTime('start', event.target.value)}
                        disabled={disabled}
                    />
                    <input
                        className="is-end"
                        type="range"
                        min="0"
                        max={DAY_MINUTES}
                        step="30"
                        value={schedule.end}
                        aria-label="Giờ kết thúc"
                        aria-valuetext={formatClubTime(schedule.end)}
                        onChange={(event) => changeTime('end', event.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="club-schedule-time-ticks" aria-hidden="true">
                    {['00:00', '06:00', '12:00', '18:00', '24:00'].map((time) => (
                        <span key={time}>{time}</span>
                    ))}
                </div>
                <p>Kéo hai điểm để chọn giờ, mỗi bước 30 phút. Có thể dùng phím mũi tên khi chọn một điểm.</p>
            </section>
            <div className="club-schedule-summary" aria-live="polite">
                <strong>Lịch hiển thị trên trang CLB</strong>
                <p>{displayClubSchedule(value) || 'Chưa chọn lịch sinh hoạt.'}</p>
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            setSchedule(defaultClubSchedule());
                            setTouched(false);
                            setInvalid(false);
                            onChange('');
                        }}
                        disabled={disabled}
                    >
                        <RotateCcw size={14} aria-hidden="true" />
                        Xóa lịch
                    </button>
                )}
                {!touched && value && !parseClubSchedule(value) && (
                    <small>Lịch hiện tại được giữ nguyên. Chọn ngày và giờ để thay bằng lịch mới.</small>
                )}
            </div>
        </div>
    );
});

export default ClubScheduleEditor;
