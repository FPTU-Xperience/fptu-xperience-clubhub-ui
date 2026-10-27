import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import MyClubCard from '../../../components/v2/my-clubs/MyClubCard';
import MyMembershipApplications from '../../../components/v2/my-clubs/MyMembershipApplications';
import {
    APPLICATION_RESULT_WINDOW_MS,
    useMyMembershipApplications,
    visibleSentApplications,
} from '../my-clubs-data';
import { usePinnedClubs } from '../pinned-clubs';
import PersonalPageHeading from '../personal-pages/PersonalPageHeading';
import './MyClubsPage.scss';

export default function MyClubsPage({ api, sessionKey }) {
    const { selection, pinnedClubs, togglePin } = usePinnedClubs();
    const applications = useMyMembershipApplications(api, sessionKey);
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        setNow(Date.now());
    }, [applications.data]);
    useEffect(() => {
        const currentTime = Date.now();
        const deadlines = applications.data
            .filter((item) => ['APPROVED', 'REJECTED'].includes(item.status))
            .filter((item) => Date.parse(item.reviewedAtUtc) <= currentTime)
            .map((item) => Date.parse(item.reviewedAtUtc) + APPLICATION_RESULT_WINDOW_MS)
            .filter((deadline) => deadline > currentTime);
        if (!deadlines.length) return;
        const timer = setTimeout(() => setNow(Date.now()), Math.min(...deadlines) - currentTime);
        return () => clearTimeout(timer);
    }, [applications.data, now]);
    const [withdrawingId, setWithdrawingId] = useState('');
    const [withdrawError, setWithdrawError] = useState('');
    const navigate = useNavigate();
    const [acceptingId, setAcceptingId] = useState('');
    const [invitationError, setInvitationError] = useState('');
    const invitationRequest = useRef(0);
    const invitationLock = useRef(false);
    useEffect(() => {
        invitationRequest.current++;
        invitationLock.current = false;
        setAcceptingId('');
        setInvitationError('');
        return () => {
            invitationRequest.current++;
        };
    }, [sessionKey]);
    const openInvitation = async (item) => {
        if (invitationLock.current || !item.canAcceptInvitation) return;
        invitationLock.current = true;
        const request = ++invitationRequest.current;
        setAcceptingId(item.applicationId);
        setInvitationError('');
        try {
            const club = await api.getClub(item.club.clubId);
            if (request !== invitationRequest.current) return;
            if (!club.code) throw new Error('Không tìm thấy trang CLB để xác nhận lời mời.');
            navigate(`/v2/clubs/${encodeURIComponent(club.code)}?invitation=${encodeURIComponent(item.applicationId)}`);
        } catch (issue) {
            if (request === invitationRequest.current) setInvitationError(issue?.message || 'Không thể mở lời mời.');
        } finally {
            if (request === invitationRequest.current) {
                invitationLock.current = false;
                setAcceptingId('');
            }
        }
    };
    const withdraw = async (applicationId) => {
        if (
            withdrawingId ||
            !applications.data.some((item) => item.applicationId === applicationId && item.canWithdraw)
        )
            return;
        setWithdrawingId(applicationId);
        setWithdrawError('');
        try {
            await api.withdrawMyMembershipApplication(applicationId);
            applications.retry();
            selection.retry();
        } catch {
            setWithdrawError('Không thể rút đơn lúc này. Bạn có thể thử lại.');
        } finally {
            setWithdrawingId('');
        }
    };
    return (
        <div className="v2-public-content v2-personal-page v2-my-clubs-page">
            <PersonalPageHeading
                title="Câu lạc bộ của tôi"
                description="Mỗi cộng đồng, một phần trong hành trình của bạn."
                action={
                    <Link className="v2-button" to="/v2/clubs">
                        Khám phá thêm <ArrowUpRight size={16} />
                    </Link>
                }
            />
            <PageState
                status={selection.status}
                onRetry={selection.retry}
                title={selection.status === 'empty' ? 'Cộng đồng đầu tiên đang chờ bạn' : undefined}
                description={
                    selection.status === 'empty' ? 'Khám phá một CLB phù hợp và bắt đầu hành trình mới.' : undefined
                }
            >
                {selection.data.length ? (
                    <div className="v2-my-clubs-grid">
                        {selection.data.map((club) => (
                            <MyClubCard
                                key={club.clubId}
                                club={club}
                                pinned={pinnedClubs.some((pinned) => pinned.clubId === club.clubId)}
                                onTogglePin={() => togglePin(club.clubId)}
                            />
                        ))}
                    </div>
                ) : null}
            </PageState>
            <PageState
                status={applications.status}
                onRetry={applications.retry}
                title="Đơn tham gia của tôi"
                description={applications.status === 'empty' ? 'Bạn chưa có đơn tham gia nào.' : undefined}
            >
                <MyMembershipApplications
                    applications={visibleSentApplications(applications.data, now)}
                    withdrawingId={withdrawingId}
                    onWithdraw={withdraw}
                    acceptingId={acceptingId}
                    onAcceptInvitation={openInvitation}
                />
                {applications.data.some((item) => item.canAcceptInvitation) && (
                    <MyMembershipApplications
                        invitations
                        applications={applications.data.filter((item) => item.canAcceptInvitation)}
                        acceptingId={acceptingId}
                        onAcceptInvitation={openInvitation}
                    />
                )}
                {invitationError && (
                    <p className="v2-my-clubs-error" role="alert">
                        {invitationError}
                    </p>
                )}
                {withdrawError && (
                    <p className="v2-my-clubs-error" role="alert">
                        {withdrawError}
                    </p>
                )}
            </PageState>
        </div>
    );
}
