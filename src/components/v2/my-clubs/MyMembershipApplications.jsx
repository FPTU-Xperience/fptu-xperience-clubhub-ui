const labels = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Chưa được duyệt', WITHDRAWN: 'Đã rút đơn' };

export default function MyMembershipApplications({
    applications,
    withdrawingId,
    onWithdraw,
    acceptingId,
    onAcceptInvitation,
}) {
    return (
        <section className="v2-my-applications">
            <div>
                <span className="v2-eyebrow">THEO DÕI HÀNH TRÌNH</span>
                <h2>Đơn tham gia và lời mời của tôi</h2>
                <p>Theo dõi phản hồi và lời mời từ các cộng đồng bạn quan tâm.</p>
            </div>
            {applications.length ? (
                applications.map((item) => (
                    <div className="v2-my-application" key={item.applicationId}>
                        <div className="v2-my-club-mark" aria-hidden="true">
                            {item.club.logoUrl ? (
                                <img src={item.club.logoUrl} alt="" />
                            ) : (
                                item.club.name.slice(0, 3).toUpperCase()
                            )}
                        </div>
                        <div>
                            <strong>{item.club.name}</strong>
                            {item.canAcceptInvitation ? (
                                <p>CLB mời bạn tham gia. Hãy xem thông tin và xác nhận nội quy trước khi chấp nhận.</p>
                            ) : (
                                item.reason && <p>{item.reason}</p>
                            )}
                        </div>
                        <span className="v2-my-application-status">
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
                        {item.canWithdraw && (
                            <button
                                className="v2-button"
                                type="button"
                                disabled={withdrawingId === item.applicationId}
                                onClick={() => onWithdraw(item.applicationId)}
                            >
                                {withdrawingId === item.applicationId ? 'Đang rút...' : 'Rút đơn'}
                            </button>
                        )}
                    </div>
                ))
            ) : (
                <p className="v2-muted">Bạn chưa có đơn tham gia hoặc lời mời nào.</p>
            )}
        </section>
    );
}
