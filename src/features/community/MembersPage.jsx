import React, { useState } from 'react';
import { Check, Award } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { displayPerson } from '../../core/model';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';
import { SearchField } from '../../components/ui/SearchField';

export function MembersPage() {
    const { state, act, api } = useClubHub();
    const { clubId, club, term, manager, archived } = useWorkspace();
    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState(null);

    const pending = state.applications.filter(
        (a) => (a.clubId === clubId || String(a.clubId) === String(clubId)) && a.status === 'pending',
    );
    const members = state.memberships.filter(
        (m) =>
            (m.clubId === clubId || String(m.clubId) === String(clubId)) &&
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
                                            onClick={async () => {
                                                if (api?.approveClubApplication) {
                                                    try {
                                                        await api.approveClubApplication(a.id, {
                                                            decision: 'Approve',
                                                            note: 'Chào đón thành viên mới',
                                                        });
                                                    } catch (err) {
                                                        console.warn(
                                                            'BE approveClubApplication sync notice:',
                                                            err.message,
                                                        );
                                                    }
                                                }
                                                act('reviewApplication', clubId, term, {
                                                    id: a.id,
                                                    status: 'approved',
                                                });
                                            }}
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            disabled={archived}
                                            className="dx-button small"
                                            onClick={async () => {
                                                if (api?.rejectClubApplication) {
                                                    try {
                                                        await api.rejectClubApplication(a.id, {
                                                            decision: 'Reject',
                                                            note: 'Chưa phù hợp đợt này',
                                                        });
                                                    } catch (err) {
                                                        console.warn(
                                                            'BE rejectClubApplication sync notice:',
                                                            err.message,
                                                        );
                                                    }
                                                }
                                                act('reviewApplication', clubId, term, {
                                                    id: a.id,
                                                    status: 'rejected',
                                                });
                                            }}
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

            <div className="dx-filter-bar">
                <SearchField value={query} onChange={setQuery} placeholder="Tìm thành viên theo tên..." />
            </div>

            <div className="dx-member-grid">
                {members.map((m) => {
                    const person = displayPerson(state, m.userId);
                    return (
                        <article className="dx-member-card" key={m.userId} onClick={() => setSelected(m.userId)}>
                            <Avatar person={person} large />
                            <h3>{person.name}</h3>
                            <Pill tone={m.role === 'manager' ? 'orange' : ''}>
                                {m.role === 'manager' ? 'Chủ nhiệm CLB' : 'Thành viên'}
                            </Pill>
                            <p>{person.bio || 'Chưa cập nhật giới thiệu cá nhân.'}</p>
                        </article>
                    );
                })}
            </div>

            {selected && (
                <Modal title={displayPerson(state, selected).name} onClose={() => setSelected(null)}>
                    <div className="dx-person-header">
                        <Avatar person={displayPerson(state, selected)} large />
                        <div>
                            <h2>{displayPerson(state, selected).name}</h2>
                            <Pill tone="orange">
                                {state.memberships.find(
                                    (m) =>
                                        (m.clubId === clubId || String(m.clubId) === String(clubId)) &&
                                        (m.userId === selected || String(m.userId) === String(selected)),
                                )?.role === 'manager'
                                    ? 'Chủ nhiệm CLB'
                                    : 'Thành viên'}
                            </Pill>
                        </div>
                    </div>
                    <p className="dx-body-large">
                        {displayPerson(state, selected).bio || 'Chưa có thông tin giới thiệu.'}
                    </p>
                    <h3>Kỹ năng & mối quan tâm</h3>
                    <div className="dx-inline">
                        {(displayPerson(state, selected).skills || ['Làm việc nhóm']).map((s) => (
                            <Pill key={s}>{s}</Pill>
                        ))}
                    </div>
                    {manager ? (
                        <>
                            <h3 className="dx-spaced">Đóng góp tại {club.name}</h3>
                            {state.ledger
                                .filter(
                                    (l) =>
                                        (l.userId === selected || String(l.userId) === String(selected)) &&
                                        (l.clubId === clubId || String(l.clubId) === String(clubId)) &&
                                        l.term === term,
                                )
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

export default MembersPage;
