import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import GiftCatalogView from './GiftCatalogView';
import ServerGiftEditor from './ServerGiftEditor';
import {
    cosmeticInventory,
    creditGuid,
    creditNumber,
    creditWallet,
    rewardCatalog,
    rewardMutation,
    rewardReceipt,
    rewardWindow,
} from '../../../../services/club-credit';
import './ServerClubRewards.scss';
import '../../../../components/v2/activity-detail/ActivitySessions.scss';
import { acceptServerCosmetics } from '../../../../services/server-cosmetics-cache';

const emptyPalette = { background: '#E8F5EF', secondary: '#B7E4C7', accent: '#087F5B', ink: '#123B2A' };
export default function ServerClubRewards({ workspace, manager: managerInput = false, readOnly = false }) {
    const { api, user } = useAuth();
    const clubId = workspace?.clubId;
    const manager = managerInput && !readOnly;
    const [page, setPage] = useState(1),
        [revision, setRevision] = useState(0),
        [result, setResult] = useState({});
    const [dialog, setDialog] = useState(null),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [notice, setNotice] = useState('');
    const lock = useRef(false),
        keys = useRef(new Map());
    const identity = `${user?.id}:${clubId}:${manager}:${readOnly}:${page}`;
    const modal = dialog?.context === identity ? dialog.value : null;
    const setModal = (value) => setDialog(value ? { context: identity, value } : null);
    const current = useRef(identity);
    current.current = identity;
    const state = result.identity === identity ? result : {};
    const canManage = manager && state.catalog?.capabilities.canManage;
    useEffect(() => {
        setModal(null);
        setError('');
        setNotice('');
        keys.current.clear();
        lock.current = false;
        setBusy(false);
    }, [api, identity]);
    useEffect(() => {
        let active = true;
        setResult((previous) => (previous.identity === identity ? { ...previous, refreshing: true } : {}));
        if (!clubId) return;
        const catalog = api
            .request(
                `/api/clubs/${encodeURIComponent(clubId)}/rewards?page=${page}&pageSize=20${manager ? '&manage=true' : ''}`,
            )
            .then((value) => rewardCatalog(value, clubId));
        const personal =
            !readOnly && user?.id
                ? Promise.all([
                      api
                          .request(`/api/clubs/${encodeURIComponent(clubId)}/wallet/me`)
                          .then((value) => creditWallet(value, user.id, clubId)),
                      cosmeticInventory(api, user.id),
                  ])
                      .then(([wallet, inventory]) => ({ wallet, inventory }))
                      .catch((issue) => ({ personalError: issue.message }))
                : Promise.resolve({});
        Promise.all([catalog, personal])
            .then(([catalog, personal]) => {
                if (active && current.current === identity) {
                    if (personal.inventory) acceptServerCosmetics(user.id, personal.inventory);
                    setResult({ identity, catalog, ...personal });
                }
            })
            .catch((issue) => {
                if (active && current.current === identity) setResult({ identity, error: issue.message });
            });
        return () => {
            active = false;
        };
    }, [api, identity, revision]);
    const run = async (kind, row, payload) => {
        if (lock.current || readOnly || !user?.id || (kind !== 'redeem' && !canManage)) return;
        const context = identity;
        let body = payload;
        if (kind === 'redeem') {
            if (!state.wallet) return;
            body = { expectedRewardVersion: row.version, expectedWalletVersion: state.wallet.version };
        }
        const suffix = kind === 'create' ? '' : `/${row.id}${kind === 'edit' ? '' : '/' + kind}`;
        const fingerprint = JSON.stringify({ kind, suffix, body });
        if (!keys.current.has(fingerprint)) keys.current.set(fingerprint, crypto.randomUUID());
        lock.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            const value = await rewardMutation(
                api,
                clubId,
                suffix,
                body,
                keys.current.get(fingerprint),
                kind === 'edit' ? 'PATCH' : 'POST',
            );
            if (kind === 'redeem') rewardReceipt(value, user.id, clubId, row);
            else if (String(value?.clubId) !== String(clubId) || !creditGuid(value.id) || !creditGuid(value.version))
                throw new Error('Máy chủ chưa xác nhận đúng phần quà. Tải lại để đối chiếu.');
            if (current.current !== context) return;
            keys.current.delete(fingerprint);
            setModal(null);
            setRevision((value) => value + 1);
            setNotice(
                kind === 'redeem'
                    ? 'Đã lưu phiếu đổi quà. Ví và kho vật phẩm được tải lại từ máy chủ.'
                    : 'Đã lưu thay đổi phần quà.',
            );
        } catch (issue) {
            if (current.current === context)
                setError(
                    issue.status === 409
                        ? 'Quà, số dư hoặc điều kiện đã thay đổi. Đóng cửa sổ và tải lại trước khi thử tiếp.'
                        : issue.message,
                );
        } finally {
            if (current.current === context) {
                lock.current = false;
                setBusy(false);
            }
        }
    };
    const owned = new Set(state.inventory?.map((item) => item.cosmetic.cosmeticId) || []);
    return (
        <WorkspaceTabLayout
            title="Kho quà"
            description="Khám phá quà tặng và những thiết kế mang dấu ấn của CLB."
            action={
                canManage ? (
                    <button
                        className="v2-button v2-button--primary"
                        onClick={() => {
                            setError('');
                            setModal({ kind: 'create' });
                        }}
                    >
                        Tạo quà
                    </button>
                ) : null
            }
        >
            {() => (
                <div className="v2-cover-gifts">
                    {notice && <p role="status">{notice}</p>}
                    {state.error ? (
                        <p role="alert">{state.error}</p>
                    ) : !state.catalog ? (
                        <p role="status">Đang tải kho quà…</p>
                    ) : (
                        <>
                            {state.personalError && (
                                <p role="alert">
                                    Không tải được ví/kho vật phẩm: {state.personalError}. Tạm khóa đổi quà.
                                </p>
                            )}
                            <GiftCatalogView
                                catalog={state.catalog}
                                wallet={state.wallet}
                                inventory={state.inventory}
                                user={user}
                                manager={canManage}
                                readOnly={readOnly}
                                busy={busy || !!state.refreshing}
                                identity={identity}
                                onAction={(kind, reward, initialKind) => {
                                    setError('');
                                    setModal({ kind, reward, initialKind });
                                }}
                            />
                            {state.catalog.totalPages > 1 && (
                                <nav aria-label="Trang kho quà">
                                    <button
                                        className="v2-button"
                                        disabled={page <= 1 || busy}
                                        onClick={() => setPage((value) => value - 1)}
                                    >
                                        Trước
                                    </button>
                                    <span>
                                        Trang {page}/{state.catalog.totalPages}
                                    </span>
                                    <button
                                        className="v2-button"
                                        disabled={page >= state.catalog.totalPages || busy}
                                        onClick={() => setPage((value) => value + 1)}
                                    >
                                        Sau
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                    {error && !modal && <p role="alert">{error}</p>}
                    <button className="v2-button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>
                        Tải lại kho quà
                    </button>
                    {modal && (
                        <RewardModal
                            key={`${identity}:${modal.kind}:${modal.reward?.id || 'new'}`}
                            modal={modal}
                            busy={busy}
                            error={error}
                            owned={owned}
                            wallet={state.wallet}
                            catalog={state.catalog?.items || []}
                            api={api}
                            clubId={clubId}
                            onClose={() => !busy && setModal(null)}
                            onSave={(body) => run(modal.kind, modal.reward, body)}
                        />
                    )}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}

function RewardModal({ modal, busy, error, wallet, owned, catalog, api, clubId, onSave, onClose }) {
    const formId = useId(),
        editor = ['create', 'edit'].includes(modal.kind);
    const row = modal.reward;
    const [label, setLabel] = useState(row?.label || ''),
        [description, setDescription] = useState(row?.description || ''),
        [kind, setKind] = useState(row?.kind || modal.initialKind || 'COLOR');
    const [price, setPrice] = useState(row?.price ?? 0),
        [palette, setPalette] = useState(
            row?.grants.find((grant) => grant.kind === 'COLOR')?.definition || emptyPalette,
        );
    const [assetUrl, setAssetUrl] = useState(
        row?.grants.find((grant) => ['SHAPE', 'FRAME'].includes(grant.kind))?.definition.assetUrl || '',
    );
    const [colorId, setColorId] = useState(row?.grants.find((grant) => grant.kind === 'COLOR')?.cosmeticId || ''),
        [shapeId, setShapeId] = useState(row?.grants.find((grant) => grant.kind === 'SHAPE')?.cosmeticId || '');
    const [opens, setOpens] = useState(''),
        [closes, setCloses] = useState(''),
        [reason, setReason] = useState(''),
        [localError, setLocalError] = useState(''),
        [uploading, setUploading] = useState(false);
    const mounted = useRef(true);
    useEffect(
        () => () => {
            mounted.current = false;
        },
        [],
    );
    const upload = async (file) => {
        if (!file || uploading) return;
        setUploading(true);
        setLocalError('');
        try {
            const url = await api.uploadPublicImage(file, 'club-reward', clubId);
            if (mounted.current) setAssetUrl(url);
        } catch (issue) {
            if (mounted.current) setLocalError(issue.message);
        } finally {
            if (mounted.current) setUploading(false);
        }
    };
    const submit = (event) => {
        event.preventDefault();
        if (busy || uploading) return;
        setLocalError('');
        try {
            if (modal.kind === 'redeem') {
                onSave();
                return;
            }
            if (modal.kind === 'publish') {
                onSave({ expectedVersion: row.version, ...rewardWindow(opens, closes) });
                return;
            }
            if (modal.kind === 'retire') {
                onSave({ expectedVersion: row.version, reason });
                return;
            }
            if (['SHAPE', 'FRAME'].includes(kind) && !assetUrl)
                throw new Error('Chọn và tải ảnh của phần quà trước khi lưu.');
            onSave({
                label,
                description,
                kind,
                price: Number(price),
                ...(row && { expectedVersion: row.version }),
                ...(kind === 'COLOR'
                    ? { palette }
                    : kind === 'BUNDLE'
                      ? { grantIds: [colorId, shapeId] }
                      : { assetUrl }),
            });
        } catch (issue) {
            setLocalError(issue.message);
        }
    };
    const grants = [
        ...new Map(catalog.flatMap((reward) => reward.grants).map((grant) => [grant.cosmeticId, grant])).values(),
    ];
    const title = {
        create: 'Tạo quà CLB',
        edit: 'Sửa bản nháp quà',
        publish: 'Mở hoặc lên lịch đổi quà',
        retire: 'Ngừng đổi quà',
        redeem: 'Xác nhận đổi quà',
    }[modal.kind];
    return (
        <V2Modal
            title={title}
            onClose={onClose}
            wide={editor}
            className={editor ? 'v2-create-gift-modal' : ''}
            footer={
                editor ? (
                    <>
                        <button className="v2-button" type="button" onClick={onClose} disabled={busy || uploading}>
                            Hủy
                        </button>
                        <button
                            className="v2-button v2-button--primary"
                            type="submit"
                            form={formId}
                            disabled={busy || uploading}
                        >
                            {busy || uploading ? 'Đang xử lý…' : 'Lưu thay đổi'}
                        </button>
                    </>
                ) : undefined
            }
        >
            <form id={formId} className={editor ? 'v2-create-gift-form' : 'v2-session-form'} onSubmit={submit}>
                <fieldset disabled={busy || uploading}>
                    {row && <h3>{row.label}</h3>}
                    {['create', 'edit'].includes(modal.kind) && (
                        <ServerGiftEditor
                            editing={!!row}
                            label={label}
                            setLabel={setLabel}
                            description={description}
                            setDescription={setDescription}
                            kind={kind}
                            setKind={setKind}
                            price={price}
                            setPrice={setPrice}
                            palette={palette}
                            setPalette={setPalette}
                            assetUrl={assetUrl}
                            upload={upload}
                            grants={grants}
                            colorId={colorId}
                            setColorId={setColorId}
                            shapeId={shapeId}
                            setShapeId={setShapeId}
                        />
                    )}
                    {modal.kind === 'publish' && (
                        <>
                            <p>
                                Giờ Việt Nam (UTC+7). Để trống giờ mở để mở ngay; để trống giờ đóng nếu không giới hạn.
                                Sau khi công bố, giá và vật phẩm được giữ nguyên.
                            </p>
                            <label>
                                Mở đổi
                                <input
                                    type="datetime-local"
                                    value={opens}
                                    onChange={(event) => setOpens(event.target.value)}
                                />
                            </label>
                            <label>
                                Đóng đổi
                                <input
                                    type="datetime-local"
                                    value={closes}
                                    onChange={(event) => setCloses(event.target.value)}
                                />
                            </label>
                        </>
                    )}
                    {modal.kind === 'retire' && (
                        <>
                            <p>Ngừng nhận lượt đổi mới. Vật phẩm đã sở hữu và phiếu đổi được giữ lại.</p>
                            <label>
                                Lý do ngừng đổi
                                <textarea
                                    required
                                    maxLength={1000}
                                    value={reason}
                                    onChange={(event) => setReason(event.target.value)}
                                />
                            </label>
                        </>
                    )}
                    {modal.kind === 'redeem' && (
                        <>
                            <p>
                                Giá: <strong>{creditNumber(row.price)} credit</strong>. Số dư đang được xác nhận:{' '}
                                {creditNumber(wallet.balance)} credit.
                            </p>
                            <p>Chỉ trừ ví của CLB này; XP và radar không giảm.</p>
                            {row.grants.some((grant) => owned.has(grant.cosmeticId)) && (
                                <p>
                                    Bạn đã sở hữu một phần combo. Giá đầy đủ của combo vẫn áp dụng; chỉ cấp thêm vật
                                    phẩm còn thiếu.
                                </p>
                            )}
                        </>
                    )}
                    {(localError || error) && <p role="alert">{localError || error}</p>}
                    {!editor && (
                        <div className="reward-actions">
                            <button className="v2-button" type="button" onClick={onClose}>
                                Giữ nguyên
                            </button>
                            <button className="v2-button v2-button--primary" type="submit">
                                {busy || uploading
                                    ? 'Đang xử lý…'
                                    : modal.kind === 'redeem'
                                      ? 'Xác nhận đổi quà'
                                      : 'Lưu thay đổi'}
                            </button>
                        </div>
                    )}
                </fieldset>
            </form>
        </V2Modal>
    );
}
