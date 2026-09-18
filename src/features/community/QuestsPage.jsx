import React, { useState } from 'react';
import { Plus, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { displayPerson } from '../../core/model';
import { Avatar } from '../../components/ui/Avatar';
import { Empty } from '../../components/ui/Empty';
import { FormField } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { PageHeading, SectionHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';

export function QuestsPage() {
    const { state, actorId, act } = useClubHub();
    const { clubId, term, manager, archived } = useWorkspace();
    const [selected, setSelected] = useState(null);
    const [creating, setCreating] = useState(false);
    const [review, setReview] = useState(null);

    const quests = state.quests.filter(
        (q) => (q.clubId === clubId || String(q.clubId) === String(clubId)) && q.term === term,
    );
    const submissions = state.submissions.filter(
        (s) =>
            (s.clubId === clubId || String(s.clubId) === String(clubId)) &&
            s.term === term &&
            (manager || s.userId === actorId || String(s.userId) === String(actorId)),
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
                    const mine = state.submissions.find(
                        (s) => s.questId === q.id && (s.userId === actorId || String(s.userId) === String(actorId)),
                    );
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
                                        ? {
                                              pending: 'Chờ xác nhận',
                                              approved: 'Đã ghi nhận',
                                              revision: 'Cần bổ sung',
                                          }[mine.status]
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
                                        {
                                            pending: 'Chờ xác nhận',
                                            approved: 'Đã xác nhận',
                                            revision: 'Cần bổ sung',
                                        }[s.status]
                                    }
                                </Pill>
                            </div>
                            <p className="dx-quote">"{s.evidence}"</p>
                            {s.link && (
                                <a href={s.link} target="_blank" rel="noreferrer" className="dx-text-link">
                                    Xem liên kết đính kèm
                                </a>
                            )}
                            {s.feedback && (
                                <div className="dx-feedback">
                                    <strong>Phản hồi từ ban chủ nhiệm:</strong>
                                    <p>{s.feedback}</p>
                                </div>
                            )}
                            {manager && s.status === 'pending' && (
                                <div className="dx-actions">
                                    <button
                                        disabled={archived}
                                        className="dx-button small"
                                        onClick={() => setReview(s)}
                                    >
                                        Xem xét minh chứng
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <Empty title="Chưa có đóng góp nào được gửi" />
                )}
            </section>

            {selected && (
                <Modal title={`Gửi đóng góp: ${selected.title}`} onClose={() => setSelected(null)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            if (
                                act('submitQuest', clubId, term, {
                                    questId: selected.id,
                                    ...d,
                                })
                            )
                                setSelected(null);
                        }}
                    >
                        <FormField
                            label="Mô tả công việc và kết quả bạn đạt được"
                            name="evidence"
                            textarea
                            rows={5}
                            required
                            maxLength={1500}
                            placeholder="Chia sẻ cách bạn thực hiện, kết quả, hoặc điều bạn học được..."
                        />
                        <FormField
                            label="Liên kết minh chứng (nếu có)"
                            name="link"
                            placeholder="https://..."
                            type="url"
                        />
                        <div className="dx-form-footer">
                            <button type="button" className="dx-button" onClick={() => setSelected(null)}>
                                Hủy
                            </button>
                            <button className="dx-button primary">
                                Gửi minh chứng <ArrowRight size={16} />
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {review && (
                <Modal title="Xác nhận đóng góp của thành viên" onClose={() => setReview(null)}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            if (
                                act('reviewSubmission', clubId, term, {
                                    id: review.id,
                                    ...d,
                                })
                            )
                                setReview(null);
                        }}
                    >
                        <label className="dx-field">
                            <span>Quyết định</span>
                            <select name="status" defaultValue="approved">
                                <option value="approved">Xác nhận và cộng điểm</option>
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

export default QuestsPage;
