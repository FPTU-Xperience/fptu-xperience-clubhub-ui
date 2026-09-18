import React, { useState } from 'react';
import { Check, MapPin, ScanLine } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { displayPerson } from '../../core/model';
import { Avatar } from '../../components/ui/Avatar';
import { Empty } from '../../components/ui/Empty';
import { FormField } from '../../components/ui/FormField';
import { PageHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { dateLabel } from '../../components/ui/formatters';

export function AttendancePage() {
    const { state, actorId, act, api } = useClubHub();
    const { clubId, club, term, manager, archived } = useWorkspace();
    const events = state.activities.filter(
        (e) =>
            (e.clubId === clubId || String(e.clubId) === String(clubId)) && e.term === term && e.status !== 'upcoming',
    );
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
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (api?.checkInActivity) {
                                                try {
                                                    await api.checkInActivity(event.id);
                                                } catch (err) {
                                                    console.warn('BE checkInActivity sync notice:', err.message);
                                                }
                                            }
                                            if (act('checkin', clubId, term, { id: event.id, code })) {
                                                setCode('');
                                            }
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

export default AttendancePage;
