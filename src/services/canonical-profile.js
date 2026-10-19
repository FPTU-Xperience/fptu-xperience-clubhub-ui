// Server-owned text always wins over older device-local profile records.
export function mergeCanonicalProfile(local, response, userId) {
    if (
        String(response?.userId) !== String(userId) ||
        typeof response?.version !== 'string' ||
        !response.profile ||
        !Array.isArray(response.profile.skills) ||
        !Array.isArray(response.profile.interests)
    )
        throw new Error('Máy chủ trả về hồ sơ không hợp lệ.');
    return {
        ...local,
        serverVersion: response.version,
        profileSource: response.profileSource,
        editableFields: response.editableFields,
        profile: { ...local.profile, ...response.profile },
        personal: { ...local.personal, phoneNumber: response.personal?.phoneNumber || '' },
    };
}

export function canonicalProfilePatch(snapshot) {
    if (!snapshot?.serverVersion) throw new Error('Tải lại hồ sơ trước khi lưu.');
    return {
        expectedVersion: snapshot.serverVersion,
        profile: {
            displayName: snapshot.profile.displayName,
            about: snapshot.profile.about,
            skills: snapshot.profile.skills,
            interests: snapshot.profile.interests,
        },
        personal: { phoneNumber: snapshot.personal.phoneNumber || null },
    };
}
