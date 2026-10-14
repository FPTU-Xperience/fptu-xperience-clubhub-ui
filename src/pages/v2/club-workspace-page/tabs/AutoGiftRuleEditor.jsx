import { Plus, Trash2 } from 'lucide-react';
import { autoGiftRuleLabel, MAX_AUTO_GIFT_RULES } from '../../profile-page/auto-gift-rules';
import './AutoGiftRuleEditor.scss';

export default function AutoGiftRuleEditor({ rules, onChange, activities = [] }) {
    const update = (id, patch) => onChange(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
    return (
        <section className="v2-auto-gift-editor" aria-label="Điều kiện tự tặng quà">
            <div className="v2-auto-gift-heading">
                <div>
                    <h3>Tự tặng khi kết thúc</h3>
                    <p>Trao quà cho người tham gia hoặc theo thứ hạng đã chốt, không trừ XP.</p>
                </div>
                <button
                    type="button"
                    className="v2-button"
                    disabled={rules.length >= MAX_AUTO_GIFT_RULES}
                    onClick={() =>
                        onChange([
                            ...rules,
                            {
                                id: crypto.randomUUID(),
                                type: 'activity',
                                eventId: '',
                                eventLabel: '',
                                audience: 'all',
                                rankFrom: 1,
                                rankTo: 3,
                                enabled: true,
                            },
                        ])
                    }
                >
                    <Plus size={16} /> Thêm điều kiện
                </button>
            </div>
            {!rules.length && <p>Chưa bật tự tặng. Quà vẫn dùng luồng đổi hiện tại.</p>}
            {rules.map((rule, index) => (
                <fieldset key={rule.id} className={rule.enabled ? '' : 'is-disabled'}>
                    <legend>Điều kiện {index + 1}</legend>
                    <div className="v2-auto-gift-rule-tools">
                        <label>
                            <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(event) => update(rule.id, { enabled: event.target.checked })}
                            />{' '}
                            Bật điều kiện
                        </label>
                        <button
                            type="button"
                            className="v2-button"
                            aria-label={`Xóa điều kiện ${index + 1}`}
                            onClick={() => onChange(rules.filter((item) => item.id !== rule.id))}
                        >
                            <Trash2 size={15} /> Xóa
                        </button>
                    </div>
                    <div className="v2-auto-gift-rule-fields">
                        <label>
                            Loại sự kiện
                            <select
                                value={rule.type}
                                onChange={(event) =>
                                    update(rule.id, { type: event.target.value, eventId: '', eventLabel: '' })
                                }
                            >
                                <option value="activity">Hoạt động</option>
                                <option value="contest">Contest</option>
                            </select>
                        </label>
                        {rule.type === 'activity' ? (
                            <label>
                                Hoạt động của CLB
                                <select
                                    value={rule.eventId}
                                    onChange={(event) => {
                                        const activity = activities.find(
                                            (item) => String(item.id) === event.target.value,
                                        );
                                        update(rule.id, {
                                            eventId: event.target.value,
                                            eventLabel: activity?.title || '',
                                        });
                                    }}
                                >
                                    <option value="">Chọn hoạt động</option>
                                    {rule.eventId && !activities.some((item) => String(item.id) === rule.eventId) && (
                                        <option value={rule.eventId}>
                                            {rule.eventLabel || rule.eventId} · ngoài danh sách hiện tại
                                        </option>
                                    )}
                                    {activities.map((activity) => (
                                        <option key={activity.id} value={String(activity.id)}>
                                            {activity.title}
                                        </option>
                                    ))}
                                </select>
                                {!activities.length && (
                                    <small>Chưa có hoạt động trong danh sách học kỳ hiện tại.</small>
                                )}
                            </label>
                        ) : (
                            <>
                                <label>
                                    ID contest
                                    <input
                                        value={rule.eventId}
                                        maxLength={100}
                                        placeholder="Nhập ID contest"
                                        onChange={(event) => update(rule.id, { eventId: event.target.value })}
                                    />
                                </label>
                                <label>
                                    Tên contest
                                    <input
                                        value={rule.eventLabel}
                                        maxLength={200}
                                        placeholder="Tên hiển thị"
                                        onChange={(event) => update(rule.id, { eventLabel: event.target.value })}
                                    />
                                </label>
                            </>
                        )}
                        <label>
                            Người nhận
                            <select
                                value={rule.audience}
                                onChange={(event) =>
                                    update(rule.id, {
                                        audience: event.target.value,
                                        rankFrom: rule.rankFrom || 1,
                                        rankTo: rule.rankTo || 3,
                                    })
                                }
                            >
                                <option value="all">Tất cả người tham gia hợp lệ</option>
                                <option value="rank">Theo thứ hạng</option>
                            </select>
                        </label>
                        {rule.audience === 'rank' && (
                            <div className="v2-auto-gift-ranks">
                                <label>
                                    Từ hạng
                                    <input
                                        type="number"
                                        min={1}
                                        max={100000}
                                        value={rule.rankFrom ?? ''}
                                        onChange={(event) =>
                                            update(rule.id, {
                                                rankFrom: event.target.value ? Number(event.target.value) : '',
                                            })
                                        }
                                    />
                                </label>
                                <label>
                                    Đến hạng
                                    <input
                                        type="number"
                                        min={1}
                                        max={100000}
                                        value={rule.rankTo ?? ''}
                                        onChange={(event) =>
                                            update(rule.id, {
                                                rankTo: event.target.value ? Number(event.target.value) : '',
                                            })
                                        }
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    <p>
                        {autoGiftRuleLabel(rule)}.{' '}
                        {rule.audience === 'rank' && 'Các người tham gia đồng hạng đều được nhận.'} Mỗi người nhận tối
                        đa một lần cho cùng quà/sự kiện.
                    </p>
                </fieldset>
            ))}
            <p className="v2-auto-gift-integration-note">
                Điều kiện hiện lưu trên thiết bị. Chưa có dữ liệu kết quả contest đã chốt để tự trao quà. Quà hiện vật
                cần thêm luồng bàn giao.
            </p>
        </section>
    );
}
