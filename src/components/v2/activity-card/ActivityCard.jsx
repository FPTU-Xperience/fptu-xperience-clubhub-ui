import { useState } from 'react';
import { ArrowUpRight, CalendarDays, Clock3, MapPin } from 'lucide-react';
import GraphicBanner from '../../media/GraphicBanner';
import { defaultGraphicBanner, ACTIVITY_BANNER_SIZE } from '../../media/graphic-banner';
import { useEntityMedia } from '../../media/EntityMediaContext';
import './ActivityCard.scss';

const statuses = {
    SCHEDULED: ['upcoming', 'Sắp diễn ra'],
    UPCOMING: ['upcoming', 'Sắp diễn ra'],
    LIVE: ['live', 'Đang diễn ra'],
    COMPLETED: ['completed', 'Đã hoàn thành'],
    CANCELLED: ['cancelled', 'Đã hủy'],
};

export default function ActivityCard({ activity: input, onOpen, variant = 'poster', publicationLabel }) {
    const activity = useEntityMedia('activity', input);
    const [failedImage, setFailedImage] = useState(null);
    const date = new Date(activity.startTime || '');
    const hasDate = Number.isFinite(date.getTime());
    const [tone, label] = statuses[String(activity.status).toUpperCase()] || ['unknown', 'Đang cập nhật'];
    const dateLabel = hasDate
        ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'Thời gian đang cập nhật';
    const timeLabel = hasDate ? date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
    const palette = [...String(activity.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
    const schedule = variant === 'schedule';
    return (
        <article className={`v2-event-card is-${tone}${schedule ? ' v2-event-card--schedule' : ''}`}>
            {schedule ? (
                <div className={`v2-event-date-tile is-${tone}`} aria-hidden="true">
                    <CalendarDays className="v2-event-date-tile-icon" size={18} strokeWidth={2} />
                    <strong>{hasDate ? String(date.getDate()).padStart(2, '0') : '—'}</strong>
                    <span>{hasDate ? `THÁNG ${String(date.getMonth() + 1).padStart(2, '0')}` : 'CHƯA CÓ LỊCH'}</span>
                </div>
            ) : (
                <div className={`v2-event-art v2-event-art--${palette}`}>
                    {activity.coverImageUrl && failedImage !== activity.coverImageUrl ? (
                        <img
                            src={activity.coverImageUrl}
                            alt=""
                            loading="lazy"
                            onError={() => setFailedImage(activity.coverImageUrl)}
                        />
                    ) : (
                        <GraphicBanner size={ACTIVITY_BANNER_SIZE} preserveAspectRatio="xMinYMid slice" design={defaultGraphicBanner('activity')} label={`Banner ${activity.title}`} />
                    )}
                    <span className={`v2-event-status is-${tone}`}>{label}</span>
                </div>
            )}
            <div className="v2-event-body">
                <div className="v2-event-info">
                    <div className="v2-event-organizer">
                        <span>{activity.clubName || 'Hoạt động CLB'}</span>
                        {activity.isInternal === true && <span className="v2-event-status">Nội bộ CLB</span>}
                        {schedule && <span className={`v2-event-status is-${tone}`}>{label}</span>}
                    </div>
                    <h3>{activity.title}</h3>
                    {publicationLabel && <span className="v2-event-publication">{publicationLabel}</span>}
                    <div className="v2-event-facts">
                        {schedule && (
                            <span>
                                <CalendarDays size={16} />
                                <time dateTime={hasDate ? date.toISOString() : undefined}>{dateLabel}</time>
                                {timeLabel && (
                                    <span className="v2-event-time">
                                        <Clock3 size={14} />
                                        {timeLabel}
                                    </span>
                                )}
                            </span>
                        )}
                        {!schedule && timeLabel && (
                            <span className="v2-event-time">
                                <Clock3 size={14} />
                                {timeLabel}
                            </span>
                        )}
                        <span>
                            <MapPin size={16} />
                            <span className="v2-event-location">{activity.location || 'Địa điểm đang cập nhật'}</span>
                        </span>
                    </div>
                </div>
                {!schedule && (
                    <time
                        className={`v2-event-calendar is-${tone}`}
                        dateTime={hasDate ? date.toISOString() : undefined}
                        aria-label={hasDate ? `${dateLabel}, ${timeLabel}` : dateLabel}
                    >
                        <span className="v2-event-calendar-sheet">
                            <strong>{hasDate ? String(date.getDate()).padStart(2, '0') : '—'}</strong>
                            <span className="v2-event-calendar-month">
                                {hasDate ? `THÁNG ${String(date.getMonth() + 1).padStart(2, '0')}` : 'CHƯA CÓ LỊCH'}
                            </span>
                        </span>
                    </time>
                )}
                <div className="v2-event-actions">
                    <button
                        className="v2-event-open"
                        type="button"
                        aria-label={`Chi tiết ${activity.title}`}
                        onClick={() => onOpen(activity)}
                    >
                        <span>Xem chi tiết</span>
                        <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>
        </article>
    );
}
