import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import ClubCreditWallet from './ClubCreditWallet';
import { cosmeticInventory, creditGuid, creditNumber, creditWallet, rewardCatalog, rewardMutation, rewardReceipt, rewardTime, rewardWindow } from '../../../../services/club-credit';
import './ServerClubRewards.scss';
import '../../../../components/v2/activity-detail/ActivitySessions.scss';
import { acceptServerCosmetics } from '../../../../services/server-cosmetics-cache';

const statusName = { DRAFT: 'Bản nháp', SCHEDULED: 'Chưa mở đổi', OPEN: 'Đang mở đổi', EXPIRED: 'Đã hết thời gian đổi', RETIRED: 'Đã ngừng đổi' };
const emptyPalette = { background: '#E8F5EF', secondary: '#B7E4C7', accent: '#087F5B', ink: '#123B2A' };
export default function ServerClubRewards({ workspace, manager: managerInput = false, readOnly = false }) {
    const { api, user } = useAuth(); const clubId = workspace?.clubId;
    const manager = managerInput && !readOnly;
    const [page, setPage] = useState(1), [revision, setRevision] = useState(0), [result, setResult] = useState({});
    const [dialog, setDialog] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const lock = useRef(false), keys = useRef(new Map());
    const identity = `${user?.id}:${clubId}:${manager}:${readOnly}:${page}`;
    const modal = dialog?.context === identity ? dialog.value : null;
    const setModal = (value) => setDialog(value ? { context: identity, value } : null);
    const current = useRef(identity); current.current = identity;
    const state = result.identity === identity ? result : {};
    const canManage = manager && state.catalog?.capabilities.canManage;
    useEffect(() => {
        setModal(null); setError(''); setNotice(''); keys.current.clear(); lock.current = false; setBusy(false);
    }, [api, identity]);
    useEffect(() => {
        let active = true; setResult({});
        if (!clubId) return;
        const catalog = api.request(`/api/clubs/${encodeURIComponent(clubId)}/rewards?page=${page}&pageSize=20${manager ? '&manage=true' : ''}`).then((value) => rewardCatalog(value, clubId));
        const personal = !readOnly && user?.id ? Promise.all([
            api.request(`/api/clubs/${encodeURIComponent(clubId)}/wallet/me`).then((value) => creditWallet(value, user.id, clubId)), cosmeticInventory(api, user.id),
        ]).then(([wallet, inventory]) => ({ wallet, inventory })).catch((issue) => ({ personalError: issue.message })) : Promise.resolve({});
        Promise.all([catalog, personal]).then(([catalog, personal]) => { if (active && current.current === identity) {
            if (personal.inventory) acceptServerCosmetics(user.id, personal.inventory);
            setResult({ identity, catalog, ...personal });
        } })
            .catch((issue) => { if (active && current.current === identity) setResult({ identity, error: issue.message }); });
        return () => { active = false; };
    }, [api, identity, revision]);
    const run = async (kind, row, payload) => {
        if (lock.current || readOnly || !user?.id || kind !== 'redeem' && !canManage) return;
        const context = identity;
        let body = payload;
        if (kind === 'redeem') {
            if (!state.wallet) return;
            body = { expectedRewardVersion: row.version, expectedWalletVersion: state.wallet.version };
        }
        const suffix = kind === 'create' ? '' : `/${row.id}${kind === 'edit' ? '' : '/' + kind}`;
        const fingerprint = JSON.stringify({ kind, suffix, body });
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        lock.current = true; setBusy(true); setError(''); setNotice('');
        try {
            const value = await rewardMutation(api, clubId, suffix, body, keys.current.get(fingerprint), kind === 'edit' ? 'PATCH' : 'POST');
            if (kind === 'redeem') rewardReceipt(value, user.id, clubId, row);
            else if (String(value?.clubId) !== String(clubId) || !creditGuid(value.id) || !creditGuid(value.version)) throw new Error('Máy chủ chưa xác nhận đúng phần quà. Tải lại để đối chiếu.');
            if (current.current !== context) return;
            keys.current.delete(fingerprint); setModal(null); setRevision((value) => value + 1);
            setNotice(kind === 'redeem' ? 'Đã lưu phiếu đổi quà. Ví và kho vật phẩm được tải lại từ máy chủ.' : 'Đã lưu thay đổi phần quà.');
        } catch (issue) {
            if (current.current === context) setError(issue.status === 409 ? 'Quà, số dư hoặc điều kiện đã thay đổi. Đóng cửa sổ và tải lại trước khi thử tiếp.' : issue.message);
        } finally { if (current.current === context) { lock.current = false; setBusy(false); } }
    };
    const owned = new Set(state.inventory?.map((item) => item.cosmetic.cosmeticId) || []);
    return <WorkspaceTabLayout title="Kho quà" description="Quà của CLB, số dư credit và quyền sở hữu được xác nhận trên máy chủ."
        action={canManage ? <button className="v2-button v2-button--primary" onClick={() => { setError(''); setModal({ kind: 'create' }); }}>Tạo quà</button> : null}>
        {() => <div className="server-club-rewards">
            {notice && <p role="status">{notice}</p>}
            {state.error ? <p role="alert">{state.error}</p> : !state.catalog ? <p role="status">Đang tải kho quà…</p> : <>
                {!readOnly && user && <p>Số dư khả dụng: <strong>{state.wallet ? creditNumber(state.wallet.balance) + ' credit' : 'Chưa xác nhận'}</strong>. Credit chỉ dùng trong CLB này.</p>}
                {state.personalError && <p role="alert">Không tải được ví/kho vật phẩm: {state.personalError}. Tạm khóa đổi quà.</p>}
                <div className="server-rewards-grid">{state.catalog.items.map((reward) => {
                    const hasAll = !!state.inventory && reward.grants.every((grant) => owned.has(grant.cosmeticId));
                    const allowed = !readOnly && state.catalog.capabilities.canRedeem && !!user?.id && !!state.wallet && !!state.inventory && reward.availability === 'OPEN' && state.wallet.balance >= reward.price && state.wallet.balance >= 0 && !hasAll;
                    return <article key={reward.id}><RewardPreview reward={reward} /><h3>{reward.label}</h3><p>{reward.description}</p>
                        <p>{creditNumber(reward.price)} credit · {statusName[reward.availability]}</p>
                        <p>Mở: {rewardTime(reward.opensAt)}<br />Đóng: {rewardTime(reward.closesAt)} · giờ Việt Nam</p>
                        {!readOnly && <button className="v2-button v2-button--primary" disabled={!allowed || busy} onClick={() => { setError(''); setModal({ kind: 'redeem', reward }); }}>
                            {hasAll ? 'Đã sở hữu' : reward.availability !== 'OPEN' ? statusName[reward.availability] : !user ? 'Đăng nhập để đổi' : !state.catalog.capabilities.canRedeem ? 'Chưa đủ điều kiện đổi quà' : !state.wallet || !state.inventory ? 'Chưa xác nhận số dư/quyền sở hữu' : state.wallet.balance < 0 ? 'Ví đang có khoản âm' : state.wallet.balance < reward.price ? 'Chưa đủ credit' : reward.price === 0 ? 'Nhận miễn phí' : 'Đổi quà'}
                        </button>}
                        {canManage && <div className="reward-actions">{reward.status === 'DRAFT' && <>
                            <button className="v2-button" disabled={busy} onClick={() => { setError(''); setModal({ kind: 'edit', reward }); }}>Sửa bản nháp</button>
                            <button className="v2-button" disabled={busy} onClick={() => { setError(''); setModal({ kind: 'publish', reward }); }}>Mở/lên lịch đổi</button>
                        </>}{reward.status !== 'RETIRED' && <button className="v2-button" disabled={busy} onClick={() => { setError(''); setModal({ kind: 'retire', reward }); }}>Ngừng đổi</button>}</div>}
                    </article>;
                })}</div>
                {!state.catalog.items.length && <p>CLB chưa có phần quà được công bố.</p>}
                <p>Quà hiện vật chưa mở đổi.</p>
                {state.catalog.totalPages > 1 && <nav aria-label="Trang kho quà"><button className="v2-button" disabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page}/{state.catalog.totalPages}</span><button className="v2-button" disabled={page >= state.catalog.totalPages || busy} onClick={() => setPage((value) => value + 1)}>Sau</button></nav>}
            </>}
            {error && !modal && <p role="alert">{error}</p>}
            <button className="v2-button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>Tải lại kho quà</button>
            {!readOnly && user?.id && <ClubCreditWallet clubId={clubId} revision={revision} />}
            {modal && <RewardModal key={`${identity}:${modal.kind}:${modal.reward?.id || 'new'}`} modal={modal} busy={busy} error={error}
                owned={owned} wallet={state.wallet} catalog={state.catalog?.items || []} api={api} clubId={clubId}
                onClose={() => !busy && setModal(null)} onSave={(body) => run(modal.kind, modal.reward, body)} />}
        </div>}
    </WorkspaceTabLayout>;
}

