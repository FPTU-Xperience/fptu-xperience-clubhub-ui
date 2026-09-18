import { useState } from 'react';
import { CalendarDays, Plus, Check, MapPin, Users, ArrowRight, ScanLine } from 'lucide-react';
import { useDemo } from '../DemoContext';
import { useWorkspace } from '../club-workspace/Workspace';
import { displayPerson } from '../model';
import { Avatar, Empty, EventCard, FormField, Modal, PageHeading, Pill, SearchField, dateLabel } from '../ui';

export function Activities() {
    const { state, actorId, act } = useDemo();
    const { club, clubId, term, manager, archived } = useWorkspace();
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const events = state.activities.filter(
        (e) =>
            e.clubId === clubId &&
            e.term === term &&
            e.title.toLowerCase().includes(query.toLowerCase()) &&
            (filter === 'all' || (filter === 'mine' ? e.registered.includes(actorId) : e.status === filter)),
    );
    const active = state.activities.find((e) => e.id === selected && e.clubId === clubId && e.term === term);
    return (
        <>
            <PageHeading
                eyebrow="GẶP GỠ · HỌC HỎI · ĐÓNG GÓP"
                title="Hoạt động trong CLB"
                description={`Những trải nghiệm được tạo nên bởi cộng đồng ${club.name}.`}
                actions={
                    manager && (
                        <button disabled={archived} className="dx-button primary" onClick={() => setCreating(true)}>
                            <Plus size={17} />
                            Tạo hoạt động
                        </button>
                    )
                }
            />
            <div className="dx-filter-bar">
                <div className="dx-tabs">
                    {[
                        ['all', 'Tất cả'],
                        ['upcoming', 'Sắp diễn ra'],
                        ['live', 'Đang diễn ra'],
                        ['completed', 'Đã hoàn thành'],
                        ['mine', 'Đã đăng ký'],
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            aria-pressed={filter === key}
                            className={filter === key ? 'active' : ''}
                            onClick={() => setFilter(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <SearchField value={query} onChange={setQuery} placeholder="Tìm hoạt động..." />
            </div>
            <div className="dx-panel">
                {events.length ? (
                    events.map((e) => (
                        <EventCard
                            key={e.id}
                            event={e}
                            club={club}
                            registered={e.registered.includes(actorId)}
                            onOpen={(e) => setSelected(e.id)}
                        />
                    ))
                ) : (
                    <Empty title="Chưa có hoạt động phù hợp" text="Thử thay đổi bộ lọc hoặc tìm kiếm." />
                )}
            </div>
            <p className="dx-small-note">
                Đồng hồ bản demo cố định ở 10:00 ngày 16/09/2026 để bạn luôn thử được các trạng thái.
            </p>
            {active && (
                <Modal title={active.title} onClose={() => setSelected(null)} wide>
                    <Pill tone={active.status === 'live' ? 'green' : 'orange'}>
                        {{ upcoming: 'Sắp diễn ra', live: 'Đang diễn ra', completed: 'Đã hoàn thành' }[active.status]}
                    </Pill>
                    <p className="dx-body-large">{active.description}</p>
                    <div className="dx-event-facts">
                        <span>
                            <CalendarDays size={18} />
                            {dateLabel(active.date)} ·{' '}
                            {new Date(active.date).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Ho_Chi_Minh',
                            })}
                        </span>
                        <span>
                            <MapPin size={18} />
                            {active.location}
                        </span>
                        <span>
                            <Users size={18} />
                            {active.registered.length}/{active.capacity} đăng ký
                        </span>
                        <span>
                            <Check size={18} />
                            {active.points} điểm tham gia (demo)
                        </span>
                    </div>
                    <div className="dx-panel soft">
                        <h3>Bạn cần chuẩn bị gì?</h3>
                        <p>
                            Đến trước 10 phút, mang thẻ sinh viên và tinh thần sẵn sàng trải nghiệm. Liên hệ ban chủ
                            nhiệm nếu lịch tham gia thay đổi.
                        </p>
                    </div>
                    {manager && (
                        <>
                            <h3>Danh sách đăng ký ({active.registered.length})</h3>
                            <div className="dx-attendee-list">
                                {active.registered.map((id) => (
                                    <div className="dx-person" key={id}>
                                        <Avatar person={displayPerson(state, id)} />
                                        <div>
                                            <strong>{displayPerson(state, id).name}</strong>
                                            <small>
                                                {active.checkedIn.includes(id) ? 'Đã điểm danh' : 'Đã đăng ký'}
                                            </small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="dx-form-footer">
                        <button className="dx-button" onClick={() => setSelected(null)}>
                            Đóng
                        </button>
                        {active.status === 'upcoming' ? (
                            <button
                                disabled={
                                    archived ||
                                    (!active.registered.includes(actorId) &&
                                        active.registered.length >= active.capacity)
                                }
                                className={`dx-button ${active.registered.includes(actorId) ? '' : 'primary'}`}
                                onClick={() => act('register', clubId, term, { id: active.id })}
                            >
                                {active.registered.includes(actorId) ? 'Hủy đăng ký' : 'Đăng ký tham gia'}
                            </button>
                        ) : (
                            <Pill>
                                {active.checkedIn.includes(actorId) ? 'Bạn đã điểm danh' : 'Đã kết thúc đăng ký'}
                            </Pill>
                        )}
                    </div>
                </Modal>
            )}
            {creating && (
                <Modal title="Tạo hoạt động nội bộ" onClose={() => setCreating(false)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            if (act('createActivity', clubId, term, data)) setCreating(false);
                        }}
                    >
                        <div className="dx-banner">
                            Hoạt động sẽ thuộc {club.name} · {term}. Không chọn CLB khác tại đây.
                        </div>
                        <FormField
                            label="Tên hoạt động"
                            name="title"
                            required
                            maxLength={120}
                            placeholder="Ví dụ: Workshop thiết kế sản phẩm"
                        />
                        <div className="dx-form-grid">
                            <FormField
                                label="Thời gian bắt đầu (giờ Việt Nam)"
                                type="datetime-local"
                                name="date"
                                required
                                defaultValue="2026-09-22T18:00"
                            />
                            <FormField label="Địa điểm" name="location" required defaultValue={club.place} />
                        </div>
                        <FormField label="Mô tả" textarea name="description" rows={4} />
                        <div className="dx-form-footer">
                            <button type="button" className="dx-button" onClick={() => setCreating(false)}>
                                Hủy
                            </button>
                            <button className="dx-button primary">
                                Tạo hoạt động <ArrowRight size={16} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </>
    );
}

export function Attendance() {
    const { state, actorId, act } = useDemo();
    const { clubId, club, term, manager, archived } = useWorkspace();
    const events = state.activities.filter((e) => e.clubId === clubId && e.term === term && e.status !== 'upcoming');
    const [eventId, setEventId] = useState(events.find((e) => e.status === 'live')?.id || events[0]?.id || '');
    const [code, setCode] = useState('');
    const event = events.find((e) => e.id === eventId);
    return (
        <>
            <PageHeading
                eyebrow="CÓ MẶT ĐỂ CÙNG TRẢI NGHIỆM"
                title={manager ? 'Quản lý điểm danh' : 'Check-in hoạt động'}
                description="Phiên điểm danh minh họa. Không sử dụng vị trí, camera hay mã xác thực thật."
            />
            {!events.length ? (
                <Empty title="Chưa có phiên điểm danh trong kỳ" />
            ) : (
                <>
                    <label className="dx-field">
                        <span>Chọn hoạt động của {club.name}</span>
                        <select
                            value={eventId}
                            onChange={(e) => {
                                setEventId(e.target.value);
                                setCode('');
                            }}
                        >
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.title}
                                </option>
                            ))}
                        </select>
                    </label>
                    {event && (
                        <div className="dx-attendance-columns">
                            <section className="dx-panel">
                                <div className="dx-between">
                                    <Pill tone={event.sessionOpen && event.status === 'live' ? 'green' : ''}>
                                        {event.sessionOpen && event.status === 'live'
                                            ? 'Phiên đang mở'
                                            : 'Phiên đã đóng'}
                                    </Pill>
                                    <span className="dx-muted">{dateLabel(event.date)}</span>
                                </div>
                                <h2>{event.title}</h2>
                                <p className="dx-meta">
                                    <MapPin size={16} />
                                    {event.location}
                                </p>
                                <div className="dx-checkin-code">
                                    <ScanLine size={48} />
                                    <small>MÃ CHECK-IN MÔ PHỎNG</small>
                                    <strong>FPT26</strong>
                                    <span>Mã cố định chỉ dùng để test UI</span>
                                </div>
                                {manager ? (
                                    <button
                                        disabled={archived || event.status !== 'live'}
                                        className="dx-button primary full"
                                        onClick={() => act('session', clubId, term, { id: event.id })}
                                    >
                                        {event.sessionOpen ? 'Đóng phiên điểm danh' : 'Mở phiên điểm danh'}
                                    </button>
                                ) : event.checkedIn.includes(actorId) ? (
                                    <div className="dx-success">
                                        <Check size={20} />
                                        Bạn đã check-in thành công!
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            act('checkin', clubId, term, { id: event.id, code });
                                        }}
                                    >
                                        <FormField
                                            label="Nhập mã điểm danh"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            placeholder="FPT26"
                                            required
                                            maxLength={12}
                                        />
                                        <button
                                            disabled={
                                                archived ||
                                                event.status !== 'live' ||
                                                !event.sessionOpen ||
                                                !event.registered.includes(actorId)
                                            }
                                            className="dx-button primary full"
                                        >
                                            Xác nhận check-in <Check size={17} />
                                        </button>
                                        {!event.registered.includes(actorId) && (
                                            <p className="dx-small-note">
                                                Bạn chưa đăng ký hoạt động này. Chọn hoạt động khác đã đăng ký để test.
                                            </p>
                                        )}
                                    </form>
                                )}
                            </section>
                            <section className="dx-panel">
                                <h2>{manager ? 'Tình hình tham dự' : 'Lịch sử điểm danh của tôi'}</h2>
                                {manager ? (
                                    <>
                                        <div className="dx-attendance-summary">
                                            <strong>
                                                {event.checkedIn.length}
                                                <span> / {event.registered.length}</span>
                                            </strong>
                                            <p>thành viên đã điểm danh</p>
                                        </div>
                                        {event.registered.map((id) => (
                                            <div className="dx-list-row" key={id}>
                                                <Avatar person={displayPerson(state, id)} />
                                                <div className="dx-grow">
                                                    <strong>{displayPerson(state, id).name}</strong>
                                                </div>
                                                <Pill tone={event.checkedIn.includes(id) ? 'green' : ''}>
                                                    {event.checkedIn.includes(id) ? 'Đã có mặt' : 'Chưa check-in'}
                                                </Pill>
                                            </div>
                                        ))}
                                    </>
                                ) : events.filter((e) => e.checkedIn.includes(actorId)).length ? (
                                    events
                                        .filter((e) => e.checkedIn.includes(actorId))
                                        .map((e) => (
                                            <div className="dx-list-row" key={e.id}>
                                                <Check size={20} />
                                                <div>
                                                    <strong>{e.title}</strong>
                                                    <p>{dateLabel(e.date)} · Đã có mặt</p>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <Empty
                                        title="Chưa có lượt điểm danh"
                                        text="Lịch sử sẽ xuất hiện sau khi bạn check-in thành công."
                                    />
                                )}
                            </section>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
