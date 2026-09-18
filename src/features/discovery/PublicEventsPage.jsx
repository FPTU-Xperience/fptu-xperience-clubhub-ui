import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { CURRENT_TERM, clubById, membership } from '../../core/model';
import { useClubHub } from '../../context/ClubHubContext';
import { ClubArt } from '../../components/club/ClubArt';
import { EventCard } from '../../components/club/EventCard';
import { PageHeading } from '../../components/ui/Headings';
import { SearchField } from '../../components/ui/SearchField';
import { Empty } from '../../components/ui/Empty';

export function PublicEventsPage() {
    const { state, actorId, basePath = '' } = useClubHub();
    const [query, setQuery] = useState('');

    const events = state.activities.filter(
        (a) => a.public && a.term === CURRENT_TERM && a.title.toLowerCase().includes(query.toLowerCase()),
    );

    return (
        <div className="dx-public-content">
            <PageHeading
                eyebrow="THÊM MỘT TRẢI NGHIỆM MỚI"
                title="Có gì đang diễn ra?"
                description="Những hoạt động công khai từ các cộng đồng tại FPTU."
            />
            <SearchField value={query} onChange={setQuery} placeholder="Tìm hoạt động theo tên hoặc nội dung..." />
            <div className="dx-event-directory">
                {events.map((e) => {
                    const club = clubById(e.clubId);
                    const hasAccess = membership(state, actorId, e.clubId);
                    const detailUrl = hasAccess
                        ? `${basePath}/my-clubs/${e.clubId}/activities`.replace(/^\/\//, '/')
                        : `${basePath}/clubs/${e.clubId}`.replace(/^\/\//, '/');

                    return (
                        <div className="dx-panel" key={e.id}>
                            <ClubArt club={club} />
                            <EventCard event={e} club={club} base={detailUrl} />
                            <p>{e.description}</p>
                            <Link className="dx-text-link" to={detailUrl}>
                                {hasAccess ? 'Xem và đăng ký trong CLB' : 'Tìm hiểu CLB để tham gia'}{' '}
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    );
                })}
            </div>
            {!events.length && <Empty title="Không tìm thấy hoạt động" />}
        </div>
    );
}

export default PublicEventsPage;
