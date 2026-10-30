import { useRef, useState } from 'react';

export default function ClubDeclarationActions({ api, clubId, record, permissions, onChanged }) {
    const [reason, setReason] = useState(''),
        [busy, setBusy] = useState(false),
        [error, setError] = useState('');
    const lock = useRef(false),
        key = useRef({});
    const reviewConnected = typeof api.reviewClubStudentDeclaration === 'function';
    const submitConnected = typeof api.submitClubStudentDeclarationToStudentAffairs === 'function';
    const canReview = permissions.process && reviewConnected && record.capabilities?.canClubReview === true;
    const canSubmit =
        permissions.process &&
        submitConnected &&
        record.capabilities?.canSubmitToStudentAffairs === true &&
        record.clubReviewStatus === 'APPROVED';
    const act = async (decision) => {
        if (
            lock.current ||
            !record.version ||
            reason.trim().length < 5 ||
            (decision === 'SUBMIT' ? !canSubmit : !canReview)
        )
            return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            const body = { expectedVersion: record.version, reason: reason.trim() };
            const signature = JSON.stringify([clubId, record.id, decision, body]);
            if (key.current.signature !== signature) key.current = { signature, value: crypto.randomUUID() };
            const result =
                decision === 'SUBMIT'
                    ? await api.submitClubStudentDeclarationToStudentAffairs(clubId, record.id, body, key.current.value)
                    : await api.reviewClubStudentDeclaration(
                          clubId,
                          record.id,
                          { ...body, decision },
                          key.current.value,
                      );
            const saved = result?.contribution || result;
            if (
                String(saved?.id) !== String(record.id) ||
                String(saved.clubId) !== String(clubId) ||
                !saved.version ||
                saved.version === record.version ||
                (decision === 'SUBMIT'
                    ? saved.ctsvSubmissionStatus !== 'SUBMITTED'
                    : saved.clubReviewStatus !== (decision === 'ENDORSE' ? 'APPROVED' : 'CHANGES_REQUESTED'))
            )
                throw new Error('Chưa xác nhận được kết quả thao tác tại CLB. Tải lại trước khi thử tiếp.');
            onChanged();
        } catch (issue) {
            setError(issue.message);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };
    return (
        <section className="club-declaration-review">
            <h3>Xét duyệt tại CLB trước khi chuyển CTSV</h3>
            <p>
                Trạng thái CLB:{' '}
                {{
                    APPROVED: 'Đã được CLB thông qua',
                    CHANGES_REQUESTED: 'CLB yêu cầu bổ sung',
                    PENDING: 'Chờ CLB xem xét',
                }[record.clubReviewStatus] || 'Chưa có trạng thái xác nhận tại CLB'}
                .
            </p>
            {!permissions.process ? (
                <p>Bạn cần quyền Xử lý trải nghiệm tự khai trong CLB để thực hiện thao tác này.</p>
            ) : (
                <>
                    {(!reviewConnected || !submitConnected) && (
                        <p className="club-student-declaration-notice">
                            Chưa thể duyệt tại CLB hoặc chuyển hồ sơ lên CTSV.
                        </p>
                    )}
                    <label>
                        Nhận xét / lý do
                        <textarea
                            rows={3}
                            minLength={5}
                            maxLength={2000}
                            value={reason}
                            disabled={busy}
                            onChange={(e) => {
                                setReason(e.target.value);
                            }}
                            placeholder="Nội dung đã kiểm tra hoặc minh chứng cần bổ sung"
                        />
                    </label>
                    <div className="club-student-declaration-actions">
                        {permissions.process && (
                            <>
                                <button
                                    type="button"
                                    className="v2-button v2-button--primary"
                                    disabled={busy || !canReview || reason.trim().length < 5}
                                    onClick={() => act('ENDORSE')}
                                >
                                    Duyệt tại CLB
                                </button>
                                <button
                                    type="button"
                                    className="v2-button"
                                    disabled={busy || !canReview || reason.trim().length < 5}
                                    onClick={() => act('REQUEST_CHANGES')}
                                >
                                    Yêu cầu bổ sung
                                </button>
                            </>
                        )}
                        {permissions.process && (
                            <button
                                type="button"
                                className="v2-button v2-button--primary"
                                disabled={busy || !canSubmit || reason.trim().length < 5}
                                onClick={() => act('SUBMIT')}
                            >
                                Chuyển lên CTSV
                            </button>
                        )}
                    </div>
                    <p>Chỉ chuyển khi CLB đã thông qua. CTSV xét duyệt cuối cùng để ghi nhận Xperience Point.</p>
                </>
            )}
            {error && <p role="alert">{error}</p>}
        </section>
    );
}
