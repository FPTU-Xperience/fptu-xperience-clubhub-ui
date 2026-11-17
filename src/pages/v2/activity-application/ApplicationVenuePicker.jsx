import { useEffect, useState } from 'react';
import { VenuePicker } from '../../../components/v2/activity-detail/ActivityBooking';

export default function ApplicationVenuePicker({ api, clubId, selected, onChange, busy }) {
    const [catalog, setCatalog] = useState(null);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        setCatalog(null);
        setError('');
        api.request(`/api/activity-applications/venue-catalog?clubId=${encodeURIComponent(clubId)}`)
            .then((value) => { if (active) setCatalog(value); })
            .catch(() => { if (active) setError('Không tải được sơ đồ và danh sách phòng.'); });
        return () => { active = false; };
    }, [api, clubId, retry]);

    const toggle = (id) => {
        const ids = selected.includes(id) ? selected.filter((current) => current !== id) : [...selected, id];
        const names = ids.map((value) => catalog.venues.find((room) => room.id === value)?.name).filter(Boolean);
        onChange(ids, names.join(' · '));
    };

    return (
        <div className="booking-workspace">
            {error && <div className="booking-callout" role="alert">
                <p>{error}</p>
                <button type="button" className="v2-button" onClick={() => setRetry((count) => count + 1)}>Tải lại</button>
            </div>}
            {!catalog && !error && <p role="status">Đang tải sơ đồ…</p>}
            {catalog && <>
                <VenuePicker venues={catalog.venues} layouts={catalog.layouts} selected={selected}
                    onToggle={toggle} busy={busy} />
                {selected.filter((id) => !catalog.venues.some((room) => room.id === id)).map((id) => (
                    <button key={id} type="button" className="v2-button" onClick={() => toggle(id)}>
                        Bỏ chọn phòng #{id} đã ngừng nhận booking
                    </button>
                ))}
            </>}
            <p className="v2-report-editor-hint">
                Phòng được đề xuất trong hồ sơ. Yêu cầu đặt phòng sẽ vào hàng chờ CTSV khi tạo phiên trực tiếp trùng lịch trong đơn đã duyệt.
            </p>
        </div>
    );
}
