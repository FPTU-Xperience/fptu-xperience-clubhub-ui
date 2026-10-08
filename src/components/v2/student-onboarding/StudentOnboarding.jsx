import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, GraduationCap, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { INTERESTS, MIN_INTERESTS, saveOnboarding } from '../../../pages/v2/onboarding';
import { readProfile } from '../../../pages/v2/profile-data';
import { CAMPUSES, inferStudentFromEmail, inferStudentYear } from '../../../pages/v2/profile-options';
import { formatBirthDate, parseBirthDate } from '../../../pages/v2/profile-date';
import OnboardingProfileFields from './OnboardingProfileFields';
import OnboardingAutofill from './OnboardingAutofill';
import './StudentOnboarding.scss';

export default function StudentOnboarding({ user, onComplete }) {
    const navigate = useNavigate();
    const [initialProfile] = useState(() => readProfile(user));
    const inferred = inferStudentFromEmail(user?.email);
    const [step, setStep] = useState(1);
    const [draft, setDraft] = useState(() => ({
        ...initialProfile.academic,
        ...initialProfile.personal,
        campus: CAMPUSES.includes(initialProfile.academic.campus) ? initialProfile.academic.campus : inferred.campus,
        studentCode: initialProfile.academic.studentCode || inferred.studentCode,
        year: initialProfile.academic.year || inferStudentYear(initialProfile.academic.studentCode || inferred.studentCode),
        dateOfBirth: formatBirthDate(initialProfile.personal.dateOfBirth),
    }));
    const [interests, setInterests] = useState(() => initialProfile.profile.interests.map((label) => INTERESTS.find((item) => item.label === label)?.id || label));
    const [error, setError] = useState('');
    const headingRef = useRef(null);
    const stepLabels = ['THÔNG TIN TỪ EMAIL', 'HỒ SƠ SINH VIÊN', 'SỞ THÍCH'];
    const updateDraft = (name, value) => {
        setDraft((current) => ({
            ...current,
            [name]: value,
            ...(name === 'studentCode' && (!current.year || current.year === inferStudentYear(current.studentCode)) ? { year: inferStudentYear(value) } : {}),
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

    const submit = (event) => {
        event.preventDefault();
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
            onComplete(saveOnboarding(user, {
                major: draft.major,
                interests,
                academic: { campus: draft.campus, year: draft.year, studentCode: draft.studentCode },
                personal: { dateOfBirth, phoneNumber: draft.phoneNumber, address: draft.address },
            }));
            navigate('/v2', { replace: true });
        } catch (saveError) {
            setError(saveError.message);
            if (step === 3 && interests.length >= MIN_INTERESTS) setStep(2);
        }
    };

    return (
        <div className="dx-app dx-access-page dx-student-onboarding">
            <header className="dx-onboarding-header">
                <a className="dx-brand" href="/v2">
                    <img src="/fptux.png" alt="" />
                    <span>
                        clubhub<span className="dx-brand-dot">.</span>
                    </span>
                </a>
                <span>BƯỚC {step} / 3 · {stepLabels[step - 1]}</span>
            </header>
            <main className="dx-onboarding-shell">
                <section className="dx-onboarding-intro">
                    <span className="dx-onboarding-number">0{step}</span>
                    <span className="dx-eyebrow">
                        CHÀO {user.name?.split(' ').slice(-1)[0]?.toUpperCase() || 'BẠN'}
                    </span>
                    <h1>
                        Điều gì khiến bạn
                        <br />
                        <em>muốn bắt đầu?</em>
                    </h1>
                    <p>Hoàn thiện hồ sơ và chọn những điều bạn quan tâm để bắt đầu hành trình cùng ClubHub.</p>
                    <div className="dx-onboarding-benefit">
                        <GraduationCap size={20} />
                        <span>
                            <strong>Một lần nhập, một hồ sơ thống nhất</strong>
                            <small>Thông tin sẽ được lưu vào hồ sơ. Bạn có thể chỉnh sửa bất cứ lúc nào.</small>
                        </span>
                    </div>
                </section>
                <form className="dx-onboarding-form" onSubmit={submit}>
                    <nav className="dx-onboarding-steps" aria-label="Tiến trình onboarding">{['Email', 'Hồ sơ', 'Sở thích'].map((label, index) => <span key={label} aria-current={step === index + 1 ? 'step' : undefined}><b>{index + 1}</b>{label}</span>)}</nav>
                    <h2 ref={headingRef} tabIndex="-1">{step === 1 ? 'Thông tin từ email của bạn' : step === 2 ? 'Làm quen với bạn' : 'Bạn quan tâm điều gì?'}</h2>
                    <p className="dx-onboarding-description">{step === 1 ? 'Kiểm tra campus và mã sinh viên để bắt đầu.' : step === 2 ? 'Chuyên ngành là bắt buộc. Những thông tin còn lại có thể bổ sung sau.' : `Chọn ít nhất ${MIN_INTERESTS} lĩnh vực. Sở thích sẽ xuất hiện trong hồ sơ của bạn.`}</p>
                    {step === 1 ? <OnboardingAutofill email={user?.email} inferred={inferred} draft={draft} onChange={updateDraft} /> : step === 2 ? <OnboardingProfileFields draft={draft} onChange={updateDraft} /> : <fieldset>
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
                        {interests.filter((id) => !INTERESTS.some((item) => item.id === id)).length > 0 && <div className="dx-onboarding-custom-interests"><p>Sở thích đã thêm trong hồ sơ</p>{interests.filter((id) => !INTERESTS.some((item) => item.id === id)).map((label) => <button type="button" key={label} onClick={() => toggleInterest(label)} aria-label={`Bỏ sở thích ${label}`}>{label} ×</button>)}</div>}
                    </fieldset>}
                    <p className="dx-onboarding-sync-note"><RefreshCw size={16} aria-hidden="true" />Thông tin được đồng bộ với hồ sơ và lưu trên thiết bị này.</p>
                    {error && (
                        <p className="dx-form-error" role="alert">
                            {error}
                        </p>
                    )}
                    <div className="dx-onboarding-actions">
                        {step > 1 ? <button className="dx-button" type="button" onClick={() => { setStep((current) => current - 1); setError(''); }}><ArrowLeft size={16} /> Quay lại</button> : <span>Bạn có thể điều chỉnh thông tin đã điền.</span>}
                        <button
                            className="dx-button primary"
                            type="submit"
                            disabled={(step > 1 && !draft.major) || (step === 3 && interests.length < MIN_INTERESTS)}
                        >
                            {step < 3 ? 'Tiếp tục' : 'Hoàn tất và khám phá'} <ArrowRight size={17} />
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
