import { Link, useLocation, useParams } from 'react-router-dom';
import { mapActivityFeedItem, useActivityFeed } from '../activity-data';
import PageState from '../../../components/v2/PageState';
import './ActivitiesPage.scss';
import './ActivityDetailPage.scss';
import '../../../components/v2/activity-detail/ActivityDetail.scss';

export default function ActivityDetailPage({ api, sessionKey }) {
    const { activityId } = useParams();
    const location = useLocation(); const result = useActivityFeed(api, sessionKey);
    const activity = mapActivityFeedItem(location.state?.activity || {}) || result.data?.find((item) => item.id === activityId);
    if (!activity && result.status !== 'populated') return <div className="v2-public-content"><PageState status={result.status} onRetry={result.retry}/></div>;
    if (!activity) return <div className="v2-public-content v2-activities-page"><h1>Không tìm thấy hoạt động</h1><Link className="v2-button" to="/v2/activities">Quay lại hoạt động</Link></div>;
    return <div className="v2-public-content v2-activities-page v2-activity-detail-page"><Link className="v2-text-link" to="/v2/activities">← Quay lại hoạt động</Link><section><span className="v2-activity-pill">{activity.status === 'LIVE' ? 'Đang diễn ra' : 'Sắp diễn ra'}</span><h1>{activity.title}</h1><p className="v2-activity-description">{activity.description}</p><div className="v2-activity-facts"><span>{activity.startTime ? new Date(activity.startTime).toLocaleString('vi-VN') : 'Đang cập nhật thời gian'}</span><span>{activity.location || 'Địa điểm đang cập nhật'}</span></div><aside className="v2-activity-prepare"><h3>Bạn cần chuẩn bị gì?</h3><p>Đến trước 10 phút, mang thẻ sinh viên và tinh thần sẵn sàng trải nghiệm.</p></aside><Link className="v2-button" to={`/v2/clubs/${activity.clubId}`}>Xem CLB</Link></section></div>;
}
