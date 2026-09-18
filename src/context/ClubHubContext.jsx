import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
    createInitialState,
    PEOPLE,
    registerRealClubs,
    registerRealPerson,
    resetRealEntities,
    transition,
    clubById,
    membership,
} from '../core/model';

const ClubHubContext = createContext(null);

export function ClubHubProvider({ children, initialActorId, basePath = '' }) {
    let auth = null;
    try {
        auth = useAuth();
    } catch (_) {
        // Fallback when rendered without AuthProvider
    }

    const currentUser = auth?.user || null;
    const api = auth?.api || null;

    if (currentUser) {
        registerRealPerson(currentUser);
    }

    const defaultActorId = initialActorId || (currentUser ? String(currentUser.id || currentUser.email) : 'linh');
    const [state, setState] = useState(createInitialState);
    const current = useRef(state);
    const [actorId, setActorId] = useState(defaultActorId);
    const [toast, setToast] = useState(null);
    const [scenario, setScenario] = useState('normal');

    // Sync real clubs from BE API on mount
    useEffect(() => {
        if (!api?.getClubs) return;
        let isMounted = true;
        api.getClubs()
            .then((data) => {
                if (!isMounted || !data) return;
                const clubs = Array.isArray(data) ? data : data.items || [];
                if (clubs.length > 0) {
                    registerRealClubs(clubs);
                }
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, [api]);

    // Sync real memberships from BE API if logged in
    useEffect(() => {
        if (!api?.getMyMemberships || !currentUser) return;
        let isMounted = true;
        api.getMyMemberships()
            .then((memberships) => {
                if (!isMounted || !Array.isArray(memberships)) return;
                const mapped = memberships.map((m) => ({
                    userId: String(currentUser.id || currentUser.email),
                    clubId: String(m.clubId || m.id),
                    role:
                        m.role?.toLowerCase() === 'manager' || m.role?.toLowerCase() === 'leader'
                            ? 'manager'
                            : 'member',
                    status: m.status?.toLowerCase() === 'approved' ? 'approved' : m.status?.toLowerCase() || 'pending',
                }));
                if (mapped.length > 0) {
                    setState((prev) => {
                        const merged = [...prev.memberships];
                        mapped.forEach((item) => {
                            const idx = merged.findIndex((m) => m.userId === item.userId && m.clubId === item.clubId);
                            if (idx >= 0) merged[idx] = item;
                            else merged.push(item);
                        });
                        const updated = { ...prev, memberships: merged };
                        current.current = updated;
                        return updated;
                    });
                }
            })
            .catch(() => {});
        return () => {
            isMounted = false;
        };
    }, [api, currentUser]);

    // Ensure actor is updated if user switches or logs in; clean up on logout
    useEffect(() => {
        if (currentUser) {
            const realId = String(currentUser.id || currentUser.email);
            if (actorId !== realId) {
                setActorId(realId);
            }
        } else if (!currentUser && actorId !== 'linh' && !initialActorId) {
            resetRealEntities();
            setActorId('linh');
            const fresh = createInitialState();
            current.current = fresh;
            setState(fresh);
        }
    }, [currentUser, actorId, initialActorId]);

    const actor = PEOPLE.find((p) => p.id === actorId || String(p.id) === String(actorId)) || PEOPLE[0];

    const act = (type, clubId, term, payload = {}) => {
        try {
            const result = transition(current.current, {
                type,
                userId: actorId,
                actorId,
                clubId,
                term,
                payload,
                ...payload,
            });

            if (result.error) {
                setToast({ text: result.error, error: true });
                return false;
            }

            current.current = result.state;
            setState(result.state);

            const messages = {
                apply: `Đã gửi đơn tham gia đến ${clubById(clubId)?.name || 'CLB'}.`,
                withdraw: 'Đã rút đơn tham gia.',
                register: 'Đã cập nhật trạng thái đăng ký hoạt động.',
                checkin: 'Check-in thành công!',
                submitQuest: 'Đã gửi minh chứng đóng góp cho ban chủ nhiệm.',
                reviewSubmission: 'Đã cập nhật kết quả xem xét đóng góp.',
                reviewApplication: 'Đã xử lý đơn tham gia.',
                redeem: 'Đã gửi yêu cầu đổi quà đến CLB.',
                fulfillGift: 'Đã xác nhận trao quà cho thành viên.',
                report: payload?.submit ? 'Đã nộp báo cáo đến CTSV.' : 'Đã lưu bản nháp báo cáo.',
                settings: 'Đã lưu thay đổi thông tin CLB.',
                updateProfile: 'Đã cập nhật hồ sơ cá nhân.',
                session: payload?.id ? 'Đã thay đổi trạng thái phiên điểm danh.' : 'Đã mở phiên điểm danh.',
                createActivity: 'Đã tạo hoạt động mới cho CLB.',
                createQuest: 'Đã tạo nhiệm vụ đóng góp mới.',
            };

            setToast({ text: result.message || messages[type] || 'Thao tác thành công.', error: false });
            return true;
        } catch (err) {
            setToast({ text: err.message || 'Thao tác không thành công.', error: true });
            return false;
        }
    };

    const reset = () => {
        const fresh = createInitialState();
        current.current = fresh;
        setState(fresh);
        setToast({ text: 'Đã khôi phục dữ liệu ban đầu.', error: false });
    };

    const value = {
        state,
        actorId,
        actor,
        setActorId,
        toast,
        setToast,
        scenario,
        setScenario,
        act,
        reset,
        basePath,
        api,
    };

    return <ClubHubContext.Provider value={value}>{children}</ClubHubContext.Provider>;
}

export const useClubHub = () => {
    const context = useContext(ClubHubContext);
    if (!context) {
        throw new Error('useClubHub must be used within a ClubHubProvider');
    }
    return context;
};

// Backward-compatible alias
export const useDemo = useClubHub;
export const DemoProvider = ClubHubProvider;

export default ClubHubContext;
