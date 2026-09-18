import React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    ScanLine,
    Users,
    Award,
    Gift,
    FileText,
    Clock,
    CheckCircle2,
    Plus,
    Sparkles,
    Flag,
} from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { displayPerson, ownPoints } from '../../core/model';
import { useWorkspace } from './ClubWorkspaceLayout';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Stat } from '../../components/ui/Stat';
import { Pill } from '../../components/ui/Pill';
import { Empty } from '../../components/ui/Empty';
import { EventCard } from '../../components/club/EventCard';

export function ClubHomePage() {
    const { state, actorId } = useClubHub();
    const { club, clubId, manager, term, base, archived } = useWorkspace();
    const actor = displayPerson(state, actorId);
    const events = state.activities.filter(
        (a) => (a.clubId === clubId || String(a.clubId) === String(clubId)) && a.term === term,
    );
    const members = state.memberships.filter(
        (m) => (m.clubId === clubId || String(m.clubId) === String(clubId)) && m.status === 'approved',
    );
    const pending = state.applications.filter(
        (a) => (a.clubId === clubId || String(a.clubId) === String(clubId)) && a.status === 'pending',
    );
    const submissions = state.submissions.filter(
        (s) =>
            (s.clubId === clubId || String(s.clubId) === String(clubId)) && s.term === term && s.status === 'pending',
    );
    const points = ownPoints(state, actorId, clubId, term);
    const attended = events.filter((e) => e.checkedIn.includes(actorId)).length;
    const latest = state.ledger
        .filter(
            (l) =>
                (l.clubId === clubId || String(l.clubId) === String(clubId)) &&
                l.term === term &&
                (manager || l.userId === actorId || String(l.userId) === String(actorId)),
        )
        .slice(-4)
        .reverse();

    return (
        <>
            <PageHeading
                eyebrow={`${term === 'FA26' ? 'FALL 2026' : 'SUMMER 2026'} / ${club.name.toUpperCase()}`}
                title={`Chào ${actor.name.split(' ').slice(-1)[0]}, ${
                    manager ? 'cùng dẫn dắt nhé.' : 'hôm nay có gì mới?'
                }`}
                description={
                    manager
                        ? 'Một góc nhìn rõ ràng về cộng đồng bạn đang xây dựng.'
                        : 'Một bước nhỏ hôm nay, thêm một trải nghiệm đáng nhớ.'
                }
                actions={
                    <Link className="dx-button primary" to={`${base}/${manager ? 'activities' : 'quests'}`}>
                        {manager ? <Plus size={17} /> : <Sparkles size={17} />}{' '}
                        {manager ? 'Quản lý hoạt động' : 'Khám phá nhiệm vụ'}
                    </Link>
                }
            />
            <div className="dx-stats">
                {manager ? (
                    <>
                        <Stat
                            label="Thành viên CLB"
                            value={members.length}
                            note="Danh sách thành viên hiện tại"
                            icon={Users}
                        />
                        <Stat
                            label="Hoạt động trong kỳ"
                            value={events.length}
                            note={`${events.filter((e) => e.status === 'upcoming').length} hoạt động sắp diễn ra`}
                            icon={CalendarDays}
                        />
                        <Stat
                            label="Đơn chờ duyệt"
                            value={pending.length}
                            note="Đơn hiện tại · không lọc theo kỳ"
                            icon={Clock}
                        />
                        <Stat
                            label="Đóng góp cần xác nhận"
                            value={submissions.length}
                            note="Mỗi đóng góp đều đáng ghi nhận"
                            icon={Award}
                        />
                    </>
                ) : (
                    <>
                        <Stat
                            label="Điểm đóng góp của tôi"
                            value={points}
                            note="Chỉ trong CLB và học kỳ đang xem"
                            icon={Award}
                        />
                        <Stat
                            label="Hoạt động đã tham dự"
                            value={attended}
                            note={`Trong ${events.length} hoạt động của kỳ`}
                            icon={CheckCircle2}
                        />
                        <Stat
                            label="Lịch đã đăng ký"
                            value={
                                events.filter((e) => e.registered.includes(actorId) && e.status !== 'completed').length
                            }
                            note="Những cuộc hẹn sắp tới"
                            icon={CalendarDays}
                        />
                        <Stat
                            label="Đóng góp đã xác nhận"
                            value={
                                state.submissions.filter(
                                    (s) =>
                                        (s.userId === actorId || String(s.userId) === String(actorId)) &&
                                        (s.clubId === clubId || String(s.clubId) === String(clubId)) &&
                                        s.term === term &&
                                        s.status === 'approved',
                                ).length
                            }
                            note="Xây hồ sơ qua từng đóng góp"
                            icon={Flag}
                        />
                    </>
                )}
            </div>
            <div className="dx-home-columns">
                <div>
                    <section className="dx-panel dx-home-feature">
                        <div>
                            <Pill tone="orange">{manager ? 'CÙNG NHAU TẠO GIÁ TRỊ' : 'HÀNH TRÌNH CỦA BẠN'}</Pill>
                            <h2>
                                {manager
                                    ? 'Một cộng đồng tốt bắt đầu\ntừ những kết nối nhỏ.'
                                    : 'Bạn không chỉ tham gia.\nBạn đang để lại dấu ấn.'}
                            </h2>
                            <p>
                                {manager
                                    ? 'Chào đón thành viên mới, tạo cơ hội thử sức và ghi nhận những đóng góp thực sự.'
                                    : 'Mỗi buổi gặp gỡ, mỗi sản phẩm và mỗi lần giúp đỡ đều là một phần của câu chuyện.'}
                            </p>
                            <Link className="dx-text-link" to={`${base}/${manager ? 'members' : 'points'}`}>
                                {manager ? 'Gặp các thành viên' : 'Xem hành trình đóng góp'} <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="dx-feature-symbol" aria-hidden="true">
                            {club.mark}
                            <span>
                                GROW
                                <br />
                                TOGETHER.
                            </span>
                        </div>
                    </section>
                    <SectionHeading
                        title="Lịch hẹn của CLB"
                        description={
                            archived
                                ? 'Nhìn lại những hoạt động trong học kỳ.'
                                : 'Dành thời gian cho những điều bạn quan tâm.'
                        }
                    >
                        <Link className="dx-text-link" to={`${base}/activities`}>
                            Xem tất cả <ArrowRight size={15} />
                        </Link>
                    </SectionHeading>
                    {events.length ? (
                        events
                            .slice(0, 3)
                            .map((e) => (
                                <EventCard
                                    key={e.id}
                                    event={e}
                                    club={club}
                                    base={`${base}/activities`}
                                    registered={e.registered.includes(actorId)}
                                />
                            ))
                    ) : (
                        <Empty title="Chưa có hoạt động trong kỳ này" />
                    )}
                </div>
                <aside>
                    <section className="dx-panel">
                        <SectionHeading title={manager ? 'Cần bạn xem qua' : 'Dành riêng cho bạn'} />
                        {manager ? (
                            <>
                                <Link className="dx-task-row" to={`${base}/members`}>
                                    <span className="dx-task-icon">
                                        <Users size={18} />
                                    </span>
                                    <div>
                                        <strong>Đơn tham gia mới</strong>
                                        <small>{pending.length} bạn đang chờ lời chào</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                                <Link className="dx-task-row" to={`${base}/quests`}>
                                    <span className="dx-task-icon">
                                        <Award size={18} />
                                    </span>
                                    <div>
                                        <strong>Xác nhận đóng góp</strong>
                                        <small>{submissions.length} minh chứng cần xem</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                                <Link className="dx-task-row" to={`${base}/reports`}>
                                    <span className="dx-task-icon">
                                        <FileText size={18} />
                                    </span>
                                    <div>
                                        <strong>Báo cáo học kỳ</strong>
                                        <small>
                                            {
                                                state.reports.filter(
                                                    (r) =>
                                                        (r.clubId === clubId || String(r.clubId) === String(clubId)) &&
                                                        r.term === term &&
                                                        r.status === 'draft',
                                                ).length
                                            }{' '}
                                            bản nháp đang soạn
                                        </small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link className="dx-task-row" to={`${base}/attendance`}>
                                    <span className="dx-task-icon">
                                        <ScanLine size={18} />
                                    </span>
                                    <div>
                                        <strong>Check-in hoạt động</strong>
                                        <small>Ghi nhận sự có mặt của bạn</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                                <Link className="dx-task-row" to={`${base}/gifts`}>
                                    <span className="dx-task-icon">
                                        <Gift size={18} />
                                    </span>
                                    <div>
                                        <strong>Một món quà nhỏ</strong>
                                        <small>Khám phá những phần quà từ CLB</small>
                                    </div>
                                    <ArrowUpRight size={18} />
                                </Link>
                            </>
                        )}
                    </section>
                    <section className="dx-panel">
                        <SectionHeading title="Đóng góp gần đây" />
                        {latest.map((l) => (
                            <div className="dx-feed-item" key={l.id}>
                                <span className="dx-feed-dot" />
                                <div>
                                    <strong>{manager ? displayPerson(state, l.userId).name : l.reason}</strong>
                                    <p>{manager ? l.reason : l.verifier}</p>
                                    <small>
                                        +{l.amount} điểm · {l.date}
                                    </small>
                                </div>
                            </div>
                        ))}
                        {!latest.length && <p className="dx-muted">Chưa có đóng góp được ghi nhận trong kỳ.</p>}
                    </section>
                </aside>
            </div>
        </>
    );
}

export default ClubHomePage;
