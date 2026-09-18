import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { dateLabel } from '../ui/formatters';
import { Pill } from '../ui/Pill';

export function EventCard({ event, club, base, registered, onOpen }) {
    const formattedDate = dateLabel(event.date);
    const day = formattedDate.slice(0, 2);
    const month = formattedDate.slice(3);

    return (
        <article className="dx-event-card">
            <div className="dx-date-block">
                <strong>{day}</strong>
                <span>THÁNG {month}</span>
            </div>
            <div className="dx-event-copy">
                <div className="dx-inline">
                    <span className="dx-overline">{club?.name}</span>
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

export default EventCard;
