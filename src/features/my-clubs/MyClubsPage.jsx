import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, CalendarDays } from 'lucide-react';
import { CURRENT_TERM, clubById } from '../../core/model';
import { useClubHub } from '../../context/ClubHubContext';
import { ClubArt } from '../../components/club/ClubArt';
import { ClubMark } from '../../components/club/ClubMark';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { Empty } from '../../components/ui/Empty';
import { dateLabel } from '../../components/ui/formatters';

export function MyClubsPage() {
    const { state, actorId, act, basePath = '' } = useClubHub();

    const mine = state.memberships
        .filter((m) => (m.userId === actorId || String(m.userId) === String(actorId)) && m.status === 'approved')
        .sort((a, b) => Number(b.role === 'manager') - Number(a.role === 'manager'));

    const applications = state.applications.filter((a) => a.userId === actorId || String(a.userId) === String(actorId));

    const homePath = basePath || '/';

    return (
        <div className="dx-public-content">
            <PageHeading
                eyebrow="KHÔNG GIAN CỦA BẠN"
                title="Câu lạc bộ của tôi"
                description="Mỗi cộng đồng, một phần trong hành trình của bạn."
                actions={
                    <Link className="dx-button" to={homePath}>
                        Khám phá thêm <ArrowUpRight size={16} />
                    </Link>
                }
            />

            {mine.length ? (
                <div className="dx-my-clubs">
                    {mine.map((m) => {
                        const c = clubById(m.clubId);
                        const next = state.activities.find(
                            (a) => (a.clubId === c.id || String(a.clubId) === String(c.id)) && a.status === 'upcoming',
                        );
                        const count = state.applications.filter(
                            (a) => (a.clubId === c.id || String(a.clubId) === String(c.id)) && a.status === 'pending',
                        ).length;

                        return (
                            <article className="dx-my-club" key={c.id}>
                                <div className="dx-my-club-art">
                                    <ClubArt club={c} />
                                </div>
                                <div className="dx-my-club-body">
                                    <div className="dx-between">
                                        <ClubMark club={c} />
                                        <Pill tone={m.role === 'manager' ? 'orange' : 'green'}>
                                            {m.role === 'manager' ? 'Chủ nhiệm' : 'Thành viên'}
                                        </Pill>
                                    </div>
                                    <h2>{c.name}</h2>
                                    <p>
                                        {m.role === 'manager'
                                            ? `${count} đơn tham gia đang chờ bạn xem xét`
                                            : 'Hôm nay bạn muốn đóng góp điều gì?'}
                                    </p>
                                    <div className="dx-up-next">
                                        <CalendarDays size={18} />
                                        <div>
                                            <small>HOẠT ĐỘNG SẮP TỚI</small>
                                            <strong>{next?.title || 'Lịch hoạt động đang cập nhật'}</strong>
                                            {next && (
                                                <span>
                                                    {dateLabel(next.date)} · {next.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        to={`${basePath}/my-clubs/${c.id}`.replace(/^\/\//, '/')}
                                        className="dx-button primary"
                                    >
                                        Vào không gian CLB <ArrowRight size={17} />
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <Empty
                    title="Cộng đồng đầu tiên đang chờ bạn"
                    text="Khám phá một CLB phù hợp, gửi lời giới thiệu và bắt đầu hành trình mới."
                >
                    <Link className="dx-button primary" to={homePath}>
                        Tìm CLB của bạn <ArrowRight size={17} />
                    </Link>
                </Empty>
            )}

            <section className="dx-panel">
                <SectionHeading
                    title="Đơn tham gia của tôi"
                    description="Theo dõi phản hồi từ các cộng đồng bạn quan tâm."
                />
                {applications.length ? (
                    applications.map((a) => {
                        const club = clubById(a.clubId);
                        return (
                            <div className="dx-list-row" key={a.id}>
                                <ClubMark club={club} />
                                <div className="dx-grow">
                                    <strong>{club.name}</strong>
                                    <p>{a.reason}</p>
                                </div>
                                <Pill tone={a.status === 'approved' ? 'green' : a.status === 'pending' ? 'orange' : ''}>
                                    {
                                        {
                                            pending: 'Chờ duyệt',
                                            approved: 'Đã duyệt',
                                            rejected: 'Chưa được duyệt',
                                            withdrawn: 'Đã rút đơn',
                                        }[a.status]
                                    }
                                </Pill>
                                {a.status === 'pending' && (
                                    <button
                                        className="dx-button small"
                                        onClick={() => act('withdraw', a.clubId, CURRENT_TERM, { id: a.id })}
                                    >
                                        Rút đơn
                                    </button>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <p className="dx-muted">Bạn chưa có đơn tham gia nào.</p>
                )}
            </section>
        </div>
    );
}

export default MyClubsPage;
