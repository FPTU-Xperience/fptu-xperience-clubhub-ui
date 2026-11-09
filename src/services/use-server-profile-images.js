import { useCallback, useEffect, useRef, useState } from 'react';
import { profileStorageKey } from '../pages/v2/profile-data.js';
import { publishProfileImageSaved, subscribeProfileImageSaved } from './profile-image-sync.js';
import { confirmedImageAttachment } from './media-attachment.js';

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
            const field = kind === 'avatar' ? 'avatarUrl' : 'coverImageUrl';
            if (!profileResult.data?.editableFields?.includes(`profile.${field}`))
                throw new Error('Máy chủ chưa cho phép lưu ảnh này. Hãy tải lại hồ sơ.');
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
                    [field]: url,
                });
                if (ticket !== generation.current) throw new Error('Phiên chỉnh ảnh đã thay đổi.');
                confirmedImageAttachment({ ...saved.profile, version: saved.version }, { [field]: url });
                publishProfileImageSaved(account, kind, 'server');
                setError('');
                return saved.profile[field];
            } catch (issue) {
                if (ticket === generation.current) setError(issue.message);
                throw issue;
            }
        },
        [api, user?.id, profileResult.save, profileResult.data?.editableFields, account],
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
