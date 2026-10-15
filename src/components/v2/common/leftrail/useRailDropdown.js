import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function useRailDropdown(initialOpen = false) {
    const [open, setOpen] = useState(initialOpen);
    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const { pathname } = useLocation();

    useEffect(() => {
        const narrow = window.matchMedia('(max-width: 768px)');
        const closeOnResize = () => setOpen(false);
        narrow.addEventListener('change', closeOnResize);
        return () => narrow.removeEventListener('change', closeOnResize);
    }, []);

    useEffect(() => {
        if (window.matchMedia('(max-width: 768px)').matches) setOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!open) return;
        const closeOutside = (event) => {
            if (window.matchMedia('(max-width: 768px)').matches && !containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        };
        const closeEscape = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeEscape);
        };
    }, [open]);

    return { open, setOpen, containerRef, triggerRef };
}
