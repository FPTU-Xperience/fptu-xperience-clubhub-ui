import { useCallback, useEffect, useRef, useState } from 'react';
import { profileStorageKey } from '../profile-data';
import { validateImageUpload } from '../../../services/media-upload';

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
    const account = profileStorageKey(user);

    useEffect(() => {
        let active = true;
        setImages({ avatar: '', cover: '' });
        setError('');
        if (account) {
            Promise.all(['avatar', 'cover'].map((kind) => imageRecord(user, kind))).then((blobs) => {
                if (!active) return;
                const next = Object.fromEntries(blobs.map((blob, index) => {
                    const url = blob instanceof Blob ? URL.createObjectURL(blob) : '';
                    return [['avatar', 'cover'][index], url];
                }));
                urls.current = next;
                setImages(next);
            }).catch(() => { if (active) setError('Không thể đọc ảnh đã lưu trên thiết bị.'); });
        }
        return () => {
            active = false;
            Object.values(urls.current).forEach((url) => { if (url) URL.revokeObjectURL(url); });
            urls.current = { avatar: '', cover: '' };
        };
    }, [account, sessionKey]);

    const saveImage = useCallback(async (kind, file) => {
        if (!['avatar', 'cover'].includes(kind)) throw new Error('Loại ảnh không hợp lệ.');
        validateImageUpload(file);
        await imageRecord(user, kind, file);
        const url = URL.createObjectURL(file);
        if (urls.current[kind]) URL.revokeObjectURL(urls.current[kind]);
        urls.current = { ...urls.current, [kind]: url };
        setImages((current) => {
            return { ...current, [kind]: url };
        });
        return url;
    }, [user]);

    return { images, error, saveImage };
}
