import GraphicBanner from '../../media/GraphicBanner';
import { defaultGraphicBanner, ACTIVITY_BANNER_SIZE } from '../../media/graphic-banner';
import { useEntityMedia } from '../../media/EntityMediaContext';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';
import './ActivityProfileLayout.scss';

const statuses = {
    UPCOMING: ['upcoming', 'Sắp diễn ra'],
    SCHEDULED: ['upcoming', 'Sắp diễn ra'],
    LIVE: ['live', 'Đang diễn ra'],
    COMPLETED: ['completed', 'Đã hoàn thành'],
    CANCELLED: ['cancelled', 'Đã hủy'],
};
export default function ActivityProfileLayout({
    activity: input,
    tabs,
    tab,
    onTabChange,
    actions,
    coverAction,
    beforeTabs,
    children,
    preview = false,
}) {
    const activity = useEntityMedia('activity', input, { preview });
    const [tone, label] = statuses[activity.status] || ['unknown', 'Đang cập nhật'];
    const date = new Date(activity.startTime || '');
    const valid = Number.isFinite(date.getTime());
    return (
        <div className="v2-activity-profile">
            <div className="v2-activity-profile-cover">
                {activity.coverImageUrl ? (
                    <img src={activity.coverImageUrl} alt={`Ảnh bìa ${activity.title}`} />
                ) : (
                    <GraphicBanner
                        size={ACTIVITY_BANNER_SIZE}
                        preserveAspectRatio="xMinYMid slice"
                        design={defaultGraphicBanner('activity')}
                        label={`Banner ${activity.title}`}
                    />
                )}
                {coverAction && <div className="v2-activity-profile-cover-action">{coverAction}</div>}
            </div>
            <header className="v2-activity-profile-identity">
                <div className={`v2-activity-profile-mark is-${tone}`} aria-hidden="true">
                    <CalendarDays size={27} />
                    <strong>{valid ? String(date.getDate()).padStart(2, '0') : '—'}</strong>
                    <span>{valid ? `THÁNG ${date.getMonth() + 1}` : 'HOẠT ĐỘNG'}</span>
                </div>
                <div className="v2-activity-profile-name">
                    <span className={`v2-event-status is-${tone}`}>{label}</span>
                    <h1>{activity.title}</h1>
                    <p>{activity.clubName}</p>
                </div>
                <div className="v2-activity-profile-actions">{actions}</div>
            </header>
            <div className="v2-activity-profile-quick-facts">
                <span>
                    <Clock3 size={16} />
                    {valid
                        ? date.toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                          })
                        : 'Thời gian đang cập nhật'}
                </span>
                <span>
                    <MapPin size={16} />
                    {activity.location || 'Địa điểm đang cập nhật'}
                </span>
            </div>
            {beforeTabs}
            <nav className="v2-activity-profile-tabs" aria-label="Nội dung hoạt động">
                {tabs.map(([id, text]) => (
                    <button
                        key={id}
                        type="button"
                        aria-pressed={tab === id}
                        className={tab === id ? 'is-active' : ''}
                        onClick={() => onTabChange(id)}
                    >
                        {text}
                    </button>
                ))}
            </nav>
            <div className="v2-activity-profile-content">{children}</div>
        </div>
    );
}

export function ActivityOverview({ activity, clubLink }) {
    const date = (value) =>
        value && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('vi-VN') : 'Đang cập nhật';
    return (
        <div className="v2-activity-profile-columns">
            <section className="v2-activity-profile-panel">
                <span className="v2-activity-section-kicker">VỀ HOẠT ĐỘNG</span>
                <h2>Thông tin chi tiết</h2>
                <p className="v2-activity-profile-description">
                    {activity.description || 'Nội dung hoạt động đang được cập nhật.'}
                </p>
            </section>
            <aside className="v2-activity-profile-panel">
                <h2>Lịch & địa điểm</h2>
                <dl>
                    <dt>Bắt đầu</dt>
                    <dd>{date(activity.startTime)}</dd>
                    <dt>Kết thúc</dt>
                    <dd>{date(activity.endTime)}</dd>
                    <dt>Địa điểm</dt>
                    <dd>{activity.location || 'Đang cập nhật'}</dd>
                    <dt>Đơn vị tổ chức</dt>
                    <dd>{activity.clubName}</dd>
                </dl>
                <section className="v2-activity-contact-point" aria-label="Đầu mối liên hệ">
                    <h2>Đầu mối liên hệ</h2>
                    {activity.contactPoint ? (
                        <>
                            <p className="v2-activity-contact-name">
                                {activity.contactPoint.displayName || 'Chưa cập nhật thông tin liên hệ'}
                            </p>
                            <p className="v2-activity-contact-source">
                                {activity.contactPoint.source === 'FIRST_HOST'
                                    ? 'Host được chỉ định đầu tiên'
                                    : 'Chủ tịch CLB · chưa chỉ định host'}
                            </p>
                            {activity.contactPoint.email && (
                                <a href={`mailto:${activity.contactPoint.email}`}>{activity.contactPoint.email}</a>
                            )}
                            {activity.contactPoint.phone && (
                                <a href={`tel:${activity.contactPoint.phone.replace(/[^\d+]/g, '')}`}>
                                    {activity.contactPoint.phone}
                                </a>
                            )}
                            {!activity.contactPoint.email && !activity.contactPoint.phone && (
                                <p>Chưa có email hoặc số điện thoại liên hệ.</p>
                            )}
                        </>
                    ) : (
                        <p>
                            Chưa đồng bộ đầu mối liên hệ. Hệ thống sẽ chọn host được chỉ định đầu tiên; khi chưa có host
                            sẽ dùng chủ tịch CLB.
                        </p>
                    )}
                </section>
                {clubLink}
            </aside>
        </div>
    );
}
