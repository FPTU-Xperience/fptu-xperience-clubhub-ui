import { Coins, Check } from 'lucide-react';
import V2Modal from '../../../../components/v2/common/modal/V2Modal';
import GiftClaimButton from './GiftClaimButton';
import GiftAvailability from './GiftAvailability';
import { giftDescription } from '../../profile-page/gift-presentation';
import './GiftDetailPanel.scss';
export default function GiftDetailPanel({
    reward,
    category,
    preview,
    owned,
    balance,
    user,
    clubId,
    onClaim,
    onClose,
    notice,
    error,
    readOnly = false,
}) {
    return (
        <V2Modal
            title="Chi tiết quà"
            className="v2-gift-detail-panel"
            onClose={onClose}
            footer={
                <>
                    <strong className="v2-gift-detail-price">
                        <Coins size={17} />
                        {reward.cost === 0 ? 'Miễn phí' : `${reward.cost.toLocaleString('vi-VN')} điểm mẫu`}
                    </strong>
                    <GiftClaimButton
                        readOnly={readOnly}
                        reward={reward}
                        owned={owned}
                        balance={balance}
                        user={user}
                        clubId={clubId}
                        onClaim={onClaim}
                    />
                </>
            }
        >
            <div className="v2-gift-preview">
                {preview}
                {owned && (
                    <span className="v2-gift-owned">
                        <Check size={12} /> Đã sở hữu
                    </span>
                )}
            </div>
            <p className="v2-gift-detail-category">{category}</p>
            <h3>{reward.label}</h3>
            <p className="v2-gift-detail-description">{giftDescription(reward)}</p>
            <section className="v2-gift-detail-info">
                <h4>Thời gian mở đổi</h4>
                <GiftAvailability reward={reward} />
            </section>
            <section className="v2-gift-detail-info">
                <h4>Thông tin đổi quà</h4>
                {reward.clubName && <p>CLB: {reward.clubName}</p>}
                {!readOnly && (
                    <p>
                        {reward.cost === 0
                            ? 'Nhận miễn phí, không trừ điểm.'
                            : `Số dư của bạn: ${balance.toLocaleString('vi-VN')} điểm mẫu.`}
                    </p>
                )}
                {reward.kind === 'physical' ? (
                    <>
                        <p>Số lượng: {reward.stock} · Mẫu</p>
                        <p>Chưa mở đổi và bàn giao hiện vật.</p>
                    </>
                ) : (
                    <p>Sau khi nhận, quà có thể dùng trong phần tùy chỉnh profile cá nhân.</p>
                )}
            </section>
            {notice && (
                <p className="v2-gift-notice" role="status">
                    {notice}
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
