import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, wide = false }) {
    const ref = useRef(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        const previous = document.activeElement;
        const old = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ref.current?.querySelector('button, input, textarea, select')?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') closeRef.current();
            if (e.key !== 'Tab') return;
            const nodes = [
                ...(ref.current?.querySelectorAll(
                    'button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]',
                ) || []),
            ];
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            }
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = old;
            document.removeEventListener('keydown', handleKeyDown);
            previous?.focus();
        };
    }, []);

    return (
        <div className="dx-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <section
                ref={ref}
                className={`dx-modal ${wide ? 'wide' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="dx-modal-title"
            >
                <header>
                    <h2 id="dx-modal-title">{title}</h2>
                    <button className="dx-icon-button" aria-label="Đóng hộp thoại" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>
                <div className="dx-modal-content">{children}</div>
            </section>
        </div>
    );
}

export default Modal;
