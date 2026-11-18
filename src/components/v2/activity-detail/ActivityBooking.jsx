import { useEffect, useRef, useState } from 'react';
import { Building2, CalendarClock, List, MapPin, Package, X } from 'lucide-react';
import { sessionDate } from '../../../services/activity-sessions';
import V2Modal from '../common/modal/V2Modal';
import './ActivityBooking.scss';

const base = '/api/activity-bookings';
const statuses = {
    PENDING: 'Chờ CTSV xử lý', CONFIRMED: 'Đã xử lý', CANCELLED: 'Đã hủy',
    EXPIRED: 'Hết hạn xử lý', SESSION_CHANGED: 'Phiên đã thay đổi',
};
const venueStatuses = {
    ...statuses, CONFIRMED: 'Đã xác nhận', UNAVAILABLE: 'Không bố trí được', NOT_REQUESTED: 'Không yêu cầu',
};
const errors = {
    BOOKING_EXISTS: 'Phiên đã có yêu cầu. Tải lại để xem trạng thái mới nhất.',
    STALE_VERSION: 'Yêu cầu đã thay đổi. Tải lại trước khi tiếp tục.',
    SESSION_NOT_BOOKABLE: 'Phiên không còn nhận yêu cầu đặt chỗ.',
};
const describeError = (issue) => errors[issue.code] || issue.message || 'Không thể kết nối dịch vụ đặt chỗ.';

function Plan({ image, label, compact = false, children }) {
    const [failed, setFailed] = useState(false);
    if (failed) return <p role="status">Không mở được ảnh sơ đồ. Bạn có thể chọn phòng trong danh sách.</p>;
    return (
        <div className={`booking-floor${image ? ' booking-floor--image' : ''}${compact ? ' booking-floor--rooms' : ''}`} role="group" aria-label={label}>
            {image && <img src={image} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />}
            {children}
        </div>
    );
}

