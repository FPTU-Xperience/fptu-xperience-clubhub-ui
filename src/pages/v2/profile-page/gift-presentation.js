export function giftClaimState(reward, { owned = false, balance = 0, authenticated = false, clubId } = {}) {
    if (reward.status !== 'published')
        return { disabled: true, label: reward.status === 'expired' ? 'Đã hết thời gian đổi' : 'Chưa mở đổi' };
    if (reward.kind === 'physical') return { disabled: true, label: 'Chưa mở đổi' };
    if (owned) return { disabled: true, label: 'Đã sở hữu' };
    if (!authenticated || !clubId) return { disabled: true, label: 'Đăng nhập để đổi' };
    if (balance < reward.cost) return { disabled: true, label: 'Chưa đủ điểm' };
    return { disabled: false, label: reward.cost === 0 ? 'Nhận miễn phí' : 'Đổi quà' };
}
export function giftDescription(reward) {
    return (
        reward.description ||
        {
            physical: 'Quà tặng hiện vật của CLB.',
            frame: 'Sử dụng trong tùy chỉnh ảnh đại diện.',
            shape: 'Stamp trang trí độc lập cho ảnh bìa cá nhân.',
            color: 'Bộ màu cho nền, shape và khung ảnh cá nhân.',
            combo: 'Bộ màu kèm shape cover đồng bộ.',
        }[reward.kind] ||
        ''
    );
}
