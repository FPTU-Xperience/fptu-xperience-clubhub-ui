import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Users, Check } from 'lucide-react';
import { CURRENT_TERM, clubById, membership, displayPerson } from '../../core/model';
import { useClubHub } from '../../context/ClubHubContext';
import { ClubArt } from '../../components/club/ClubArt';
import { ClubMark } from '../../components/club/ClubMark';
import { EventCard } from '../../components/club/EventCard';
import { Avatar } from '../../components/ui/Avatar';
import { Pill } from '../../components/ui/Pill';
import { Empty } from '../../components/ui/Empty';
import { BackLink } from '../../components/ui/BackLink';
import { Modal } from '../../components/ui/Modal';
import { FormField } from '../../components/ui/FormField';
import { SectionHeading } from '../../components/ui/Headings';

export function ClubDetailPage() {
    const { clubId } = useParams();
    const club = clubById(clubId);
    const { state, actorId, act, basePath = '', api } = useClubHub();
    const [joining, setJoining] = useState(false);
    const [reason, setReason] = useState('');

    const homePath = basePath || '/';

    if (!club) {
        return (
            <Empty title="Không tìm thấy CLB" text="CLB này không có trong hệ thống hoặc bản demo.">
                <Link to={homePath} className="dx-button">
                    Về khám phá
                </Link>
            </Empty>
        );
    }

    const access = membership(state, actorId, clubId);
    const pending = state.applications.find(
        (a) =>
            (a.userId === actorId || String(a.userId) === String(actorId)) &&
            (a.clubId === clubId || String(a.clubId) === String(clubId)) &&
            a.status === 'pending',
    );
    const recruiting = state.settings[clubId]?.recruiting ?? club.recruiting;
    const leaders = state.memberships.filter(
        (m) => (m.clubId === clubId || String(m.clubId) === String(clubId)) && m.role === 'manager',
    );
    const events = state.activities.filter(
        (a) => (a.clubId === clubId || String(a.clubId) === String(clubId)) && a.public && a.term === CURRENT_TERM,
    );

    return (
        <div className="dx-public-content">
            <BackLink to={homePath}>Tất cả câu lạc bộ</BackLink>
            <div className="dx-detail-cover">
                <ClubArt club={club} hero />
            </div>
            <div className="dx-club-identity">
                <ClubMark club={club} large />
                <div>
                    <div className="dx-inline">
                        <Pill>{club.category}</Pill>
                        <Pill tone="orange">{recruiting ? 'Đang tuyển thành viên' : 'Chưa mở tuyển'}</Pill>
                    </div>
                    <h1>{club.fullName}</h1>
                    <p>{club.tagline}</p>
                </div>
                <div className="dx-identity-action">
                    {access ? (
                        <Link to={`${basePath}/my-clubs/${clubId}`.replace(/^\/\//, '/')} className="dx-button primary">
                            Vào CLB của tôi <ArrowRight size={17} />
                        </Link>
                    ) : pending ? (
                        <span className="dx-button soft">
                            <Check size={17} />
                            Đơn đang chờ duyệt
                        </span>
                    ) : (
                        <button className="dx-button primary" disabled={!recruiting} onClick={() => setJoining(true)}>
                            Tham gia cộng đồng <ArrowUpRight size={17} />
                        </button>
                    )}
                </div>
            </div>

            <div className="dx-detail-columns">
                <div>
                    <section className="dx-panel">
                        <span className="dx-eyebrow">CHÚNG MÌNH LÀ AI?</span>
                        <h2>Một nơi để cùng nhau phát triển.</h2>
                        <p className="dx-body-large">{state.settings[clubId]?.description || club.description}</p>
                        <p>
                            Ở {club.name}, bạn không cần phải có mọi câu trả lời. Chúng mình cùng học hỏi qua các buổi
                            sinh hoạt, dự án nhóm và những hoạt động thực tế. Mỗi thành viên đều có không gian để thử
                            sức và đóng góp theo cách của riêng mình.
                        </p>
                        <div className="dx-inline">
                            {club.tags.map((t) => (
                                <Pill key={t}>{t}</Pill>
                            ))}
                        </div>
                    </section>

                    <SectionHeading title="Sắp diễn ra" description="Một cơ hội tốt để gặp gỡ cộng đồng." />
                    {events.length ? (
                        events.map((e) => (
                            <EventCard
                                key={e.id}
                                event={e}
                                club={club}
                                base={
                                    access
                                        ? `${basePath}/my-clubs/${clubId}/activities`.replace(/^\/\//, '/')
                                        : `${basePath}/events`.replace(/^\/\//, '/')
                                }
                            />
                        ))
                    ) : (
                        <Empty
                            title="Lịch hoạt động đang được chuẩn bị"
                            text="Theo dõi CLB để đón những cập nhật tiếp theo."
                        />
                    )}

                    <section className="dx-panel">
                        <h2>Bạn sẽ tìm thấy gì ở đây?</h2>
                        <div className="dx-benefits">
                            {[
                                ['01', 'Học từ trải nghiệm', 'Thử sức trong các hoạt động và dự án có đầu ra cụ thể.'],
                                [
                                    '02',
                                    'Những người bạn đồng hành',
                                    'Kết nối với các thành viên cùng sở thích, từ nhiều ngành học.',
                                ],
                                [
                                    '03',
                                    'Ghi nhận từng đóng góp',
                                    'Lưu lại vai trò, sản phẩm và tiến bộ trong hồ sơ cá nhân.',
                                ],
                            ].map(([n, t, d]) => (
                                <div key={n}>
                                    <span>{n}</span>
                                    <h3>{t}</h3>
                                    <p>{d}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside>
                    <section className="dx-panel">
                        <h3>Hẹn gặp bạn tại CLB</h3>
                        <div className="dx-info-row">
                            <CalendarDays />
                            <div>
                                <small>Lịch sinh hoạt</small>
                                <strong>{club.schedule}</strong>
                            </div>
                        </div>
                        <div className="dx-info-row">
                            <MapPin />
                            <div>
                                <small>Địa điểm</small>
                                <strong>{club.place}</strong>
                            </div>
                        </div>
                        <div className="dx-info-row">
                            <Users />
                            <div>
                                <small>Thành viên trong hệ thống</small>
                                <strong>
                                    {
                                        state.memberships.filter(
                                            (m) =>
                                                (m.clubId === clubId || String(m.clubId) === String(clubId)) &&
                                                m.status === 'approved',
                                        ).length
                                    }{' '}
                                    thành viên
                                </strong>
                            </div>
                        </div>
                    </section>

                    <section className="dx-panel">
                        <h3>Gặp ban chủ nhiệm</h3>
                        {leaders.length ? (
                            leaders.map((m) => {
                                const p = displayPerson(state, m.userId);
                                return (
                                    <div className="dx-person" key={p.id}>
                                        <Avatar person={p} />
                                        <div>
                                            <strong>{p.name}</strong>
                                            <small>Chủ nhiệm CLB</small>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p>Thông tin đang cập nhật.</p>
                        )}
                    </section>

                    <div className="dx-small-note">
                        Cổng thông tin sinh viên FPTU ClubHub · Hoạt động ngoại khóa & phong trào sinh viên.
                    </div>
                </aside>
            </div>

            {joining && (
                <Modal title={`Tham gia ${club.name}`} onClose={() => setJoining(false)}>
                    <p>Giới thiệu một chút về bạn để ban chủ nhiệm hiểu bạn hơn.</p>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (api?.joinClub) {
                                try {
                                    await api.joinClub(clubId, { reason });
                                } catch (err) {
                                    console.warn('BE joinClub sync notice:', err.message);
                                }
                            }
                            if (act('apply', clubId, CURRENT_TERM, { reason })) setJoining(false);
                        }}
                    >
                        <FormField
                            label="Vì sao bạn muốn tham gia?"
                            textarea
                            rows={5}
                            required
                            maxLength={1500}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Sở thích, điều bạn muốn học, thời gian có thể tham gia..."
                        />
                        <div className="dx-form-footer">
                            <button type="button" className="dx-button" onClick={() => setJoining(false)}>
                                Để sau
                            </button>
                            <button className="dx-button primary">
                                Gửi đơn tham gia <ArrowRight size={17} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

export default ClubDetailPage;
