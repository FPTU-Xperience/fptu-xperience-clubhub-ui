import { ArrowRight, ArrowUpRight, CalendarDays, Compass, Heart, Search, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { useEntityMedia } from '../media/EntityMediaContext';
import { Link } from 'react-router-dom';
import './DiscoveryLayout.scss';
import './ClubArt.scss';

export function SectionHeading({ title, description, children }) {
    return (
        <div className="v2-discovery-section-heading">
            <div>
                <h2>{title}</h2>
                {description && <p>{description}</p>}
            </div>
            {children}
        </div>
    );
}

export function SearchField({ value, onChange, placeholder = 'Tìm kiếm...' }) {
    return (
        <label className="v2-discovery-search">
            <Search size={18} />
            <input
                aria-label="Tìm kiếm"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
            />
        </label>
    );
}

export function EmptyState({ title = 'Chưa có nội dung', text, children }) {
    return (
        <div className="v2-discovery-empty">
            <Compass size={34} />
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}

export function Pill({ children, tone = '' }) {
    return <span className={`v2-discovery-pill ${tone}`}>{children}</span>;
}

export function ClubMark({ club, large = false }) {
    return (
        <span className={`v2-discovery-mark ${large ? 'large' : ''}`} style={{ '--club': club.color }}>
            {club.mark}
        </span>
    );
}

export function ClubArt({ club, hero = false }) {
    const palette = [...String(club.id ?? club.name)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
    return (
        <div className={`v2-club-banner v2-club-art v2-club-art--${palette} ${hero ? 'hero' : ''}`} aria-hidden="true">
            <strong>{club.name}</strong>
        </div>
    );
}

export function ClubLogo({ club: input, hero = false }) {
    const club = useEntityMedia('club', input);
    const [failedUrl, setFailedUrl] = useState('');
    if (!club.logoUrl || failedUrl === club.logoUrl) return <ClubArt club={club} hero={hero} />;

    return (
        <div className={`v2-club-banner v2-club-logo ${hero ? 'hero' : ''}`}>
            <img src={club.logoUrl} alt={`Logo ${club.name}`} onError={() => setFailedUrl(club.logoUrl)} />
        </div>
    );
}

export function DiscoverHero({ campus = 'FPTU' }) {
    return (
        <>
            <section className="v2-discovery-hero">
                <div className="v2-discovery-hero-copy">
                    <div className="v2-discovery-eyebrow">
                        <span className="v2-discovery-live-dot" /> MỘT CAMPUS. NHIỀU CÁCH TỎA SÁNG.
                    </div>
                    <h1>
                        Tìm cộng đồng.
                        <br />
                        <span>Viết câu chuyện của bạn.</span>
                    </h1>
                    <p>
                        Những người bạn mới, những điều chưa từng thử.
                        <br />
                        Hành trình đại học đáng nhớ bắt đầu từ một câu lạc bộ.
                    </p>
                    <a href="#club-directory" className="v2-discovery-button primary">
                        Khám phá các CLB <ArrowRight size={18} />
                    </a>
                    <div className="v2-discovery-hero-note">
                        <div className="v2-discovery-avatar-stack">
                            <span>KL</span>
                            <span>NM</span>
                            <span>HA</span>
                        </div>
                        <div>
                            <strong>Mỗi cá tính, một nơi thuộc về.</strong>
                            <small>Cộng đồng sinh viên {campus}</small>
                        </div>
                    </div>
                </div>
                <div className="v2-discovery-hero-collage" aria-hidden="true">
                    <div className="v2-discovery-collage-note">
                        YOUR NEXT
                        <br />
                        <em>chapter.</em>
                        <Sparkles size={38} />
                    </div>
                    <div className="v2-discovery-collage-ticket">
                        <span>THE CAMPUS PASS</span>
                        <strong>
                            Explore.
                            <br />
                            Connect.
                            <br />
                            Belong.
                        </strong>
                        <div className="v2-discovery-ticket-line" />
                        <small>FPTU XPERIENCE &nbsp; / &nbsp; YOUR CAMPUS COMMUNITY</small>
                    </div>
                    <div className="v2-discovery-floating-tag">
                        <Heart size={17} /> Những điều hay đang chờ bạn
                    </div>
                    <div className="v2-discovery-circle-label">
                        BE PART
                        <br />
                        OF SOMETHING
                    </div>
                </div>
            </section>
            <div className="v2-discovery-strip">
                <span>
                    <Compass size={18} />
                    Khám phá theo sở thích
                </span>
                <span>
                    <CalendarDays size={18} />
                    Tìm lịch sinh hoạt phù hợp
                </span>
                <span>
                    <Users size={18} />
                    Kết nối với cộng đồng của bạn
                </span>
            </div>
        </>
    );
}

export function BottomCallout() {
    return (
        <section className="v2-discovery-bottom-callout">
            <div>
                <span className="v2-discovery-eyebrow">KHÁM PHÁ THÊM CỘNG ĐỒNG</span>
                <h2>Nếu vẫn chưa thấy CLB phù hợp, xem nhiều hơn tại đây.</h2>
                <p>Khám phá toàn bộ câu lạc bộ để tìm cộng đồng phù hợp với sở thích của bạn.</p>
            </div>
            <Link className="v2-discovery-button" to="/v2/clubs">
                Xem tất cả câu lạc bộ <ArrowUpRight size={18} />
            </Link>
        </section>
    );
}