function RewardPreview({ reward }) {
    return <div className="server-reward-preview">{reward.grants.map((grant) => grant.kind === 'COLOR'
        ? <div key={grant.cosmeticId} className="reward-palette-preview" style={{ background: grant.definition.background, color: grant.definition.ink, borderBottom: `12px solid ${grant.definition.accent}` }}>ClubHub</div>
        : <img key={grant.cosmeticId} src={grant.definition.assetUrl} alt={grant.label} />)}</div>;
}
function RewardModal({ modal, busy, error, wallet, owned, catalog, api, clubId, onSave, onClose }) {
    const row = modal.reward;
    const [label, setLabel] = useState(row?.label || ''), [description, setDescription] = useState(row?.description || ''), [kind, setKind] = useState(row?.kind || 'COLOR');
    const [price, setPrice] = useState(row?.price ?? 0), [palette, setPalette] = useState(row?.grants.find((grant) => grant.kind === 'COLOR')?.definition || emptyPalette);
    const [assetUrl, setAssetUrl] = useState(row?.grants.find((grant) => ['SHAPE', 'FRAME'].includes(grant.kind))?.definition.assetUrl || '');
    const [colorId, setColorId] = useState(row?.grants.find((grant) => grant.kind === 'COLOR')?.cosmeticId || ''), [shapeId, setShapeId] = useState(row?.grants.find((grant) => grant.kind === 'SHAPE')?.cosmeticId || '');
    const [opens, setOpens] = useState(''), [closes, setCloses] = useState(''), [reason, setReason] = useState(''), [localError, setLocalError] = useState(''), [uploading, setUploading] = useState(false);
    const mounted = useRef(true); useEffect(() => () => { mounted.current = false; }, []);
    const upload = async (file) => {
        if (!file || uploading) return; setUploading(true); setLocalError('');
        try { const url = await api.uploadPublicImage(file, 'club-reward', clubId); if (mounted.current) setAssetUrl(url); }
        catch (issue) { if (mounted.current) setLocalError(issue.message); }
        finally { if (mounted.current) setUploading(false); }
    };
    const submit = (event) => {
        event.preventDefault(); if (busy || uploading) return; setLocalError('');
        try {
            if (modal.kind === 'redeem') { onSave(); return; }
            if (modal.kind === 'publish') { onSave({ expectedVersion: row.version, ...rewardWindow(opens, closes) }); return; }
            if (modal.kind === 'retire') { onSave({ expectedVersion: row.version, reason }); return; }
            if (['SHAPE', 'FRAME'].includes(kind) && !assetUrl) throw new Error('Chọn và tải ảnh của phần quà trước khi lưu.');
            onSave({ label, description, kind, price: Number(price), ...(row && { expectedVersion: row.version }),
                ...(kind === 'COLOR' ? { palette } : kind === 'BUNDLE' ? { grantIds: [colorId, shapeId] } : { assetUrl }) });
        } catch (issue) { setLocalError(issue.message); }
    };
    const grants = [...new Map(catalog.flatMap((reward) => reward.grants).map((grant) => [grant.cosmeticId, grant])).values()];
    const title = { create: 'Tạo quà CLB', edit: 'Sửa bản nháp quà', publish: 'Mở hoặc lên lịch đổi quà', retire: 'Ngừng đổi quà', redeem: 'Xác nhận đổi quà' }[modal.kind];
    return <V2Modal title={title} onClose={onClose}><form className="v2-session-form" onSubmit={submit}><fieldset disabled={busy || uploading}>
        {row && <h3>{row.label}</h3>}
        {['create', 'edit'].includes(modal.kind) && <>
            <label>Tên quà<input required maxLength={80} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
            <label>Mô tả<textarea maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <label>Loại quà<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="COLOR">Bộ màu</option><option value="SHAPE">Shape cover</option><option value="FRAME">Khung avatar</option><option value="BUNDLE">Bộ màu + shape</option></select></label>
            <label>Giá credit<input type="number" required min="0" max="100000" step="1" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
            {kind === 'COLOR' && Object.entries({ background: 'Màu nền', secondary: 'Màu phụ', accent: 'Màu nhấn', ink: 'Màu chữ' }).map(([key, name]) => <label key={key}>{name}<input type="color" value={palette[key]} onChange={(event) => setPalette((value) => ({ ...value, [key]: event.target.value }))} /></label>)}
            {['SHAPE', 'FRAME'].includes(kind) && <><label>Ảnh quà PNG, JPEG hoặc WebP<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])} /></label>{assetUrl && <img src={assetUrl} alt="Ảnh quà đã tải" style={{ width: 160, maxWidth: '100%' }} />}</>}
            {kind === 'BUNDLE' && <>{[['COLOR', colorId, setColorId, 'Bộ màu trong combo'], ['SHAPE', shapeId, setShapeId, 'Shape trong combo']].map(([type, value, setValue, name]) => <label key={type}>{name}<select required value={value} onChange={(event) => setValue(event.target.value)}><option value="">Chọn vật phẩm của CLB</option>{grants.filter((grant) => grant.kind === type).map((grant) => <option key={grant.cosmeticId} value={grant.cosmeticId}>{grant.label}</option>)}</select></label>)}</>}
        </>}
        {modal.kind === 'publish' && <><p>Giờ Việt Nam (UTC+7). Để trống giờ mở để mở ngay; để trống giờ đóng nếu không giới hạn. Sau khi công bố, giá và vật phẩm được giữ nguyên.</p><label>Mở đổi<input type="datetime-local" value={opens} onChange={(event) => setOpens(event.target.value)} /></label><label>Đóng đổi<input type="datetime-local" value={closes} onChange={(event) => setCloses(event.target.value)} /></label></>}
        {modal.kind === 'retire' && <><p>Ngừng nhận lượt đổi mới. Vật phẩm đã sở hữu và phiếu đổi được giữ lại.</p><label>Lý do ngừng đổi<textarea required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label></>}
        {modal.kind === 'redeem' && <><p>Giá: <strong>{creditNumber(row.price)} credit</strong>. Số dư đang được xác nhận: {creditNumber(wallet.balance)} credit.</p><p>Chỉ trừ ví của CLB này; XP và radar không giảm.</p>{row.grants.some((grant) => owned.has(grant.cosmeticId)) && <p>Bạn đã sở hữu một phần combo. Giá đầy đủ của combo vẫn áp dụng; chỉ cấp thêm vật phẩm còn thiếu.</p>}</>}
        {(localError || error) && <p role="alert">{localError || error}</p>}
        <div className="reward-actions"><button className="v2-button" type="button" onClick={onClose}>Giữ nguyên</button><button className="v2-button v2-button--primary" type="submit">{busy || uploading ? 'Đang xử lý…' : modal.kind === 'redeem' ? 'Xác nhận đổi quà' : 'Lưu thay đổi'}</button></div>
    </fieldset></form></V2Modal>;
}
