import { useState } from 'react';
import { Plus, ArrowRight, Check, Award, Gift, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { useDemo } from '../DemoContext';
import { useWorkspace } from '../club-workspace/Workspace';
import { displayPerson, ownPoints, wallet } from '../model';
import { Avatar, Empty, FormField, Modal, PageHeading, Pill, SearchField, SectionHeading, Stat, fmt } from '../ui';

export function Members() {
    const { state, actorId, act } = useDemo();
    const { clubId, club, term, manager, archived } = useWorkspace();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);
    const pending = state.applications.filter((a) => a.clubId === clubId && a.status === 'pending');
    const members = state.memberships.filter(
        (m) =>
            m.clubId === clubId &&
            m.status === 'approved' &&
            displayPerson(state, m.userId).name.toLowerCase().includes(query.toLowerCase()),
    );
    return (
        <>
            <PageHeading
                eyebrow="NHỮNG NGƯỜI LÀM NÊN CỘNG ĐỒNG"
                title={manager ? 'Thành viên CLB' : 'Cộng đồng của tôi'}
                description={
                    manager
                        ? `Quản lý thành viên và chào đón những gương mặt mới tại ${club.name}.`
                        : 'Gặp ban chủ nhiệm và những người bạn đồng hành. Chỉ hiển thị thông tin được chia sẻ.'
                }
            />
            {manager && (
                <section className="dx-panel">
                    <SectionHeading title={`Đơn tham gia chờ duyệt (${pending.length})`} />
                    {pending.length ? (
                        pending.map((a) => (
                            <div className="dx-application" key={a.id}>
                                <Avatar person={{ name: a.name }} />
                                <div className="dx-grow">
                                    <strong>{a.name}</strong>
                                    <Pill tone="orange">Thành viên mới</Pill>
                                    <p>{a.reason}</p>
                                    <div className="dx-inline">
                                        <button
                                            disabled={archived}
                                            className="dx-button primary small"
                                            onClick={() =>
                                                act('reviewApplication', clubId, term, { id: a.id, status: 'approved' })
                                            }
                                        >
                                            <Check size={15} />
                                            Chấp nhận
                                        </button>
                                        <button
                                            disabled={archived}
                                            className="dx-button small"
                                            onClick={() =>
                                                act('reviewApplication', clubId, term, { id: a.id, status: 'rejected' })
                                            }
                                        >
                                            Từ chối
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="dx-inline dx-muted">
                            <Check size={18} />
                            Bạn đã xử lý hết các đơn tham gia.
                        </div>
                    )}
                </section>
            )}
            <section className="dx-panel">
                <SectionHeading
                    title={`Cộng đồng ${club.name}`}
                    description={`${members.length} thành viên trong danh sách đang xem`}
                >
                    <SearchField value={query} onChange={setQuery} placeholder="Tìm thành viên..." />
                </SectionHeading>
                <table className="dx-table">
                    <thead>
                        <tr>
                            <th>Thành viên</th>
                            <th>Vai trò trong CLB</th>
                            <th>{manager ? 'Điểm đóng góp trong kỳ' : 'Kết nối'}</th>
                            <th>Hồ sơ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {members.map((m) => {
                            const p = displayPerson(state, m.userId);
                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div className="dx-person">
                                            <Avatar person={p} />
                                            <div>
                                                <strong>
                                                    {p.name}
                                                    {p.id === actorId && ' (Bạn)'}
                                                </strong>
                                                <small>{p.major || 'Sinh viên FPTU'}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Pill tone={m.role === 'manager' ? 'orange' : ''}>
                                            {m.role === 'manager' ? 'Chủ nhiệm' : 'Thành viên'}
                                        </Pill>
                                    </td>
                                    <td>
                                        {manager
                                            ? `${ownPoints(state, p.id, clubId, term)} điểm`
                                            : 'Cùng một cộng đồng'}
                                    </td>
                                    <td>
                                        <button className="dx-text-link" onClick={() => setSelected(p.id)}>
                                            Xem hồ sơ <ArrowRight size={15} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!members.length && <Empty title="Không tìm thấy thành viên" />}
            </section>
            {selected && (
                <Modal title="Hồ sơ thành viên trong CLB" onClose={() => setSelected(null)}>
                    <div className="dx-person">
                        <Avatar person={displayPerson(state, selected)} large />
                        <div>
                            <h2>{displayPerson(state, selected).name}</h2>
                            <p>{displayPerson(state, selected).major || 'Sinh viên FPTU'}</p>
                        </div>
                    </div>
                    <p>{displayPerson(state, selected).headline || 'Cùng học hỏi và đóng góp cho cộng đồng.'}</p>
                    <div className="dx-inline">
                        {(displayPerson(state, selected).skills || ['Làm việc nhóm']).map((s) => (
                            <Pill key={s}>{s}</Pill>
                        ))}
                    </div>
                    {manager ? (
                        <>
                            <h3 className="dx-spaced">Đóng góp tại {club.name}</h3>
                            {state.ledger
                                .filter((l) => l.userId === selected && l.clubId === clubId && l.term === term)
                                .map((l) => (
                                    <div className="dx-list-row" key={l.id}>
                                        <Award size={18} />
                                        <div className="dx-grow">
                                            <strong>{l.reason}</strong>
                                            <small>{l.verifier}</small>
                                        </div>
                                        <Pill tone="green">+{l.amount}</Pill>
                                    </div>
                                ))}
                            <p className="dx-small-note">Chỉ hiển thị đóng góp trong CLB và học kỳ đang quản lý.</p>
                        </>
                    ) : (
                        <p className="dx-small-note">
                            Thông tin liên hệ và lịch sử đóng góp riêng tư không hiển thị trong danh bạ cộng đồng.
                        </p>
                    )}
                </Modal>
            )}
        </>
    );
}

export function Quests() {
    const { state, actorId, act } = useDemo();
    const { clubId, term, manager, archived } = useWorkspace();
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const [review, setReview] = useState(null);
    const quests = state.quests.filter((q) => q.clubId === clubId && q.term === term);
    const submissions = state.submissions.filter(
        (s) => s.clubId === clubId && s.term === term && (manager || s.userId === actorId),
    );
    return (
        <>
            <PageHeading
                eyebrow="MỖI ĐÓNG GÓP ĐỀU CÓ Ý NGHĨA"
                title="Nhiệm vụ & đóng góp"
                description="Chọn điều bạn muốn thử. Ghi lại sản phẩm và để cộng đồng ghi nhận."
                actions={
                    manager && (
                        <button className="dx-button primary" disabled={archived} onClick={() => setCreating(true)}>
                            <Plus size={17} />
                            Tạo nhiệm vụ
                        </button>
                    )
                }
            />
            <div className="dx-quest-grid">
                {quests.map((q) => {
                    const mine = state.submissions.find((s) => s.questId === q.id && s.userId === actorId);
                    return (
                        <section className="dx-panel dx-quest" key={q.id}>
                            <div className="dx-between">
                                <span className="dx-task-icon">
                                    <Sparkles size={24} />
                                </span>
                                <Pill tone="orange">+{q.points} điểm</Pill>
                            </div>
                            <h2>{q.title}</h2>
                            <p>{q.description}</p>
                            <div className="dx-card-footer">
                                <Pill>
                                    {mine
                                        ? { pending: 'Chờ xác nhận', approved: 'Đã ghi nhận', revision: 'Cần bổ sung' }[
                                              mine.status
                                          ]
                                        : 'Sẵn sàng thử sức'}
                                </Pill>
                                <button
                                    disabled={archived || (mine && mine.status !== 'revision')}
                                    className="dx-text-link"
                                    onClick={() => setSelected(q)}
                                >
                                    {mine?.status === 'revision' ? 'Bổ sung minh chứng' : 'Gửi đóng góp'}{' '}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </section>
                    );
                })}
            </div>
            {!quests.length && <Empty title="Chưa có nhiệm vụ trong kỳ này" />}
            <section className="dx-panel">
                <SectionHeading
                    title={manager ? 'Đóng góp từ cộng đồng' : 'Đóng góp của tôi'}
                    description="Minh chứng và phản hồi được lưu cùng từng đóng góp."
                />
                {submissions.length ? (
                    submissions.map((s) => (
                        <div className="dx-submission" key={s.id}>
                            <div className="dx-between">
                                <div className="dx-person">
                                    <Avatar person={displayPerson(state, s.userId)} />
                                    <div>
                                        <strong>{displayPerson(state, s.userId).name}</strong>
                                        <small>{quests.find((q) => q.id === s.questId)?.title}</small>
                                    </div>
                                </div>
                                <Pill tone={s.status === 'approved' ? 'green' : 'orange'}>
                                    {
                                        { pending: 'Chờ xác nhận', approved: 'Đã xác nhận', revision: 'Cần bổ sung' }[
                                            s.status
                                        ]
                                    }
                                </Pill>
                            </div>
                            <p>{s.evidence}</p>
                            {s.note && <div className="dx-banner">Phản hồi: {s.note}</div>}
                            {manager && s.status === 'pending' && (
                                <button
                                    disabled={archived || s.userId === actorId}
                                    className="dx-button small"
                                    onClick={() => setReview(s)}
                                >
                                    {s.userId === actorId ? 'Không tự duyệt đóng góp của mình' : 'Xem xét minh chứng'}
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <Empty
                        title="Chưa có đóng góp được gửi"
                        text="Chọn một nhiệm vụ và gửi sản phẩm đầu tiên của bạn."
                    />
                )}
            </section>
            {selected && (
                <Modal title="Gửi minh chứng đóng góp" onClose={() => setSelected(null)}>
                    <h3>{selected.title}</h3>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            if (act('contribute', clubId, term, { id: selected.id, ...d })) setSelected(null);
                        }}
                    >
                        <FormField
                            label="Mô tả sản phẩm / đường dẫn minh chứng"
                            name="evidence"
                            textarea
                            rows={6}
                            required
                            maxLength={2000}
                            placeholder="Bạn đã làm gì? Kết quả ra sao? Ghi đường dẫn hoặc mô tả minh chứng..."
                        />
                        <p className="dx-small-note">
                            Bản demo chỉ lưu nội dung mô tả, không tải tệp hoặc mở đường dẫn ngoài.
                        </p>
                        <div className="dx-form-footer">
                            <button className="dx-button primary">
                                Gửi để xác nhận <ArrowRight size={16} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
            {review && (
                <Modal title="Xác nhận đóng góp" onClose={() => setReview(null)}>
                    <p>{review.evidence}</p>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            if (act('reviewContribution', clubId, term, { id: review.id, ...d })) setReview(null);
                        }}
                    >
                        <label className="dx-field">
                            <span>Kết quả</span>
                            <select name="status">
                                <option value="approved">Xác nhận và ghi nhận điểm</option>
                                <option value="revision">Yêu cầu bổ sung minh chứng</option>
                            </select>
                        </label>
                        <FormField
                            label="Lý do / phản hồi bắt buộc"
                            name="note"
                            textarea
                            rows={4}
                            required
                            maxLength={1000}
                        />
                        <button className="dx-button primary">
                            Lưu kết quả <Check size={16} />
                        </button>
                    </form>
                </Modal>
            )}
            {creating && (
                <Modal title="Tạo nhiệm vụ cho CLB" onClose={() => setCreating(false)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (act('createQuest', clubId, term, Object.fromEntries(new FormData(e.currentTarget))))
                                setCreating(false);
                        }}
                    >
                        <FormField label="Tên nhiệm vụ" name="title" required maxLength={120} />
                        <FormField
                            label="Yêu cầu và minh chứng cần gửi"
                            name="description"
                            textarea
                            rows={4}
                            required
                        />
                        <p className="dx-small-note">
                            Nhiệm vụ trong demo dùng mức cố định 50 điểm. Chưa chốt công thức tính điểm thật.
                        </p>
                        <button className="dx-button primary">Tạo nhiệm vụ</button>
                    </form>
                </Modal>
            )}
        </>
    );
}

export function Points() {
    const { state, actorId } = useDemo();
    const { clubId, club, term, manager } = useWorkspace();
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('mine');
    const rows = state.ledger
        .filter((l) => l.clubId === clubId && l.term === term && ((manager && view === 'club') || l.userId === actorId))
        .slice()
        .reverse();
    return (
        <>
            <PageHeading
                eyebrow="NHÌN LẠI ĐỂ TIẾN XA HƠN"
                title={manager ? 'Điểm & thành tích' : 'Từng đóng góp, từng bước tiến'}
                description="Mỗi điểm ghi nhận đều có một câu chuyện và nguồn minh chứng."
            />
            <div className="dx-stats three">
                <Stat
                    label="Điểm đóng góp của tôi trong kỳ"
                    value={ownPoints(state, actorId, clubId, term)}
                    note={`${club.name} · ${term}`}
                    icon={Award}
                />
                <Stat
                    label="Tích lũy tại CLB"
                    value={ownPoints(state, actorId, clubId)}
                    note="Giữ lại qua các học kỳ"
                    icon={Sparkles}
                />
                <Stat
                    label="Số dư đổi quà tại CLB"
                    value={wallet(state, actorId, clubId)}
                    note="Đổi quà không làm mất điểm thành tích"
                    icon={Gift}
                />
            </div>
            <section className="dx-panel dx-points-note">
                <ShieldCheck size={30} />
                <div>
                    <h3>Điểm rõ ràng. Đóng góp có ý nghĩa.</h3>
                    <p>
                        Điểm ở đây là dữ liệu minh họa, chưa áp dụng công thức XP hay chỉ số 6+1 chính thức. Bạn luôn
                        xem được lý do và người xác nhận từng lần ghi nhận.
                    </p>
                </div>
            </section>
            <section className="dx-panel">
                <SectionHeading title="Sổ ghi nhận đóng góp">
                    {manager && (
                        <div className="dx-tabs">
                            <button className={view === 'mine' ? 'active' : ''} onClick={() => setView('mine')}>
                                Của tôi
                            </button>
                            <button className={view === 'club' ? 'active' : ''} onClick={() => setView('club')}>
                                Trong CLB
                            </button>
                        </div>
                    )}
                </SectionHeading>
                <table className="dx-table">
                    <thead>
                        <tr>
                            <th>Đóng góp</th>
                            {view === 'club' && <th>Thành viên</th>}
                            <th>Ngày ghi nhận</th>
                            <th>Điểm</th>
                            <th>Minh chứng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((l) => (
                            <tr key={l.id}>
                                <td>
                                    <strong>{l.reason}</strong>
                                    <small>{l.verifier}</small>
                                </td>
                                {view === 'club' && <td>{displayPerson(state, l.userId).name}</td>}
                                <td>{l.date}</td>
                                <td>
                                    <strong className="dx-green">+{l.amount}</strong>
                                </td>
                                <td>
                                    <button className="dx-text-link" onClick={() => setSelected(l)}>
                                        Xem chi tiết <ArrowRight size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!rows.length && <Empty title="Chưa có điểm ghi nhận trong kỳ" />}
            </section>
            {selected && (
                <Modal title="Chi tiết ghi nhận" onClose={() => setSelected(null)}>
                    <Pill tone="green">Đã xác nhận · +{selected.amount} điểm</Pill>
                    <h2 className="dx-spaced">{selected.reason}</h2>
                    <p>Nguồn: {selected.source}</p>
                    <p>Người xác nhận: {selected.verifier}</p>
                    {selected.note && <p>Phản hồi: {selected.note}</p>}
                    <p className="dx-small-note">
                        Bản ghi mock thuộc {club.name} · {selected.term}.
                    </p>
                </Modal>
            )}
        </>
    );
}

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
export function Gifts() {
    const { state, actorId, act } = useDemo();
    const { clubId, term, manager, archived } = useWorkspace();
    const [selected, setSelected] = useState(null);
    const balance = wallet(state, actorId, clubId);
    const requests = state.redemptions.filter((r) => r.clubId === clubId && (manager || r.userId === actorId));
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
                    .filter((g) => g.clubId === clubId)
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
                    <p>Nhận quà tại buổi sinh hoạt CLB. Đây là giao dịch mock, không có quà thật hoặc thanh toán.</p>
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

export function Reports() {
    const { state, act } = useDemo();
    const { clubId, term, archived } = useWorkspace();
    const [editing, setEditing] = useState(null);
    const rows = state.reports.filter((r) => r.clubId === clubId && r.term === term);
    return (
        <>
            <PageHeading
                eyebrow="GHI LẠI NHỮNG ĐIỀU ĐÃ LÀM"
                title="Báo cáo CLB"
                description="Bản nháp, kế hoạch và kết quả hoạt động trong học kỳ đang chọn."
                actions={
                    <button
                        disabled={archived}
                        className="dx-button primary"
                        onClick={() => setEditing({ title: '', content: '' })}
                    >
                        <Plus size={17} />
                        Soạn báo cáo
                    </button>
                }
            />
            <section className="dx-panel">
                {rows.length ? (
                    rows.map((r) => (
                        <div className="dx-list-row" key={r.id}>
                            <span className="dx-task-icon">
                                <FileText size={21} />
                            </span>
                            <div className="dx-grow">
                                <strong>{r.title}</strong>
                                <small>{term} · Báo cáo nội bộ</small>
                            </div>
                            <Pill tone={r.status === 'submitted' ? 'green' : 'orange'}>
                                {r.status === 'submitted' ? 'Đã nộp mock' : 'Bản nháp'}
                            </Pill>
                            <button className="dx-text-link" onClick={() => setEditing(r)}>
                                {r.status === 'submitted' || archived ? 'Xem báo cáo' : 'Tiếp tục soạn'}{' '}
                                <ArrowRight size={15} />
                            </button>
                        </div>
                    ))
                ) : (
                    <Empty title="Chưa có báo cáo trong học kỳ" />
                )}
            </section>
            {editing && (
                <Modal
                    title={editing.status === 'submitted' ? 'Báo cáo đã nộp' : 'Soạn báo cáo'}
                    onClose={() => setEditing(null)}
                    wide
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            if (
                                act('report', clubId, term, {
                                    ...d,
                                    id: editing.id,
                                    submit: e.nativeEvent.submitter?.value === 'submit',
                                })
                            )
                                setEditing(null);
                        }}
                    >
                        <FormField
                            label="Tiêu đề"
                            name="title"
                            defaultValue={editing.title}
                            required
                            maxLength={160}
                            disabled={archived || editing.status === 'submitted'}
                        />
                        <FormField
                            label="Nội dung báo cáo"
                            name="content"
                            defaultValue={editing.content}
                            required
                            textarea
                            rows={10}
                            disabled={archived || editing.status === 'submitted'}
                        />
                        <p className="dx-small-note">
                            Bản demo chỉ lưu văn bản. Nộp báo cáo không gửi dữ liệu đến server.
                        </p>
                        {!archived && editing.status !== 'submitted' && (
                            <div className="dx-form-footer">
                                <button className="dx-button" value="draft">
                                    Lưu bản nháp
                                </button>
                                <button className="dx-button primary" value="submit">
                                    Nộp báo cáo <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </form>
                </Modal>
            )}
        </>
    );
}

export function Finance() {
    const { state } = useDemo();
    const { clubId, term } = useWorkspace();
    const rows = state.transactions.filter((t) => t.clubId === clubId && t.term === term);
    const income = rows.filter((r) => r.amount > 0).reduce((s, r) => s + r.amount, 0),
        expense = -rows.filter((r) => r.amount < 0).reduce((s, r) => s + r.amount, 0);
    return (
        <>
            <PageHeading
                eyebrow="TÍNH NĂNG TÙY CHỌN CỦA CLB"
                title="Tổng quan tài chính"
                description="Màn hình minh họa thu chi. Không thực hiện thanh toán hoặc nghiệp vụ thủ quỹ."
            />
            <div className="dx-stats three">
                <Stat label="Tổng thu trong kỳ" value={`${fmt(income)} ₫`} note="Nguồn quỹ demo" />
                <Stat label="Tổng chi trong kỳ" value={`${fmt(expense)} ₫`} note="Khoản chi đã ghi nhận" />
                <Stat
                    label="Chênh lệch thu chi"
                    value={`${fmt(income - expense)} ₫`}
                    note="Không phải số dư ngân hàng"
                />
            </div>
            <section className="dx-panel">
                <SectionHeading title="Các khoản thu chi" />
                <table className="dx-table">
                    <thead>
                        <tr>
                            <th>Nội dung</th>
                            <th>Ngày</th>
                            <th>Loại</th>
                            <th>Số tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    <strong>{r.title}</strong>
                                </td>
                                <td>{r.date}</td>
                                <td>
                                    <Pill tone={r.amount > 0 ? 'green' : 'orange'}>{r.amount > 0 ? 'Thu' : 'Chi'}</Pill>
                                </td>
                                <td>
                                    {r.amount > 0 ? '+' : '−'}
                                    {fmt(Math.abs(r.amount))} ₫
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!rows.length && <Empty title="Chưa có khoản thu chi trong kỳ" />}
            </section>
        </>
    );
}

export function ClubSettings() {
    const { state, act } = useDemo();
    const { clubId, club, term, archived } = useWorkspace();
    return (
        <>
            <PageHeading
                eyebrow="CÁ TÍNH RIÊNG CỦA CỘNG ĐỒNG"
                title="Cài đặt CLB"
                description="Nội dung này sẽ hiển thị trên trang giới thiệu công khai của CLB."
            />
            <section className="dx-panel dx-form-panel">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        const d = Object.fromEntries(new FormData(e.currentTarget));
                        act('settings', clubId, term, {
                            description: d.description,
                            recruiting: d.recruiting === 'on',
                        });
                    }}
                >
                    <FormField label="Tên CLB" value={club.fullName} readOnly />
                    <FormField
                        label="Giới thiệu ngắn"
                        name="description"
                        defaultValue={state.settings[clubId]?.description ?? club.description}
                        textarea
                        rows={5}
                        required
                        maxLength={1000}
                        disabled={archived}
                    />
                    <label className="dx-checkbox">
                        <input
                            name="recruiting"
                            type="checkbox"
                            defaultChecked={state.settings[clubId]?.recruiting ?? club.recruiting}
                            disabled={archived}
                        />
                        Đang mở tuyển thành viên
                    </label>
                    <div className="dx-banner">
                        <ShieldCheck size={18} />
                        Quyền quản lý, học kỳ và tính năng tài chính không được thay đổi từ màn này.
                    </div>
                    <button disabled={archived} className="dx-button primary">
                        Lưu thay đổi <Check size={16} />
                    </button>
                </form>
            </section>
        </>
    );
}
