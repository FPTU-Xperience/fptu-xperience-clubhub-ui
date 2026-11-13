import { useId, useMemo, useState } from 'react';
import { ACTIVITY_TAG_CATEGORIES, EXPERIENCE_TAGS, tagDraft, tagSelectionPayload } from '../../services/discovery-tags.js';
import { Pill } from './DiscoveryLayout';
import './DiscoveryTagFields.scss';

export function DiscoveryTagFields({ draft, onChange, activity = false, disabled = false }) {
    return (
        <fieldset className="v2-discovery-tag-fields" disabled={disabled}>
            <legend>Tag khám phá</legend>
            {activity && (
                <label className="v2-discovery-tag-input">
                    Thể loại hoạt động
                    <select value={draft.activityCategory} onChange={(event) => onChange({ ...draft, activityCategory: event.target.value })}>
                        <option value="">Hoạt động khác (mặc định)</option>
                        {ACTIVITY_TAG_CATEGORIES.filter(([code]) => code !== 'other').map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                        ))}
                    </select>
                </label>
            )}
            <div className="v2-discovery-tag-options" role="group" aria-label="Loại trải nghiệm">
                {EXPERIENCE_TAGS.map(([code, label]) => {
                    const checked = draft.experience.includes(code);
                    return (
                        <label key={code}>
                            <input type="checkbox" checked={checked} onChange={() => onChange({
                                ...draft,
                                experience: checked ? draft.experience.filter((value) => value !== code) : [...draft.experience, code],
                            })} />
                            {label}
                        </label>
                    );
                })}
            </div>
            <label className="v2-discovery-tag-input">
                Tag tự thêm
                <input value={draft.customText} maxLength={420} placeholder="Phân cách bằng dấu phẩy"
                    onChange={(event) => onChange({ ...draft, customText: event.target.value })} />
            </label>
        </fieldset>
    );
}

export function DiscoveryTagEditor({ selection, activity, disabled, onSave }) {
    const [draft, setDraft] = useState(() => tagDraft(selection));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const changed = JSON.stringify(draft) !== JSON.stringify(tagDraft(selection));

    const save = async (event) => {
        event.preventDefault();
        if (!changed || disabled || saving) return;
        setSaving(true);
        setError('');
        try {
            await onSave(tagSelectionPayload(draft));
        } catch (issue) {
            setError(issue?.status === 409 ? 'Dữ liệu đã thay đổi. Tải lại trang rồi lưu tag.'
                : issue?.message || 'Không thể lưu tag. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };
    return (
        <form onSubmit={save}>
            <DiscoveryTagFields draft={draft} onChange={setDraft} activity={activity} disabled={disabled || saving} />
            <button className="v2-button" type="submit" disabled={!changed || disabled || saving}>
                {saving ? 'Đang lưu…' : 'Lưu tag'}
            </button>
            {error && <p role="alert">{error}</p>}
        </form>
    );
}

export function DiscoveryTagFilter({ items, value, onChange }) {
    const options = useMemo(() => Array.from(new Map(items.flatMap((item) =>
        (item.discoveryTags ?? []).map((tag) => [tag.id, tag.label])))).sort((a, b) => a[1].localeCompare(b[1], 'vi')), [items]);
    if (!options.length && !value) return null;
    return (
        <label className="v2-discovery-tag-filter">
            Lọc theo tag
            <select value={value} onChange={(event) => onChange(event.target.value)}>
                <option value="">Tất cả tag</option>
                {options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                {value && !options.some(([id]) => id === value) && <option value={value}>Tag đã chọn</option>}
            </select>
        </label>
    );
}

export function DiscoveryTagList({ tags, limit = tags?.length }) {
    if (!tags?.length) return null;
    return (
        <div className="v2-discovery-tag-list" aria-label="Tag khám phá">
            {tags.slice(0, limit).map((tag) => <Pill key={tag.id}>{tag.label}</Pill>)}
        </div>
    );
}

export function DiscoveryTagSection({ tags }) {
    const headingId = useId();
    if (!tags?.length) return null;

    return (
        <section className="v2-discovery-tag-section" aria-labelledby={headingId}>
            <h3 id={headingId}>Tag khám phá</h3>
            <DiscoveryTagList tags={tags} />
        </section>
    );
}
