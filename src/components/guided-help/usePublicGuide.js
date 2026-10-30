import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPublicTour } from './public-tour.js';
import { publicGuidePlan } from './public-guide-plan.js';
import { isGuideTargetPainted } from './guide-model.js';

export default function usePublicGuide(accountKey, personal = true) {
    const location = useLocation();
    const navigate = useNavigate();
    const routeKey = location.pathname + location.search;
    const currentRoute = useRef(routeKey);
    const previousRoute = useRef(routeKey);
    currentRoute.current = routeKey;
    const controller = useRef(null);
    const generation = useRef(0);
    const alive = useRef(false);
    const starting = useRef(false);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
            generation.current++;
            starting.current = false;
            controller.current?.stop(false);
            controller.current = null;
        };
    }, [accountKey]);

    useEffect(() => {
        if (previousRoute.current !== routeKey && starting.current && !controller.current) {
            generation.current++;
            starting.current = false;
        }
        previousRoute.current = routeKey;
        controller.current?.routeChanged(routeKey);
        setNotice('');
    }, [routeKey]);

    function findTarget(selector) {
        // Driver marks the background aria-hidden during a tour; future steps are still painted.
        return Array.from(document.querySelectorAll(selector)).find(isGuideTargetPainted);
    }

    async function start() {
        if (starting.current || controller.current) return;
        document.querySelector('.v2-left-rail-account-trigger')?.focus({ preventScroll: true });
        if (
            document.querySelector(
                '[data-guide-editing="true"], dialog[open], [role="dialog"][aria-modal="true"], form input:not([readonly]):not([type="hidden"]), form textarea:not([readonly]), form select',
            )
        ) {
            setNotice('Hãy lưu hoặc đóng biểu mẫu đang mở trước khi xem hướng dẫn.');
            return;
        }
        starting.current = true;
        setNotice('');
        const request = ++generation.current;
        try {
            const { driver } = await import('driver.js');
            if (!alive.current || request !== generation.current) return;
            const origin = currentRoute.current;
            document.querySelector('.v2-left-rail-account-trigger')?.focus({ preventScroll: true });
            controller.current = createPublicTour({
                driver,
                plan: publicGuidePlan(origin, personal),
                navigate,
                readRoute: () => currentRoute.current,
                findTarget,
                waitForTarget: async ({ path, selector, cancelled }) => {
                    const deadline = performance.now() + 8000;
                    const started = performance.now();
                    while (!cancelled() && performance.now() < deadline) {
                        if (
                            currentRoute.current === path &&
                            document.querySelector('[data-guide-route]')?.getAttribute('data-guide-route') === path
                        ) {
                            if (!selector || findTarget(selector)) return true;
                            const loading = document.querySelector('.v2-page-state.is-loading, .v2-access-loading');
                            if (!loading && performance.now() - started > 400) return false;
                        }
                        await new Promise((resolve) => setTimeout(resolve, 50));
                    }
                    return false;
                },
                onStop: (restore) => {
                    controller.current = null;
                    if (restore)
                        requestAnimationFrame(() => {
                            if (alive.current)
                                document.querySelector('.v2-left-rail-account-trigger')?.focus({ preventScroll: true });
                        });
                },
                onError: (message) => {
                    if (alive.current) setNotice(message);
                },
            });
            await controller.current.start();
        } catch {
            if (alive.current && request === generation.current)
                setNotice('Không tải được hướng dẫn. Vui lòng thử lại.');
        } finally {
            if (request === generation.current) starting.current = false;
        }
    }

    return { start, notice };
}
