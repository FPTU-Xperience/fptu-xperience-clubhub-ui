import { ArrowRight, ArrowUpRight, CalendarDays, Compass, Heart, Search, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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

export function SearchField({ value, onChange, placeholder = 'Tìm kiếm...' }) {
    return (
        <label className="dx-search">
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
        <div className="dx-empty">
            <Compass size={34} />
            <h3>{title}</h3>
            <p>{text}</p>
            {children}
        </div>
    );
}

export function Pill({ children, tone = '' }) {
    return <span className={`dx-pill ${tone}`}>{children}</span>;
}

export function ClubMark({ club, large = false }) {
    return (
        <span className={`dx-mark ${large ? 'large' : ''}`} style={{ '--club': club.color }}>
            {club.mark}
        </span>
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
                {club.founded && (
                    <>
                        <br />
                        EST. {club.founded}
                    </>
                )}
            </span>
            <span className="dx-art-caption">{club.tagline}</span>
            <ArrowUpRight className="dx-art-arrow" size={28} />
        </div>
    );
}

export function ClubLogo({ club, hero = false }) {
    const [failedUrl, setFailedUrl] = useState('');
    if (!club.logoUrl || failedUrl === club.logoUrl) return <ClubArt club={club} hero={hero} />;

    return (
        <div className={`dx-art dx-club-logo ${hero ? 'hero' : ''}`}>
            <img src={club.logoUrl} alt={`Logo ${club.name}`} onError={() => setFailedUrl(club.logoUrl)} />
        </div>
    );
}

export function DiscoverHero() {
    return (
        <>
            <section className="dx-discover-hero">
                <div className="dx-hero-copy">
                    <div className="dx-eyebrow">
                        <span className="dx-live-dot" /> MỘT CAMPUS. NHIỀU CÁCH TỎA SÁNG.
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
                    <a href="#club-directory" className="dx-button primary">
                        Khám phá các CLB <ArrowRight size={18} />
                    </a>
                    <div className="dx-hero-note">
                        <div className="dx-avatar-stack">
                            <span>KL</span>
                            <span>NM</span>
                            <span>HA</span>
                        </div>
                        <div>
                            <strong>Mỗi cá tính, một nơi thuộc về.</strong>
                            <small>Cộng đồng sinh viên FPTU Hồ Chí Minh</small>
                        </div>
                    </div>
                </div>
                <div className="dx-hero-collage" aria-hidden="true">
                    <div className="dx-collage-note">
                        YOUR NEXT
                        <br />
                        <em>chapter.</em>
                        <Sparkles size={38} />
                    </div>
                    <div className="dx-collage-ticket">
                        <span>THE CAMPUS PASS</span>
                        <strong>
                            Explore.
                            <br />
                            Connect.
                            <br />
                            Belong.
                        </strong>
                        <div className="dx-ticket-line" />
                        <small>FPTU XPERIENCE &nbsp; / &nbsp; FALL 2026</small>
                    </div>
                    <div className="dx-floating-tag">
                        <Heart size={17} /> Những điều hay đang chờ bạn
                    </div>
                    <div className="dx-circle-label">
                        BE PART
                        <br />
                        OF SOMETHING
                    </div>
                </div>
            </section>
            <div className="dx-discovery-strip">
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
        <section className="dx-bottom-callout">
            <div>
                <span className="dx-eyebrow">KHÁM PHÁ THÊM CỘNG ĐỒNG</span>
                <h2>Nếu vẫn chưa thấy CLB phù hợp, xem nhiều hơn tại đây.</h2>
                <p>Khám phá toàn bộ câu lạc bộ để tìm cộng đồng phù hợp với sở thích của bạn.</p>
            </div>
            <Link className="dx-button" to="/v2/clubs">
                Xem tất cả câu lạc bộ <ArrowUpRight size={18} />
            </Link>
        </section>
    );
}
