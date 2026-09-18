import { useState } from 'react';
import { ArrowRight, CalendarCheck, Check, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INTERESTS, MAJORS, MIN_INTERESTS, saveOnboarding } from '../../../pages/v2/onboarding';

export default function StudentOnboarding({ user, onComplete }) {
    const navigate = useNavigate();
    const [major, setMajor] = useState('');
    const [interests, setInterests] = useState([]);
    const [syncTimetable, setSyncTimetable] = useState(true);
    const [error, setError] = useState('');

    const toggleInterest = (id) => {
        setError('');
        setInterests((current) =>
            current.includes(id) ? current.filter((interest) => interest !== id) : [...current, id],
        );
    };

    const submit = (event) => {
        event.preventDefault();
        try {
            onComplete(saveOnboarding(user, { major, interests, syncTimetable }));
            navigate('/v2', { replace: true });
        } catch (saveError) {
            setError(saveError.message);
        }
    };

    return (
        <div className="dx-app dx-access-page">
            <header className="dx-onboarding-header">
                <a className="dx-brand" href="/v2">
                    <img src="/fptux.png" alt="" />
                    <span>
                        clubhub<span className="dx-brand-dot">.</span>
                    </span>
                </a>
                <span>BƯỚC 1 / 1 · CÁ NHÂN HÓA</span>
            </header>
            <main className="dx-onboarding-shell">
                <section className="dx-onboarding-intro">
                    <span className="dx-onboarding-number">01</span>
                    <span className="dx-eyebrow">
                        CHÀO {user.name?.split(' ').slice(-1)[0]?.toUpperCase() || 'BẠN'}
                    </span>
                    <h1>
                        Điều gì khiến bạn
                        <br />
                        <em>muốn bắt đầu?</em>
                    </h1>
                    <p>Cho ClubHub biết một chút về bạn để ưu tiên những cộng đồng và hoạt động phù hợp.</p>
                    <div className="dx-onboarding-benefit">
                        <GraduationCap size={20} />
                        <span>
                            <strong>Gợi ý dành riêng cho bạn</strong>
                            <small>Bạn luôn có thể thay đổi sở thích sau.</small>
                        </span>
                    </div>
                </section>
                <form className="dx-onboarding-form" onSubmit={submit}>
                    <label className="dx-field">
                        <span>Chuyên ngành của bạn</span>
                        <select value={major} onChange={(event) => setMajor(event.target.value)}>
                            <option value="">Chọn chuyên ngành</option>
                            {MAJORS.map((item) => (
                                <option key={item}>{item}</option>
                            ))}
                        </select>
                    </label>
                    <fieldset>
                        <legend>Bạn quan tâm điều gì?</legend>
                        <p>
                            Chọn ít nhất {MIN_INTERESTS} lĩnh vực · Đã chọn {interests.length}
                        </p>
                        <div className="dx-interest-grid">
                            {INTERESTS.map((interest) => {
                                const selected = interests.includes(interest.id);
                                return (
                                    <button
                                        key={interest.id}
                                        type="button"
                                        className={selected ? 'selected' : ''}
                                        aria-pressed={selected}
                                        onClick={() => toggleInterest(interest.id)}
                                    >
                                        <span>
                                            {selected && <Check size={14} />}
                                            {interest.label}
                                        </span>
                                        <small>{interest.description}</small>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                    <label className="dx-sync-option">
                        <input
                            type="checkbox"
                            checked={syncTimetable}
                            onChange={(event) => setSyncTimetable(event.target.checked)}
                        />
                        <CalendarCheck size={21} />
                        <span>
                            <strong>Đồng bộ thời khóa biểu</strong>
                            <small>Ưu tiên hoạt động không trùng lịch học.</small>
                        </span>
                    </label>
                    {error && (
                        <p className="dx-form-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="dx-onboarding-actions">
                        <span>
                            {major ? 'Đã chọn chuyên ngành' : 'Chưa chọn chuyên ngành'} · {interests.length}/
                            {MIN_INTERESTS} sở thích
                        </span>
                        <button
                            className="dx-button primary"
                            type="submit"
                            disabled={!major || interests.length < MIN_INTERESTS}
                        >
                            Hoàn tất và khám phá <ArrowRight size={17} />
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
