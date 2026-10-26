export function canonicalProfileSnapshot(user, local, response) {
    if (
        String(response?.userId) !== String(user?.id) ||
        typeof response?.version !== 'string' ||
        !response.profile ||
        !response.personal ||
        !Array.isArray(response.editableFields)
    )
        throw new Error('Máy chủ chưa trả hồ sơ cá nhân hợp lệ.');
    return {
        ...local,
        version: response.version,
        profileSource: response.profileSource,
        editableFields: response.editableFields,
        profile: {
            ...local.profile,
            ...response.profile,
            avatarUrl: response.profile.avatarUrl || '',
            coverImageUrl: response.profile.coverImageUrl || '',
            initials: response.profile.displayName
                .split(/\s+/)
                .filter(Boolean)
                .map((x) => x[0])
                .slice(0, 2)
                .join('')
                .toUpperCase(),
        },
        personal: {
            dateOfBirth: '',
            phoneNumber: '',
            address: '',
            ...Object.fromEntries(Object.entries(response.personal).map(([name, value]) => [name, value ?? ''])),
        },
        academic: {
            ...response.academic,
            campus:
                {
                    HAN: 'FPTU Hà Nội',
                    HCM: 'FPTU Hồ Chí Minh',
                    DAN: 'FPTU Đà Nẵng',
                    CAN: 'FPTU Cần Thơ',
                    QNH: 'FPTU Quy Nhơn',
                }[user.campusCode] ||
                user.campusCode ||
                '',
            studentCode: response.academic?.studentCode || '',
            major: response.academic?.major || '',
            year: response.academic?.year || '',
        },
        // Local preview records are never evidence of server-owned experience or membership.
        evidence: [],
        participations: [],
        terms: [],
        summary: {
            clubCount: null,
            activityCount: null,
            recognizedContributionTotal: null,
            contributionRecordCount: null,
            experiencePillars: { current: [], previous: [] },
        },
    };
}

export function selfProfilePatch(snapshot, patch) {
    const result = { expectedVersion: snapshot.version };
    const fields = new Set(snapshot.editableFields);
    const sections = { profile: patch, personal: patch.personal || {} };
    for (const [section, values] of Object.entries(sections)) {
        for (const [name, input] of Object.entries(values)) {
            if (!fields.has(`${section}.${name}`)) continue;
            let value = input;
            if (['skills', 'interests'].includes(name) && typeof value === 'string')
                value = value
                    .split(',')
                    .map((x) => x.trim())
                    .filter(Boolean);
            if (section === 'personal' && value === '') value = null;
            if (JSON.stringify(value ?? '') === JSON.stringify(snapshot[section]?.[name] ?? '')) continue;
            (result[section] ||= {})[name] = value;
        }
    }
    return Object.keys(result).length > 1 ? result : null;
}