export function VenuePicker({ venues, layouts, selected, onToggle, busy }) {
    const selectedRooms = venues.filter((venue) => selected.includes(venue.id));
    const selectedRoom = selectedRooms[0];
    const buildings = [...new Set(venues.map((venue) => venue.building).filter(Boolean))].sort();
    const startingBuilding = selectedRoom?.building || buildings[0] || '';
    const sortFloors = (rooms) => [...new Set(rooms.flatMap((venue) =>
        [venue.floor, ...Object.keys(venue.planAreasByFloor || {})]).filter(Boolean))]
        .sort((a, b) => a === 'G' ? -1 : b === 'G' ? 1 : a.localeCompare(b, 'vi', { numeric: true }));
    const [building, setBuilding] = useState(startingBuilding);
    const [floor, setFloor] = useState(selectedRoom?.floor || sortFloors(venues.filter((venue) => venue.building === startingBuilding))[0] || '');
    const [view, setView] = useState(buildings.length ? 'map' : 'list');
    const [zoomed, setZoomed] = useState(false);
    const inBuilding = venues.filter((venue) => venue.building === building);
    const floors = sortFloors(inBuilding);
    const campusImage = layouts.find((layout) => !layout.building && !layout.floor)?.imageUrl;
    const floorImage = layouts.find((layout) => layout.building === building && layout.floor === floor && floor)?.imageUrl;
    const roomsOnFloor = inBuilding.filter((venue) => venue.floor === floor);
    const areas = floorImage ? inBuilding.map((venue) => ({
        ...venue, planArea: venue.floor === floor ? venue.planArea : venue.planAreasByFloor?.[floor],
    })).filter((venue) => venue.planArea) : [];
    const pins = roomsOnFloor.filter((venue) => (!floorImage || !venue.planArea) && venue.planX != null && venue.planY != null);
    const buildingPins = layouts.filter((layout) => !layout.floor && buildings.includes(layout.building) && layout.planX != null);
    const position = ({ planX, planY }) => ({ left: `${planX}%`, top: `${planY}%` });
    const chooseBuilding = (value) => {
        setBuilding(value);
        setFloor(sortFloors(venues.filter((venue) => venue.building === value))[0] || '');
    };
    return (
        <div className="booking-picker">
            <div className="booking-switch" role="group" aria-label="Cách chọn địa điểm">
                <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}><MapPin size={16} /> Sơ đồ cơ sở</button>
                <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} /> Danh sách</button>
            </div>
            {view === 'map' && (
                <>
                    {(campusImage || buildingPins.length > 0) && (
                        <Plan key={campusImage} image={campusImage} label="Bản đồ cơ sở">
                            {buildingPins.map((pin) => (
                                <button type="button" key={pin.building} aria-pressed={building === pin.building}
                                    aria-label={`Chọn tòa ${pin.building}`} style={position(pin)} onClick={() => chooseBuilding(pin.building)}>
                                    <Building2 size={16} /> {pin.building}
                                </button>
                            ))}
                        </Plan>
                    )}
                    {buildings.length ? (
                        <div className="booking-buildings" role="group" aria-label="Chọn tòa nhà">
                            {buildings.map((name) => (
                                <button type="button" key={name} aria-pressed={building === name} onClick={() => chooseBuilding(name)}>
                                    <Building2 size={22} /><strong>{name}</strong>
                                    <small>{venues.filter((venue) => venue.building === name).length} địa điểm</small>
                                </button>
                            ))}
                        </div>
                    ) : <p>Cơ sở chưa có dữ liệu tòa nhà. Bạn có thể xem danh sách địa điểm.</p>}
                    {building && floors.length > 0 && (
                        <label className="booking-label">Tầng
                            <select value={floor} onChange={(event) => setFloor(event.target.value)}>
                                {floors.map((name) => <option key={name}>{name}</option>)}
                            </select>
                        </label>
                    )}
                    {floorImage && <div className="booking-switch">
                        <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>
                            {zoomed ? 'Thu nhỏ sơ đồ' : 'Phóng to sơ đồ'}
                        </button>
                    </div>}
                    {(floorImage || pins.length > 0) && <div className={`booking-floor-scroll${zoomed ? ' booking-floor-scroll--zoomed' : ''}`}>
                        <Plan key={`${building}:${floor}:${floorImage}`} image={floorImage} compact={Boolean(floorImage)}
                            label={`Sơ đồ ${building}, tầng ${floor}`}>
                            {areas.length > 0 && (
                                <svg className="booking-room-areas" viewBox="0 0 100 100" preserveAspectRatio="none"
                                    role="group" aria-label="Phòng trên sơ đồ">
                                    {areas.map((venue) => (
                                        <polygon key={venue.id} points={venue.planArea} role="button" tabIndex={busy ? -1 : 0}
                                            aria-pressed={selected.includes(venue.id)} aria-disabled={busy}
                                            aria-label={`Chọn ${venue.name} (${venue.code})`} vectorEffect="non-scaling-stroke"
                                            onClick={() => !busy && onToggle(venue.id)}
                                            onKeyDown={(event) => {
                                                if (event.key !== 'Enter' && event.key !== ' ') return;
                                                event.preventDefault();
                                                if (!busy) onToggle(venue.id);
                                            }}>
                                            <title>{venue.name}</title>
                                        </polygon>
                                    ))}
                                </svg>
                            )}
                            {pins.map((venue) => (
                                <button type="button" key={venue.id} aria-pressed={selected.includes(venue.id)}
                                    aria-label={`Chọn ${venue.name} (${venue.code})`} title={`${venue.name} · ${venue.code}`}
                                    style={position(venue)} onClick={() => onToggle(venue.id)}>
                                    <MapPin size={floorImage ? 12 : 16} aria-hidden="true" />{!floorImage && venue.code}
                                </button>
                            ))}
                        </Plan>
                    </div>}
                    {building && !areas.length && !pins.length && <p>Tầng này chưa có phòng được gắn trên sơ đồ.</p>}
                </>
            )}
            {view === 'list' && <div className="booking-venues" role="group" aria-label="Địa điểm có thể yêu cầu">
                {venues.map((venue) => (
                        <button type="button" key={venue.id} aria-pressed={selected.includes(venue.id)} onClick={() => onToggle(venue.id)}>
                            <strong>{venue.name}</strong>
                            <small>{[venue.code, venue.venueType, venue.building, venue.floor && `Tầng ${venue.floor}`, venue.capacity > 0 && `${venue.capacity} chỗ`].filter(Boolean).join(' · ')}</small>
                        </button>
                    ))}
            </div>}
            {selectedRooms.length > 0 && (
                <div className="booking-selected-rooms" role="group" aria-label="Phòng đã chọn">
                    {selectedRooms.map((room) => (
                        <button key={room.id} type="button" className="booking-room-chip" disabled={busy}
                            aria-label={`Bỏ chọn ${room.name}`} onClick={() => onToggle(room.id)}>
                            <span>{room.name}</span><X size={14} aria-hidden="true" />
                        </button>
                    ))}
                </div>
            )}
            {!venues.length && <p>CTSV chưa mở địa điểm nào tại cơ sở này.</p>}
        </div>
    );
}

