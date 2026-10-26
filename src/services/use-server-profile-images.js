import { useCallback, useEffect, useRef, useState } from 'react';
import { profileStorageKey } from '../pages/v2/profile-data.js';
import { publishProfileImageSaved, subscribeProfileImageSaved } from './profile-image-sync.js';

export function useServerProfileImages(user, sessionKey, api, profileResult) {
    const [error, setError] = useState('');
    const generation = useRef(0);
    const account = profileStorageKey(user);
    useEffect(() => {
        generation.current++;
        setError('');
        const unsubscribe = subscribeProfileImageSaved(account, () => profileResult.retry());
        return () => {
            generation.current++;
            unsubscribe();
        };
    }, [account, sessionKey, profileResult.retry]);
    const saveImage = useCallback(
        async (kind, file, appearance = {}) => {
            if (!['avatar', 'cover'].includes(kind)) throw new Error('Loại ảnh không hợp lệ.');
            const ticket = generation.current;
            try {
                const url = await api.uploadPublicImage(
                    file,
                    kind === 'avatar' ? 'student-avatar' : 'student-cover',
                    user.id,
                );
                if (ticket !== generation.current) throw new Error('Phiên chỉnh ảnh đã thay đổi.');
                const saved = await profileResult.save({
                    ...appearance,
                    [kind === 'avatar' ? 'avatarUrl' : 'coverImageUrl']: url,
                });
                if (ticket !== generation.current) throw new Error('Phiên chỉnh ảnh đã thay đổi.');
                publishProfileImageSaved(account, kind, 'server');
                setError('');
                return saved.profile[kind === 'avatar' ? 'avatarUrl' : 'coverImageUrl'];
            } catch (issue) {
                if (ticket === generation.current) setError(issue.message);
                throw issue;
            }
        },
        [api, user?.id, profileResult.save, account],
    );
    return {
        images: {
            avatar: profileResult.data?.profile.avatarUrl || '',
            cover: profileResult.data?.profile.coverImageUrl || '',
        },
        error,
        saveImage,
    };
}
