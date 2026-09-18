import { Link, useParams } from 'react-router-dom';

export default function WorkspacePlaceholder() {
    const { clubId } = useParams();
    return <section className="v2-workspace-placeholder" role="status"><span className="v2-eyebrow">KHÔNG GIAN CLB</span><h1>Không gian CLB đang được hoàn thiện</h1><p>Không gian production cho CLB {clubId} sẽ được migrate trong hạng mục tiếp theo.</p><Link to="/v2/my-clubs" className="v2-button">Về CLB của tôi</Link></section>;
}
