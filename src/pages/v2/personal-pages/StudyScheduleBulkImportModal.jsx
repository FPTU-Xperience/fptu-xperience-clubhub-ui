import { useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import {
    STUDY_DAYS,
    formatStudyTerm,
    getStudySlots,
    getStudyWeekCount,
    normalizeStudyTemplate,
} from '../study-schedule-data';

export default function StudyScheduleBulkImportModal({ period, existingEntries, onImport, onClose }) {
    const [rows, setRows] = useState([{ id: 1, day: 'mon', slotId: 'slot-1', subject: '', room: '' }]);
    const [preview, setPreview] = useState(null);
    const [mode, setMode] = useState('skip');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const nextId = useRef(2);
    const slots = getStudySlots(period.block);
    const weekCount = getStudyWeekCount(period.block);
    const maxRows = STUDY_DAYS.length * slots.length;

    const updateRow = (id, field, value) => {
        setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
        setPreview(null);
        setError('');
    };

    const addRow = () => {
        if (rows.length >= maxRows) return;
        const occupied = new Set(rows.map((row) => `${row.day}:${row.slotId}`));
        const nextCell = STUDY_DAYS.flatMap((day) => slots.map((slot) => ({ day: day.id, slotId: slot.id }))).find(
            (cell) => !occupied.has(`${cell.day}:${cell.slotId}`),
        );
        if (!nextCell) return;
        setRows((current) => [...current, { id: nextId.current++, ...nextCell, subject: '', room: '' }]);
        setPreview(null);
    };

    const removeRow = (id) => {
        setRows((current) => current.filter((row) => row.id !== id));
        setPreview(null);
        setError('');
    };

    const showPreview = () => {
        try {
            setPreview(normalizeStudyTemplate(rows, period.block));
            setError('');
        } catch (validationError) {
            setError(validationError?.message || 'Dữ liệu lịch học không hợp lệ.');
        }
    };

    const apply = async () => {
        if (!preview || submitting) return;
        setSubmitting(true);
        setError('');
        try {
            await onImport(preview, mode);
        } catch (importError) {
            setError(importError?.message || 'Không thể nhập lịch học.');
        } finally {
            setSubmitting(false);
        }
    };

    const existingCells = new Set(existingEntries.map((entry) => `${entry.week}:${entry.day}:${entry.slotId}`));
    const conflictCount = preview
        ? preview.reduce((count, row) => {
              for (let week = 1; week <= weekCount; week += 1) {
                  if (existingCells.has(`${week}:${row.day}:${row.slotId}`)) count += 1;
              }
              return count;
          }, 0)
        : 0;
    const totalCells = (preview?.length || 0) * weekCount;

    return (
        <V2Modal
            title={`Nhập hàng loạt · ${formatStudyTerm(period)} · ${period.block}`}
            onClose={() => !submitting && onClose()}
            wide
        >
            <div className="v2-study-bulk-modal">
                <p>
                    Thêm tên môn, ngày học và timeslot. Mỗi dòng sẽ được điền vào cùng ngày/slot của toàn bộ {weekCount}{' '}
                    tuần.
                </p>
                {!preview ? (
                    <>
                        <div className="v2-study-bulk-rows">
                            {rows.map((row, index) => (
                                <div className="v2-study-bulk-row" key={row.id}>
                                    <span className="v2-study-bulk-row-number">{index + 1}</span>
                                    <label>
                                        Ngày học
                                        <select
                                            value={row.day}
                                            onChange={(event) => updateRow(row.id, 'day', event.target.value)}
                                        >
                                            {STUDY_DAYS.map((day) => (
                                                <option key={day.id} value={day.id}>
                                                    {day.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Timeslot
                                        <select
                                            value={row.slotId}
                                            onChange={(event) => updateRow(row.id, 'slotId', event.target.value)}
                                        >
                                            {slots.map((slot) => (
                                                <option key={slot.id} value={slot.id}>
                                                    {slot.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        Tên môn
                                        <input
                                            value={row.subject}
                                            maxLength="120"
                                            placeholder="Ví dụ: SWP391"
                                            onChange={(event) => updateRow(row.id, 'subject', event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Phòng
                                        <input
                                            value={row.room}
                                            maxLength="80"
                                            placeholder="Tùy chọn"
                                            onChange={(event) => updateRow(row.id, 'room', event.target.value)}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="v2-study-bulk-remove"
                                        disabled={rows.length === 1}
                                        onClick={() => removeRow(row.id)}
                                        aria-label={`Xóa dòng ${index + 1}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="v2-button v2-study-bulk-add"
                            disabled={rows.length >= maxRows}
                            onClick={addRow}
                        >
                            <Plus size={15} /> Thêm môn
                        </button>
                    </>
                ) : (
                    <div className="v2-study-bulk-preview">
                        <strong>
                            {preview.length} dòng · {totalCells} ô qua {weekCount} tuần
                        </strong>
                        <p>{conflictCount} ô đã có lịch. Chọn cách xử lý trước khi áp dụng.</p>
                        <div className="v2-study-bulk-preview-list">
                            {preview.map((row) => (
                                <div key={`${row.day}:${row.slotId}`}>
                                    <span>
                                        {STUDY_DAYS.find((day) => day.id === row.day)?.label} ·{' '}
                                        {slots.find((slot) => slot.id === row.slotId)?.label}
                                    </span>
                                    <strong>{row.subject}</strong>
                                    {row.room && <small>{row.room}</small>}
                                </div>
                            ))}
                        </div>
                        <label className="v2-study-bulk-mode">
                            Nếu ô đã có lịch
                            <select value={mode} onChange={(event) => setMode(event.target.value)}>
                                <option value="skip">Giữ lịch cũ, bỏ qua ô trùng</option>
                                <option value="replace">Thay bằng lịch mới</option>
                            </select>
                        </label>
                        <p className="v2-study-bulk-count">
                            {mode === 'skip' ? totalCells - conflictCount : totalCells} ô sẽ được ghi;
                            {mode === 'skip'
                                ? ` ${conflictCount} ô giữ nguyên.`
                                : ` ${conflictCount} ô cũ sẽ được thay.`}
                        </p>
                    </div>
                )}
                {error && (
                    <p className="v2-study-schedule-error" role="alert">
                        {error}
                    </p>
                )}
                <footer>
                    <button type="button" className="v2-button" disabled={submitting} onClick={onClose}>
                        Hủy
                    </button>
                    {preview ? (
                        <>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={submitting}
                                onClick={() => setPreview(null)}
                            >
                                Sửa danh sách
                            </button>
                            <button
                                type="button"
                                className="v2-button v2-button--primary"
                                disabled={submitting || (mode === 'skip' && totalCells === conflictCount)}
                                onClick={apply}
                            >
                                Áp dụng cho {weekCount} tuần
                            </button>
                        </>
                    ) : (
                        <button type="button" className="v2-button v2-button--primary" onClick={showPreview}>
                            Xem trước
                        </button>
                    )}
                </footer>
            </div>
        </V2Modal>
    );
}
