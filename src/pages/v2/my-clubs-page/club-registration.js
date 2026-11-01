const commitments = ['foundingMembersCommitted', 'committedToRules', 'committedToResponsibility', 'committedToReporting'];
const optionalFields = ['code', 'logoUrl', 'expectedLocation', 'expectedSchedule', 'majorEvents', 'equipmentNeeds'];
const frequencyUnits = { WEEK: 'tuần', MONTH: 'tháng', YEAR: 'năm' };

export function buildClubRegistrationPayload(data) {
    const text = (name) => String(data.get(name) ?? '').trim();
    const frequency = text('activityFrequencyCount');
    const unit = frequencyUnits[text('activityFrequencyUnit')];
    if (!/^[1-9][0-9]{0,2}$/.test(frequency) || !unit)
        throw new Error('Tần suất hoạt động phải từ 1 đến 999 lần.');
    if (commitments.some((name) => !data.has(name)))
        throw new Error('Vui lòng xác nhận tất cả cam kết trước khi gửi đơn.');

    const names = data.getAll('memberName');
    const emails = data.getAll('memberEmail');
    const organizations = data.getAll('memberOrganization');
    const foundingMembers = names.map((name, index) => ({
        fullName: String(name).trim(),
        email: String(emails[index] ?? '').trim(),
        organization: String(organizations[index] ?? '').trim(),
    }));
    if (!foundingMembers.length || foundingMembers.length > 200 ||
        foundingMembers.some((member) => !member.fullName || !member.email || !member.organization))
        throw new Error('Vui lòng điền đầy đủ thông tin thành viên sáng lập.');
    const foundingMemberCount = Number(text('foundingMemberCount'));
    if (!Number.isInteger(foundingMemberCount) || foundingMemberCount < foundingMembers.length || foundingMemberCount > 200)
        throw new Error('Số thành viên sáng lập phải từ 1 đến 200 và không ít hơn danh sách đã nhập.');

    const requiredFields = ['name', 'category', 'purpose', 'description', 'founderFullName', 'founderRole',
        'founderEmail', 'founderPhone', 'founderOrganization', 'mainActivities', 'venueSupport', 'fundingSupport'];
    if (requiredFields.some((name) => !text(name)))
        throw new Error('Vui lòng điền đầy đủ các thông tin bắt buộc.');

    return {
        ...Object.fromEntries(requiredFields.map((name) => [name, text(name)])),
        ...Object.fromEntries(optionalFields.map((name) => [name, text(name) || null])),
        ...Object.fromEntries(commitments.map((name) => [name, true])),
        code: text('code').toUpperCase() || null,
        foundingMembers,
        foundingMemberCount,
        activityFrequency: `${frequency} lần mỗi ${unit}`,
        advisorNeeded: data.has('advisorNeeded'),
    };
}
