import { Clock } from 'lucide-react';
const date = (value) => new Date(value).toLocaleString('vi-VN');
export default function GiftAvailability({ reward }) {
    return (
        <div className="v2-gift-availability">
            <Clock size={14} />
            <div>
                {reward.publishAt ? (
                    <>
                        <span>Mở từ {date(reward.publishAt)}</span>
                        <span>{reward.unpublishAt ? `Đến ${date(reward.unpublishAt)}` : 'Không đặt giờ kết thúc'}</span>
                    </>
                ) : (
                    <span>Đang mở đổi · Không đặt thời hạn</span>
                )}
            </div>
        </div>
    );
}
