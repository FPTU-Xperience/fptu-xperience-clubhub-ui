import { useEffect, useState } from 'react';

export default function WorkspacePolicyStatus({ api, clubId, semesterId }) {
    const [state, setState] = useState({});
    useEffect(() => {
        let active = true;
        setState({});
        if (clubId && semesterId && typeof api?.request === 'function')
            api.request(
                `/api/clubs/${encodeURIComponent(clubId)}/experience-policies?${new URLSearchParams({ semesterId })}`,
            )
                .then((data) => {
                    if (active) setState({ data });
                })
                .catch((error) => {
                    if (active) setState({ error });
                });
        return () => {
            active = false;
        };
    }, [api, clubId, semesterId]);
    if (!clubId || !semesterId) return null;
    return (
        <p className="v2-profile-note" role="status">
            {state.error
                ? `Không tải được chính sách học kỳ: ${state.error.message}`
                : !state.data
                  ? 'Đang tải chính sách học kỳ…'
                  : state.data.availability === 'NO_APPROVED_POLICY'
                    ? 'Học kỳ chưa có chính sách được duyệt.'
                    : `${state.data.items.length} chính sách được duyệt · môi trường ${state.data.environment}.`}{' '}
            Catalog này không xác nhận tính điểm action hoặc quyết toán đã được triển khai.
        </p>
    );
}
