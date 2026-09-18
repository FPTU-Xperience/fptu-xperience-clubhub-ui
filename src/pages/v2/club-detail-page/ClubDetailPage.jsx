import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ClubLogo, ClubMark, Pill } from '../../../components/v2/DiscoveryLayout';
import PageState from '../../../components/v2/PageState';
import { useClubDetail } from '../discover-data';
import './ClubDetailPage.scss';

export default function ClubDetailPage({ api, viewerAccess, sessionKey }) {
    const { clubId } = useParams();
    const result = useClubDetail(api, clubId, viewerAccess, sessionKey);
    const club = result.data;
    return (
        <div className="v2-public-content">
            <Link to="/v2/clubs" className="v2-back">
                <ArrowLeft size={16} /> Tất cả câu lạc bộ
            </Link>
            <PageState status={result.status} onRetry={result.retry}>
                {club && (
                    <>
                        <div className="v2-detail-cover">
                            {club.coverImageUrl ? (
                                <img src={club.coverImageUrl} alt="" />
                            ) : (
                                <ClubLogo club={club} hero />
                            )}
                        </div>
                        <div className="v2-club-identity">
                            <ClubMark club={club} large />
                            <div>
                                <div className="v2-inline">
                                    <Pill>{club.category || 'Chưa phân loại'}</Pill>
                                    <Pill tone={club.isRecruiting ? 'orange' : ''}>
                                        {club.hasRecruitmentStatus
                                            ? club.isRecruiting
                                                ? 'Đang tuyển thành viên'
                                                : 'Chưa mở tuyển'
                                            : 'Trạng thái tuyển đang cập nhật'}
                                    </Pill>
                                </div>
                                <h1>{club.fullName}</h1>
                                <p>{club.tagline}</p>
                            </div>
                        </div>
                        <div className="v2-detail-columns">
                            <div>
                                <section className="v2-panel">
                                    <span className="v2-eyebrow">CHÚNG MÌNH LÀ AI?</span>
                                    <h2>Một nơi để cùng nhau phát triển.</h2>
                                    <p className="v2-body-large">
                                        {club.description || 'Thông tin giới thiệu đang được cập nhật.'}
                                    </p>
                                    <p>
                                        Thông tin trên trang này đến từ nguồn dữ liệu ClubHub được phép hiển thị cho tài
                                        khoản của bạn.
                                    </p>
                                    <div className="v2-inline">
                                        {club.tags.map((tag) => (
                                            <Pill key={tag}>{tag}</Pill>
                                        ))}
                                    </div>
                                </section>
                                <section className="v2-panel">
                                    <h2>Bạn sẽ tìm thấy gì ở đây?</h2>
                                    <div className="v2-benefits">
                                        {[
                                            [
                                                '01',
                                                'Học từ trải nghiệm',
                                                'Thử sức trong các hoạt động và dự án có đầu ra cụ thể.',
                                            ],
                                            [
                                                '02',
                                                'Những người bạn đồng hành',
                                                'Kết nối với các thành viên cùng sở thích.',
                                            ],
                                            ['03', 'Ghi nhận từng đóng góp', 'Lưu lại vai trò, sản phẩm và tiến bộ.'],
                                        ].map(([number, title, text]) => (
                                            <div key={number}>
                                                <span>{number}</span>
                                                <h3>{title}</h3>
                                                <p>{text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                            <aside>
                                <section className="v2-panel">
                                    <h3>Hẹn gặp bạn tại CLB</h3>
                                    <Info
                                        icon={CalendarDays}
                                        label="Lịch sinh hoạt"
                                        value={club.scheduleLabel || 'Đang cập nhật'}
                                    />
                                    <Info
                                        icon={MapPin}
                                        label="Địa điểm"
                                        value={club.locationLabel || 'Đang cập nhật'}
                                    />
                                    <Info
                                        icon={Users}
                                        label="Thành viên"
                                        value={
                                            club.memberCount === null
                                                ? 'Đang cập nhật'
                                                : `${club.memberCount} thành viên`
                                        }
                                    />
                                    {club.contact.email && (
                                        <Info icon={Mail} label="Email" value={club.contact.email} />
                                    )}
                                    {club.contact.phone && (
                                        <Info icon={Phone} label="Điện thoại" value={club.contact.phone} />
                                    )}
                                </section>
                                <div className="v2-small-note">
                                    Chỉ thông tin công khai được phép mới hiển thị trên trang này.
                                </div>
                            </aside>
                        </div>
                    </>
                )}
            </PageState>
        </div>
    );
}

function Info({ icon: Icon, label, value }) {
    return (
        <div className="v2-info-row">
            <Icon />
            <div>
                <small>{label}</small>
                <strong>{value}</strong>
            </div>
        </div>
    );
}
