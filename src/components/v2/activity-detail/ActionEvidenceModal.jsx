import { useState } from 'react';
import V2Modal from '../common/modal/V2Modal';

export default function ActionEvidenceModal({ assignment, busy, error, onClose, onSubmit }) {
    const [occurrenceKey] = useState(() => crypto.randomUUID());
    const [label, setLabel] = useState('');
    const [content, setContent] = useState('');
    const [url, setUrl] = useState('');
    const evidence = [content.trim(), url.trim() ? `Tài nguyên: ${url.trim()}` : ''].filter(Boolean).join('\n\n');
    return (
        <V2Modal title="Minh chứng thực hiện" onClose={() => !busy && onClose()} wide>
            <form className="v2-staffing-form" onSubmit={(event) => {
                event.preventDefault();
                if (busy || !label.trim() || !content.trim() || evidence.length > 4000) return;
                onSubmit({ occurrenceKey, occurrenceLabel: label.trim(), evidence });
            }}>
                <h3>{assignment.actionName}</h3>
                <p>{assignment.displayName} · {assignment.assignmentKind === 'HOST' ? 'Host' : 'Staff'}</p>
                <p>Trạng thái phân công: {assignment.status === 'ASSIGNED' ? 'Đã phân công' : assignment.status}</p>
                <fieldset disabled={busy}>
                    <label>Lượt thực hiện<input required maxLength={200} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ví dụ: Chuẩn bị tài liệu cho buổi 1" /></label>
                    <label>Nội dung minh chứng<textarea required maxLength={4000} rows={5} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Công việc đã làm, kết quả và cách đối chiếu" /></label>
                    <label>Liên kết tài nguyên (nếu có)<input type="url" pattern="https://.*" value={url} maxLength={1500} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" /></label>
                    <p>API hiện lưu nội dung và liên kết minh chứng; chưa hỗ trợ đính kèm tệp trực tiếp cho lượt thực hiện này.</p>
                    <p>Gửi minh chứng tạo lượt chờ xác minh. Hoàn thành và XP chỉ được ghi nhận theo xác nhận của máy chủ.</p>
                    {assignment.completions?.length > 0 && <details><summary>Các lượt đã gửi</summary>{assignment.completions.map((row) => <p key={row.id}>{row.occurrenceLabel} · {({ PENDING: 'Chờ xác minh', VERIFIED: 'Đã xác minh', REJECTED: 'Cần sửa' })[row.status] || row.status}</p>)}</details>}
                    {evidence.length > 4000 && <p role="alert">Tổng nội dung và liên kết tối đa 4000 ký tự.</p>}
                    {error && <p role="alert">{error}</p>}
                    <footer><button type="button" className="v2-button" onClick={onClose}>Hủy</button><button className="v2-button v2-button--primary" disabled={busy || !content.trim() || !label.trim() || evidence.length > 4000}>{busy ? 'Đang gửi…' : 'Gửi để xác minh'}</button></footer>
                </fieldset>
            </form>
        </V2Modal>
    );
}
