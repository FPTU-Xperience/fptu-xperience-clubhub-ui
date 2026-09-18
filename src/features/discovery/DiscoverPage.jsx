import React, { useMemo, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { CLUBS } from '../../core/model';
import { useClubHub } from '../../context/ClubHubContext';
import { ClubCard } from '../../components/club/ClubCard';
import { SearchField } from '../../components/ui/SearchField';
import { Empty } from '../../components/ui/Empty';

const CATEGORIES = [
    'Tất cả',
    'Học thuật & Công nghệ',
    'Truyền thông & Báo chí',
    'Văn hóa & Nghệ thuật',
    'Kỹ năng & Sự kiện',
];

export function DiscoverPage() {
    const { state } = useClubHub();
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('Tất cả');
    const [onlyRecruiting, setOnlyRecruiting] = useState(false);

    const clubs = useMemo(
        () =>
            CLUBS.filter(
                (c) =>
                    (category === 'Tất cả' || c.category === category) &&
                    (!onlyRecruiting || (state.settings[c.id]?.recruiting ?? c.recruiting)) &&
                    `${c.name} ${c.fullName} ${c.tags.join(' ')}`
                        .toLocaleLowerCase('vi')
                        .includes(query.toLocaleLowerCase('vi')),
            ),
        [query, category, onlyRecruiting, state.settings],
    );

    return (
        <div className="dx-public-content">
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
                </div>
            </section>

            <section id="club-directory" className="dx-directory-section">
                <div className="dx-directory-header">
                    <div>
                        <div className="dx-eyebrow">DANH MỤC CÂU LẠC BỘ</div>
                        <h2>Chọn không gian phù hợp với bạn</h2>
                    </div>
                    <div className="dx-directory-filters">
                        <SearchField
                            value={query}
                            onChange={setQuery}
                            placeholder="Tìm theo tên CLB, chuyên ngành, sở thích..."
                        />
                        <div className="dx-filter-pills">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    className={`dx-filter-pill ${category === cat ? 'active' : ''}`}
                                    onClick={() => setCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <label className="dx-checkbox-label">
                            <input
                                type="checkbox"
                                checked={onlyRecruiting}
                                onChange={(e) => setOnlyRecruiting(e.target.checked)}
                            />
                            <span>Chỉ hiện CLB đang tuyển thành viên</span>
                        </label>
                    </div>
                </div>

                {clubs.length ? (
                    <div className="dx-club-grid">
                        {clubs.map((c) => (
                            <ClubCard key={c.id} club={c} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        title="Không tìm thấy câu lạc bộ phù hợp"
                        text="Thử thay đổi từ khóa hoặc bộ lọc danh mục để tìm thấy các cộng đồng khác."
                    />
                )}
            </section>
        </div>
    );
}

export default DiscoverPage;
