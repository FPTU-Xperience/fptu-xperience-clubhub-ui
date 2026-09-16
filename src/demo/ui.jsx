import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, MapPin, X, Check, ArrowRight, Search, Compass } from 'lucide-react';
import { useDemo } from './DemoContext';
import { membership } from './model';

export const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
export const dateLabel = (value) =>
    new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }).format(
        new Date(value),
    );
export function Avatar({ person, large = false }) {
    return (
        <span className={`dx-avatar ${large ? 'large' : ''}`} aria-hidden="true">
            {person?.initials ||
                person?.name
                    ?.split(' ')
                    .slice(-2)
                    .map((n) => n[0])
                    .join('') ||
                'TV'}
        </span>
    );
}
export function ClubMark({ club, large = false }) {
    return (
        <span className={`dx-mark ${large ? 'large' : ''}`} style={{ '--club': club.color }}>
            {club.mark}
        </span>
    );
}
export function Pill({ children, tone = '' }) {
    return <span className={`dx-pill ${tone}`}>{children}</span>;
}
export function PageHeading({ eyebrow, title, description, actions }) {
    return (
        <div className="dx-page-heading">
            <div>
                {eyebrow && <div className="dx-eyebrow">{eyebrow}</div>}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </div>
            {actions && <div className="dx-actions">{actions}</div>}
        </div>
    );
}
export function SectionHeading({ title, description, children }) {
    return (
        <div className="dx-section-heading">
            <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {children}
        </div>
    );
}
export function Empty({ title = 'Chưa có nội dung', text = 'Những cập nhật mới sẽ xuất hiện tại đây.', children }) {
    return (
        <div className="dx-empty">
            <Compass size={34} />
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}
export function SearchField({ value, onChange, placeholder = 'Tìm kiếm...', label = 'Tìm kiếm' }) {
    return (
        <label className="dx-search">
            <Search size={18} />
            <input
                aria-label={label}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}
export function ClubArt({ club, hero = false }) {
    return (
        <div className={`dx-art ${club.tone} ${hero ? 'hero' : ''}`} aria-hidden="true">
            <span className="dx-art-grid" />
            <span className="dx-art-orbit" />
            <span className="dx-art-orbit second" />
            <span className="dx-art-word">{club.mark}</span>
            <span className="dx-art-stamp">
                FPTU COMMUNITY
                <br />
                EST. {club.founded}
            </span>
            <span className="dx-art-caption">{club.tagline}</span>
            <ArrowUpRight className="dx-art-arrow" size={28} />
        </div>
    );
}
export function ClubCard({ club }) {
    const { state, actorId } = useDemo();
    const access = membership(state, actorId, club.id);
    const recruiting = state.settings[club.id]?.recruiting ?? club.recruiting;
    return (
        <article className="dx-club-card">
            <Link to={`/demo/clubs/${club.id}`} className="dx-art-link" aria-label={`Khám phá ${club.name}`}>
                <ClubArt club={club} />
            </Link>
            <div className="dx-club-card-body">
                <div className="dx-between">
                    <span className="dx-overline">{club.category}</span>
                    <Pill tone={access ? 'green' : recruiting ? 'orange' : ''}>
                        {access ? 'CLB của bạn' : recruiting ? 'Đang tuyển thành viên' : 'Chưa mở tuyển'}
                    </Pill>
                </div>
                <h3>
                    <Link to={`/demo/clubs/${club.id}`}>{club.name}</Link>
                </h3>
                <p>{state.settings[club.id]?.description || club.description}</p>
                <div className="dx-meta">
                    <CalendarDays size={15} />
                    {club.schedule}
                </div>
                <div className="dx-card-footer">
                    <span>{club.tags.slice(0, 2).join(' · ')}</span>
                    <Link to={`/demo/clubs/${club.id}`} className="dx-text-link">
                        Khám phá <ArrowUpRight size={16} />
                    </Link>
                </div>
            </div>
        </article>
    );
}
export function EventCard({ event, club, base, registered, onOpen }) {
    return (
        <article className="dx-event-card">
            <div className="dx-date-block">
                <strong>{dateLabel(event.date).slice(0, 2)}</strong>
                <span>THÁNG {dateLabel(event.date).slice(3)}</span>
            </div>
            <div className="dx-event-copy">
                <div className="dx-inline">
                    <span className="dx-overline">{club.name}</span>
                    <Pill tone={event.status === 'live' ? 'green' : ''}>
                        {event.status === 'live'
                            ? 'Đang diễn ra'
                            : event.status === 'completed'
                              ? 'Đã hoàn thành'
                              : 'Sắp diễn ra'}
                    </Pill>
                    {registered && <Pill tone="orange">Đã đăng ký</Pill>}
                </div>
                <h3>{event.title}</h3>
                <div className="dx-meta">
                    <MapPin size={14} />
                    {event.location}
                </div>
            </div>
            {onOpen ? (
                <button className="dx-icon-button" onClick={() => onOpen(event)} aria-label={`Chi tiết ${event.title}`}>
                    <ArrowUpRight size={20} />
                </button>
            ) : (
                <Link className="dx-icon-button" to={base} aria-label={`Chi tiết ${event.title}`}>
                    <ArrowUpRight size={20} />
                </Link>
            )}
        </article>
    );
}
export function Modal({ title, onClose, children, wide = false }) {
    const ref = useRef(null);
    const closeRef = useRef(onClose);
    closeRef.current = onClose;
    useEffect(() => {
        const previous = document.activeElement;
        const old = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ref.current?.querySelector('button, input, textarea, select')?.focus();
        const key = (e) => {
            if (e.key === 'Escape') closeRef.current();
            if (e.key !== 'Tab') return;
            const nodes = [
                ...(ref.current?.querySelectorAll(
                    'button:not(:disabled), a[href], input, textarea, select, [tabindex="0"]',
                ) || []),
            ];
            const first = nodes[0],
                last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last?.focus();
            }
            if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first?.focus();
            }
        };
        document.addEventListener('keydown', key);
        return () => {
            document.body.style.overflow = old;
            document.removeEventListener('keydown', key);
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
export function FormField({ label, name, value, onChange, textarea = false, ...props }) {
    const Element = textarea ? 'textarea' : 'input';
    return (
        <label className="dx-field">
            <span>{label}</span>
            <Element name={name} value={value} onChange={onChange} {...props} />
        </label>
    );
}
export function Stat({ label, value, note, icon: Icon }) {
    return (
        <div className="dx-stat">
            <div className="dx-between">
                <span>{label}</span>
                {Icon && <Icon size={18} />}
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
        </div>
    );
}
export function Toast() {
    const { toast, setToast } = useDemo();
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 5500);
        return () => clearTimeout(timer);
    }, [toast, setToast]);
    return (
        toast && (
            <div className={`dx-toast ${toast.error ? 'error' : ''}`} role={toast.error ? 'alert' : 'status'}>
                {toast.error ? <X size={20} /> : <Check size={20} />}
                <span>{toast.text}</span>
                <button aria-label="Đóng thông báo" onClick={() => setToast(null)}>
                    <X size={16} />
                </button>
            </div>
        )
    );
}
export function BackLink({ to, children }) {
    return (
        <Link to={to} className="dx-back">
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
            {children}
        </Link>
    );
}
