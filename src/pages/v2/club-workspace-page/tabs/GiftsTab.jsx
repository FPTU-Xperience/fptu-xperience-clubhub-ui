import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import WorkspaceTabLayout from './WorkspaceTabLayout';
import ProfileCoverArt from '../../profile-page/ProfileCoverArt';
import ClubShapeUploadModal from './ClubShapeUploadModal';
import {
    getClubCoverRewards,
    readCoverInventory,
    redeemCoverReward,
    sampleClubBalance,
} from '../../profile-page/cover-cosmetics';
import './GiftsTab.scss';

export default function GiftsTab({ workspace, manager = false }) {
    const { user } = useAuth();
    const clubId = workspace?.clubId;
    const clubCode = workspace?.clubCode || workspace?.name || workspace?.clubName || '';
    const [inventory, setInventory] = useState(() => readCoverInventory(user));
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [rewards, setRewards] = useState(() => getClubCoverRewards(clubId, undefined, clubCode));
    useEffect(() => {
        setInventory(readCoverInventory(user));
        setNotice('');
        setError('');
        setUploadOpen(false);
        setRewards(getClubCoverRewards(clubId, undefined, clubCode));
        const refresh = () => {
            setInventory(readCoverInventory(user));
            setRewards(getClubCoverRewards(clubId, undefined, clubCode));
        };
        window.addEventListener('storage', refresh);
        window.addEventListener('clubhub:cover-rewards-updated', refresh);
        return () => {
            window.removeEventListener('storage', refresh);
            window.removeEventListener('clubhub:cover-rewards-updated', refresh);
        };
    }, [user, clubId, clubCode]);
    const redeem = (reward) => {
        setError('');
        try {
            setInventory(redeemCoverReward(user, clubId, reward.key, undefined, clubCode));
            setNotice(`Đã đổi ${reward.label} bằng điểm mẫu. Bạn có thể sử dụng trong ảnh bìa cá nhân.`);
        } catch (issue) {
            setError(issue.message);
        }
    };
    const balance = sampleClubBalance(inventory, clubId);
    return (
        <WorkspaceTabLayout
            title="Kho quà"
            description="Đổi điểm đóng góp tại CLB để sở hữu màu nền và shape cho ảnh bìa cá nhân."
            preview
            action={
                manager && user ? (
                    <button type="button" className="v2-button v2-button--primary" onClick={() => setUploadOpen(true)}>
                        + Thêm shape riêng
                    </button>
                ) : undefined
            }
        >
            {() => (
                <div className="v2-cover-gifts">
                    {uploadOpen && manager && user && (
                        <ClubShapeUploadModal
                            workspace={workspace}
                            onClose={() => setUploadOpen(false)}
                            onPublished={() => {
                                setUploadOpen(false);
                                setRewards(getClubCoverRewards(clubId, undefined, clubCode));
                                setNotice('Đã thêm shape riêng của CLB vào Kho quà trên thiết bị này.');
                            }}
                        />
                    )}
                    <div className="v2-cover-gifts-balance">
                        <div>
                            <small>ĐIỂM MẪU TẠI CLB NÀY</small>
                            <strong>{balance} điểm</strong>
                        </div>
                        <p>
                            Luồng thử nghiệm với 200 điểm mẫu ban đầu cho mỗi CLB. Chưa sử dụng hay trừ điểm thật; số dư
                            và quà lưu trên thiết bị này.
                        </p>
                    </div>
                    {notice && (
                        <p role="status">
                            {notice} <Link to="/v2/profile">Tùy chỉnh ảnh bìa →</Link>
                        </p>
                    )}
                    {error && (
                        <p className="v2-profile-form-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="v2-cover-gifts-grid">
                        {rewards.map((reward) => {
                            const owned = inventory.owned.includes(reward.key);
                            return (
                                <article key={reward.key}>
                                    <ProfileCoverArt
                                        color={reward.colorId || (reward.kind === 'color' ? reward.id : 'horizon')}
                                        shape={reward.shapeId || (reward.kind === 'shape' ? reward.id : 'petals')}
                                        shapeAssetUrl={reward.assetUrl || ''}
                                    />
                                    <div>
                                        <small>
                                            {reward.kind === 'combo'
                                                ? 'COMBO MÀU + SHAPE'
                                                : reward.kind === 'color'
                                                  ? 'MÀU NỀN'
                                                  : 'SHAPE'}
                                        </small>
                                        <h2>{reward.label}</h2>
                                        {reward.kind === 'shape' && (
                                            <small>{reward.clubName} · Thiết kế riêng của CLB</small>
                                        )}
                                        <p>{reward.cost} điểm mẫu</p>
                                        <button
                                            type="button"
                                            className="v2-button v2-button--primary"
                                            disabled={!user || !clubId || owned || balance < reward.cost}
                                            onClick={() => redeem(reward)}
                                        >
                                            {owned
                                                ? 'Đã sở hữu'
                                                : balance < reward.cost
                                                  ? 'Chưa đủ điểm'
                                                  : 'Đổi điểm mẫu'}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                    {!rewards.some((reward) => reward.kind === 'shape') && (
                        <p>
                            CLB chưa upload shape riêng. Các shape chung được sử dụng miễn phí trong phần tùy chỉnh ảnh
                            bìa.
                        </p>
                    )}
                </div>
            )}
        </WorkspaceTabLayout>
    );
}
