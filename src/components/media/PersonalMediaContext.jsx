import { createContext, useContext, useEffect, useState } from 'react';
import { cosmeticInventory } from '../../services/club-credit';
import { acceptServerCosmetics, clearServerCosmetics } from '../../services/server-cosmetics-cache';
import { useProfile } from '../../pages/v2/profile-data';
import { useServerProfileImages } from '../../services/use-server-profile-images';
import ProfileAvatar from '../../pages/v2/profile-page/ProfileAvatar';
import './PersonalMediaContext.scss';

const PersonalMediaContext = createContext(null);

export function PersonalMediaProvider({ user, api, children }) {
    const [cosmeticStatus, setCosmeticStatus] = useState('idle');
    const sessionKey = user?.id || user?.email || 'anonymous';
    const profileResult = useProfile(user, sessionKey, api);
    const profileImages = useServerProfileImages(user, sessionKey, api, profileResult);
    useEffect(() => {
        let active = true;
        setCosmeticStatus('loading');
        if (user?.id && api?.request) cosmeticInventory(api, user.id)
            .then((items) => { if (active) { acceptServerCosmetics(user.id, items); setCosmeticStatus('ready'); } })
            .catch(() => { if (active) setCosmeticStatus('unavailable'); });
        else setCosmeticStatus('idle');
        return () => { active = false; if (user?.id) clearServerCosmetics(user.id); };
    }, [user?.id, api]);
    return (
        <PersonalMediaContext.Provider value={{ user, profileResult, profileImages, cosmeticStatus }}>
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
