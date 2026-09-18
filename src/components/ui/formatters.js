export const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export const dateLabel = (value) =>
    new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(value));
