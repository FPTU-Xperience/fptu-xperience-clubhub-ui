import { Link, Outlet } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import { getAdminAppUrl, isAffairsViewer } from '../affairs-access';

export function AffairsAccess({ user }) {
    return isAffairsViewer(user) ? (
        <Outlet />
    ) : (
        <div className="v2-public-content">
            <PageState status="forbidden" />
        </div>
    );
}

const sections = {
    activities: {
        title: 'Hoạt động cấp trường',
        description: 'Quan sát các hoạt động do nhà trường tổ chức và nội dung hiển thị cho sinh viên.',
        emptyTitle: 'Hoạt động cấp trường chưa khả dụng',
        emptyDescription: 'Hiện chưa thể hiển thị riêng danh sách hoạt động cấp trường.',
        link: '/v2/activities',
        linkLabel: 'Xem tất cả hoạt động',
    },
    rewards: {
        title: 'Phần thưởng cấp trường',
        description: 'Quan sát danh mục phần thưởng và điều kiện nhận dành cho sinh viên toàn trường.',
        emptyTitle: 'Phần thưởng cấp trường chưa khả dụng',
        emptyDescription: 'Danh mục và điều kiện nhận thưởng sẽ hiển thị khi được hệ thống cung cấp.',
    },
    admin: {
        title: 'Trang quản trị',
        description: 'Xét duyệt hồ sơ và thực hiện nghiệp vụ quản lý tại FPTUX Admin.',
        emptyTitle: 'Liên kết trang quản trị chưa khả dụng',
        emptyDescription: 'Bạn có thể tiếp tục truy cập FPTUX Admin bằng địa chỉ do nhà trường cung cấp.',
    },
};

export default function AffairsPage({ section }) {
    const content = sections[section];
    const adminUrl =
        section === 'admin'
            ? getAdminAppUrl({ override: import.meta.env.VITE_ADMIN_APP_URL, development: import.meta.env.DEV })
            : null;
    return (
        <div className="v2-public-content v2-activities-page">
            <header>
                <span className="v2-eyebrow">CÔNG TÁC SINH VIÊN</span>
                <h1>{content.title}</h1>
                <p>{content.description}</p>
            </header>
            {adminUrl ? (
                <a className="v2-button" href={adminUrl} target="_blank" rel="noopener noreferrer">
                    Mở FPTUX Admin ↗
                </a>
            ) : (
                <PageState status="empty" title={content.emptyTitle} description={content.emptyDescription} />
            )}
            {content.link && (
                <Link className="v2-button" to={content.link}>
                    {content.linkLabel}
                </Link>
            )}
        </div>
    );
}
