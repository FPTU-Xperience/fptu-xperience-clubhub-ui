import React, { useState } from 'react';
import { ArrowRight, FileText, Plus } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';
import { useWorkspace } from '../workspace/ClubWorkspaceLayout';
import { Empty } from '../../components/ui/Empty';
import { FormField } from '../../components/ui/FormField';
import { Modal } from '../../components/ui/Modal';
import { PageHeading } from '../../components/ui/Headings';
import { Pill } from '../../components/ui/Pill';

export function ReportsPage() {
    const { state, act, api } = useClubHub();
    const { clubId, term, archived } = useWorkspace();
    const [editing, setEditing] = useState(null);

    const rows = state.reports.filter(
        (r) => (r.clubId === clubId || String(r.clubId) === String(clubId)) && r.term === term,
    );

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
                                {r.status === 'submitted' ? 'Đã nộp' : 'Bản nháp'}
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
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const isSubmit = e.nativeEvent.submitter?.value === 'submit';
                            const d = Object.fromEntries(new FormData(e.currentTarget));
                            if (api?.createReport) {
                                try {
                                    const created = await api.createReport({
                                        clubId: Number(clubId) || clubId,
                                        period: term,
                                        reportType: 'MONTHLY',
                                        title: d.title,
                                        content: d.content,
                                    });
                                    if (isSubmit && created?.id && api?.submitReport) {
                                        await api.submitReport(created.id);
                                    }
                                } catch (err) {
                                    console.warn('BE createReport/submitReport sync notice:', err.message);
                                }
                            }
                            if (
                                act('report', clubId, term, {
                                    ...d,
                                    id: editing.id,
                                    submit: isSubmit,
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
                        <p className="dx-small-note">Báo cáo định kỳ hoạt động câu lạc bộ gửi cán bộ phụ trách CTSV.</p>
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

export default ReportsPage;
