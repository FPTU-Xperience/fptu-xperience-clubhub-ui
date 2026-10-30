import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INTERESTS, MIN_INTERESTS, saveOnboarding, onboardingAutofill } from '../../../pages/v2/onboarding';
import { formatBirthDate, parseBirthDate } from '../../../pages/v2/profile-date';
import OnboardingProfileFields from './OnboardingProfileFields';
import OnboardingAutofill from './OnboardingAutofill';
import '../../../pages/v2/V2Access.scss';
import './StudentOnboarding.scss';

export default function StudentOnboarding({ user, snapshot, api, onComplete, onReload }) {
    const navigate = useNavigate();
    const initialProfile = snapshot;
    const academicAutofill = onboardingAutofill(user, snapshot);
    const [busy, setBusy] = useState(false);
    const [step, setStep] = useState(1);
    const [draft, setDraft] = useState(() => ({
        ...academicAutofill,
        ...initialProfile.personal,
        major: initialProfile.academic?.major || '',
        dateOfBirth: formatBirthDate(initialProfile.personal.dateOfBirth),
    }));
    const [interests, setInterests] = useState(() =>
        initialProfile.profile.interests.map((label) => INTERESTS.find((item) => item.label === label)?.id || label),
    );
    const [error, setError] = useState('');
    const headingRef = useRef(null);
    const stepLabels = ['THÔNG TIN TỪ EMAIL', 'HỒ SƠ SINH VIÊN', 'SỞ THÍCH'];
    const updateDraft = (name, value) => {
        setDraft((current) => ({
            ...current,
            [name]: value,
        }));
        setError('');
    };

    useEffect(() => {
        headingRef.current?.focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }, [step]);

    const toggleInterest = (id) => {
        setError('');
        setInterests((current) =>
            current.includes(id) ? current.filter((interest) => interest !== id) : [...current, id],
        );
    };

    const submit = async (event) => {
        event.preventDefault();
        if (busy) return;
        setError('');
        try {
            if (step === 1) {
                setStep(2);
                return;
            }
            const dateOfBirth = parseBirthDate(draft.dateOfBirth);
            if (step === 2) {
                setStep(3);
                return;
            }
            setBusy(true);
            const saved = await saveOnboarding(
                user,
                {
                    major: draft.major,
                    interests,
                    personal: { dateOfBirth, phoneNumber: draft.phoneNumber, address: draft.address },
                },
                snapshot,
                api,
            );
            onComplete(saved);
            navigate('/v2', { replace: true });
        } catch (saveError) {
            setError(saveError.message);
            if (saveError.status === 409) setError('Hồ sơ đã thay đổi. Tải lại để xem dữ liệu mới trước khi lưu.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="v2-access-shell v2-access-page v2-student-onboarding">
            <header className="v2-onboarding-header">
                <a className="v2-access-brand" href="/v2">
                    <img src="/fptux.png" alt="" />
                    <span>
                        clubhub<span className="v2-access-brand-dot">.</span>
                    </span>
                </a>
                <span>
                    BƯỚC {step} / 3 · {stepLabels[step - 1]}
                </span>
            </header>
            <main className="v2-onboarding-shell">
                <section className="v2-onboarding-intro">
                    <span className="v2-onboarding-number">0{step}</span>
                    <span className="v2-access-eyebrow">
                        CHÀO {user.name?.split(' ').slice(-1)[0]?.toUpperCase() || 'BẠN'}
                    </span>
                    <h1>
                        Điều gì khiến bạn
                        <br />
                        <em>muốn bắt đầu?</em>
                    </h1>
                    <p>Hoàn thiện hồ sơ và chọn những điều bạn quan tâm để bắt đầu hành trình cùng ClubHub.</p>
                    <div className="v2-onboarding-benefit">
                        <GraduationCap size={20} />
                        <span>
                            <strong>Một lần nhập, một hồ sơ thống nhất</strong>
                            <small>Thông tin sẽ được lưu vào hồ sơ. Bạn có thể chỉnh sửa bất cứ lúc nào.</small>
                        </span>
                    </div>
                </section>
                <form className="v2-onboarding-form" onSubmit={submit} aria-busy={busy}>
                    <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                        <nav className="v2-onboarding-steps" aria-label="Tiến trình onboarding">
                            {['Email', 'Hồ sơ', 'Sở thích'].map((label, index) => (
                                <span key={label} aria-current={step === index + 1 ? 'step' : undefined}>
                                    <b>{index + 1}</b>
                                    {label}
                                </span>
                            ))}
                        </nav>
                        <h2 ref={headingRef} tabIndex="-1">
                            {step === 1
                                ? 'Thông tin từ email của bạn'
                                : step === 2
                                  ? 'Làm quen với bạn'
                                  : 'Bạn quan tâm điều gì?'}
                        </h2>
                        <p className="v2-onboarding-description">
                            {step === 1
                                ? 'Kiểm tra campus và mã sinh viên để bắt đầu.'
                                : step === 2
                                  ? 'Chuyên ngành là bắt buộc. Những thông tin còn lại có thể bổ sung sau.'
                                  : `Chọn ít nhất ${MIN_INTERESTS} lĩnh vực. Sở thích sẽ xuất hiện trong hồ sơ của bạn.`}
                        </p>
                        {step === 1 ? (
                            <OnboardingAutofill email={user?.email} draft={academicAutofill} academic={snapshot.academic} />
                        ) : step === 2 ? (
                            <OnboardingProfileFields draft={draft} onChange={updateDraft} />
                        ) : (
                            <fieldset className="v2-onboarding-interests" aria-label="Sở thích">
                                <p aria-live="polite">Đã chọn {interests.length} lĩnh vực</p>
                                <div className="v2-access-interest-grid">
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
                                {interests.filter((id) => !INTERESTS.some((item) => item.id === id)).length > 0 && (
                                    <div className="v2-onboarding-custom-interests">
                                        <p>Sở thích đã thêm trong hồ sơ</p>
                                        {interests
                                            .filter((id) => !INTERESTS.some((item) => item.id === id))
                                            .map((label) => (
                                                <button
                                                    type="button"
                                                    key={label}
                                                    onClick={() => toggleInterest(label)}
                                                    aria-label={`Bỏ sở thích ${label}`}
                                                >
                                                    {label} ×
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </fieldset>
                        )}
                        {error && (
                            <p className="v2-access-form-error" role="alert">
                                {error}
                            </p>
                        )}
                        {error && (
                            <button type="button" className="v2-button" onClick={onReload}>
                                Tải lại hồ sơ
                            </button>
                        )}
                        <div className="v2-onboarding-actions">
                            {step > 1 ? (
                                <button
                                    className="v2-access-button"
                                    type="button"
                                    onClick={() => {
                                        setStep((current) => current - 1);
                                        setError('');
                                    }}
                                >
                                    <ArrowLeft size={16} /> Quay lại
                                </button>
                            ) : null}
                            <button
                                className="v2-access-button primary"
                                type="submit"
                                disabled={
                                    (step > 1 && !draft.major) || (step === 3 && interests.length < MIN_INTERESTS)
                                }
                            >
                                {step < 3 ? 'Tiếp tục' : 'Hoàn tất và khám phá'} <ArrowRight size={17} />
                            </button>
                        </div>
                    </fieldset>
                </form>
            </main>
        </div>
    );
}
