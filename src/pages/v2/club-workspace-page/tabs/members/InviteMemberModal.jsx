import { useEffect, useRef, useState } from 'react';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import { STUDY_TERMS, defaultStudyPeriod } from '../../../study-schedule-data';
import { eligibleInvitationCandidates, semesterCode } from '../../../../../services/club-invitations';

export default function InviteMemberModal({ api, clubId, onClose, onInvited }) {
    const [period, setPeriod] = useState(defaultStudyPeriod);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [version, setVersion] = useState(0);
    const [result, setResult] = useState(null);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const active = useRef(true);
    const lock = useRef(false);
    const semesterId = semesterCode(period);
    useEffect(() => {
        active.current = true;
        return () => {
            active.current = false;
        };
    }, []);
    useEffect(() => {
        let current = true;
        setSelected(null);
        setResult(null);
        setError('');
        if (!semesterId) {
            setLoading(false);
            setError('Chọn học kỳ và năm hợp lệ (2000–2100).');
            return undefined;
        }
        if (search.trim().length < 2) {
            setLoading(false);
            return undefined;
        }
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const data = await api.searchEligibleClubMembers(clubId, {
                    semesterId,
                    search: search.trim(),
                    page,
                    pageSize: 10,
                });
                if (current) {
                    if (data?.semesterId !== semesterId)
                        throw new Error('Danh sách trả về không khớp học kỳ đã chọn. Vui lòng tra cứu lại.');
                    setResult({ ...data, query: search.trim(), page });
                }
            } catch (issue) {
                if (current)
                    setError(
                        issue?.status === 404 || issue?.status === 405
                            ? 'Máy chủ chưa hỗ trợ tra cứu sinh viên theo học kỳ. Chưa thể gửi lời mời lúc này.'
                            : issue?.status === 403
                              ? 'Bạn không có quyền tra cứu sinh viên cho CLB này.'
                              : issue?.message || 'Không thể tải danh sách sinh viên.',
                    );
            } finally {
                if (current) setLoading(false);
            }
        }, 300);
        return () => {
            current = false;
            clearTimeout(timer);
        };
    }, [api, clubId, semesterId, search, page, version]);
    const send = async (event) => {
        event.preventDefault();
        if (
            lock.current ||
            loading ||
            !selected ||
            result?.query !== search.trim() ||
            result?.page !== page ||
            !eligibleInvitationCandidates(result, semesterId).includes(selected)
        )
            return;
        lock.current = true;
        setSending(true);
        setError('');
        try {
            await api.inviteClubMember(clubId, selected, semesterId);
            if (active.current) onInvited(selected);
        } catch (issue) {
            if (active.current) {
                setError(
                    issue?.status === 409
                        ? 'Sinh viên đã có tư cách thành viên hoặc đơn tham gia tại CLB. Hãy chọn sinh viên khác.'
                        : issue?.message || 'Không thể gửi lời mời.',
                );
                if (issue?.status === 409) setSelected(null);
            }
        } finally {
            lock.current = false;
            if (active.current) setSending(false);
        }
    };
    const candidates = eligibleInvitationCandidates(result, semesterId);
    return (
        <div className="v2-member-dialog">
            <V2Modal
                title="Thêm thành viên"
                wide
                onClose={() => {
                    if (!lock.current) onClose();
                }}
            >
                <form className="v2-member-invite" onSubmit={send} aria-busy={sending}>
                    <p>
                        Tra cứu danh sách sinh viên trong học kỳ do CTSV quản lý. Sinh viên nhận lời mời tại “CLB của
                        tôi” và cần tự xác nhận nội quy, cam kết tham gia trước khi CLB duyệt.
                    </p>
                    <div className="v2-member-invite-period">
                        <label>
                            Học kỳ
                            <select
                                aria-label="Học kỳ tra cứu"
                                value={period.term}
                                disabled={sending}
                                onChange={(event) => {
                                    setPeriod((value) => ({ ...value, term: event.target.value }));
                                    setPage(1);
                                }}
                            >
                                {STUDY_TERMS.map((term) => (
                                    <option key={term.id} value={term.id}>
                                        {term.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Năm
                            <input
                                aria-label="Năm tra cứu"
                                type="number"
                                min="2000"
                                max="2100"
                                value={period.year}
                                disabled={sending}
                                onChange={(event) => {
                                    setPeriod((value) => ({ ...value, year: event.target.value }));
                                    setPage(1);
                                }}
                            />
                        </label>
                    </div>
                    <label>
                        Tìm sinh viên
                        <input
                            autoComplete="off"
                            aria-label="Tìm sinh viên để mời"
                            placeholder="Nhập tên hoặc mã sinh viên (ít nhất 2 ký tự)…"
                            value={search}
                            disabled={sending}
                            onChange={(event) => {
                                setSearch(event.target.value);
                                setPage(1);
                            }}
                        />
                    </label>
                    {loading && <p role="status">Đang tra cứu sinh viên…</p>}
                    {!loading && result && (
                        <fieldset className="v2-member-candidates">
                            <legend>Chọn sinh viên</legend>
                            {!candidates.length && <p>Không có sinh viên phù hợp có thể mời trong học kỳ này.</p>}
                            {candidates.map((student) => (
                                <label key={student.userId} className="v2-member-candidate">
                                    <input
                                        type="radio"
                                        name="student"
                                        value={student.userId}
                                        checked={selected?.userId === student.userId}
                                        disabled={sending}
                                        onChange={() => setSelected(student)}
                                    />
                                    <span>
                                        <strong>{student.fullName}</strong>
                                        <small>{student.studentCode}</small>
                                    </span>
                                    <span className="v2-member-active">Đang hoạt động</span>
                                </label>
                            ))}
                        </fieldset>
                    )}
                    {result?.totalPages > 1 && (
                        <div className="v2-member-pagination">
                            <span>
                                Trang {page}/{result.totalPages}
                            </span>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={sending || loading || page <= 1}
                                onClick={() => setPage((value) => value - 1)}
                            >
                                Trước
                            </button>
                            <button
                                type="button"
                                className="v2-button"
                                disabled={sending || loading || page >= result.totalPages}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    )}
                    {selected && (
                        <p className="v2-member-invite-selection" role="status">
                            Sẽ gửi lời mời cho <strong>{selected.fullName}</strong>.
                        </p>
                    )}
                    {error && (
                        <div className="v2-member-error" role="alert">
                            {error}{' '}
                            <button
                                type="button"
                                className="v2-button"
                                disabled={sending}
                                onClick={() => setVersion((value) => value + 1)}
                            >
                                Thử lại tra cứu
                            </button>
                        </div>
                    )}
                    <footer className="v2-member-actions">
                        <button type="button" className="v2-button" disabled={sending} onClick={onClose}>
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="v2-button v2-button--primary"
                            disabled={sending || loading || !selected}
                        >
                            {sending ? 'Đang gửi…' : 'Gửi lời mời'}
                        </button>
                    </footer>
                </form>
            </V2Modal>
        </div>
    );
}
