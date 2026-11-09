// Profile display name is user-editable; auth name is the server fullName.
export function getDisplayName(user, profile, fallback = 'bạn') {
    return [profile?.displayName, user?.name, user?.fullName]
        .find((value) => typeof value === 'string' && value.trim())?.trim() || fallback;
}
