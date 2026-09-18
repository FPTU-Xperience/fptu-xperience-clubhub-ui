import React, { useState } from 'react';
import { CalendarDays, Plus, Check, MapPin, Users, ArrowRight } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { displayPerson } from '../../core/model';
import { Avatar } from '../../components/ui/Avatar';
import { Empty } from '../../components/ui/Empty';
import { EventCard } from '../../components/club/EventCard';
import { FormField } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { PageHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { SearchField } from '../../components/ui/SearchField';
import { dateLabel } from '../../components/ui/formatters';

export function ActivitiesPage() {
    const { state, actorId, act, api } = useClubHub();
    const { club, clubId, term, manager, archived } = useWorkspace();
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);

    const events = state.activities.filter(
        (e) =>
            (e.clubId === clubId || String(e.clubId) === String(clubId)) &&
            e.term === term &&
            e.title.toLowerCase().includes(query.toLowerCase()) &&
            (filter === 'all' || (filter === 'mine' ? e.registered.includes(actorId) : e.status === filter)),
    );

    const active = state.activities.find(
        (e) => e.id === selected && (e.clubId === clubId || String(e.clubId) === String(clubId)) && e.term === term,
    );

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
                            onOpen={(event) => setSelected(event.id)}
                        />
                    ))
                ) : (
                    <Empty title="Chưa có hoạt động phù hợp" text="Thử thay đổi bộ lọc hoặc tìm kiếm." />
                )}
            </div>

            {active && (
                <Modal title={active.title} onClose={() => setSelected(null)} wide>
                    <Pill tone={active.status === 'live' ? 'green' : 'orange'}>
                        {
                            {
                                upcoming: 'Sắp diễn ra',
                                live: 'Đang diễn ra',
                                completed: 'Đã hoàn thành',
                            }[active.status]
                        }
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
                                onClick={async () => {
                                    if (api?.registerParticipant) {
                                        try {
                                            await api.registerParticipant(
                                                active.id,
                                                actorId,
                                                state.members.find((m) => m.id === actorId)?.name,
                                            );
                                        } catch (err) {
                                            console.warn('BE registerParticipant sync notice:', err.message);
                                        }
                                    }
                                    act('register', clubId, term, { id: active.id });
                                }}
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
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const data = Object.fromEntries(new FormData(e.currentTarget));
                            if (api?.createActivity) {
                                try {
                                    await api.createActivity({
                                        clubId: Number(clubId) || clubId,
                                        clubName: club.name,
                                        title: data.title,
                                        description: data.description || '',
                                        startTimeUtc: new Date(data.date).toISOString(),
                                        location: data.location || club.place,
                                    });
                                } catch (err) {
                                    console.warn('BE createActivity sync notice:', err.message);
                                }
                            }
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

export default ActivitiesPage;
