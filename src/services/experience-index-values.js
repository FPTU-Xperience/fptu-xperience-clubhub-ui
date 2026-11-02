export function experienceIndexValues(value, userId) {
    if (userId == null || value?.studentId == null || String(value.studentId) !== String(userId) || value.isAuthoritative !== true)
        return null;
    const bounds = { eri: [0, 130], d: [0, 100], j: [0, 1], m: [1, 1.3] };
    if (Object.entries(bounds).some(([key, [min, max]]) => !Number.isFinite(value[key]) || value[key] < min || value[key] > max))
        return null;
    return Object.fromEntries(Object.keys(bounds).map((key) => [key, value[key]]));
}
