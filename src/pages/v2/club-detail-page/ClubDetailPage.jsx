import { ArrowLeft, CalendarDays, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ClubLogo, ClubMark, Pill } from '../../../components/v2/DiscoveryLayout';
import V2Modal from '../../../components/v2/common/modal/V2Modal';
import PageState from '../../../components/v2/PageState';
import { canJoinClub, useClubDetail } from '../discover-data';
import { useProfile } from '../profile-data';
import './ClubDetailPage.scss';

const joinProfile = (viewer, profileSnapshot) => ({
    fullName: profileSnapshot?.profile?.displayName || viewer?.name || '',
    dateOfBirth: profileSnapshot?.personal?.dateOfBirth || '',
    gender: '',
    email: viewer?.email || '',
    phoneNumber: profileSnapshot?.personal?.phoneNumber || '',
    address: profileSnapshot?.personal?.address || '',
    hobbies: profileSnapshot?.profile?.interests?.join(', ') || '',
    skills: profileSnapshot?.profile?.skills?.join(', ') || '',
    reason: '',
    expectations: '',
    contributions: '',
    message: '',
    acceptedClubRules: false,
    committedToParticipate: false,
});

export default function ClubDetailPage({ api, viewer, viewerAccess, sessionKey }) {
    const { clubCode } = useParams();
    const result = useClubDetail(api, clubCode, viewerAccess, sessionKey);
    const profileResult = useProfile(viewer, sessionKey);
    const club = result.data;
    const [joinOpen, setJoinOpen] = useState(false);
    const [rulesOpen, setRulesOpen] = useState(false);
    const [form, setForm] = useState(() => joinProfile(viewer));
    const [submitting, setSubmitting] = useState(false);
    const [joinError, setJoinError] = useState('');
    const [joined, setJoined] = useState(false);
    const updateForm = (event) => {
        const { name, type, checked, value } = event.target;
        setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    };
    const openJoin = () => {
        setForm(joinProfile(viewer, profileResult.data));
        setJoinError('');
        setJoinOpen(true);
    };
    const openRules = () => {
        setJoinOpen(false);
        setRulesOpen(true);
    };
    const closeRules = () => {
        setRulesOpen(false);
        setJoinOpen(true);
    };
    const submitJoin = async (event) => {
        event.preventDefault();
        const clubId = Number(club?.id);
        if (!Number.isSafeInteger(clubId) || clubId <= 0 || submitting) return;
        if (!form.fullName || !form.dateOfBirth || !form.email || !form.phoneNumber) {
            setJoinError('Hãy cập nhật ngày sinh và số điện thoại trong Hồ sơ cá nhân trước khi gửi hồ sơ.');
            return;
        }
        setSubmitting(true);
        setJoinError('');
        try {
            await api.joinClub(clubId, {
                fullName: form.fullName.trim(),
                dateOfBirth: form.dateOfBirth,
                gender: form.gender,
                email: form.email.trim(),
                phoneNumber: form.phoneNumber.trim(),
                address: form.address.trim() || null,
                hobbies: form.hobbies.trim() || null,
                skills: form.skills.trim() || null,
                reason: form.reason.trim(),
                expectations: form.expectations.trim() || null,
                contributions: form.contributions.trim() || null,
                additionalInfo: null,
                acceptedClubRules: form.acceptedClubRules,
                committedToParticipate: form.committedToParticipate,
                message: form.message.trim() || null,
            });
            setJoined(true);
            setJoinOpen(false);
        } catch (error) {
            setJoinError(error?.message || 'Không thể gửi hồ sơ lúc này. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };
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
                                <div className="v2-club-detail-actions">
                                    {joined ? (
                                        <p role="status">Hồ sơ đã được gửi, CLB sẽ phản hồi sớm.</p>
                                    ) : canJoinClub(club) ? (
                                        <button
                                            className="v2-button v2-button--primary"
                                            type="button"
                                            onClick={openJoin}
                                        >
                                            Nộp hồ sơ gia nhập
                                        </button>
                                    ) : null}
                                </div>
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
            {joinOpen && (
                <V2Modal title={`Gia nhập ${club.name}`} onClose={() => !submitting && setJoinOpen(false)} wide>
                    <form className="v2-club-join-form" onSubmit={submitJoin}>
                        <p>Hồ sơ sẽ được gửi đến ban chủ nhiệm CLB để xem xét.</p>
                        <p className="v2-club-join-profile">
                            <span>Thông tin hồ sơ đã được tự điền.</span>
                            <Link to="/v2/profile">Chỉnh sửa hồ sơ</Link>
                        </p>
                        <div className="v2-club-join-form-grid">
                            <label>
                                Họ và tên
                                <input value={form.fullName} readOnly maxLength="200" />
                            </label>
                            <label>
                                Ngày sinh
                                <input value={form.dateOfBirth} readOnly type="date" />
                            </label>
                            <label>
                                Email
                                <input value={form.email} readOnly type="email" maxLength="255" />
                            </label>
                            <label>
                                Số điện thoại
                                <input
                                    value={form.phoneNumber}
                                    readOnly
                                    inputMode="tel"
                                    placeholder="Cập nhật trong Hồ sơ cá nhân"
                                />
                            </label>
                            <label>
                                <span className="v2-club-join-field-label">Địa chỉ <small>(không bắt buộc)</small></span>
                                <input value={form.address} readOnly maxLength="500" />
                            </label>
                            <label>
                                <span className="v2-club-join-field-label">Giới tính <small aria-hidden="true">&nbsp;</small></span>
                                <select name="gender" value={form.gender} onChange={updateForm} required>
                                    <option value="">Chọn giới tính</option>
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </label>
                        </div>
                        <label>
                            Lý do bạn muốn tham gia
                            <textarea
                                name="reason"
                                value={form.reason}
                                onChange={updateForm}
                                maxLength="1000"
                                rows="4"
                                required
                            />
                        </label>
                        <div className="v2-club-join-form-grid">
                            <label>
                                <span className="v2-club-join-field-label">Sở thích <small>(lấy từ hồ sơ)</small></span>
                                <textarea value={form.hobbies} readOnly maxLength="1000" rows="3" />
                            </label>
                            <label>
                                <span className="v2-club-join-field-label">Kỹ năng <small>(lấy từ hồ sơ)</small></span>
                                <textarea value={form.skills} readOnly maxLength="1000" rows="3" />
                            </label>
                            <label>
                                <span className="v2-club-join-field-label">Kỳ vọng <small>(không bắt buộc)</small></span>
                                <textarea
                                    name="expectations"
                                    value={form.expectations}
                                    onChange={updateForm}
                                    maxLength="1000"
                                    rows="3"
                                />
                            </label>
                            <label>
                                <span className="v2-club-join-field-label">Đóng góp mong muốn <small>(không bắt buộc)</small></span>
                                <textarea
                                    name="contributions"
                                    value={form.contributions}
                                    onChange={updateForm}
                                    maxLength="1000"
                                    rows="3"
                                />
                            </label>
                        </div>
                        <label>
                            <span className="v2-club-join-field-label">Lời nhắn cho CLB <small>(không bắt buộc)</small></span>
                            <textarea
                                name="message"
                                value={form.message}
                                onChange={updateForm}
                                maxLength="1000"
                                rows="3"
                            />
                        </label>
                        <div className="v2-club-join-check">
                            <input
                                id="accepted-club-rules"
                                name="acceptedClubRules"
                                checked={form.acceptedClubRules}
                                onChange={updateForm}
                                type="checkbox"
                                required
                            />
                            <label htmlFor="accepted-club-rules">
                                Tôi đã đọc và đồng ý với{' '}
                                <button type="button" className="v2-club-rules-link" onClick={openRules}>
                                    Quy định câu lạc bộ
                                </button>
                                .
                            </label>
                        </div>
                        <label className="v2-club-join-check">
                            <input
                                name="committedToParticipate"
                                checked={form.committedToParticipate}
                                onChange={updateForm}
                                type="checkbox"
                                required
                            />{' '}
                            Tôi cam kết tham gia nghiêm túc khi hồ sơ được duyệt.
                        </label>
                        {joinError && (
                            <p className="v2-club-join-error" role="alert">
                                {joinError}
                            </p>
                        )}
                        <footer>
                            <button
                                className="v2-button"
                                type="button"
                                onClick={() => setJoinOpen(false)}
                                disabled={submitting}
                            >
                                Hủy
                            </button>
                            <button className="v2-button v2-button--primary" disabled={submitting}>
                                {submitting ? 'Đang gửi…' : 'Gửi hồ sơ'}
                            </button>
                        </footer>
                    </form>
                </V2Modal>
            )}
            {rulesOpen && (
                <V2Modal title={`Quy định tham gia ${club?.name || 'câu lạc bộ'}`} onClose={closeRules}>
                    <article className="v2-club-rules">
                        <p>
                            Quy định này áp dụng cho hồ sơ gia nhập CLB và có thể được ban chủ nhiệm làm rõ thêm khi
                            duyệt hồ sơ.
                        </p>
                        <ol>
                            <li>Thông tin trong hồ sơ cần chính xác và thuộc về chính người nộp.</li>
                            <li>Thành viên tôn trọng mọi người, nội quy trường và quy chế của CLB.</li>
                            <li>
                                Thành viên chủ động phản hồi, tham gia đúng cam kết và báo sớm khi không thể tham dự.
                            </li>
                            <li>
                                Ban chủ nhiệm có thể từ chối hoặc kết thúc tư cách thành viên khi có vi phạm nghiêm
                                trọng.
                            </li>
                        </ol>
                        <footer>
                            <button className="v2-button v2-button--primary" type="button" onClick={closeRules}>
                                Đã hiểu
                            </button>
                        </footer>
                    </article>
                </V2Modal>
            )}
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
