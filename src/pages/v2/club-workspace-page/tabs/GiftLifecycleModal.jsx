import { useState } from 'react';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import { setRewardLifecycle, setRewardWindow } from '../../profile-page/reward-lifecycle';
const localTime = (date) => {
    if (!date) return '';
    const value = new Date(date);
    return new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function GiftLifecycleModal({ clubId, reward, action, onClose, onSaved }) {
    const [date, setDate] = useState(() => localTime(reward.publishAt));
    const [end, setEnd] = useState(() => localTime(reward.unpublishAt));
    const [error, setError] = useState('');
    const deleting = action === 'deleted';
    const submit = () => {
        try {
            if (deleting) setRewardLifecycle(clubId, reward.key, action);
            else setRewardWindow(clubId, reward.key, date, end);
            onSaved();
        } catch (issue) {
            setError(issue.message);
        }
    };
    return (
        <V2Modal
            title={deleting ? 'Xóa quà khỏi kho' : 'Lịch mở đổi quà'}
            onClose={onClose}
            footer={
                <>
                    <button type="button" className="v2-button" onClick={onClose}>
                        Hủy
                    </button>
                    {!deleting && reward.publishAt && (
                        <button
                            type="button"
                            className="v2-button"
                            onClick={() => {
                                try {
                                    setRewardLifecycle(
                                        clubId,
                                        reward.key,
                                        reward.status === 'published' ? 'published' : 'draft',
                                    );
                                    onSaved();
                                } catch (issue) {
                                    setError(issue.message);
                                }
                            }}
                        >
                            Bỏ lịch
                        </button>
                    )}
                    <button type="button" className="v2-button v2-button--primary" onClick={submit}>
                        {deleting ? 'Xóa quà' : 'Lưu lịch'}
                    </button>
                </>
            }
        >
            <p>
                <strong>{reward.label}</strong>
            </p>
            {deleting ? (
                <p>Quà sẽ bị gỡ khỏi kho và ngừng nhận lượt đổi mới. Quà thành viên đã sở hữu vẫn được giữ lại.</p>
            ) : (
                <div className="v2-gift-window-fields">
                    <label className="v2-gift-schedule-field">
                        Mở đổi từ (giờ địa phương)
                        <input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
                    </label>
                    <label className="v2-gift-schedule-field">
                        Đóng đổi lúc (giờ địa phương)
                        <input type="datetime-local" value={end} onChange={(event) => setEnd(event.target.value)} />
                    </label>
                </div>
            )}
            {!deleting && (
                <p>
                    Quà tự mở đổi trong khoảng đã chọn và đóng khi hết giờ. Publish/Unpublish thủ công sẽ bỏ lịch và áp
                    dụng ngay; bỏ lịch giữ trạng thái hiện tại. Lịch hiện lưu trên thiết bị.
                </p>
            )}
            {error && (
                <p className="v2-profile-form-error" role="alert">
                    {error}
                </p>
            )}
        </V2Modal>
    );
}
