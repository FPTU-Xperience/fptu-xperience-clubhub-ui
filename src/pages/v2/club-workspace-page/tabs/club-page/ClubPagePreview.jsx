import { Camera, CalendarDays, Image, Mail, Pencil, Phone } from 'lucide-react';
import { CLUB_CATEGORY_LABELS } from './club-page-fields';
import { displayClubSchedule } from './club-schedule-data';

function EditButton({ label, onClick, disabled }) {
    return (
        <button className="club-page-edit-button" type="button" onClick={onClick} aria-label={label} disabled={disabled}>
            <Pencil size={15} aria-hidden="true" />
            <span>Chỉnh sửa thông tin</span>
        </button>
    );
}

export default function ClubPagePreview({ club, logo, cover, manager, onEdit, disabled = false }) {
    return (
        <article className="club-page-preview" aria-label="Xem trước trang CLB">
            <div className="club-page-preview-heading">
                <span className="v2-eyebrow">XEM TRƯỚC TRANG CÔNG KHAI</span>
            </div>
            <div className="club-page-preview-surface">
                <div className="club-page-preview-cover">
                    {cover ? (
                        <img src={cover} alt="Ảnh bìa CLB" />
                    ) : (
                        <div className="club-page-cover-empty">
                            <Image size={38} aria-hidden="true" />
                            <span>Thêm ảnh bìa cho câu chuyện của CLB</span>
                        </div>
                    )}
                    {manager && (
                        <button className="club-page-change-cover" type="button" onClick={() => onEdit('cover')} disabled={disabled}>
                            <Camera size={17} aria-hidden="true" /> Đổi ảnh bìa
                        </button>
                    )}
                </div>
                <div className="club-page-preview-body">
                    <div className="club-page-identity">
                        <div className="club-page-logo-wrap">
                            <div className="club-page-preview-logo">
                                {logo ? (
                                    <img src={logo} alt="Logo CLB" />
                                ) : (
                                    (club.name || 'CLB').slice(0, 2).toUpperCase()
                                )}
                            </div>
                            {manager && (
                                <button
                                    className="club-page-change-logo"
                                    type="button"
                                    onClick={() => onEdit('logo')}
                                    aria-label="Đổi logo CLB"
                                    title="Đổi logo CLB"
                                    disabled={disabled}
                                >
                                    <Camera size={16} aria-hidden="true" />
                                </button>
                            )}
                        </div>
                        <div className="club-page-identity-copy">
                            <span className="club-page-category">
                                {CLUB_CATEGORY_LABELS[club.category] || club.category || 'Câu lạc bộ'}
                            </span>
                            <div className="club-page-name-row">
                                <h2>{club.name}</h2>
                                {manager && (
                                    <EditButton label="Chỉnh sửa thông tin CLB" onClick={() => onEdit('info')} disabled={disabled} />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="club-page-preview-details">
                        <section className="club-page-about">
                            <header>
                                <h3>Giới thiệu CLB</h3>
                            </header>
                            <p>
                                {club.description ||
                                    'Chưa có thông tin giới thiệu. Hãy chia sẻ câu chuyện và những điều CLB hướng tới.'}
                            </p>
                        </section>
                        <div className="club-page-sidebar">
                            <section>
                                <header>
                                    <h3>Liên hệ</h3>
                                </header>
                                <dl>
                                    <div>
                                        <dt>
                                            <Mail size={16} aria-hidden="true" />
                                            Email
                                        </dt>
                                        <dd>{club.contactEmail || 'Chưa cập nhật'}</dd>
                                    </div>
                                    <div>
                                        <dt>
                                            <Phone size={16} aria-hidden="true" />
                                            Điện thoại
                                        </dt>
                                        <dd>{club.contactPhone || 'Chưa cập nhật'}</dd>
                                    </div>
                                </dl>
                            </section>
                            <section>
                                <header>
                                    <h3>
                                        <CalendarDays size={18} aria-hidden="true" />
                                        Lịch sinh hoạt
                                    </h3>
                                </header>
                                <p>{displayClubSchedule(club.scheduleLabel) || 'Chưa cập nhật lịch sinh hoạt.'}</p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}
