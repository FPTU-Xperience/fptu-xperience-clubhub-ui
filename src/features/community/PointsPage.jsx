import React, { useState } from 'react';
import { ArrowRight, Award, Gift, ShieldCheck, Sparkles } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { displayPerson, ownPoints, wallet } from '../../core/model';
import { Empty } from '../../components/ui/Empty';
import { Modal } from '../../components/ui/Modal';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { Stat } from '../../components/ui/Stat';

export function PointsPage() {
    const { state, actorId } = useClubHub();
    const { clubId, club, term, manager } = useWorkspace();
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('mine');

    const rows = state.ledger
        .filter(
            (l) =>
                (l.clubId === clubId || String(l.clubId) === String(clubId)) &&
                l.term === term &&
                ((manager && view === 'club') || l.userId === actorId || String(l.userId) === String(actorId)),
        )
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
                        Bản ghi thuộc {club.name} · {selected.term}.
                    </p>
                </Modal>
            )}
        </>
    );
}

export default PointsPage;
