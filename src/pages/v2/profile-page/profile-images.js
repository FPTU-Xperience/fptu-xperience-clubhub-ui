import { useCallback, useEffect, useRef, useState } from 'react';
import { profileStorageKey } from '../profile-data';
import { validateImageUpload } from '../../../services/media-upload';
import { publishProfileImageSaved, subscribeProfileImageSaved } from '../../../services/profile-image-sync';

const DATABASE = 'clubhub-profile-images';
const STORE = 'images';

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE, 1);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function imageRecord(user, kind, value) {
    const account = profileStorageKey(user);
    if (!account) throw new Error('Vui lòng đăng nhập để lưu ảnh.');
    const db = await openDatabase();
    try {
        return await new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE, value === undefined ? 'readonly' : 'readwrite');
            const request = value === undefined
                ? transaction.objectStore(STORE).get(`${account}:${kind}`)
                : transaction.objectStore(STORE).put(value, `${account}:${kind}`);
            transaction.oncomplete = () => resolve(request.result);
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
            request.onerror = () => reject(request.error);
        });
    } finally {
        db.close();
    }
}

export function useProfileImages(user, sessionKey) {
    const [images, setImages] = useState({ avatar: '', cover: '' });
    const [error, setError] = useState('');
    const urls = useRef({ avatar: '', cover: '' });
    const versions = useRef({ avatar: 0, cover: 0 });
    const lifetime = useRef(null);
    const source = useRef(`${Date.now()}-${Math.random()}`);
    const account = profileStorageKey(user);

    useEffect(() => {
        const token = { account };
        lifetime.current = token;
        setImages({ avatar: '', cover: '' });
        setError('');
        const reload = async (kind) => {
            const version = ++versions.current[kind];
            try {
                const blob = await imageRecord(user, kind);
                if (lifetime.current !== token || versions.current[kind] !== version) return;
                const url = blob instanceof Blob ? URL.createObjectURL(blob) : '';
                if (urls.current[kind]) URL.revokeObjectURL(urls.current[kind]);
                urls.current = { ...urls.current, [kind]: url };
                setImages((current) => ({ ...current, [kind]: url }));
                setError('');
            } catch {
                if (lifetime.current === token && versions.current[kind] === version)
                    setError('Không thể đọc ảnh đã lưu trên thiết bị.');
            }
        };
        if (account) ['avatar', 'cover'].forEach(reload);
        const unsubscribe = subscribeProfileImageSaved(account, (signal) => {
            if (signal.source !== source.current) reload(signal.kind);
        });
        return () => {
            lifetime.current = null;
            unsubscribe();
            Object.values(urls.current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
            urls.current = { avatar: '', cover: '' };
        };
    }, [account, sessionKey]);

    const saveImage = useCallback(async (kind, file) => {
        if (!['avatar', 'cover'].includes(kind)) throw new Error('Loại ảnh không hợp lệ.');
        validateImageUpload(file);
        const token = lifetime.current;
        const version = ++versions.current[kind];
        await imageRecord(user, kind, file);
        publishProfileImageSaved(account, kind, source.current);
        if (lifetime.current !== token || token?.account !== account || versions.current[kind] !== version)
            throw new Error('Phiên chỉnh ảnh đã thay đổi. Vui lòng mở lại hồ sơ.');
        const url = URL.createObjectURL(file);
        if (urls.current[kind]) URL.revokeObjectURL(urls.current[kind]);
        urls.current = { ...urls.current, [kind]: url };
        setImages((current) => {
            return { ...current, [kind]: url };
        });
        return url;
    }, [user, account]);

    return { images, error, saveImage };
}
