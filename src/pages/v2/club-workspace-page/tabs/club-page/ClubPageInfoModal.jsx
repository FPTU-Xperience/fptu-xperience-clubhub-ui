import { useRef, useState } from 'react';
import { Eye } from 'lucide-react';
import V2Modal from '../../../../../components/v2/common/modal/V2Modal';
import { CLUB_PAGE_FIELDS as fields, CLUB_PAGE_TABS as tabs } from './club-page-fields';
import ClubScheduleEditor from './ClubScheduleEditor';

export default function ClubPageInfoModal({ club, saving, error, onClose, onPreview }) {
    const [draft, setDraft] = useState(() => Object.fromEntries(fields.map(({ name }) => [name, club[name] ?? ''])));
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    const [validation, setValidation] = useState('');
    const controls = useRef({});
    const tabButtons = useRef({});
    const changed = fields.some(({ name }) => draft[name].trim() !== String(club[name] ?? '').trim());
    const revealInvalid = (name) => {
        setActiveTab(tabs.find((tab) => tab.fields.includes(name)).id);
        requestAnimationFrame(() => {
            controls.current[name]?.focus();
            controls.current[name]?.reportValidity();
        });
    };
    const submit = (event) => {
        event.preventDefault();
        if (saving || !changed) return;
        const values = Object.fromEntries(fields.map(({ name }) => [name, draft[name].trim()]));
        if (!values.name) {
            setValidation('Vui lòng nhập tên CLB.');
            revealInvalid('name');
            return;
        }
        const invalid = fields.find(({ name }) => !controls.current[name]?.checkValidity());
        if (invalid) {
            revealInvalid(invalid.name);
            return;
        }
        setValidation('');
        onPreview(values);
    };
    const navigateTabs = (event, index) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        setActiveTab(tabs[next].id);
        tabButtons.current[tabs[next].id]?.focus();
    };
    return (
        <V2Modal title="Chỉnh sửa thông tin CLB" onClose={onClose} wide>
            <form className="club-page-modal-form" onSubmit={submit} aria-busy={saving} noValidate>
                <p>Xem trước nội dung trên trang CLB, sau đó xác nhận lưu thay đổi.</p>
                <div className="club-page-info-tabs" role="tablist" aria-label="Nội dung chỉnh sửa">
                    {tabs.map((tab, index) => (
                        <button
                            key={tab.id}
                            ref={(node) => {
                                tabButtons.current[tab.id] = node;
                            }}
                            id={`club-page-tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`club-page-panel-${tab.id}`}
                            tabIndex={activeTab === tab.id ? 0 : -1}
                            onClick={() => setActiveTab(tab.id)}
                            onKeyDown={(event) => navigateTabs(event, index)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="club-page-info-panels">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            id={`club-page-panel-${tab.id}`}
                            role="tabpanel"
                            aria-labelledby={`club-page-tab-${tab.id}`}
                            hidden={activeTab !== tab.id}
                            className="club-page-info-panel"
                        >
                            <div className="club-page-info-fields">
                                {fields
                                    .filter(({ name }) => tab.fields.includes(name))
                                    .map(({ name, label, options, multiline, ...constraints }) => {
                                        if (name === 'scheduleLabel')
                                            return (
                                                <div className="is-wide" key={name}>
                                                    <ClubScheduleEditor
                                                        ref={(control) => {
                                                            controls.current[name] = control;
                                                        }}
                                                        value={draft[name]}
                                                        disabled={saving}
                                                        onChange={(value) => {
                                                            setDraft((current) => ({ ...current, [name]: value }));
                                                            setValidation('');
                                                        }}
                                                    />
                                                </div>
                                            );
                                        const props = {
                                            id: `club-page-${name}`,
                                            name,
                                            value: draft[name],
                                            disabled: saving,
                                            ref: (node) => {
                                                controls.current[name] = node;
                                            },
                                            onChange: (event) => {
                                                setDraft((current) => ({ ...current, [name]: event.target.value }));
                                                setValidation('');
                                            },
                                            ...constraints,
                                        };
                                        return (
                                            <label key={name} htmlFor={props.id} className={multiline ? 'is-wide' : ''}>
                                                <span>{label}</span>
                                                {options ? (
                                                    <select {...props} required>
                                                        {!options[draft[name]] && (
                                                            <option value={draft[name]}>
                                                                {draft[name] || 'Chọn lĩnh vực'}
                                                            </option>
                                                        )}
                                                        {Object.entries(options).map(([value, text]) => (
                                                            <option key={value} value={value}>
                                                                {text}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : multiline ? (
                                                    <textarea {...props} rows={name === 'description' ? 6 : 3} />
                                                ) : (
                                                    <input {...props} />
                                                )}
                                                {multiline && (
                                                    <small>
                                                        {draft[name].length}/{constraints.maxLength} ký tự
                                                    </small>
                                                )}
                                            </label>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>
                {(validation || error) && (
                    <div className="club-page-modal-error" role="alert">
                        {validation || error}
                    </div>
                )}
                <footer>
                    <button type="button" className="v2-button" onClick={onClose} disabled={saving}>
                        Hủy
                    </button>
                    <button type="submit" className="v2-button v2-button--primary" disabled={saving || !changed}>
                        <Eye size={16} aria-hidden="true" />
                        Xem trước
                    </button>
                </footer>
            </form>
        </V2Modal>
    );
}
