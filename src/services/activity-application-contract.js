export const scoringDeferred = (value) =>
    value?.scoringStatus === 'DEFERRED_BY_PRODUCT_OWNER' &&
    value.expectedRawXp === null &&
    value.canAwardPoints === false;

export const validApplicationReceipt = (value) =>
    Boolean(
        value &&
        Number.isSafeInteger(value.id) &&
        value.id > 0 &&
        Number.isSafeInteger(value.version) &&
        value.version > 0 &&
        (scoringDeferred(value) || (Number.isFinite(value.expectedRawXp) && value.expectedRawXp >= 0)),
    );

export const applicationXpLabel = (value) =>
    scoringDeferred(value)
        ? 'Tạm hoãn tính điểm — chưa có dự toán được duyệt'
        : `${new Intl.NumberFormat('vi-VN').format(value.expectedRawXp)} raw Xperience Point`;
