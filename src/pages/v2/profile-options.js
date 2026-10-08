export const CAMPUSES = [
    'FPTU Hồ Chí Minh',
    'FPTU Hà Nội',
    'FPTU Cần Thơ',
    'FPTU Đà Nẵng',
    'FPTU Quy Nhơn',
];

export const CAMPUS_NICKNAMES = {
    'FPTU Hồ Chí Minh': 'Xavalo',
    'FPTU Hà Nội': 'Hola',
    'FPTU Cần Thơ': 'Hovilo',
    'FPTU Đà Nẵng': 'Fuda',
    'FPTU Quy Nhơn': 'Cahata',
};

export function campusLabel(campus) {
    return CAMPUS_NICKNAMES[campus] ? `${campus} · ${CAMPUS_NICKNAMES[campus]}` : campus;
}

export function inferStudentYear(studentCode) {
    const digits = /^(?:[A-Z]{2}|FQN)(\d{6})$/i.exec(String(studentCode || '').trim())?.[1];
    return digits ? `K${digits.slice(0, 2)}` : '';
}

export function inferStudentFromEmail(email) {
    const match = /^([^\s@]+)@fpt\.edu\.vn$/i.exec(String(email || '').trim());
    if (!match) return { studentCode: '', campus: '', year: '' };
    const local = match[1];
    const quyNhonCode = /FQN\d{5,6}$/i.exec(local)?.[0].toUpperCase();
    if (quyNhonCode) return { studentCode: quyNhonCode, campus: 'FPTU Quy Nhơn', year: inferStudentYear(quyNhonCode) };
    const candidate = local.slice(-8).toUpperCase();
    const studentCode = /^[A-Z]{2}\d{6}$/.test(candidate) ? candidate : '';
    const campuses = { C: 'FPTU Cần Thơ', S: 'FPTU Hồ Chí Minh', H: 'FPTU Hà Nội', D: 'FPTU Đà Nẵng' };
    const campus = campuses[studentCode[0]] || '';
    return { studentCode, campus, year: inferStudentYear(studentCode) };
}
