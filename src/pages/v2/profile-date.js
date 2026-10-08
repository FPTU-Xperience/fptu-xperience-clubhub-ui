export function formatBirthDate(value) {
    return value ? value.split('-').reverse().join('/') : '';
}

export function parseBirthDate(value) {
    if (!value) return '';
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) throw new Error('Ngày sinh cần theo định dạng DD/MM/YYYY.');
    const [, day, month, year] = match;
    const leapYear = Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0);
    const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (Number(year) < 1 || Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > days[Number(month) - 1]) {
        throw new Error('Ngày sinh không hợp lệ. Vui lòng kiểm tra ngày, tháng và năm.');
    }
    return `${year}-${month}-${day}`;
}
export function formatBirthDateInput(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
}
