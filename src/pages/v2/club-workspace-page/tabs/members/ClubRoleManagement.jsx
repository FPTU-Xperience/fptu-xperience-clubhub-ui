import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../../context/AuthContext';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import { clubMemberRoleLabel } from './club-member-roles';
import './MemberManagement.scss';
import './ClubRoleManagement.scss';

const guid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
export default function ClubRoleManagement({ clubId, readOnly = false, onChanged }) {
    const { api, user, refreshClubAccess } = useAuth();
    const [state, setState] = useState({}),
        [page, setPage] = useState(1),
        [retry, setRetry] = useState(0),
        [selected, setSelected] = useState(null),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    const generation = useRef(0),
        lock = useRef(false),
        keys = useRef(new Map());
    useEffect(() => {
        keys.current.clear();
        setNotice('');
        setPage(1);
    }, [clubId, user?.id]);
    useEffect(() => {
        const ticket = ++generation.current;
        setState({});
        setSelected(null);
        setError('');
        setBusy(false);
        lock.current = false;
        api.request(`/api/clubs/${encodeURIComponent(clubId)}/roles?page=${page}&pageSize=20`)
            .then((data) => {
                if (generation.current !== ticket) return;
                if (
                    String(data?.clubId) !== String(clubId) ||
                    !guid(data.version) ||
                    !Array.isArray(data.items) ||
                    !Number.isSafeInteger(data.totalPages) ||
                    data.items.some((row) => !Number.isSafeInteger(row.memberId) || !guid(row.version)) ||
                    new Set(data.items.map((row) => row.memberId)).size !== data.items.length
                )
                    throw new Error('Máy chủ chưa trả dữ liệu vai trò hợp lệ.');
                setState({ data });
            })
            .catch((issue) => {
                if (generation.current === ticket) setState({ error: issue });
            });
        return () => {
            generation.current++;
        };
    }, [api, clubId, user?.id, page, retry]);
    const save = async (event) => {
        event.preventDefault();
        if (lock.current || readOnly || !selected || state.data?.capabilities?.canManageRoles !== true) return;
        const reason = new FormData(event.currentTarget).get('reason')?.trim();
        if (!reason) return;
        const body = {
            role: selected.canRevokeTreasurer ? 'MEMBER' : 'TREASURER',
            expectedVersion: selected.version,
            expectedClubVersion: state.data.version,
            reason,
        };
        const fingerprint = JSON.stringify([selected.memberId, body]);
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        const ticket = generation.current;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const saved = await api.request(`/api/clubs/${encodeURIComponent(clubId)}/roles/${selected.memberId}`, {
                method: 'PATCH',
                headers: { 'Idempotency-Key': keys.current.get(fingerprint) },
                body: JSON.stringify(body),
            });
            if (
                String(saved?.clubId) !== String(clubId) ||
                saved.memberId !== selected.memberId ||
                saved.role !== body.role ||
                !guid(saved.version) ||
                saved.version === body.expectedVersion ||
                !guid(saved.clubVersion)
            )
                throw new Error('Chưa xác nhận được vai trò đã lưu. Tải lại để đối chiếu.');
            if (generation.current !== ticket) return;
            keys.current.delete(fingerprint);
            setSelected(null);
            setNotice('Đã cập nhật vai trò. Quyền được đối chiếu lại từ máy chủ.');
            setBusy(false);
            await refreshClubAccess?.();
            if (generation.current !== ticket) return;
            onChanged?.();
            setRetry((value) => value + 1);
        } catch (issue) {
            if (generation.current === ticket)
                setError(
                    issue.status === 409
                        ? 'Vai trò hoặc số chỗ thủ quỹ đã thay đổi. Tải lại danh sách trước khi thử tiếp.'
                        : issue.message || 'Không thể cập nhật vai trò.',
                );
        } finally {
            if (generation.current === ticket) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    const data = state.data;
    return (
        <section className="v2-activity-profile-panel v2-club-roles" aria-label="Quản lý vai trò CLB">
            <h2>Vai trò trong CLB</h2>
            <p>
                Chủ nhiệm dùng quy trình chuyển giao riêng. Mỗi CLB tối đa 2 thủ quỹ; chỉ hiển thị thao tác máy chủ cho
                phép.
            </p>
            {notice && <p role="status">{notice}</p>}
            {state.error ? (
                <p role="alert">
                    {[404, 405, 501].includes(state.error.status)
                        ? 'Máy chủ chưa hỗ trợ quản lý vai trò này.'
                        : state.error.status === 403
                          ? 'Bạn chưa có quyền xem danh sách vai trò của CLB.'
                          : state.error.message}
                </p>
            ) : !data ? (
                <p role="status">Đang tải vai trò…</p>
            ) : (
                <>
                    {(readOnly || !data.capabilities?.canManageRoles) && (
                        <p>Chế độ chỉ xem. Bạn không có thao tác gán/thu hồi vai trò tại đây.</p>
                    )}
                    <p>
                        Thủ quỹ: {data.treasurerCount}/{data.treasurerLimit}
                    </p>
                    {data.items.map((row) => (
                        <article key={row.memberId} className="v2-club-role-row">
                            <strong>{row.displayName}</strong>
                            <span>{clubMemberRoleLabel(row.role)}</span>
                            {!readOnly &&
                                data.capabilities?.canManageRoles &&
                                (row.canAssignTreasurer === true || row.canRevokeTreasurer === true) && (
                                    <button
                                        className="v2-button"
                                        disabled={busy}
                                        onClick={() => {
                                            setSelected(row);
                                            setError('');
                                        }}
                                    >
                                        {row.canRevokeTreasurer ? 'Thu hồi thủ quỹ' : 'Gán thủ quỹ'} · {row.displayName}
                                    </button>
                                )}
                        </article>
                    ))}
                    {data.totalPages > 1 && (
                        <nav aria-label="Trang vai trò">
                            <button disabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>
                                Trước
                            </button>
                            <span>
                                Trang {page}/{data.totalPages}
                            </span>
                            <button
                                disabled={page >= data.totalPages || busy}
                                onClick={() => setPage((value) => value + 1)}
                            >
                                Sau
                            </button>
                        </nav>
                    )}
                </>
            )}
            <button className="v2-button" disabled={busy} onClick={() => setRetry((value) => value + 1)}>
                Tải lại vai trò
            </button>
            {selected && (
                <V2Modal
                    title={selected.canRevokeTreasurer ? 'Thu hồi vai trò thủ quỹ' : 'Gán vai trò thủ quỹ'}
                    onClose={() => !busy && setSelected(null)}
                >
                    <form className="v2-club-role-form" onSubmit={save}>
                        <p>{selected.displayName}</p>
                        <label>
                            Lý do thay đổi
                            <textarea
                                aria-label="Lý do thay đổi vai trò"
                                name="reason"
                                required
                                maxLength={1000}
                                disabled={busy}
                            />
                        </label>
                        {error && <p role="alert">{error}</p>}
                        <button type="button" disabled={busy} onClick={() => setSelected(null)}>
                            Hủy
                        </button>
                        <button className="v2-button" disabled={busy}>
                            Xác nhận vai trò
                        </button>
                        {error && (
                            <button type="button" onClick={() => setRetry((value) => value + 1)}>
                                Tải lại dữ liệu vai trò
                            </button>
                        )}
                    </form>
                </V2Modal>
            )}
        </section>
    );
}
