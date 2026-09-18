import React, { useState } from 'react';
import { ArrowRight, Check, Gift } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { displayPerson, wallet } from '../../core/model';
import { Empty } from '../../components/ui/Empty';
import { Modal } from '../../components/ui/Modal';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { fmt } from '../../components/ui/formatters';

function GiftArt({ kind }) {
    return (
        <div className={`dx-gift-art ${kind}`} aria-hidden="true">
            {kind === 'tote' ? (
                <div className="dx-tote">
                    <span />{' '}
                    <strong>
                        GOOD
                        <br />
                        THINGS
                        <br />
                        <em>together.</em>
                    </strong>
                </div>
            ) : kind === 'bottle' ? (
                <div className="dx-bottle">
                    <span />
                    <strong>
                        REFILL.
                        <br />
                        REPEAT.
                    </strong>
                </div>
            ) : (
                <div className="dx-stickers">
                    <span>hello.</span>
                    <strong>
                        MAKE
                        <br />
                        IT HAPPEN
                    </strong>
                </div>
            )}
        </div>
    );
}

export function GiftsPage() {
    const { state, actorId, act } = useClubHub();
    const { clubId, term, manager, archived } = useWorkspace();
    const [selected, setSelected] = useState(null);

    const balance = wallet(state, actorId, clubId);
    const requests = state.redemptions.filter(
        (r) =>
            (r.clubId === clubId || String(r.clubId) === String(clubId)) &&
            (manager || r.userId === actorId || String(r.userId) === String(actorId)),
    );

    return (
        <>
            <PageHeading
                eyebrow="MỘT LỜI CẢM ƠN TỪ CỘNG ĐỒNG"
                title={manager ? 'Kho quà của CLB' : 'Những món quà nhỏ, niềm vui lớn'}
                description="Đổi phần thưởng bằng số dư tại CLB này. Thành tích đóng góp của bạn vẫn được giữ nguyên."
                actions={
                    <div className="dx-wallet">
                        <Gift size={20} />
                        <span>
                            Số dư của bạn<strong>{fmt(balance)} điểm</strong>
                        </span>
                    </div>
                }
            />
            <div className="dx-gift-grid">
                {state.gifts
                    .filter((g) => g.clubId === clubId || String(g.clubId) === String(clubId))
                    .map((g) => (
                        <article className="dx-gift-card" key={g.id}>
                            <GiftArt kind={g.kind} />
                            <div className="dx-gift-copy">
                                <div className="dx-between">
                                    <Pill tone={g.stock ? 'green' : ''}>
                                        {g.stock ? `Còn ${g.stock} phần` : 'Tạm hết quà'}
                                    </Pill>
                                    <strong>{g.cost} điểm</strong>
                                </div>
                                <h2>{g.name}</h2>
                                <p>{g.subtitle}</p>
                                <button
                                    disabled={archived || g.stock < 1 || balance < g.cost}
                                    className="dx-button full"
                                    onClick={() => setSelected(g)}
                                >
                                    {g.stock < 1
                                        ? 'Chờ đợt quà tiếp theo'
                                        : balance < g.cost
                                          ? 'Chưa đủ điểm đổi quà'
                                          : 'Đổi món quà này'}{' '}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </article>
                    ))}
            </div>
            <section className="dx-panel">
                <SectionHeading title={manager ? 'Yêu cầu đổi quà trong CLB' : 'Lịch sử đổi quà của tôi'} />
                {requests.length ? (
                    requests.map((r) => (
                        <div className="dx-list-row" key={r.id}>
                            <Gift size={20} />
                            <div className="dx-grow">
                                <strong>{r.name}</strong>
                                <small>
                                    {manager ? `${displayPerson(state, r.userId).name} · ` : ''}
                                    {r.cost} điểm
                                </small>
                            </div>
                            <Pill tone={r.status === 'received' ? 'green' : 'orange'}>
                                {r.status === 'received' ? 'Đã nhận quà' : 'Chờ nhận tại CLB'}
                            </Pill>
                            {manager && r.status === 'pending' && (
                                <button
                                    disabled={archived}
                                    className="dx-button small"
                                    onClick={() => act('fulfillGift', clubId, term, { id: r.id })}
                                >
                                    Xác nhận đã trao
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <Empty
                        title="Chưa có yêu cầu đổi quà"
                        text="Món quà đầu tiên sẽ xuất hiện ở đây sau khi đổi thành công."
                    />
                )}
            </section>
            {selected && (
                <Modal title="Xác nhận đổi quà" onClose={() => setSelected(null)}>
                    <h2>{selected.name}</h2>
                    <p>
                        Bạn sẽ dùng <strong>{selected.cost} điểm</strong> tại CLB này. Số dư còn lại:{' '}
                        <strong>{balance - selected.cost} điểm</strong>.
                    </p>
                    <p>Nhận quà tại buổi sinh hoạt CLB. Ghi nhận giao dịch quà thưởng phong trào.</p>
                    <div className="dx-form-footer">
                        <button className="dx-button" onClick={() => setSelected(null)}>
                            Để sau
                        </button>
                        <button
                            className="dx-button primary"
                            onClick={() => {
                                if (act('redeem', clubId, term, { id: selected.id })) setSelected(null);
                            }}
                        >
                            Xác nhận đổi <Check size={16} />
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}

export default GiftsPage;
