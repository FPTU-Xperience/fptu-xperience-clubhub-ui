import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './V2Modal.scss';

export default function V2Modal({ title, children, onClose, wide = false }) {
    const dialogRef = useRef(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        dialogRef.current?.querySelector('button:not(:disabled), input, textarea, select, a[href]')?.focus();

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeRef.current();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = [
                ...(dialogRef.current?.querySelectorAll(
                    'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]',
                ) || []),
            ];
            const first = focusable[0];
            const last = focusable.at(-1);
            if (!first || !last) return;
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
            previouslyFocused?.focus?.();
        };
    }, []);

    return (
        <div className="v2-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section
                ref={dialogRef}
                className={`v2-modal${wide ? ' v2-modal--wide' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="v2-modal-title"
            >
                <header className="v2-modal-header">
                    <h2 id="v2-modal-title">{title}</h2>
                    <button type="button" className="v2-modal-close" onClick={onClose} aria-label="Đóng hộp thoại">
                        <X size={21} />
                    </button>
                </header>
                <div className="v2-modal-content">{children}</div>
            </section>
        </div>
    );
}
