import { createContext, useContext } from 'react';
import { useProfile } from '../../pages/v2/profile-data';
import { useServerProfileImages } from '../../services/use-server-profile-images';
import ProfileAvatar from '../../pages/v2/profile-page/ProfileAvatar';
import './PersonalMediaContext.scss';

const PersonalMediaContext = createContext(null);

export function PersonalMediaProvider({ user, api, children }) {
    const sessionKey = user?.id || user?.email || 'anonymous';
    const profileResult = useProfile(user, sessionKey, api);
    const profileImages = useServerProfileImages(user, sessionKey, api, profileResult);
    return (
        <PersonalMediaContext.Provider value={{ user, profileResult, profileImages }}>
            {children}
        </PersonalMediaContext.Provider>
    );
}

export const usePersonalMedia = () => useContext(PersonalMediaContext);

export function AccountAvatar() {
    const media = usePersonalMedia();
    const user = media?.user;
    return (
        <ProfileAvatar
            className="account-avatar"
            profile={
                media?.profileResult.data?.profile || { initials: user?.avatar || 'SV', avatarUrl: user?.avatarUrl }
            }
            imageUrl={media?.profileImages.images.avatar}
        />
    );
}
