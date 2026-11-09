export const emptyAcademicCalendar = Object.freeze({
    termStartDate: '',
    block10StartDate: '',
    block3StartDate: '',
});

function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function validateAcademicCalendar(value) {
    const termStart = parseDate(value?.termStartDate);
    const block10Start = parseDate(value?.block10StartDate);
    const block3Start = parseDate(value?.block3StartDate);
    if (!termStart || !block10Start || !block3Start) throw new Error('Nhập đủ ba ngày hợp lệ cho học kỳ và hai block.');
    if (block10Start.getUTCDay() !== 1 || block3Start.getUTCDay() !== 1) {
        throw new Error('Ngày bắt đầu mỗi block phải là Thứ Hai.');
    }
    if (termStart > block10Start) throw new Error('Block 10W không thể bắt đầu trước học kỳ.');
    if (block3Start - block10Start < 70 * 24 * 60 * 60 * 1000) {
        throw new Error('Block 3W phải bắt đầu sau khi Block 10W học đủ 10 tuần.');
    }
    return {
        termStartDate: value.termStartDate,
        block10StartDate: value.block10StartDate,
        block3StartDate: value.block3StartDate,
    };
}
