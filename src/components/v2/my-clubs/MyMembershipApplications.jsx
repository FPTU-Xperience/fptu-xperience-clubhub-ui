import { useEntityMedia } from '../../media/EntityMediaContext';

const labels = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', WITHDRAWN: 'Đã rút đơn' };

function ApplicationLogo({ club: input }) {
    const club = useEntityMedia('club', input);
    return club.logoUrl ? <img src={club.logoUrl} alt="" /> : <span className="v2-my-application-club-code" title={club.clubCode}>{club.clubCode}</span>;
}

export default function MyMembershipApplications({
    applications,
    withdrawingId,
    onWithdraw,
    acceptingId,
    onAcceptInvitation,
    invitations = false,
}) {
    return (
        <section className="v2-my-applications">
            <div className="v2-my-applications-header">
                <h2>{invitations ? 'Lời mời tham gia CLB' : 'Đơn tham gia của tôi'}</h2>
                <p>
                    {invitations
                        ? 'Xem và phản hồi lời mời từ các câu lạc bộ.'
                        : 'Đơn đang chờ duyệt và kết quả duyệt trong 7 ngày gần đây.'}
                </p>
            </div>
            {applications.length ? (
                applications.map((item) => (
                    <div className="v2-my-application" key={item.applicationId}>
                        <div className="v2-my-club-mark" aria-hidden="true">
                            <ApplicationLogo club={item.club} />
                        </div>
                        <div>
                            <strong>{item.club.name}</strong>
                            {item.canAcceptInvitation ? (
                                <p>CLB mời bạn tham gia. Hãy xem thông tin và xác nhận nội quy trước khi chấp nhận.</p>
                            ) : (
                                item.reason && <p>{item.reason}</p>
                            )}
                        </div>
                        <span className={`v2-my-application-status is-${item.status.toLowerCase()}`}>
                            {item.canAcceptInvitation ? 'Lời mời tham gia' : labels[item.status]}
                        </span>
                        {item.canAcceptInvitation && (
                            <button
                                className="v2-button v2-button--primary"
                                type="button"
                                disabled={Boolean(acceptingId)}
                                onClick={() => onAcceptInvitation(item)}
                            >
                                {acceptingId === item.applicationId ? 'Đang mở…' : 'Xem lời mời'}
                            </button>
                        )}
                        {item.status === 'PENDING' && !item.canAcceptInvitation && (
                            <div className="v2-my-application-withdraw">
                                <button
                                    className="v2-button"
                                    type="button"
                                    disabled={!item.canWithdraw || Boolean(withdrawingId)}
                                    onClick={() => onWithdraw(item.applicationId)}
                                >
                                    {withdrawingId === item.applicationId ? 'Đang rút...' : 'Rút đơn'}
                                </button>
                            </div>
                        )}
                    </div>
                ))
            ) : (
                <p className="v2-muted">
                    {invitations
                        ? 'Bạn chưa có lời mời tham gia nào.'
                        : 'Bạn không có đơn chờ duyệt hoặc kết quả duyệt trong 7 ngày gần đây.'}
                </p>
            )}
        </section>
    );
}
