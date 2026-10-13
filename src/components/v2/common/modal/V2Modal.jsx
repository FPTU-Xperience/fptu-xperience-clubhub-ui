import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import './V2Modal.scss';

const modalStack = [];
let originalBodyOverflow = '';

export default function V2Modal({ title, children, onClose, wide = false, className = '', footer }) {
    const dialogRef = useRef(null);
    const titleId = useId();
    const closeRef = useRef(onClose);
    const modalToken = useRef(Symbol('modal'));
    closeRef.current = onClose;

    useEffect(() => {
        const previouslyFocused = document.activeElement;
        if (!modalStack.length) originalBodyOverflow = document.body.style.overflow;
        const token = modalToken.current;
        const entry = { token, element: dialogRef.current };
        const descendant = modalStack.findIndex((item) => dialogRef.current?.contains(item.element));
        if (descendant === -1) modalStack.push(entry);
        else modalStack.splice(descendant, 0, entry);
        document.body.style.overflow = 'hidden';
        if (modalStack[modalStack.length - 1]?.token === token)
            dialogRef.current?.querySelector('button:not(:disabled), input, textarea, select, a[href]')?.focus();

        const onKeyDown = (event) => {
            if (modalStack[modalStack.length - 1]?.token !== token) return;
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
            const wasTop = modalStack[modalStack.length - 1]?.token === token;
            const index = modalStack.findIndex((item) => item.token === token);
            if (index !== -1) modalStack.splice(index, 1);
            document.body.style.overflow = modalStack.length ? 'hidden' : originalBodyOverflow;
            document.removeEventListener('keydown', onKeyDown);
            if (wasTop && document.contains(previouslyFocused)) previouslyFocused?.focus?.();
        };
    }, []);

    return (
        <div className="v2-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section
                ref={dialogRef}
                className={`v2-modal${wide ? ' v2-modal--wide' : ''}${className ? ` ${className}` : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <header className="v2-modal-header">
                    <h2 id={titleId}>{title}</h2>
                    <button type="button" className="v2-modal-close" onClick={onClose} aria-label="Đóng hộp thoại">
                        <X size={21} />
                    </button>
                </header>
                <div className="v2-modal-content">{children}</div>
                {footer && <footer className="v2-modal-footer">{footer}</footer>}
            </section>
        </div>
    );
}