function BookingResult({ row, catalog, onCancel, busy }) {
    const [confirm, setConfirm] = useState(false);
    const venue = (id) => catalog.venues.find((item) => item.id === id)?.name || (id ? `Địa điểm #${id}` : '');
    const requested = row.requestedVenueIds ?? (row.requestedVenueId ? [row.requestedVenueId] : []);
    const confirmed = row.confirmedVenueIds ?? (row.confirmedVenueId ? [row.confirmedVenueId] : []);
    return (
        <article className="booking-card">
            <header><strong>Yêu cầu #{row.id}</strong><span className="booking-badge" data-status={row.status}>{statuses[row.status]}</span>
                {row.isLate && <span className="booking-badge" data-status="PENDING">Gửi sau cutoff</span>}
            </header>
            <p className="booking-muted">Gửi lúc {sessionDate(row.requestedAtUtc)}{row.processedAtUtc && ` · Cập nhật ${sessionDate(row.processedAtUtc)}`}</p>
            <p><strong>Địa điểm:</strong> {venueStatuses[row.venueStatus]}{(requested.length > 0 || row.requestedVenueType) && (
                <> · Ưu tiên {requested.map(venue).join(', ') || row.requestedVenueType}</>
            )}{row.venueStatus === 'CONFIRMED' && <> · Được bố trí tại {confirmed.map(venue).join(', ')}</>}</p>
            {row.equipment.length > 0 && (
                <div className="booking-table">
                    <table>
                        <thead><tr><th scope="col">Thiết bị</th><th scope="col">Đề nghị</th><th scope="col">Được cấp</th><th scope="col">Còn thiếu</th></tr></thead>
                        <tbody>{row.equipment.map((line) => (
                            <tr key={line.equipmentId}>
                                <th scope="row">{catalog.equipment.find((item) => item.id === line.equipmentId)?.name || `Thiết bị #${line.equipmentId}`}</th>
                                <td>{line.requestedQuantity}</td><td>{row.status === 'CONFIRMED' ? line.confirmedQuantity : '—'}</td>
                                <td>{line.missingQuantity ?? '—'}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
            {row.equipment.some((line) => line.missingQuantity > 0) && <p className="booking-callout">CLB có thể tự chuẩn bị phần thiết bị còn thiếu.</p>}
            {row.canManage && (confirm ? (
                <div className="booking-callout">
                    <p>Hủy yêu cầu sẽ giải phóng địa điểm và thiết bị đã được bố trí.</p>
                    <div className="booking-switch">
                        <button type="button" disabled={busy} onClick={() => setConfirm(false)}>Giữ yêu cầu</button>
                        <button type="button" disabled={busy} onClick={() => onCancel(row)}>Xác nhận hủy</button>
                    </div>
                </div>
            ) : <button type="button" className="v2-button" disabled={busy} onClick={() => setConfirm(true)}>Hủy yêu cầu</button>)}
        </article>
    );
}

export default function ActivityBooking({ api, session, onClose, onLocationChanged }) {
    const path = `${base}/sessions/${session.id}`;
    const [state, setState] = useState(null);
    const [revision, setRevision] = useState(0);
    const [error, setError] = useState('');
    const [catalogError, setCatalogError] = useState('');
    const [busy, setBusy] = useState(false);
    const [venueMode, setVenueMode] = useState('none');
    const [venueIds, setVenueIds] = useState([]);
    const toggleVenue = (id) => setVenueIds((ids) => ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id]);
    const [type, setType] = useState('');
    const [quantities, setQuantities] = useState({});
    const [notice, setNotice] = useState('');
    const lock = useRef(false);
    useEffect(() => {
        let active = true;
        setState(null);
        setError('');
        setCatalogError('');
        const load = async () => {
            const details = await api.request(path);
            let catalog = { venues: [], equipment: [], layouts: [] };
            if (details.canSubmit || details.bookings.length) {
                try {
                    catalog = await api.request(`${base}/campuses/${encodeURIComponent(details.campusCode)}/catalog`);
                } catch (issue) {
                    if (active) setCatalogError(describeError(issue));
                }
            }
            if (active) setState({ ...details, catalog });
        };
        load().catch((issue) => { if (active) setError(describeError(issue)); });
        return () => { active = false; };
    }, [api, path, revision]);

    const save = async (route, body, message, changesLocation = false) => {
        if (lock.current) return;
        lock.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await api.request(route, { method: 'POST', body: JSON.stringify(body) });
            if (changesLocation) {
                onLocationChanged();
                return;
            }
            setNotice(message);
            setQuantities({});
            setVenueMode('none');
            setVenueIds([]);
            setType('');
            setRevision((value) => value + 1);
        } catch (issue) {
            setError(describeError(issue));
        } finally {
            lock.current = false;
            setBusy(false);
        }
    };

    const venues = state?.catalog.venues.filter((venue) => venue.isBookable) || [];
    const equipment = state?.catalog.equipment.filter((item) => item.isBookable) || [];
    const selectedVenueIds = venueIds.filter((id) => venues.some((venue) => venue.id === id));
    const lines = equipment.filter((item) => Number(quantities[item.id]) > 0)
        .map((item) => ({ equipmentId: item.id, quantity: Number(quantities[item.id]) }));
    const ready = (venueMode === 'room' && selectedVenueIds.length) || (venueMode === 'type' && type.trim()) || (venueMode === 'none' && lines.length);

    return (
        <V2Modal title="Đặt địa điểm và thiết bị" wide className="booking-modal" onClose={() => !busy && onClose()}>
            <div className="booking-workspace">
                <div className="booking-context"><CalendarClock size={22} aria-hidden="true" />
                    <div><strong>{sessionDate(state?.startTimeUtc ?? session.startTime)} – {sessionDate(state?.endTimeUtc ?? session.endTime)}</strong>
                        <p>{(state?.location ?? session.location) || 'Chưa nhập địa điểm'}{state && ` · Cơ sở ${state.campusCode}`}</p></div>
                </div>
                {!state && !error && <p role="status">Đang tải thông tin đặt chỗ…</p>}
                {notice && <p role="status" className="booking-callout">{notice}</p>}
                {(error || catalogError) && <div className="booking-callout" role="alert">
                    <p>{error || `Không tải được danh mục. ${catalogError}`}</p>
                    <button type="button" className="v2-button" disabled={busy} onClick={() => setRevision((value) => value + 1)}>Tải lại</button>
                </div>}
                {state?.bookings.map((row) => <BookingResult key={row.id} row={row} catalog={state.catalog} busy={busy}
                    onCancel={() => save(`${path}/${row.id}/cancel`, { version: row.version }, 'Đã hủy yêu cầu.', row.venueStatus === 'CONFIRMED')} />)}
                {state && !state.canSubmit && !state.bookings.length && <p>Phiên này hiện chưa thể gửi yêu cầu đặt chỗ.</p>}
                {state?.canSubmit && !catalogError && (
                    <form onSubmit={(event) => {
                        event.preventDefault();
                        if (ready) save(path, {
                            sessionVersion: state.sessionVersion,
                            venueIds: venueMode === 'room' ? selectedVenueIds : [],
                            venueType: venueMode === 'type' ? type.trim() : null,
                            equipment: lines,
                        }, 'Đã gửi yêu cầu. Bạn có thể theo dõi kết quả xử lý ngay tại phiên này.');
                    }}>
                        <p className="booking-callout">
                            {state.cutoffAtUtc ? `Hạn nhận yêu cầu của tuần diễn ra phiên: ${sessionDate(state.cutoffAtUtc)}.` : 'CTSV xử lý yêu cầu theo tuần.'}
                            {state.isLate && ' Yêu cầu này sẽ được đánh dấu gửi muộn để CTSV xem xét.'}
                        </p>
                        <fieldset className="booking-card" disabled={busy}>
                            <legend><MapPin size={18} /> Địa điểm</legend>
                            <div className="booking-options">
                                {[['none', 'Chỉ mượn thiết bị'], ['room', 'Chọn địa điểm cụ thể'], ['type', 'Đề nghị loại địa điểm']].map(([value, label]) => (
                                    <label key={value}><input type="radio" name="venue-mode" value={value} checked={venueMode === value}
                                        onChange={() => setVenueMode(value)} /> {label}</label>
                                ))}
                            </div>
                            {venueMode === 'room' && <VenuePicker venues={venues} layouts={state.catalog.layouts || []}
                                selected={selectedVenueIds} onToggle={toggleVenue} busy={busy} />}
                            {venueMode === 'type' && <label className="booking-label">Loại địa điểm
                                <input value={type} onChange={(event) => setType(event.target.value)} maxLength={40}
                                    required placeholder="Ví dụ: Hội trường, phòng seminar" /></label>}
                        </fieldset>
                        <fieldset className="booking-card" disabled={busy}>
                            <legend><Package size={18} /> Thiết bị</legend>
                            {!equipment.length && <p>CTSV chưa mở danh mục thiết bị tại cơ sở này.</p>}
                            {equipment.map((item) => (
                                <label className="booking-equipment" key={item.id}>
                                    <span><strong>{item.name}</strong><small>{item.code} · Tổng kho {item.quantity}</small></span>
                                    <input type="number" min={0} max={2147483647} step={1} value={quantities[item.id] ?? ''}
                                        placeholder="0" aria-label={`Số lượng ${item.name}`}
                                        onChange={(event) => setQuantities({ ...quantities, [item.id]: event.target.value })} />
                                </label>
                            ))}
                            <small>CTSV xác nhận số lượng theo tồn kho trong khung giờ của phiên.</small>
                        </fieldset>
                        <div className="booking-submit">
                            <p aria-live="polite">{selectedVenueIds.length > 0 && venueMode === 'room'
                                ? `${selectedVenueIds.length} phòng đã chọn`
                                : venueMode === 'type' && type.trim() ? type.trim() : 'Không chọn địa điểm'} · {lines.length} loại thiết bị</p>
                            <button type="submit" className="v2-button v2-button--primary" disabled={busy || !ready}>{busy ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
                        </div>
                    </form>
                )}
            </div>
        </V2Modal>
    );
}
