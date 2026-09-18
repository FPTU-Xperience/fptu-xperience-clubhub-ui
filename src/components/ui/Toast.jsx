import React, { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { useClubHub } from '../../context/ClubHubContext';

export function Toast() {
    const { toast, setToast } = useClubHub();

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5500);
        return () => clearTimeout(timer);
    }, [toast, setToast]);

    if (!toast) return null;

    return (
        <div className={`dx-toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>
            {toast.error ? <X size={20} /> : <Check size={20} />}
            <span>{toast.text}</span>
            <button aria-label="Đóng thông báo" onClick={() => setToast(null)}>
                <X size={16} />
            </button>
        </div>
    );
}

export default Toast;
