import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageState from '../../../components/v2/PageState';
import MyClubCard from '../../../components/v2/my-clubs/MyClubCard';
import MyMembershipApplications from '../../../components/v2/my-clubs/MyMembershipApplications';
import { isMyClubsMockEnabled, useMyClubSelection, useMyMembershipApplications } from '../my-clubs-data';
import PersonalPageHeading from '../personal-pages/PersonalPageHeading';
import './MyClubsPage.scss';

export default function MyClubsPage({ api, sessionKey }) {
    const selection = useMyClubSelection(api, sessionKey);
    const applications = useMyMembershipApplications(api, sessionKey);
    const [withdrawingId, setWithdrawingId] = useState('');
    const [withdrawError, setWithdrawError] = useState('');
    const [mockWithdrawnIds, setMockWithdrawnIds] = useState([]);
    const withdraw = async (applicationId) => {
        setWithdrawingId(applicationId);
        setWithdrawError('');
        try {
            if (isMyClubsMockEnabled) {
                await new Promise((resolve) => setTimeout(resolve, 350));
                setMockWithdrawnIds((ids) => [...ids, applicationId]);
            } else {
                await api.withdrawMyMembershipApplication(applicationId);
                applications.retry();
                selection.retry();
            }
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
                            <MyClubCard key={club.clubId} club={club} />
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
                    applications={applications.data.filter(
                        (application) => !mockWithdrawnIds.includes(application.applicationId),
                    )}
                    withdrawingId={withdrawingId}
                    onWithdraw={withdraw}
                />
                {withdrawError && (
                    <p className="v2-my-clubs-error" role="alert">
                        {withdrawError}
                    </p>
                )}
            </PageState>
        </div>
    );
}
